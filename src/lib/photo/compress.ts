/**
 * Kompresja zdjęcia w przeglądarce przed uploadem (CLAUDE.md §8).
 * WebP, max ~1600 px dłuższy bok, cel poniżej ~400 kB. Orientacja z EXIF
 * jest korygowana przez createImageBitmap(imageOrientation: "from-image").
 */

const MAX_SIZE = 1600;
const TARGET_BYTES = 400 * 1024;
const QUALITIES = [0.82, 0.7, 0.6, 0.5, 0.4];

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

export async function compressToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });

  let { width, height } = bitmap;
  const longest = Math.max(width, height);
  if (longest > MAX_SIZE) {
    const scale = MAX_SIZE / longest;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Przeglądarka nie obsługuje przetwarzania obrazu.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let last: Blob | null = null;
  for (const q of QUALITIES) {
    last = await toBlob(canvas, q);
    if (last && last.size <= TARGET_BYTES) return last;
  }
  if (!last) throw new Error("Nie udało się przetworzyć zdjęcia.");
  return last;
}
