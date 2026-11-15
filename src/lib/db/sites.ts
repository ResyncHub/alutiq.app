import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { createSiteSchema, updateSiteSchema } from "@/lib/validation/customer";

export type Site = Database["public"]["Tables"]["site"]["Row"];
export type SiteOption = { id: string; customerId: string; label: string };

/**
 * Wszystkie obiekty (wszystkich klientów) jako lekka lista do wyboru przy
 * zleceniu — formularz filtruje ją po wybranym kliencie bez dodatkowego
 * zapytania (§2 — bez useEffect do pobierania danych).
 */
export async function listSiteOptions(): Promise<SiteOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site")
    .select("id, customer_id, label, address, city")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Nie udało się pobrać obiektów: ${error.message}`);
  return (data ?? []).map((s) => ({
    id: s.id,
    customerId: s.customer_id,
    label: s.label || [s.address, s.city].filter(Boolean).join(", ") || "Obiekt bez nazwy",
  }));
}

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

/**
 * Znajduje obiekt klienta o dokładnie tym adresie albo tworzy nowy.
 * Używane, gdy ktoś wpisze adres ręcznie zamiast wybrać istniejący obiekt —
 * dzięki temu przy kolejnym zleceniu ten adres jest już do wyboru.
 */
export async function findOrCreateSiteByAddress(params: {
  customerId: string;
  address: string;
}): Promise<string> {
  const supabase = await createClient();
  const address = params.address.trim();

  const { data: existing, error: selErr } = await supabase
    .from("site")
    .select("id")
    .eq("customer_id", params.customerId)
    .eq("address", address)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (selErr) throw new Error(`Nie udało się sprawdzić obiektu: ${selErr.message}`);
  if (existing) return existing.id;

  const created = await createSite({
    customerId: params.customerId,
    label: null,
    address,
    city: null,
    postalCode: null,
    notes: null,
  });
  return created.id;
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
