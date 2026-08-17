import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/app-shell/bottom-nav";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Zabezpieczenie na wypadek pominięcia middleware.
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-wordmark.png"
              alt="Alutiq"
              width={60}
              height={24}
              priority
              className="rounded-md"
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>

      <BottomNav />
    </div>
  );
}
