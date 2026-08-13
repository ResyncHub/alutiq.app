"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayInWarsaw,
  warsawDateOf,
} from "@/lib/domain/dates";
import { dominantStatus, jobStatusBorder } from "@/lib/domain/dictionaries";
import type { JobWithCustomer } from "@/lib/db/jobs";
import { JobListItem } from "../zlecenia/job-list-item";
import { JobQuickAdd } from "../zlecenia/job-quick-add";
import type { CustomerOption } from "../zlecenia/job-form";

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const LEGEND = [
  { cls: "bg-accent", label: "Zaplanowane / w toku" },
  { cls: "bg-warning", label: "Czeka na części" },
  { cls: "bg-success", label: "Zrobione / rozliczone" },
  { cls: "bg-danger", label: "Anulowane" },
] as const;

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

/** Kalendarz miesięczny; wybór dnia pokazuje jego zlecenia poniżej. */
export function MonthCalendar({
  month,
  jobs,
  customers,
}: {
  month: string;
  jobs: JobWithCustomer[];
  customers: CustomerOption[];
}) {
  const today = todayInWarsaw();
  const firstOfMonth = `${month}-01`;
  const [selected, setSelected] = useState(
    today.startsWith(month) ? today : firstOfMonth,
  );

  // Zlecenia pogrupowane po dniu (czas warszawski).
  const byDay = new Map<string, JobWithCustomer[]>();
  for (const job of jobs) {
    if (!job.scheduled_at) continue;
    const day = warsawDateOf(new Date(job.scheduled_at));
    const list = byDay.get(day) ?? [];
    list.push(job);
    byDay.set(day, list);
  }

  // Dni siatki: od poniedziałku tygodnia z 1. dniem miesiąca do niedzieli ostatniego.
  const gridStart = startOfWeek(startOfMonth(firstOfMonth));
  const gridEnd = endOfWeek(endOfMonth(firstOfMonth));
  const days: string[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const selectedJobs = byDay.get(selected) ?? [];
  const selectedLabel = new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${selected}T12:00:00Z`));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/kalendarz?m=${shiftMonth(month, -1)}`}
          aria-label="Poprzedni miesiąc"
          className="touch-target flex items-center justify-center rounded-app text-muted hover:text-foreground"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h2 className="text-base font-semibold capitalize">{monthLabel(month)}</h2>
        <Link
          href={`/kalendarz?m=${shiftMonth(month, 1)}`}
          aria-label="Następny miesiąc"
          className="touch-target flex items-center justify-center rounded-app text-muted hover:text-foreground"
        >
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayJobs = byDay.get(day) ?? [];
          const status = dominantStatus(dayJobs.map((j) => j.status));
          const inMonth = day.startsWith(month);
          const isToday = day === today;
          const isSelected = day === selected;
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelected(day)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-app border-2 text-sm transition-colors",
                inMonth ? "text-foreground" : "text-muted/40",
                status ? jobStatusBorder(status) : "border-transparent",
                isSelected ? "bg-accent/15 ring-1 ring-accent" : "hover:bg-surface-2",
                !isSelected && isToday ? "font-semibold text-accent" : "",
              )}
            >
              <span>{Number(day.slice(-2))}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {LEGEND.map((l) => (
          <span key={l.label} className="inline-flex items-center gap-1">
            <span className={cn("size-1.5 rounded-full", l.cls)} aria-hidden />
            {l.label}
          </span>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold capitalize">{selectedLabel}</h3>
          <JobQuickAdd
            customers={customers}
            defaultScheduledAt={`${selected}T09:00`}
            triggerLabel="Dodaj"
            variant="outline"
            className="px-3"
          />
        </div>

        {selectedJobs.length === 0 ? (
          <p className="rounded-app border border-dashed border-border bg-surface/50 px-4 py-6 text-center text-sm text-muted">
            Brak zleceń tego dnia.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedJobs.map((job) => (
              <li key={job.id}>
                <JobListItem job={job} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
