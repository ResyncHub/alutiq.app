import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/states";

export default function FinancePage() {
  return (
    <>
      <PageHeader title="Finanse" subtitle="Wydatki, wpłaty i raporty" />
      <EmptyState
        icon={<Wallet className="size-8" />}
        title="Moduł finansów w planie"
        description="Kwoty prowadzone w groszach, kategorie kosztów: materiały, paliwo/dojazd, narzędzia. Dashboard i zestawienia okresowe powstaną w Etapie 4–5."
      />
    </>
  );
}
