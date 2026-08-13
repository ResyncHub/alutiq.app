import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Klient Supabase dla środowiska serwerowego (Server Components, Server Actions,
 * Route Handlers). Czyta i zapisuje sesję w cookies. Klucz anon + RLS (§10).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll wywołane z Server Component — sesję odświeża middleware.
            // To oczekiwane, można zignorować.
          }
        },
      },
    },
  );
}
