import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
} from "@/lib/domain/dictionaries";
import { endOfMonth, startOfMonth, todayInWarsaw } from "@/lib/domain/dates";
import { formatPln, sumGr } from "@/lib/domain/money";
import { cn } from "@/lib/utils";
import { getYearlyTotals, listExpenses, listPayments } from "@/lib/db/finance";
import { listJobOptions } from "@/lib/db/jobs";
import { ExpenseItem } from "./expense-item";
import { PaymentItem } from "./payment-item";
import { ExpenseQuickAdd, PaymentQuickAdd } from "./finance-quick-add";
import { CategoryBars, IncomeExpenseChart, ProfitChart } from "./finance-charts";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const idx = y * 12 + (m - 1) + delta;
  return `${Math.floor(idx / 12)}-${pad2((idx % 12) + 1)}`;
}
function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, 15)),
  );
}
function normalizeMonth(raw: string | undefined): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
  return todayInWarsaw().slice(0, 7);
}

export default async function FinancePage({ searchParams }: PageProps<"/finanse">) {
  const params = await searchParams;
  const month = normalizeMonth(typeof params.m === "string" ? params.m : undefined);
  const from = `${month}-01`;
  const to = endOfMonth(startOfMonth(from));

  const year = Number(month.slice(0, 4));
  const [expenses, payments, jobs, yearly] = await Promise.all([
    listExpenses(from, to),
    listPayments(from, to),
    listJobOptions(),
    getYearlyTotals(year),
  ]);

  const expensesGr = sumGr(expenses.map((e) => e.gross_gr));
  const paymentsGr = sumGr(payments.map((p) => p.amount_gr));
  const balanceGr = paymentsGr - expensesGr;

  const byCategory = EXPENSE_CATEGORIES.map((c) => ({
    category: c,
    label: EXPENSE_CATEGORY_LABELS[c],
    sumGr: sumGr(expenses.filter((e) => e.category === c).map((e) => e.gross_gr)),
  })).filter((row) => row.sumGr > 0);

  return (
    <>
      <PageHeader title="Finanse" subtitle="Wpłaty, wydatki i zestawienia" />

      {/* Wybór miesiąca */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={`/finanse?m=${shiftMonth(month, -1)}`}
          aria-label="Poprzedni miesiąc"
          className="touch-target flex items-center justify-center rounded-app text-muted hover:text-foreground"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h2 className="text-base font-semibold capitalize">{monthLabel(month)}</h2>
        <Link
          href={`/finanse?m=${shiftMonth(month, 1)}`}
          aria-label="Następny miesiąc"
          className="touch-target flex items-center justify-center rounded-app text-muted hover:text-foreground"
        >
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      </div>

      {/* Podsumowanie */}
      <div className="mb-5 grid grid-cols-3 gap-2">
        <div className="rounded-app border border-border bg-surface px-3 py-2">
          <span className="tabular block text-lg font-semibold text-success">
            {formatPln(paymentsGr)}
          </span>
          <span className="text-xs text-muted">Wpłaty</span>
        </div>
        <div className="rounded-app border border-border bg-surface px-3 py-2">
          <span className="tabular block text-lg font-semibold">
            {formatPln(expensesGr)}
          </span>
          <span className="text-xs text-muted">Wydatki</span>
        </div>
        <div className="rounded-app border border-border bg-surface px-3 py-2">
          <span
            className={cn(
              "tabular block text-lg font-semibold",
              balanceGr >= 0 ? "text-success" : "text-danger",
            )}
          >
            {formatPln(balanceGr)}
          </span>
          <span className="text-xs text-muted">Bilans</span>
        </div>
      </div>

      {/* Wykresy */}
      <div className="mb-6 flex flex-col gap-4">
        <IncomeExpenseChart data={yearly} year={year} />
        <ProfitChart data={yearly} year={year} />
        {byCategory.length > 0 ? (
          <CategoryBars rows={byCategory.map((r) => ({ label: r.label, sumGr: r.sumGr }))} />
        ) : null}
      </div>

      {/* Wpłaty */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Wpłaty {payments.length > 0 ? `(${payments.length})` : ""}
          </h2>
          <PaymentQuickAdd jobs={jobs} />
        </div>
        {payments.length === 0 ? (
          <p className="rounded-app border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
            Brak wpłat w tym miesiącu.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {payments.map((p) => (
              <PaymentItem key={p.id} payment={p} jobs={jobs} />
            ))}
          </ul>
        )}
      </section>

      {/* Wydatki */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Wydatki {expenses.length > 0 ? `(${expenses.length})` : ""}
          </h2>
          <ExpenseQuickAdd jobs={jobs} />
        </div>
        {expenses.length === 0 ? (
          <p className="rounded-app border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
            Brak wydatków w tym miesiącu.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {expenses.map((e) => (
              <ExpenseItem key={e.id} expense={e} jobs={jobs} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
