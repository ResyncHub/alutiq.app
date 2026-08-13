-- Klienta można dodać bez nazwy — czasem znamy tylko telefon lub adres.
-- Minimalną zasadę zapisu (przynajmniej jedno: nazwa/telefon/adres)
-- trzymamy w warstwie walidacji (zod), nie w bazie, żeby nie blokować
-- przypadku "tylko adres".
alter table public.customer alter column name drop not null;
