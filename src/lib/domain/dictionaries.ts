/**
 * Słowniki domenowe — mapowanie wartości z bazy (angielski) na etykiety UI (polski).
 * Wartości muszą zgadzać się z constraintami CHECK w migracjach.
 */

export const CUSTOMER_KINDS = ["person", "company"] as const;
export type CustomerKind = (typeof CUSTOMER_KINDS)[number];

export const CUSTOMER_KIND_LABELS: Record<CustomerKind, string> = {
  person: "Osoba",
  company: "Firma",
};

export const DEVICE_TYPES = [
  "gate",
  "drive",
  "window",
  "door",
  "automatic_door",
  "roller_shutter",
  "awning",
  "pergola",
  "other",
] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  gate: "Brama",
  drive: "Napęd / silnik",
  window: "Okno",
  door: "Drzwi",
  automatic_door: "Automat drzwiowy",
  roller_shutter: "Roleta",
  awning: "Markiza",
  pergola: "Pergola tarasowa",
  other: "Inne",
};

export function deviceTypeLabel(value: string): string {
  return (DEVICE_TYPE_LABELS as Record<string, string>)[value] ?? value;
}

export function customerKindLabel(value: string): string {
  return (CUSTOMER_KIND_LABELS as Record<string, string>)[value] ?? value;
}

// Statusy zleceń — wartości muszą zgadzać się z CHECK w migracji (CLAUDE.md §3).
export const JOB_STATUSES = [
  "new",
  "scheduled",
  "in_progress",
  "waiting_parts",
  "done",
  "settled",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new: "Nowe",
  scheduled: "Zaplanowane",
  in_progress: "W toku",
  waiting_parts: "Czeka na części",
  done: "Zrobione",
  settled: "Rozliczone",
  cancelled: "Anulowane",
};

/** Klasy Tailwind koloru statusu (tło + tekst), spójne z motywem. */
export const JOB_STATUS_CLASSES: Record<JobStatus, string> = {
  new: "bg-surface-2 text-muted",
  scheduled: "bg-accent/15 text-accent",
  in_progress: "bg-accent/15 text-accent",
  waiting_parts: "bg-warning/15 text-warning",
  done: "bg-success/15 text-success",
  settled: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
};

/** Kolor ramki statusu — do oznaczeń dnia w kalendarzu. */
export const JOB_STATUS_BORDER: Record<JobStatus, string> = {
  new: "border-muted",
  scheduled: "border-accent",
  in_progress: "border-accent",
  waiting_parts: "border-warning",
  done: "border-success",
  settled: "border-success",
  cancelled: "border-danger",
};

export function jobStatusBorder(value: string): string {
  return (JOB_STATUS_BORDER as Record<string, string>)[value] ?? "border-muted";
}

/**
 * Priorytet do wyboru koloru ramki dnia, gdy jest kilka zleceń (pierwszy wygrywa).
 * Najpierw stany wymagające uwagi, na końcu zakończone/anulowane.
 */
const STATUS_PRIORITY: JobStatus[] = [
  "waiting_parts",
  "in_progress",
  "scheduled",
  "new",
  "done",
  "settled",
  "cancelled",
];

/** Wybiera status o najwyższym priorytecie z listy (do koloru ramki dnia). */
export function dominantStatus(statuses: string[]): JobStatus | null {
  for (const s of STATUS_PRIORITY) {
    if (statuses.includes(s)) return s;
  }
  return null;
}

export function jobStatusLabel(value: string): string {
  return (JOB_STATUS_LABELS as Record<string, string>)[value] ?? value;
}

// Kategorie wydatków — wartości zgodne z CHECK w migracji.
export const EXPENSE_CATEGORIES = [
  "material_parts",
  "fuel_travel",
  "tools",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  material_parts: "Materiały / części",
  fuel_travel: "Paliwo / dojazd",
  tools: "Narzędzia i sprzęt",
  other: "Inne",
};

export function expenseCategoryLabel(value: string): string {
  return (EXPENSE_CATEGORY_LABELS as Record<string, string>)[value] ?? value;
}
