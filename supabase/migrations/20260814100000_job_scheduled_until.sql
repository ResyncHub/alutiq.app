-- Zlecenia wielodniowe (np. montaż trwający kilka dni).
-- Nadal jedno zlecenie = jeden rekord (decyzja z 2026-08-13: zlecenie = wizyta),
-- ale termin dostaje opcjonalny koniec — zlecenie jest wtedy widoczne
-- w kalendarzu na każdym dniu w zakresie [scheduled_at .. scheduled_until].
-- Data bez godziny — liczy się tylko, do którego dnia włącznie trwa robota.

alter table public.job
  add column scheduled_until date;

alter table public.job
  add constraint job_scheduled_until_requires_start
  check (scheduled_until is null or scheduled_at is not null);

comment on column public.job.scheduled_until is
  'Ostatni dzień zlecenia wielodniowego (włącznie). NULL = zlecenie jednodniowe.';
