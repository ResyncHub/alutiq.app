import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { createDeviceSchema, updateDeviceSchema } from "@/lib/validation/customer";

export type Device = Database["public"]["Tables"]["device"]["Row"];

/** Lista urządzeń w danym obiekcie. */
export async function listDevicesForSite(siteId: string): Promise<Device[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device")
    .select("*")
    .eq("site_id", siteId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Nie udało się pobrać urządzeń: ${error.message}`);
  return data ?? [];
}

/** Lista wszystkich urządzeń klienta (przez jego obiekty). */
export async function listDevicesForCustomer(customerId: string): Promise<Device[]> {
  const supabase = await createClient();

  const { data: sites, error: sitesError } = await supabase
    .from("site")
    .select("id")
    .eq("customer_id", customerId)
    .is("deleted_at", null);
  if (sitesError) throw new Error(`Nie udało się pobrać urządzeń: ${sitesError.message}`);

  const siteIds = (sites ?? []).map((s) => s.id);
  if (siteIds.length === 0) return [];

  const { data, error } = await supabase
    .from("device")
    .select("*")
    .in("site_id", siteIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Nie udało się pobrać urządzeń: ${error.message}`);
  return data ?? [];
}

/** Tworzy urządzenie w obiekcie. */
export async function createDevice(input: unknown): Promise<Device> {
  const values = createDeviceSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device")
    .insert({
      site_id: values.siteId,
      device_type: values.deviceType,
      brand: values.brand,
      model: values.model,
      serial_number: values.serialNumber,
      installed_on: values.installedOn,
      warranty_until: values.warrantyUntil,
      notes: values.notes,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się dodać urządzenia: ${error.message}`);
  return data;
}

/** Aktualizuje urządzenie. */
export async function updateDevice(input: unknown): Promise<Device> {
  const values = updateDeviceSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("device")
    .update({
      site_id: values.siteId,
      device_type: values.deviceType,
      brand: values.brand,
      model: values.model,
      serial_number: values.serialNumber,
      installed_on: values.installedOn,
      warranty_until: values.warrantyUntil,
      notes: values.notes,
    })
    .eq("id", values.id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się zapisać urządzenia: ${error.message}`);
  return data;
}

/** Miękkie kasowanie urządzenia (§4). */
export async function softDeleteDevice(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("device")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(`Nie udało się usunąć urządzenia: ${error.message}`);
}
