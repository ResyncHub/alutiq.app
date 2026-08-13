import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Mail } from "lucide-react";
import { customerKindLabel } from "@/lib/domain/dictionaries";
import { getCustomer, listCustomerOptions } from "@/lib/db/customers";
import { listSitesForCustomer } from "@/lib/db/sites";
import { listDevicesForCustomer, type Device } from "@/lib/db/devices";
import { listJobsForCustomer } from "@/lib/db/jobs";
import { JobListItem } from "../../zlecenia/job-list-item";
import { JobQuickAdd } from "../../zlecenia/job-quick-add";
import { CustomerActions } from "./customer-actions";
import { SiteQuickAdd } from "./site-quick-add";
import { SiteActions } from "./site-actions";
import { DeviceQuickAdd } from "./device-quick-add";
import { DeviceItem } from "./device-item";

function siteTitle(label: string | null, address: string | null): string {
  return label || address || "Obiekt bez nazwy";
}

export default async function CustomerDetailPage({
  params,
}: PageProps<"/klienci/[id]">) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const [sites, devices, jobs, customerOptions] = await Promise.all([
    listSitesForCustomer(id),
    listDevicesForCustomer(id),
    listJobsForCustomer(id),
    listCustomerOptions(),
  ]);

  const devicesBySite = new Map<string, Device[]>();
  for (const d of devices) {
    const list = devicesBySite.get(d.site_id) ?? [];
    list.push(d);
    devicesBySite.set(d.site_id, list);
  }

  const title = customer.name || customer.phone || "Klient bez nazwy";

  return (
    <>
      <Link
        href="/klienci"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Klienci
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
              {customerKindLabel(customer.kind)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="tabular inline-flex items-center gap-1 hover:text-foreground"
              >
                <Phone className="size-3.5" aria-hidden />
                {customer.phone}
              </a>
            ) : null}
            {customer.email ? (
              <a
                href={`mailto:${customer.email}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Mail className="size-3.5" aria-hidden />
                {customer.email}
              </a>
            ) : null}
          </div>
        </div>
        <CustomerActions customer={customer} />
      </div>

      {customer.notes ? (
        <p className="mb-5 whitespace-pre-wrap rounded-app border border-border bg-surface px-4 py-3 text-sm">
          {customer.notes}
        </p>
      ) : null}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Zlecenia {jobs.length > 0 ? `(${jobs.length})` : ""}
          </h2>
          <JobQuickAdd
            customers={customerOptions}
            defaultCustomerId={customer.id}
            triggerLabel="Dodaj"
            variant="outline"
            className="px-3"
          />
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-app border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-muted">
            Brak zleceń dla tego klienta.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {jobs.map((job) => (
              <li key={job.id}>
                <JobListItem job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Obiekty i urządzenia
          </h2>
          <SiteQuickAdd customerId={customer.id} />
        </div>

        {sites.length === 0 ? (
          <div className="rounded-app border border-dashed border-border bg-surface/50 px-4 py-8 text-center text-sm text-muted">
            Brak obiektów. Dodaj adres, pod którym pracujesz u tego klienta.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {sites.map((site) => {
              const siteDevices = devicesBySite.get(site.id) ?? [];
              const addressLine = [site.postal_code, site.city].filter(Boolean).join(" ");
              return (
                <li key={site.id} className="rounded-app border border-border bg-surface p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{siteTitle(site.label, site.address)}</p>
                      {site.label && site.address ? (
                        <p className="text-sm text-muted">{site.address}</p>
                      ) : null}
                      {addressLine ? (
                        <p className="text-sm text-muted">{addressLine}</p>
                      ) : null}
                      {site.notes ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                          {site.notes}
                        </p>
                      ) : null}
                    </div>
                    <SiteActions site={site} />
                  </div>

                  {siteDevices.length > 0 ? (
                    <ul className="mt-3 flex flex-col border-t border-border pt-2">
                      {siteDevices.map((d) => (
                        <DeviceItem key={d.id} device={d} customerId={customer.id} />
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-2">
                    <DeviceQuickAdd siteId={site.id} customerId={customer.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
