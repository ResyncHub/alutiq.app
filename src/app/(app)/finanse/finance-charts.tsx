import { formatPln } from "@/lib/domain/money";
import { cn } from "@/lib/utils";

const MONTHS_SHORT = [
  "Sty", "Lut", "Mar", "Kwi", "Maj", "Cze",
  "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru",
];

const CHART_H = 112; // px – wysokość obszaru słupków

type MonthTotals = { month: number; incomeGr: number; expenseGr: number };

function LegendItem({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <span className={cn("size-2.5 rounded-sm", cls)} aria-hidden />
      {label}
    </span>
  );
}

function bar(valueGr: number, maxGr: number): number {
  if (valueGr <= 0) return 0;
  return Math.max(2, Math.round((valueGr / maxGr) * CHART_H));
}

/** Przychód vs wydatki — słupki grupowane, miesiąc po miesiącu. */
export function IncomeExpenseChart({
  data,
  year,
}: {
  data: MonthTotals[];
  year: number;
}) {
  const max = Math.max(1, ...data.flatMap((m) => [m.incomeGr, m.expenseGr]));
  const empty = data.every((m) => m.incomeGr === 0 && m.expenseGr === 0);

  return (
    <section className="rounded-app border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Przychód vs wydatki · {year}</h3>
        <div className="flex gap-3">
          <LegendItem cls="bg-accent" label="Przychód" />
          <LegendItem cls="bg-warning" label="Wydatki" />
        </div>
      </div>

      {empty ? (
        <p className="py-8 text-center text-sm text-muted">Brak danych w tym roku.</p>
      ) : (
        <div className="flex items-end gap-1" style={{ height: CHART_H + 20 }}>
          {data.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex items-end justify-center gap-0.5" style={{ height: CHART_H }}>
                <div
                  className="w-1.5 rounded-t bg-accent"
                  style={{ height: bar(m.incomeGr, max) }}
                  title={`${MONTHS_SHORT[m.month - 1]}: przychód ${formatPln(m.incomeGr)}`}
                />
                <div
                  className="w-1.5 rounded-t bg-warning"
                  style={{ height: bar(m.expenseGr, max) }}
                  title={`${MONTHS_SHORT[m.month - 1]}: wydatki ${formatPln(m.expenseGr)}`}
                />
              </div>
              <span className="text-[9px] text-muted">{MONTHS_SHORT[m.month - 1]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Zysk w czasie — słupki wokół zera (zielony dodatni / czerwony ujemny). */
export function ProfitChart({ data, year }: { data: MonthTotals[]; year: number }) {
  const profits = data.map((m) => ({ month: m.month, profitGr: m.incomeGr - m.expenseGr }));
  const maxAbs = Math.max(1, ...profits.map((p) => Math.abs(p.profitGr)));
  const half = CHART_H / 2;
  const empty = profits.every((p) => p.profitGr === 0);

  function halfBar(v: number): number {
    if (v === 0) return 0;
    return Math.max(2, Math.round((Math.abs(v) / maxAbs) * half));
  }

  return (
    <section className="rounded-app border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">Zysk w czasie · {year}</h3>
      {empty ? (
        <p className="py-8 text-center text-sm text-muted">Brak danych w tym roku.</p>
      ) : (
        <div className="flex items-stretch gap-1">
          {profits.map((p) => (
            <div key={p.month} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-col items-center">
                <div className="flex items-end justify-center" style={{ height: half }}>
                  {p.profitGr > 0 ? (
                    <div
                      className="w-2 rounded-t bg-success"
                      style={{ height: halfBar(p.profitGr) }}
                      title={`${MONTHS_SHORT[p.month - 1]}: zysk ${formatPln(p.profitGr)}`}
                    />
                  ) : null}
                </div>
                <div className="h-px w-full bg-border" aria-hidden />
                <div className="flex items-start justify-center" style={{ height: half }}>
                  {p.profitGr < 0 ? (
                    <div
                      className="w-2 rounded-b bg-danger"
                      style={{ height: halfBar(p.profitGr) }}
                      title={`${MONTHS_SHORT[p.month - 1]}: strata ${formatPln(p.profitGr)}`}
                    />
                  ) : null}
                </div>
              </div>
              <span className="text-[9px] text-muted">{MONTHS_SHORT[p.month - 1]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** Wydatki wg kategorii — poziome słupki (jednolity kolor, etykiety niosą tożsamość). */
export function CategoryBars({
  rows,
}: {
  rows: { label: string; sumGr: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.sumGr));
  return (
    <section className="rounded-app border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">Koszty wg kategorii</h3>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{r.label}</span>
              <span className="tabular">{formatPln(r.sumGr)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-2 rounded-full bg-accent"
                style={{ width: `${Math.max(3, Math.round((r.sumGr / max) * 100))}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
