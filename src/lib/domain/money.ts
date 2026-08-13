/**
 * Pieniądze — jedyne miejsce, w którym wolno zaokrąglać kwoty (CLAUDE.md §6).
 *
 * Zasady:
 * - kwoty trzymamy WYŁĄCZNIE w groszach jako `integer` (nigdy float/numeric),
 * - zaokrąglenie zawsze half-up (matematyczne, 0,5 w górę co do wartości bezwzględnej),
 *   wykonywane na samym końcu obliczenia,
 * - stawka VAT to `integer` (procent: 23, 8, 0),
 * - formatowanie tylko przy renderowaniu, przez Intl.NumberFormat.
 *
 * Firma jest zwolniona z VAT — domyślna stawka to 0, ale funkcje obsługują VAT,
 * bo kolumny net_gr/vat_gr/gross_gr zostają w bazie na przyszłość.
 */

/** Rozbicie kwoty na netto / VAT / brutto — wszystko w groszach. */
export interface MoneyBreakdown {
  netGr: number;
  vatGr: number;
  grossGr: number;
}

/**
 * Zaokrąglenie half-up co do wartości bezwzględnej:
 * 2,5 -> 3, -2,5 -> -3. Małe epsilon niweluje błąd reprezentacji float
 * (np. 76,5 zapisane jako 76,4999999).
 */
export function roundHalfUp(value: number): number {
  const sign = value < 0 ? -1 : 1;
  return sign * Math.floor(Math.abs(value) + 0.5 + 1e-9);
}

/** Sprawdza, że kwota jest poprawną liczbą groszy (skończony integer). */
export function assertGrosze(value: number, label = "kwota"): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} musi być liczbą całkowitą groszy, otrzymano: ${value}`);
  }
  return value;
}

/** Waliduje stawkę VAT (całkowity procent w zakresie 0–100). */
export function assertVatRate(vatRate: number): number {
  if (!Number.isInteger(vatRate) || vatRate < 0 || vatRate > 100) {
    throw new Error(`Stawka VAT musi być całkowitym procentem 0–100, otrzymano: ${vatRate}`);
  }
  return vatRate;
}

/** Z kwoty netto (grosze) i stawki VAT liczy VAT i brutto. */
export function grossFromNet(netGr: number, vatRate: number): MoneyBreakdown {
  assertGrosze(netGr, "netto");
  assertVatRate(vatRate);
  const vatGr = roundHalfUp((netGr * vatRate) / 100);
  return { netGr, vatGr, grossGr: netGr + vatGr };
}

/** Z kwoty brutto (grosze) i stawki VAT wylicza netto i VAT. */
export function netFromGross(grossGr: number, vatRate: number): MoneyBreakdown {
  assertGrosze(grossGr, "brutto");
  assertVatRate(vatRate);
  const netGr = roundHalfUp((grossGr * 100) / (100 + vatRate));
  return { netGr, vatGr: grossGr - netGr, grossGr };
}

/** Suma kwot w groszach (integer). */
export function sumGr(amounts: readonly number[]): number {
  return amounts.reduce((acc, gr) => acc + assertGrosze(gr), 0);
}

const plnFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

/** Formatuje grosze jako kwotę PLN — używać WYŁĄCZNIE przy renderowaniu. */
export function formatPln(amountGr: number): string {
  assertGrosze(amountGr);
  return plnFormatter.format(amountGr / 100);
}

/**
 * Parsuje kwotę wpisaną przez użytkownika (np. "1 234,50" albo "1234.5")
 * na grosze. Zwraca null, gdy nie da się sparsować.
 */
export function parsePlnToGr(input: string): number | null {
  const cleaned = input.trim().replace(/\s/g, "").replace(",", ".");
  if (cleaned === "" || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const zloty = Number.parseFloat(cleaned);
  if (!Number.isFinite(zloty)) return null;
  return roundHalfUp(zloty * 100);
}
