import { Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/states";

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Klienci" subtitle="Baza klientów, obiektów i urządzeń" />
      <EmptyState
        icon={<Users className="size-8" />}
        title="Baza klientów gotowa w bazie danych"
        description="Tabele klientów, obiektów i urządzeń są już w Supabase z RLS. Interfejs dodawania i przeglądania budujemy w Etapie 1."
      />
    </>
  );
}
