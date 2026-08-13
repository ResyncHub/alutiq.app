import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { createSiteSchema, updateSiteSchema } from "@/lib/validation/customer";

export type Site = Database["public"]["Tables"]["site"]["Row"];

/** Lista obiektów (adresów) klienta. */
export async function listSitesForCustomer(customerId: string): Promise<Site[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site")
    .select("*")
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Nie udało się pobrać obiektów: ${error.message}`);
  return data ?? [];
}

/** Tworzy obiekt (adres) dla klienta. */
export async function createSite(input: unknown): Promise<Site> {
  const values = createSiteSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site")
    .insert({
      customer_id: values.customerId,
      label: values.label,
      address: values.address,
      city: values.city,
      postal_code: values.postalCode,
      notes: values.notes,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się dodać obiektu: ${error.message}`);
  return data;
}

/** Aktualizuje obiekt (adres). */
export async function updateSite(input: unknown): Promise<Site> {
  const values = updateSiteSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site")
    .update({
      label: values.label,
      address: values.address,
      city: values.city,
      postal_code: values.postalCode,
      notes: values.notes,
    })
    .eq("id", values.id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się zapisać obiektu: ${error.message}`);
  return data;
}

/** Miękkie kasowanie obiektu (§4). */
export async function softDeleteSite(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(`Nie udało się usunąć obiektu: ${error.message}`);
}
