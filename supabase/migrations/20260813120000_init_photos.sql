-- Migracja: zdjęcia do zleceń (photo) + prywatny bucket Storage.
-- §8: bucket prywatny, dostęp tylko przez signed URL; ścieżka {user_id}/{job_id}/{uuid}.webp.
-- §4: zdjęcia kasujemy twardo (bez deleted_at).

create table public.photo (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id),
  job_id      uuid not null references public.job(id),
  path        text not null,             -- ścieżka w buckecie job-photos
  taken_at    timestamptz,               -- kiedy zrobiono zdjęcie (jeśli znane)
  description text,                       -- opcjonalny opis
  kind        text check (kind in ('before', 'after', 'part', 'document')), -- na przyszłość; UI bez kategorii
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.photo is 'Zdjęcie zlecenia. Plik w prywatnym buckecie job-photos, tu tylko metadane.';

create index photo_user_job_idx on public.photo (user_id, job_id);

create trigger photo_set_updated_at
  before update on public.photo
  for each row execute function public.set_updated_at();

alter table public.photo enable row level security;

create policy photo_select on public.photo
  for select using (auth.uid() = user_id);
create policy photo_insert on public.photo
  for insert with check (auth.uid() = user_id);
create policy photo_update on public.photo
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy photo_delete on public.photo
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Prywatny bucket na zdjęcia
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-photos', 'job-photos', false, 5242880, array['image/webp'])
on conflict (id) do nothing;

-- Polityki Storage: użytkownik operuje tylko na plikach w swoim folderze
-- (pierwszy segment ścieżki = jego user_id).
create policy job_photos_select on storage.objects
  for select to authenticated
  using (bucket_id = 'job-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy job_photos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'job-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy job_photos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'job-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'job-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy job_photos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'job-photos' and (storage.foldername(name))[1] = auth.uid()::text);
