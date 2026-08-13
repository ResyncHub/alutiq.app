import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Photo = Database["public"]["Tables"]["photo"]["Row"];
export type PhotoWithUrl = Photo & { url: string | null };

const BUCKET = "job-photos";
const SIGNED_URL_TTL = 3600; // 1 h

/** Zdjęcia zlecenia wraz z krótkotrwałymi signed URL (§8). */
export async function listPhotosForJob(jobId: string): Promise<PhotoWithUrl[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("photo")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Nie udało się pobrać zdjęć: ${error.message}`);

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(rows.map((r) => r.path), SIGNED_URL_TTL);

  const urlByPath = new Map<string, string>();
  for (const s of signed ?? []) {
    if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
  }
  return rows.map((r) => ({ ...r, url: urlByPath.get(r.path) ?? null }));
}

/**
 * Wgrywa zdjęcie: plik do prywatnego bucketu + metadane do tabeli photo.
 * Ścieżka {user_id}/{job_id}/{uuid}.webp — nazwa od użytkownika nie trafia do ścieżki (§8).
 */
export async function uploadPhoto(params: {
  jobId: string;
  description: string | null;
  bytes: ArrayBuffer;
}): Promise<Photo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Brak sesji.");

  const path = `${user.id}/${params.jobId}/${crypto.randomUUID()}.webp`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, params.bytes, { contentType: "image/webp", upsert: false });
  if (upErr) throw new Error(`Nie udało się wysłać zdjęcia: ${upErr.message}`);

  const { data, error } = await supabase
    .from("photo")
    .insert({
      job_id: params.jobId,
      path,
      taken_at: new Date().toISOString(),
      description: params.description,
    })
    .select("*")
    .single();

  if (error) {
    // Rollback pliku, żeby nie zostały „sieroty" w buckecie.
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(`Nie udało się zapisać zdjęcia: ${error.message}`);
  }
  return data;
}

/** Twarde usunięcie zdjęcia: metadane + plik (§4). */
export async function deletePhoto(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: row, error: selErr } = await supabase
    .from("photo")
    .select("path")
    .eq("id", id)
    .maybeSingle();
  if (selErr) throw new Error(`Nie udało się usunąć zdjęcia: ${selErr.message}`);
  if (!row) return;

  const { error: delErr } = await supabase.from("photo").delete().eq("id", id);
  if (delErr) throw new Error(`Nie udało się usunąć zdjęcia: ${delErr.message}`);

  await supabase.storage.from(BUCKET).remove([row.path]);
}
