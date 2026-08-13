-- Migracja: fundament + baza klientów (customer, site, device)
-- Zgodnie z CLAUDE.md §4: każda tabela ma user_id, created_at, updated_at (trigger),
-- miękkie kasowanie tam, gdzie dotyka historii, RLS + polityki w tym samym pliku.

-- gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Wspólny trigger: automatyczne ustawianie updated_at przy UPDATE
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ===========================================================================
-- customer — klient (osoba lub firma)
-- ===========================================================================
create table public.customer (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id),
  kind        text not null default 'person' check (kind in ('person', 'company')),
  name        text not null,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

comment on table public.customer is 'Klient — osoba lub firma.';

create index customer_user_idx on public.customer (user_id) where deleted_at is null;
create index customer_user_name_idx on public.customer (user_id, name) where deleted_at is null;

create trigger customer_set_updated_at
  before update on public.customer
  for each row execute function public.set_updated_at();

alter table public.customer enable row level security;

create policy customer_select on public.customer
  for select using (auth.uid() = user_id);
create policy customer_insert on public.customer
  for insert with check (auth.uid() = user_id);
create policy customer_update on public.customer
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy customer_delete on public.customer
  for delete using (auth.uid() = user_id);

-- ===========================================================================
-- site — obiekt / adres robót (klient może mieć kilka)
-- ===========================================================================
create table public.site (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id),
  customer_id  uuid not null references public.customer(id),
  label        text,
  address      text,
  city         text,
  postal_code  text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

comment on table public.site is 'Obiekt / adres robót; klient może mieć kilka.';

create index site_user_customer_idx on public.site (user_id, customer_id) where deleted_at is null;

create trigger site_set_updated_at
  before update on public.site
  for each row execute function public.set_updated_at();

alter table public.site enable row level security;

create policy site_select on public.site
  for select using (auth.uid() = user_id);
create policy site_insert on public.site
  for insert with check (auth.uid() = user_id);
create policy site_update on public.site
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy site_delete on public.site
  for delete using (auth.uid() = user_id);

-- ===========================================================================
-- device — urządzenie (brama, napęd, okno, drzwi, roleta, pergola, markiza…)
-- ===========================================================================
create table public.device (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id),
  site_id        uuid not null references public.site(id),
  device_type    text not null default 'other' check (device_type in (
                   'gate',            -- brama
                   'drive',           -- napęd / silnik
                   'window',          -- okno
                   'door',            -- drzwi
                   'automatic_door',  -- automat drzwiowy
                   'roller_shutter',  -- roleta
                   'awning',          -- markiza
                   'pergola',         -- pergola tarasowa
                   'other'
                 )),
  brand          text,
  model          text,
  serial_number  text,
  installed_on   date,
  warranty_until date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

comment on table public.device is 'Urządzenie z numerem seryjnym i gwarancją, przypisane do obiektu (site).';

create index device_user_site_idx on public.device (user_id, site_id) where deleted_at is null;

create trigger device_set_updated_at
  before update on public.device
  for each row execute function public.set_updated_at();

alter table public.device enable row level security;

create policy device_select on public.device
  for select using (auth.uid() = user_id);
create policy device_insert on public.device
  for insert with check (auth.uid() = user_id);
create policy device_update on public.device
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy device_delete on public.device
  for delete using (auth.uid() = user_id);
