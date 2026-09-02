-- Fictional local-development fixtures only.
-- This file is disabled in config.toml. To apply it, the session must be started with:
--   PGOPTIONS="-c adiert.allow_fixtures=on"
-- Never enable or run this file against staging or production.

do $$
begin
  if coalesce(current_setting('adiert.allow_fixtures', true), 'off') <> 'on' then
    raise exception 'Refusing to load fictional fixtures without adiert.allow_fixtures=on';
  end if;
end;
$$;

insert into public.schools (
  id,
  name,
  slug,
  type,
  city,
  county,
  postal_code,
  address
)
values (
  '10000000-0000-4000-8000-000000000001',
  'Minta Általános Iskola (nem valós adat)',
  'minta-altalanos-iskola',
  'primary_school',
  'Mintaváros',
  'Mintavármegye',
  '0000',
  'Minta utca 1.'
)
on conflict (id) do nothing;

insert into public.campaigns (
  id,
  name,
  slug,
  description,
  target_amount,
  start_date,
  end_date,
  active
)
values (
  '20000000-0000-4000-8000-000000000001',
  'Helyi fejlesztési minta kampány (nem valós adat)',
  'helyi-minta-kampany',
  'Kizárólag helyi fejlesztéshez használt fiktív rekord.',
  1000000,
  '2099-01-01',
  '2099-12-31',
  true
)
on conflict (id) do nothing;

insert into public.campaign_schools (campaign_id, school_id)
values (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001'
)
on conflict (campaign_id, school_id) do nothing;
