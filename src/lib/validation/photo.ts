import { z } from "zod";
import { optionalText } from "./common";

/** Metadane uploadowanego zdjęcia (plik walidujemy osobno w akcji). */
export const uploadPhotoSchema = z.object({
  jobId: z.string().uuid(),
  description: optionalText(500),
});

/** Zapis/edycja notatki zlecenia. */
export const jobNotesSchema = z.object({
  id: z.string().uuid(),
  notes: optionalText(2000),
});
