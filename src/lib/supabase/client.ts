import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Klient Supabase dla komponentów klienckich (przeglądarka).
 * Używa klucza anon + RLS (CLAUDE.md §10). Nigdy service_role po stronie klienta.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
