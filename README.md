# Alutiq

System operacyjny jednoosobowego serwisu okienno-drzwiowego i automatyki
(bramy, napędy, rolety, automaty drzwiowe, automatyka tarasowa).

Zasady pracy nad projektem: [`CLAUDE.md`](./CLAUDE.md).
Dziennik decyzji: [`docs/decisions.md`](./docs/decisions.md).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 ·
Supabase (Postgres + Auth + Storage) · zod · React Hook Form · vitest.

## Wymagane zmienne środowiskowe

Trzymane w `.env.local` (poza repo — `.env*` jest w `.gitignore`).

| Zmienna | Do czego | Gdzie znaleźć |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | działanie aplikacji | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | działanie aplikacji (klucz anon + RLS) | j.w. |
| `SUPABASE_ACCESS_TOKEN` | CLI: migracje, generowanie typów | Supabase → Account → Access Tokens |
| `SUPABASE_DB_PASSWORD` | CLI: `db push` przez pooler | Supabase → Project Settings → Database |
| `SUPABASE_PROJECT_ID` | wygoda skryptów | ref projektu |

> Klucz `service_role` nie jest używany po stronie klienta ani w `NEXT_PUBLIC_*` (§10).

## Uruchomienie

```bash
npm install
npm run dev          # http://localhost:3000
```

Aplikacja wymaga zalogowania. Utwórz użytkownika w Supabase → Authentication → Users
(e-mail + hasło), potem zaloguj się na `/login`.

## Skrypty

```bash
npm run dev          # serwer deweloperski
npm run build        # build produkcyjny
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # testy jednostkowe (vitest)
npm run db:push      # wypchnięcie migracji do Supabase (wymaga hasła do bazy)
npm run db:types     # regeneracja src/lib/supabase/database.types.ts
```

## Baza danych

- Migracje: pliki SQL w [`supabase/migrations/`](./supabase/migrations) (§4).
- Typy TS: `src/lib/supabase/database.types.ts` — **plik generowany, nie edytuj ręcznie**.
- RLS włączone na każdej tabeli, polityki oparte o `auth.uid() = user_id`.

### Uwaga: hasło do bazy

Przy zakładaniu projektu `supabase db push` odrzucił podane hasło do bazy
(`password authentication failed`). Pierwsza migracja została wgrana przez
Supabase Management API (access token) i zarejestrowana w tabeli migracji.
Aby `npm run db:push` działał dla kolejnych migracji, ustaw prawidłowe
`SUPABASE_DB_PASSWORD` (Supabase → Project Settings → Database → w razie
potrzeby „Reset database password").

## Struktura

```
src/
  app/
    (app)/           # obszar po zalogowaniu (nagłówek + dolna nawigacja)
    login/           # ekran logowania
  components/        # UI: nawigacja, stany, nagłówki
  lib/
    domain/          # czysta logika: money.ts, dates.ts (+ testy)
    supabase/        # klienty (client/server) + typy generowane
    db/              # (wkrótce) dostęp do danych per domena
    validation/      # (wkrótce) schematy zod
  proxy.ts           # sesja Supabase + ochrona tras (Next 16 "proxy")
```

## Roadmapa

- [x] Etap 0 — Fundament (scaffold, baza klientów w DB, auth, domena, szkielet UI)
- [ ] Etap 1 — Baza klientów (interfejs: customer / site / device)
- [ ] Etap 2 — Zlecenia + kalendarz (job / visit)
- [ ] Etap 3 — Zdjęcia i notatki do zleceń
- [ ] Etap 4 — Finanse (expense / payment)
- [ ] Etap 5 — Dashboard i raporty
- [ ] Etap 6 — Warstwa AI / czat (+ Telegram)
```
