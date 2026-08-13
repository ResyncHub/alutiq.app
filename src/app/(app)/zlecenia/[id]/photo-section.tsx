"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressToWebp } from "@/lib/photo/compress";
import type { PhotoWithUrl } from "@/lib/db/photos";
import { deletePhotoAction, uploadPhotoAction } from "../actions";

type Pending = {
  key: string;
  previewUrl: string;
  status: "uploading" | "error";
  error?: string;
  file: File;
};

function Tile({ children, url, label }: { children?: React.ReactNode; url?: string; label?: string }) {
  return (
    <div
      className="relative aspect-square overflow-hidden rounded-app border border-border bg-surface-2 bg-cover bg-center"
      style={url ? { backgroundImage: `url("${url}")` } : undefined}
      role={url ? "img" : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function PhotoSection({
  jobId,
  photos,
}: {
  jobId: string;
  photos: PhotoWithUrl[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);

  function setStatus(key: string, status: Pending["status"], error?: string) {
    setPending((prev) =>
      prev.map((p) => (p.key === key ? { ...p, status, error } : p)),
    );
  }

  async function doUpload(key: string, file: File, previewUrl: string) {
    try {
      const blob = await compressToWebp(file);
      const fd = new FormData();
      fd.append("jobId", jobId);
      fd.append("file", blob, "photo.webp");
      const res = await uploadPhotoAction(fd);
      if (!res.ok) {
        setStatus(key, "error", res.error);
        return;
      }
      setPending((prev) => prev.filter((p) => p.key !== key));
      URL.revokeObjectURL(previewUrl);
      router.refresh();
    } catch (e) {
      setStatus(key, "error", e instanceof Error ? e.message : "Nie udało się wysłać.");
    }
  }

  function startUpload(file: File) {
    const key = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    setPending((prev) => [...prev, { key, previewUrl, status: "uploading", file }]);
    void doUpload(key, file, previewUrl);
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    for (const file of Array.from(list)) {
      if (file.type.startsWith("image/")) startUpload(file);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function retry(key: string) {
    const p = pending.find((x) => x.key === key);
    if (!p) return;
    setStatus(key, "uploading");
    void doUpload(key, p.file, p.previewUrl);
  }

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Zdjęcia
        </h2>
        <Button
          variant="outline"
          className="px-3"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="size-4" aria-hidden />
          Dodaj
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {photos.length === 0 && pending.length === 0 ? (
        <p className="rounded-app border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
          Brak zdjęć. Dodaj zdjęcia z telefonu — w trakcie lub po zleceniu.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {/* Wysyłane / błędne */}
          {pending.map((p) => (
            <Tile key={p.key} url={p.previewUrl} label="Wysyłane zdjęcie">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 text-center text-xs text-white">
                {p.status === "uploading" ? (
                  <span>Wysyłanie…</span>
                ) : (
                  <>
                    <span className="px-1 font-semibold">Nie wysłano</span>
                    <button
                      type="button"
                      onClick={() => retry(p.key)}
                      className="inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 font-medium text-black"
                    >
                      <RotateCw className="size-3" aria-hidden />
                      Ponów
                    </button>
                  </>
                )}
              </div>
            </Tile>
          ))}

          {/* Zapisane */}
          {photos.map((photo) => (
            <Tile key={photo.id} url={photo.url ?? undefined} label={photo.description ?? "Zdjęcie zlecenia"}>
              {photo.url ? (
                <a
                  href={photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0"
                  aria-label="Otwórz zdjęcie"
                />
              ) : null}
              <button
                type="button"
                onClick={async () => {
                  const res = await deletePhotoAction(photo.id, jobId);
                  if (res.ok) router.refresh();
                }}
                aria-label="Usuń zdjęcie"
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-danger"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </Tile>
          ))}
        </div>
      )}
    </section>
  );
}
