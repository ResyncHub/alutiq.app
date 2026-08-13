import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/app-shell/page-header";
import { EmptyState } from "@/components/ui/states";

export default function ChatPage() {
  return (
    <>
      <PageHeader title="Czat z danymi" subtitle="Asystent Claude — wkrótce" />
      <EmptyState
        icon={<MessageSquare className="size-8" />}
        title="Asystent podłączymy w ostatnim etapie"
        description="Wspólna warstwa narzędzi nad bazą pozwoli rozmawiać z danymi tutaj i przez Telegram. Najpierw budujemy moduły, na których asystent będzie operował."
      />
    </>
  );
}
