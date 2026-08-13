import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Stan ładowania — prosty, bez animacji-ozdobników (§9). */
export function LoadingState({ label = "Ładowanie…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="size-2 animate-pulse rounded-full bg-accent" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

/**
 * Pusty ekran = zaproszenie do działania (§9).
 * `action` to zwykle przycisk dodania pierwszego rekordu.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-app border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      {icon ? <div className="text-muted">{icon}</div> : null}
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Stan błędu — mówi, co się stało i co zrobić (§9). */
export function ErrorState({
  title = "Coś poszło nie tak",
  description,
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-app border border-danger/40 bg-danger/5 px-6 py-16 text-center",
        className,
      )}
      role="alert"
    >
      <h2 className="text-lg font-semibold text-danger">{title}</h2>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
