# CLAUDE.md

Zasady pracy nad tym projektem. Czytaj ten plik przed każdą zmianą.
Jeśli coś tutaj koliduje z prośbą użytkownika — powiedz o tym, nie zgaduj.

---

## 1. Kontekst

Aplikacja wewnętrzna dla jednoosobowej firmy: **serwis okienno-drzwiowy + serwis automatyki**
(bramy, napędy, rolety, automaty drzwiowe).

- **Użytkownik: jedna osoba.** Właściciel firmy, pracuje głównie z telefonu w terenie,
  rozliczenia robi wieczorem na laptopie.
- **To nie jest produkt na sprzedaż.** Nie buduj onboardingu, landing page'a, planów
  cenowych, zapraszania użytkowników, ustawień organizacji. Jeśli funkcja nie oszczędza
  właścicielowi czasu albo pieniędzy — nie powstaje.
- **Priorytety na start (w tej kolejności):**
  1. Kalendarz i planowanie wizyt
  2. Szybkie dodawanie zdjęć z telefonu przy zleceniu
  3. Przychody / wydatki i raporty pod rozliczenie

Praca offline nie jest wymagana. Ale aplikacja **nigdy nie może zgubić wpisanych danych**
przy słabym zasięgu — patrz §8.

---

## 2. Stack — nie zmieniaj bez pytania

- Next.js (App Router) + TypeScript w trybie `strict`
- Tailwind CSS + shadcn/ui
- Supabase: Postgres + Auth + Storage
- `zod` do walidacji, React Hook Form do formularzy
- Mutacje przez Server Actions. `useEffect` do pobierania danych = błąd.
- PWA: manifest + service worker do instalacji i cache'owania shella. Bez frameworków PWA.

**Zanim dodasz jakąkolwiek nową zależność — zapytaj.** Podaj powód, wagę paczki i co
się stanie, jeśli jej nie będzie. Domyślna odpowiedź to „nie".

---

## 3. Język i nazewnictwo

| Warstwa | Język | Przykład |
|---|---|---|
| Tabele, kolumny, typy, kod | angielski, `snake_case` w bazie, `camelCase` w TS | `job_status`, `createJob()` |
| Teksty w interfejsie | polski | „Dodaj zlecenie" |
| Komentarze, commity, dokumentacja | polski | |

Słownik domenowy — trzymaj się go, nie wymyślaj synonimów:

| Polski | W kodzie | Znaczenie |
|---|---|---|
| klient | `customer` | osoba lub firma |
| obiekt / adres | `site` | miejsce robót; klient może mieć kilka |
| urządzenie | `device` | brama, napęd, okno, drzwi — z numerem seryjnym i gwarancją |
| zlecenie | `job` | jednostka pracy, do której podpięte są wizyty, zdjęcia, koszty |
| wizyta | `visit` | konkretny termin w kalendarzu, powiązany ze zleceniem |
| wycena | `quote` | |
| wydatek | `expense` | materiał, paliwo, podwykonawca |
| wpłata | `payment` | pieniądze, które wpłynęły |

Statusy zleceń: `new`, `scheduled`, `in_progress`, `waiting_parts`, `done`, `settled`, `cancelled`.
Nie dodawaj statusów bez pytania.

---

## 4. Baza danych

- **Migracje wyłącznie jako pliki SQL** w `supabase/migrations/`, nazwa
  `YYYYMMDDHHMMSS_opis.sql`. Nigdy nie zmieniaj schematu klikając w panelu Supabase
  i nigdy nie zakładaj, że użytkownik to zrobi ręcznie.
- **Zanim napiszesz zapytanie — przeczytaj aktualny schemat.** Nie wymyślaj kolumn
  z pamięci. Jeśli kolumny brakuje, napisz migrację, nie obchodź problemu w kodzie.
- Każda tabela ma: `id uuid primary key default gen_random_uuid()`,
  `user_id uuid not null references auth.users(id)`, `created_at timestamptz not null default now()`,
  `updated_at timestamptz not null default now()` (trigger).
- `user_id` zostaje nawet przy jednym użytkowniku. To fundament RLS i jedyna rzecz, która
  później pozwoli dopuścić pracownika bez przepisywania bazy.
- **Kasowanie miękkie** (`deleted_at timestamptz`) dla wszystkiego, co dotyka pieniędzy
  i historii: `job`, `expense`, `payment`, `customer`. Twarde `DELETE` tylko dla zdjęć
  i szkiców.
- Statusy: kolumna `text` + `CHECK` constraint. Bez typów `enum` — migracja enuma boli.
- Indeksy na tym, po czym filtrujesz: `job(user_id, status)`, `visit(user_id, starts_at)`,
  `expense(user_id, spent_on)`.
- Typy TS generowane komendą `supabase gen types typescript` do
  `src/lib/supabase/database.types.ts`. **Ten plik jest generowany — nigdy go nie edytuj
  ręcznie i nie pisz typów encji od zera.**

### RLS — bez wyjątków

Każda tabela ma `ENABLE ROW LEVEL SECURITY` i polityki oparte na `auth.uid() = user_id`,
osobno dla `select`, `insert`, `update`, `delete`. Tabela bez RLS nie przechodzi review,
nawet „tymczasowo", nawet gdy użytkownik jest jeden. Migracja tworząca tabelę zawiera
polityki w tym samym pliku.

---

## 5. Warstwa danych

- Cały dostęp do Supabase żyje w `src/lib/db/<domena>.ts` (np. `jobs.ts`, `finance.ts`).
  **Komponenty nigdy nie wołają klienta Supabase bezpośrednio.**
- Każda funkcja z `db/` waliduje wejście schematem `zod` i zwraca typ z `database.types.ts`.
- Ten sam schemat `zod` obsługuje formularz i Server Action. Jedno źródło prawdy,
  zdefiniowane w `src/lib/validation/`.
- Logika biznesowa (marże, VAT, sumy okresowe, wykrywanie kolizji terminów) siedzi
  w czystych funkcjach w `src/lib/domain/` — bez importów Reacta i bez Supabase.
  Dzięki temu da się to przetestować i zobaczyć w jednym miejscu.

---

## 6. Pieniądze

Tu błąd kosztuje realne pieniądze, więc reguły są sztywne:

- **Kwoty wyłącznie w groszach, jako `integer`.** Nigdy `float`, nigdy `numeric` w JS.
  Nazwa kolumny z sufiksem: `amount_gr`, `net_gr`, `vat_gr`, `gross_gr`.
- Waluta: PLN. Nie dodawaj obsługi wielu walut.
- Stawka VAT jako `integer` (procent: `23`, `8`, `0`). Przy każdej pozycji zapisuj
  **jawnie netto, VAT i brutto** — nie licz brutto w locie z netto przy wyświetlaniu.
- Zaokrąglanie tylko w jednym miejscu (`src/lib/domain/money.ts`), zawsze half-up,
  zawsze na końcu obliczenia.
- Formatowanie przez `Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' })`
  — wyłącznie przy renderowaniu.
- Aplikacja **nie wystawia faktur i nie liczy podatku do zapłaty.** Daje sumy i zestawienia
  za okres, do przekazania księgowej. Nie sugeruj funkcji podatkowych bez pytania.

## 7. Daty

- W bazie `timestamptz`, zawsze UTC. Wyjątek: dzień księgowy (`spent_on`, `paid_on`) jako `date`.
- Strefa prezentacji zawsze `Europe/Warsaw`. Nie polegaj na strefie przeglądarki.
- „Dziś" i granice tygodnia/miesiąca liczy jedna funkcja z `src/lib/domain/dates.ts`.
  Zmiana czasu i tydzień zaczynający się w poniedziałek to typowe miejsca na błąd.
- Wizyta ma `starts_at` i `ends_at`. Nakładające się terminy pokazuj jako ostrzeżenie,
  ale nie blokuj zapisu — realny serwis bywa chaotyczny.

---

## 8. Zdjęcia

Najczęściej używana funkcja w terenie. Musi działać jednym kciukiem, w rękawicy, w słońcu.

- Bucket Supabase Storage **prywatny**. Dostęp wyłącznie przez signed URL o krótkim czasie życia.
  Nigdy publiczny bucket.
- Ścieżka: `{user_id}/{job_id}/{uuid}.webp`. Nazwa pliku od użytkownika nigdy nie trafia
  do ścieżki.
- Kompresja **po stronie przeglądarki przed uploadem**: max ~1600 px dłuższy bok, WebP,
  cel poniżej 400 kB. Popraw orientację z EXIF, bo inaczej zdjęcia z telefonu leżą na boku.
- Metadane zdjęcia w tabeli `photo`: `job_id`, ścieżka, `taken_at`, opcjonalny opis,
  `kind` (`before` / `after` / `part` / `document`).
- Upload optymistyczny: miniatura pojawia się od razu, transfer leci w tle,
  przy błędzie ponawiaj i pokaż stan „nie wysłano" z przyciskiem ponowienia.
  **Zdjęcie nigdy nie znika po cichu.**
- Żaden formularz nie może zgubić danych przy utracie zasięgu: szkic trzymaj
  w `localStorage` pod kluczem powiązanym z rekordem, czyść po udanym zapisie.

---

## 9. Interfejs

Mobile-first, ale nie „mobile-only" — raporty finansowe projektuj pod laptop.

- Cele dotykowe min. 44 px. Główne akcje w dolnej części ekranu, w zasięgu kciuka.
- Wysoki kontrast. To narzędzie używane na dworze, nie portfolio.
- Pola liczbowe z `inputMode="numeric"`, telefon z `type="tel"` — bez podnoszenia
  klawiatury alfanumerycznej tam, gdzie wpisuje się kwotę.
- **Dodanie zlecenia to maksymalnie 3 pola obowiązkowe.** Resztę da się uzupełnić później.
  Jeśli projektujesz formularz na 12 pól — źle projektujesz.
- Teksty po polsku, zdaniowa wielkość liter, czasowniki w trybie rozkazującym:
  „Zapisz zlecenie", nie „Wyślij". Nazwa akcji jest ta sama na przycisku, w potwierdzeniu
  i w komunikacie.
- Pusty ekran to zaproszenie do działania, nie ozdoba. Błąd mówi co się stało i co zrobić.
- Bez animacji-ozdobników. Respektuj `prefers-reduced-motion`.

---

## 10. Bezpieczeństwo

- Klucz `service_role` **nigdy** po stronie klienta i nigdy w zmiennej `NEXT_PUBLIC_*`.
  Domyślnie używaj klucza `anon` + RLS.
- Sekrety tylko w `.env.local`. `.env*` w `.gitignore`. Nie wklejaj kluczy do kodu,
  migracji ani do przykładów w dokumentacji.
- Dane klientów (nazwiska, adresy, telefony) nie trafiają do logów, URL-i ani query stringów.

---

## 11. Jak masz pracować

- **Jedna zmiana na raz.** Nie generuj sześciu modułów w jednym podejściu.
- Przed większą zmianą (nowa tabela, refaktor, nowa zależność) **napisz krótki plan
  i poczekaj na zgodę.** Przy oczywistym drobiazgu po prostu zrób.
- Nie usuwaj i nie przepisuj kodu, o który nikt nie prosił. Jeśli widzisz problem obok —
  zgłoś go, nie naprawiaj po cichu.
- Nie zostawiaj kodu-zaślepki udającego działanie. Brakującą funkcję nazwij wprost.
- Nie chowaj błędów w `try/catch` z pustym blokiem. Błąd albo obsłuż, albo puść wyżej.
- Nie pisz `any` i nie wyłączaj reguł lintera, żeby przejść build.
- Gdy nie wiesz, jak firma coś robi w praktyce (np. jak rozlicza dojazd) — **zapytaj**.
  Nie zgaduj procesu biznesowego.
- Decyzje architektoniczne dopisuj jednym zdaniem do `docs/decisions.md` (data, decyzja, powód).
- Gdy ustalimy nową zasadę — zaktualizuj ten plik. CLAUDE.md ma być zawsze aktualny.

## 12. Testy

Bez pogoni za pokryciem. Testujemy tylko to, co boli:

- `src/lib/domain/money.ts` — zaokrąglanie, VAT, sumy
- `src/lib/domain/dates.ts` — granice okresów, strefa czasowa
- polityki RLS — czy zapytanie bez sesji faktycznie nic nie zwraca

## 13. Definition of Done

Zadanie jest skończone, gdy:

- [ ] `tsc` i lint przechodzą bez ostrzeżeń
- [ ] nowa tabela ma migrację, RLS i polityki w tym samym pliku
- [ ] typy zostały przegenerowane po zmianie schematu
- [ ] działa na szerokości 375 px jednym kciukiem
- [ ] widoczny jest stan ładowania, stan pusty i stan błędu
- [ ] żadna kwota nie przeszła przez `float`
- [ ] `docs/decisions.md` zaktualizowany, jeśli zapadła decyzja

---

## 14. Twarde „nie"

Nie rób tego bez wyraźnej prośby:

- multi-tenant, role, uprawnienia, zapraszanie użytkowników
- integracje z płatnościami, e-fakturą, KSeF
- powiadomienia push, e-maile, SMS-y
- wykresy i dashboardy „bo ładnie wyglądają"
- AI w aplikacji
- migracja na inną bazę, ORM albo framework

## 15. Asystent

Asystent to **orkiestrator z narzędziami**, nie „model podpięty do bazy". Pętla
tool-callingu: model dostaje zestaw narzędzi i sam wybiera, którego użyć.
Model jest częścią wymienialną — narzędzia i dane zostają.

Na teraz asystent ma **jeden mózg: operacyjny.** Czyta dane z bazy (zlecenia,
wizyty, kwoty, daty, klienci) i na ich podstawie odpowiada. Wiedza miękka
(instrukcje, procedury, RAG) jest poza zakresem — patrz §16.

### Narzędzia do bazy

- **Tylko odczyt.** Asystent nie zapisuje, nie kasuje, nie zmienia stanu.
  Kuszące będzie kiedyś pozwolić mu „dodaj zlecenie za mnie" — to moment, w którym
  halucynacja modelu zaczyna kosztować realne dane. Luzuj to świadomie, jednym
  narzędziem naraz, nigdy hurtem.
- **Nazwane funkcje, nie surowy SQL.** Nie dawaj narzędzia „wykonaj dowolne zapytanie".
  Dawaj konkretne: `get_finance_summary(from, to)`, `get_jobs_by_status(status)`,
  `find_customer(query)`, `get_visits(from, to)`. Ty kontrolujesz, co wolno.
- Liczenie (marże, VAT, sumy) robią funkcje z `src/lib/domain/` z §6 — asystent
  dostaje wynik policzony twoim kodem, nie liczy sam.
- Każda funkcja respektuje RLS (`auth.uid()`), tak jak reszta warstwy danych z §5.

### Każda odpowiedź podaje źródło

Asystent zawsze mówi, skąd wie: „(z bazy, marzec 2026)". Odpowiedź bez źródła nie
jest gotowa. Bez tego po pół roku nie odróżnisz policzonego od zmyślonego — a przy
pieniądzach to różnica między narzędziem a zabawką.

### Model za jednym modułem

Całość wywołań modelu żyje w `src/lib/assistant/`. Nazwa dostawcy nie pojawia się
w komponentach ani w warstwie danych. Wymiana modelu = zmiana w jednym miejscu.
Klucz API tylko po stronie serwera, nigdy w `NEXT_PUBLIC_*` (patrz §10).

### Kolejność budowy

Zgodnie z §11 — jedna rzecz na raz:

1. Nazwane funkcje SQL do odczytu.
2. Asystent, który po nie sięga (pętla tool-callingu).
3. Interfejs czatu w apce.

---

## 16. Wiedza i instrukcje — na później

Świadomie **poza zakresem na teraz.** Bez Obsidiana, bez syncu plików, bez tabeli
dokumentów, bez RAG-a. Nie buduj tego, dopóki nie zostanie o to wprost poproszone.

- Instrukcje serwisowe i PDF-y producentów trzyma właściciel na telefonie i otwiera
  sam. Apka ich nie przechowuje, asystent ich nie czyta. To zaakceptowany trade-off:
  asystent zna liczby i zlecenia, nie zna instrukcji montażu.
- Wolny tekst (uwagi do klienta, notatka do zlecenia) żyje jako **kolumna na rekordzie**
  (`job.notes`, `customer.notes`), nie jako osobny system. To wystarcza i nie wymaga
  żadnej dodatkowej infrastruktury.

### Gdyby kiedyś wrócić do tematu

Mózg wiedzy dokłada się **bez przepisywania** tego, co jest: tabela `documents`
(markdown + `tsvector` do wyszukiwania), a jeśli tekstu będzie dużo — kolumna
`embedding` (pgvector) w tej samej tabeli. Osobna baza wektorowa nie jest potrzebna.
To dostawka z boku, nie migracja.

### Źródło prawdy

Wszystko, co apka przechowuje, ma jedno źródło prawdy: **Supabase.** Bez zewnętrznych
edytorów, bez kopii w drugim miejscu, którą trzeba by synchronizować.