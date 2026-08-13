import Link from "next/link";
import { Phone, Search, Mail, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/states";
import { customerKindLabel } from "@/lib/domain/dictionaries";
import { listCustomers, type Customer } from "@/lib/db/customers";
import { CustomerQuickAdd } from "./customer-quick-add";

/** Nazwa do wyświetlenia, gdy klient nie ma imienia/nazwy firmy. */
function displayName(c: Customer): string {
  if (c.name) return c.name;
  if (c.phone) return c.phone;
  if (c.email) return c.email;
  return "Klient bez nazwy";
}

export default async function CustomersPage({
  searchParams,
}: PageProps<"/klienci">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const customers = await listCustomers(q);

  return (
    <>
      <PageHeader
        title="Klienci"
        subtitle="Baza klientów, obiektów i urządzeń"
        action={<CustomerQuickAdd />}
      />

      <form method="get" className="mb-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Szukaj po nazwie, telefonie lub e-mailu"
            className="touch-target w-full rounded-app border border-border bg-surface pl-9 pr-3 text-base outline-none focus:border-accent"
          />
        </div>
      </form>

      {customers.length === 0 ? (
        q ? (
          <EmptyState
            title="Brak wyników"
            description={`Nie znaleziono klientów dla „${q}".`}
          />
        ) : (
          <EmptyState
            title="Brak klientów"
            description="Dodaj pierwszego klienta — wystarczy telefon lub adres."
          />
        )
      ) : (
        <ul className="flex flex-col gap-2">
          {customers.map((c) => (
            <li key={c.id}>
              <Link
                href={`/klienci/${c.id}`}
                className="flex items-center gap-3 rounded-app border border-border bg-surface px-4 py-3 transition-colors hover:border-accent"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{displayName(c)}</span>
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
                      {customerKindLabel(c.kind)}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted">
                    {c.phone ? (
                      <span className="tabular inline-flex items-center gap-1">
                        <Phone className="size-3.5" aria-hidden />
                        {c.phone}
                      </span>
                    ) : null}
                    {c.email ? (
                      <span className="inline-flex items-center gap-1 truncate">
                        <Mail className="size-3.5" aria-hidden />
                        {c.email}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
