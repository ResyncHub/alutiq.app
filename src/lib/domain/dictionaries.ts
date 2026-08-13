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
