import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "danger" | "outline";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-2",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground",
  danger: "border border-danger/40 bg-danger/5 text-danger hover:bg-danger/10",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** Przycisk z celem dotykowym ≥44 px (§9). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "touch-target inline-flex items-center justify-center gap-2 rounded-app px-4 text-sm font-semibold transition-colors disabled:opacity-60",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
});
