"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Users,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Dziś", icon: LayoutDashboard },
  { href: "/kalendarz", label: "Kalendarz", icon: CalendarDays },
  { href: "/zlecenia", label: "Zlecenia", icon: ClipboardList },
  { href: "/klienci", label: "Klienci", icon: Users },
  { href: "/finanse", label: "Finanse", icon: Wallet },
  { href: "/czat", label: "Czat", icon: MessageSquare },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Dolna nawigacja — główne akcje w zasięgu kciuka (§9). */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Nawigacja główna"
    >
      <ul className="mx-auto flex max-w-3xl">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "touch-target flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                  active ? "text-accent" : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
