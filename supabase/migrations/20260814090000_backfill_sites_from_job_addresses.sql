-- Jednorazowe odtworzenie obiektów (site) z adresów wpisanych ręcznie
-- w dotychczasowych zleceniach. Do tej pory formularz zlecenia miał wolne
-- pole „Adres" niepowiązane z klientem — ten sam klient (np. „Hotel Aries")
-- mógł mieć adres wpisywany od nowa przy każdym zleceniu, bo nigdy nie
-- powstał dla niego obiekt do wyboru. Kod od teraz sam tworzy obiekt przy
-- wpisaniu adresu (patrz findOrCreateSiteByAddress); ta migracja wyrównuje
-- dane historyczne, żeby zadziałało to też dla zleceń sprzed tej zmiany.

-- 1) Zlecenia, których wpisany adres pasuje do obiektu, który klient już ma
--    (np. dodanego ręcznie na karcie klienta) — tylko podpinamy, bez duplikatu.
update public.job j
set site_id = s.id,
    address = null
from public.site s
where j.customer_id = s.customer_id
  and j.site_id is null
  and j.address is not null
  and trim(j.address) <> ''
  and trim(j.address) = trim(s.address)
  and s.deleted_at is null
  and j.deleted_at is null;

-- 2) Pozostałe zlecenia z adresem bez pasującego obiektu — tworzymy obiekt
--    (po jednym na unikalny adres u danego klienta) i podpinamy zlecenia.
with distinct_job_addresses as (
  select distinct j.customer_id, trim(j.address) as address, c.user_id
  from public.job j
  join public.customer c on c.id = j.customer_id
  where j.deleted_at is null
    and j.customer_id is not null
    and j.site_id is null
    and j.address is not null
    and trim(j.address) <> ''
),
inserted as (
  insert into public.site (customer_id, address, user_id)
  select customer_id, address, user_id from distinct_job_addresses
  returning id, customer_id, address
)
update public.job j
set site_id = i.id,
    address = null
from inserted i
where j.customer_id = i.customer_id
  and j.site_id is null
  and j.address is not null
  and trim(j.address) = i.address
  and j.deleted_at is null;
