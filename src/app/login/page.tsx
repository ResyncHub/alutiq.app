"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      setError("Nie udało się zalogować. Sprawdź e-mail i hasło.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-md bg-accent text-lg font-bold text-accent-foreground">
            A
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Alutiq</h1>
            <p className="text-sm text-muted">Zaloguj się do systemu serwisu</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">E-mail</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="touch-target rounded-app border border-border bg-surface px-3 text-base outline-none focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Hasło</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="touch-target rounded-app border border-border bg-surface px-3 text-base outline-none focus:border-accent"
            />
          </label>

          {error ? (
            <p className="rounded-app border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="touch-target mt-1 rounded-app bg-accent px-4 font-semibold text-accent-foreground transition-opacity disabled:opacity-60"
          >
            {pending ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>
      </div>
    </main>
  );
}
