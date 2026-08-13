-- Migracja: finanse — wydatki (expense) i wpłaty (payment).
-- §6: kwoty wyłącznie w groszach jako integer; przy każdej pozycji jawnie
-- netto/VAT/brutto (firma zwolniona z VAT -> vat_rate 0, brutto = netto).
-- §4: miękkie kasowanie (deleted_at). Dzień księgowy jako date w strefie Europe/Warsaw.

-- ===========================================================================
-- expense — wydatek (materiał, paliwo, narzędzia, inne)
-- ===========================================================================
create table public.expense (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id),
  job_id      uuid references public.job(id),           -- opcjonalne powiązanie ze zleceniem
  category    text not null default 'other' check (category in (
                'material_parts',   -- materiały / części
                'fuel_travel',      -- paliwo / dojazd
                'tools',            -- narzędzia i sprzęt
                'other'             -- inne
              )),
  spent_on    date not null default (now() at time zone 'Europe/Warsaw')::date,
  description text,
  net_gr      integer not null check (net_gr >= 0),
  vat_gr      integer not null default 0 check (vat_gr >= 0),
  gross_gr    integer not null check (gross_gr >= 0),
  vat_rate    integer not null default 0 check (vat_rate between 0 and 100),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz,
  constraint expense_gross_sum check (gross_gr = net_gr + vat_gr)
);

comment on table public.expense is 'Wydatek. Kwoty w groszach; brutto = netto + VAT.';

create index expense_user_spent_idx on public.expense (user_id, spent_on) where deleted_at is null;
create index expense_user_job_idx on public.expense (user_id, job_id) where deleted_at is null;

create trigger expense_set_updated_at
  before update on public.expense
  for each row execute function public.set_updated_at();

alter table public.expense enable row level security;

create policy expense_select on public.expense
  for select using (auth.uid() = user_id);
create policy expense_insert on public.expense
  for insert with check (auth.uid() = user_id);
create policy expense_update on public.expense
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy expense_delete on public.expense
  for delete using (auth.uid() = user_id);

-- ===========================================================================
-- payment — wpłata (pieniądze, które wpłynęły)
-- ===========================================================================
create table public.payment (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id),
  job_id      uuid references public.job(id),           -- opcjonalne powiązanie ze zleceniem
  paid_on     date not null default (now() at time zone 'Europe/Warsaw')::date,
  description text,
  amount_gr   integer not null check (amount_gr > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

comment on table public.payment is 'Wpłata. Kwota w groszach.';

create index payment_user_paid_idx on public.payment (user_id, paid_on) where deleted_at is null;
create index payment_user_job_idx on public.payment (user_id, job_id) where deleted_at is null;

create trigger payment_set_updated_at
  before update on public.payment
  for each row execute function public.set_updated_at();

alter table public.payment enable row level security;

create policy payment_select on public.payment
  for select using (auth.uid() = user_id);
create policy payment_insert on public.payment
  for insert with check (auth.uid() = user_id);
create policy payment_update on public.payment
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy payment_delete on public.payment
  for delete using (auth.uid() = user_id);
