/**
 * Daty — jedyne miejsce liczące "dziś" oraz granice tygodnia/miesiąca (CLAUDE.md §7).
 *
 * Zasady:
 * - w bazie timestamptz w UTC; dzień księgowy (spent_on, paid_on) jako `date`,
 * - strefa prezentacji zawsze Europe/Warsaw, nigdy strefa przeglądarki,
 * - tydzień zaczyna się w poniedziałek,
 * - zmiana czasu (DST) to typowe miejsce na błąd — dlatego offset liczymy z Intl.
 *
 * Konwencja: "dzień księgowy" reprezentujemy jako string "YYYY-MM-DD" (kalendarzowy,
 * bez strefy), a chwile czasu jako obiekty Date (UTC).
 */

export const WARSAW_TZ = "Europe/Warsaw";

/** Data kalendarzowa w formacie "YYYY-MM-DD". */
export type IsoDate = string;

/** Zakres chwil w UTC: [startUtc, endUtc) — koniec wyłączny. */
export interface UtcRange {
  startUtc: Date;
  endUtc: Date;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Offset danej strefy względem UTC w milisekundach dla konkretnej chwili. */
function tzOffsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - instant.getTime();
}

/**
 * Chwila UTC odpowiadająca zegarowi ściennemu w Warszawie.
 * Używane do wyznaczania granic doby — granice padają o północy, z dala od
 * godziny przełączenia DST (2:00–3:00), więc pojedyncza korekta offsetu wystarcza.
 */
function warsawWallToUtc(
  y: number,
  m: number,
  d: number,
  h = 0,
  mi = 0,
  s = 0,
  ms = 0,
): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi, s, ms);
  const offset = tzOffsetMs(new Date(guess), WARSAW_TZ);
  return new Date(guess - offset);
}

/** Rozbija "YYYY-MM-DD" na liczby; rzuca przy złym formacie. */
function parseIsoDate(date: IsoDate): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new Error(`Nieprawidłowa data (oczekiwano YYYY-MM-DD): ${date}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** Dzisiejsza data kalendarzowa w Warszawie jako "YYYY-MM-DD". */
export function todayInWarsaw(now: Date = new Date()): IsoDate {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: WARSAW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA daje format YYYY-MM-DD
  return dtf.format(now);
}

/** Dodaje n dni do daty kalendarzowej (może być ujemne). */
export function addDays(date: IsoDate, n: number): IsoDate {
  const [y, m, d] = parseIsoDate(date);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/** Dzień tygodnia: 1 = poniedziałek ... 7 = niedziela. */
export function weekdayMonday1(date: IsoDate): number {
  const [y, m, d] = parseIsoDate(date);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=nd ... 6=sob
  return ((dow + 6) % 7) + 1;
}

/** Poniedziałek tygodnia, w którym leży data. */
export function startOfWeek(date: IsoDate): IsoDate {
  return addDays(date, -(weekdayMonday1(date) - 1));
}

/** Niedziela tygodnia, w którym leży data. */
export function endOfWeek(date: IsoDate): IsoDate {
  return addDays(startOfWeek(date), 6);
}

/** Pierwszy dzień miesiąca. */
export function startOfMonth(date: IsoDate): IsoDate {
  const [y, m] = parseIsoDate(date);
  return `${y}-${pad2(m)}-01`;
}

/** Ostatni dzień miesiąca. */
export function endOfMonth(date: IsoDate): IsoDate {
  const [y, m] = parseIsoDate(date);
  const nextMonthFirst = m === 12 ? `${y + 1}-01-01` : `${y}-${pad2(m + 1)}-01`;
  return addDays(nextMonthFirst, -1);
}

/**
 * Zakres UTC obejmujący całe dni kalendarzowe [fromDate, toDate] w Warszawie.
 * Zwraca [startUtc, endUtc), gdzie endUtc to północ dnia następującego po toDate.
 * Do filtrowania kolumn timestamptz (np. visit.starts_at).
 */
export function warsawRangeUtc(fromDate: IsoDate, toDate: IsoDate): UtcRange {
  const [fy, fm, fd] = parseIsoDate(fromDate);
  const [ty, tm, td] = parseIsoDate(toDate);
  const startUtc = warsawWallToUtc(fy, fm, fd, 0, 0, 0, 0);
  const nextDay = addDays(`${ty}-${pad2(tm)}-${pad2(td)}`, 1);
  const [ny, nm, nd] = parseIsoDate(nextDay);
  const endUtc = warsawWallToUtc(ny, nm, nd, 0, 0, 0, 0);
  return { startUtc, endUtc };
}

/** Zakres UTC pojedynczej doby w Warszawie. */
export function warsawDayRangeUtc(date: IsoDate): UtcRange {
  return warsawRangeUtc(date, date);
}

const dateFormatterPl = new Intl.DateTimeFormat("pl-PL", {
  timeZone: WARSAW_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatterPl = new Intl.DateTimeFormat("pl-PL", {
  timeZone: WARSAW_TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formatuje chwilę jako datę w strefie warszawskiej (do renderowania). */
export function formatDatePl(instant: Date): string {
  return dateFormatterPl.format(instant);
}

/** Formatuje chwilę jako datę i godzinę w strefie warszawskiej (do renderowania). */
export function formatDateTimePl(instant: Date): string {
  return dateTimeFormatterPl.format(instant);
}

const timeFormatterPl = new Intl.DateTimeFormat("pl-PL", {
  timeZone: WARSAW_TZ,
  hour: "2-digit",
  minute: "2-digit",
});

/** Formatuje chwilę jako godzinę w strefie warszawskiej (do renderowania). */
export function formatTimePl(instant: Date): string {
  return timeFormatterPl.format(instant);
}

/**
 * "YYYY-MM-DDTHH:mm" z pola datetime-local (czas warszawski) -> ISO UTC.
 * Używane przy zapisie terminu zlecenia.
 */
export function warsawLocalToUtcIso(local: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) throw new Error(`Nieprawidłowy termin (oczekiwano YYYY-MM-DDTHH:mm): ${local}`);
  const d = warsawWallToUtc(
    Number(m[1]),
    Number(m[2]),
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
  );
  return d.toISOString();
}

/**
 * ISO UTC -> "YYYY-MM-DDTHH:mm" w czasie warszawskim (do pola datetime-local).
 */
export function utcToWarsawLocalInput(iso: string): string {
  const dtf = new Intl.DateTimeFormat("sv-SE", {
    timeZone: WARSAW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  // sv-SE daje "YYYY-MM-DD HH:mm"
  return dtf.format(new Date(iso)).replace(" ", "T");
}

/** Data kalendarzowa "YYYY-MM-DD" w Warszawie dla danej chwili UTC. */
export function warsawDateOf(instant: Date): IsoDate {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: WARSAW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(instant);
}
