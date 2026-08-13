import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  customerFieldsSchema,
  updateCustomerSchema,
} from "@/lib/validation/customer";

export type Customer = Database["public"]["Tables"]["customer"]["Row"];

/** Usuwa znaki łamiące składnię filtra PostgREST `or`. */
function sanitizeSearch(term: string): string {
  return term.trim().replace(/[,()*]/g, " ").trim();
}

/** Lista aktywnych klientów; opcjonalne wyszukiwanie po nazwie/telefonie/e-mailu. */
export async function listCustomers(search?: string): Promise<Customer[]> {
  const supabase = await createClient();
  let query = supabase
    .from("customer")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const term = search ? sanitizeSearch(search) : "";
  if (term) {
    const like = `%${term}%`;
    query = query.or(`name.ilike.${like},phone.ilike.${like},email.ilike.${like}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Nie udało się pobrać klientów: ${error.message}`);
  return data ?? [];
}

/** Pojedynczy klient (aktywny) lub null. */
export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(`Nie udało się pobrać klienta: ${error.message}`);
  return data;
}

/** Tworzy klienta. Waliduje wejście schematem zod (§5). */
export async function createCustomer(input: unknown): Promise<Customer> {
  const values = customerFieldsSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer")
    .insert({
      kind: values.kind,
      name: values.name,
      phone: values.phone,
      email: values.email,
      notes: values.notes,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się dodać klienta: ${error.message}`);
  return data;
}

/** Aktualizuje dane klienta. */
export async function updateCustomer(input: unknown): Promise<Customer> {
  const values = updateCustomerSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer")
    .update({
      kind: values.kind,
      name: values.name,
      phone: values.phone,
      email: values.email,
      notes: values.notes,
    })
    .eq("id", values.id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się zapisać klienta: ${error.message}`);
  return data;
}

/** Miękkie kasowanie klienta (§4). */
export async function softDeleteCustomer(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(`Nie udało się usunąć klienta: ${error.message}`);
}
