import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { warsawLocalToUtcIso } from "@/lib/domain/dates";
import {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
} from "@/lib/validation/job";

export type Job = Database["public"]["Tables"]["job"]["Row"];
type Customer = Database["public"]["Tables"]["customer"]["Row"];
type Site = Database["public"]["Tables"]["site"]["Row"];

/** Zlecenie z podstawowymi danymi klienta (do list i kalendarza). */
export type JobWithCustomer = Job & {
  customer: Pick<Customer, "id" | "name" | "phone"> | null;
};

/** Zlecenie ze szczegółami klienta i obiektu (do widoku szczegółów). */
export type JobDetail = Job & {
  customer: Pick<Customer, "id" | "name" | "phone" | "email"> | null;
  site: Pick<Site, "id" | "label" | "address" | "city" | "postal_code"> | null;
};

const WITH_CUSTOMER = "*, customer:customer_id(id, name, phone)";

/** Zlecenia z terminem w danym zakresie chwil [startUtc, endUtc). */
export async function listJobsInRange(
  startUtc: Date,
  endUtc: Date,
): Promise<JobWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .select(WITH_CUSTOMER)
    .is("deleted_at", null)
    .not("scheduled_at", "is", null)
    .gte("scheduled_at", startUtc.toISOString())
    .lt("scheduled_at", endUtc.toISOString())
    .order("scheduled_at", { ascending: true })
    .returns<JobWithCustomer[]>();
  if (error) throw new Error(`Nie udało się pobrać zleceń: ${error.message}`);
  return data ?? [];
}

/** Wszystkie zlecenia (opcjonalnie filtrowane po statusie), do listy zleceń. */
export async function listAllJobs(status?: string): Promise<JobWithCustomer[]> {
  const supabase = await createClient();
  let query = supabase.from("job").select(WITH_CUSTOMER).is("deleted_at", null);
  if (status) query = query.eq("status", status);
  const { data, error } = await query
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<JobWithCustomer[]>();
  if (error) throw new Error(`Nie udało się pobrać zleceń: ${error.message}`);
  return data ?? [];
}

/** Liczba zleceń łącznie i w rozbiciu na statusy. */
export async function getJobStatusCounts(): Promise<{
  total: number;
  byStatus: Record<string, number>;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .select("status")
    .is("deleted_at", null);
  if (error) throw new Error(`Nie udało się policzyć zleceń: ${error.message}`);
  const byStatus: Record<string, number> = {};
  for (const row of data ?? []) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  }
  return { total: data?.length ?? 0, byStatus };
}

/** Zlecenia do wyboru (id + etykieta) — do podpięcia wydatku/wpłaty. */
export async function listJobOptions(): Promise<{ id: string; label: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .select("id, title, customer:customer_id(name, phone)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .returns<
      { id: string; title: string | null; customer: { name: string | null; phone: string | null } | null }[]
    >();
  if (error) throw new Error(`Nie udało się pobrać zleceń: ${error.message}`);
  return (data ?? []).map((j) => ({
    id: j.id,
    label: j.title || j.customer?.name || j.customer?.phone || "Zlecenie",
  }));
}

/** Zlecenia bez ustalonego terminu. */
export async function listUnscheduledJobs(): Promise<JobWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .select(WITH_CUSTOMER)
    .is("deleted_at", null)
    .is("scheduled_at", null)
    .order("created_at", { ascending: false })
    .returns<JobWithCustomer[]>();
  if (error) throw new Error(`Nie udało się pobrać zleceń: ${error.message}`);
  return data ?? [];
}

/** Zlecenia danego klienta. */
export async function listJobsForCustomer(
  customerId: string,
): Promise<JobWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .select(WITH_CUSTOMER)
    .eq("customer_id", customerId)
    .is("deleted_at", null)
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .returns<JobWithCustomer[]>();
  if (error) throw new Error(`Nie udało się pobrać zleceń: ${error.message}`);
  return data ?? [];
}

/** Pojedyncze zlecenie ze szczegółami lub null. */
export async function getJob(id: string): Promise<JobDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .select(
      "*, customer:customer_id(id, name, phone, email), site:site_id(id, label, address, city, postal_code)",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()
    .returns<JobDetail | null>();
  if (error) throw new Error(`Nie udało się pobrać zlecenia: ${error.message}`);
  return data;
}

function toScheduledIso(local: string | null): string | null {
  return local ? warsawLocalToUtcIso(local) : null;
}

/** Tworzy zlecenie. Waliduje wejście schematem zod (§5). */
export async function createJob(input: unknown): Promise<Job> {
  const values = createJobSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .insert({
      customer_id: values.customerId,
      site_id: values.siteId,
      title: values.title,
      notes: values.notes,
      phone: values.phone,
      address: values.address,
      status: values.status,
      scheduled_at: toScheduledIso(values.scheduledAt),
    })
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się dodać zlecenia: ${error.message}`);
  return data;
}

/** Aktualizuje zlecenie. */
export async function updateJob(input: unknown): Promise<Job> {
  const values = updateJobSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .update({
      customer_id: values.customerId,
      site_id: values.siteId,
      title: values.title,
      notes: values.notes,
      phone: values.phone,
      address: values.address,
      status: values.status,
      scheduled_at: toScheduledIso(values.scheduledAt),
    })
    .eq("id", values.id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się zapisać zlecenia: ${error.message}`);
  return data;
}

/** Zmienia sam status zlecenia. */
export async function updateJobStatus(input: unknown): Promise<Job> {
  const values = updateJobStatusSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job")
    .update({ status: values.status })
    .eq("id", values.id)
    .is("deleted_at", null)
    .select("*")
    .single();
  if (error) throw new Error(`Nie udało się zmienić statusu: ${error.message}`);
  return data;
}

/** Zapisuje samą notatkę zlecenia (edytowalna na każdym etapie). */
export async function updateJobNotes(id: string, notes: string | null): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job")
    .update({ notes })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(`Nie udało się zapisać notatki: ${error.message}`);
}

/** Miękkie kasowanie zlecenia (§4). */
export async function softDeleteJob(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("job")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);
  if (error) throw new Error(`Nie udało się usunąć zlecenia: ${error.message}`);
}
