-- Migracja: zlecenia (job). Dla serwisanta zlecenie = wpis w kalendarzu,
-- dlatego termin (scheduled_at) jest polem zlecenia, a osobnej tabeli visit nie ma
-- (decyzja 2026-08-13, patrz docs/decisions.md).

create table public.job (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id),
  customer_id  uuid references public.customer(id),
  site_id      uuid references public.site(id),
  title        text,               -- krótki opis / temat
  notes        text,               -- dłuższa notatka
  phone        text,               -- kontakt, gdy zlecenie nie jest podpięte pod klienta z bazy
  address      text,               -- adres wpisany ręcznie, gdy nie ma obiektu
  status       text not null default 'new' check (status in (
                 'new',
                 'scheduled',
                 'in_progress',
                 'waiting_parts',
                 'done',
                 'settled',
                 'cancelled'
               )),
  scheduled_at timestamptz,        -- data + godzina, na którą serwisant się umówił
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

comment on table public.job is 'Zlecenie = jednostka pracy i zarazem wpis w kalendarzu (termin scheduled_at).';

create index job_user_status_idx on public.job (user_id, status) where deleted_at is null;
create index job_user_scheduled_idx on public.job (user_id, scheduled_at) where deleted_at is null;
create index job_user_customer_idx on public.job (user_id, customer_id) where deleted_at is null;

create trigger job_set_updated_at
  before update on public.job
  for each row execute function public.set_updated_at();

alter table public.job enable row level security;

create policy job_select on public.job
  for select using (auth.uid() = user_id);
create policy job_insert on public.job
  for insert with check (auth.uid() = user_id);
create policy job_update on public.job
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy job_delete on public.job
  for delete using (auth.uid() = user_id);
