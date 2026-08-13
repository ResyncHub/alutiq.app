"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Wylogowanie — czyści sesję i wraca na ekran logowania. */
export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label="Wyloguj się"
      className="touch-target flex items-center justify-center rounded-md text-muted transition-colors hover:text-foreground"
    >
      <LogOut className="size-5" aria-hidden />
    </button>
  );
}
