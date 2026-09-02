set client_min_messages = warning;

insert into public.schools (name, slug, type, city, county)
values
  ('Árvíztűrő Tesztiskola', 'arvizturo-tesztiskola', 'other', 'Őriszentpéter', 'Vas'),
  ('Árvíztűrő Tesztiskolák', 'arvizturo-tesztiskolak', 'other', 'Másváros', 'Vas');

do $$
begin
  if (select count(*) from public.schools where import_key is not null) <> 2773 then
    raise exception 'The real school migration did not import exactly 2773 normalized schools';
  end if;

  if (
    select count(*)
    from pg_indexes
    where schemaname = 'public'
      and indexname in (
        'schools_search_name_prefix_idx',
        'schools_search_city_prefix_idx',
        'schools_search_name_trgm_idx',
        'schools_search_document_trgm_idx'
      )
  ) <> 4 then
    raise exception 'Indexed school search infrastructure is incomplete';
  end if;
end;
$$;

set role anon;
set request.jwt.claim.sub = '';

do $$
declare
  first_result record;
  campaign_amount bigint;
  campaign_bottles bigint;
  participant_count bigint;
  profile record;
begin
  begin
    perform public.normalize_school_search('direct helper access');
    raise exception 'Anonymous role executed an internal normalization helper';
  exception when insufficient_privilege then null;
  end;

  select * into first_result from public.search_schools('arvizturo', null, 15, null) limit 1;
  if first_result.name <> 'Árvíztűrő Tesztiskola' then
    raise exception 'Accent-insensitive strong-prefix school search ranking failed';
  end if;

  select * into first_result
  from public.search_schools('Árvíztűrő Tesztiskola', null, 15, null)
  limit 1;
  if first_result.name <> 'Árvíztűrő Tesztiskola' then
    raise exception 'Exact school-name match did not outrank a weaker fuzzy match';
  end if;

  if not exists (
    select 1 from public.search_schools('arvizturo tesztiskla', null, 15, null)
    where name = 'Árvíztűrő Tesztiskola'
  ) then
    raise exception 'Reasonable trigram typo tolerance failed';
  end if;

  if not exists (
    select 1 from public.search_schools('oriszentpeter', null, 15, null)
    where name = 'Árvíztűrő Tesztiskola'
  ) then
    raise exception 'Accent-insensitive city search failed';
  end if;

  if exists (
    select 1
    from public.search_schools(
      'arvizturo', '20000000-0000-4000-8000-000000000001', 15, null
    )
  ) then
    raise exception 'Campaign-scoped school search exposed a non-participating school';
  end if;

  if (select count(*) from public.search_schools('a', null, 15, null)) <> 0 then
    raise exception 'School search accepted an unbounded one-character query';
  end if;

  select approved_amount, approved_bottle_count, participating_school_count
  into campaign_amount, campaign_bottles, participant_count
  from public.public_campaign_summary('20000000-0000-4000-8000-000000000001');

  if campaign_amount <> 7000 or campaign_bottles <> 140 or participant_count <> 2 then
    raise exception 'Public campaign summary is not approved-only or participation-aware';
  end if;

  if (
    select count(*)
    from public.public_campaign_leaderboard(
      '20000000-0000-4000-8000-000000000001', '', 'Test County', 'Test City', null, 1, 1
    )
  ) <> 1 then
    raise exception 'Leaderboard page size or normalized county/city filtering failed';
  end if;

  if (
    select total_count
    from public.public_campaign_leaderboard(
      '20000000-0000-4000-8000-000000000001', '', 'Test County', 'Test City', null, 1, 1
    )
  ) <> 2 then
    raise exception 'Leaderboard filtered total count is incorrect';
  end if;

  select * into profile
  from public.public_school_profile('active-test-school', '20000000-0000-4000-8000-000000000001');
  if profile.approved_amount <> 6000
    or profile.approved_bottle_count <> 120
    or profile.national_rank <> 1
  then
    raise exception 'Public school profile is not based on approved aggregates';
  end if;

  if row_to_json(profile)::text ~ '(receipt|identifier|detected|reviewer|email|phone|address)' then
    raise exception 'Public school profile exposed a private field';
  end if;
end;
$$;

reset role;

update public.campaign_schools
set active = false
where campaign_id = '20000000-0000-4000-8000-000000000001'
  and school_id = '10000000-0000-4000-8000-000000000001';

do $$
begin
  if (
    select coalesce(sum(approved_amount), 0)
    from public.campaign_school_totals('20000000-0000-4000-8000-000000000001')
  ) <> 1000 then
    raise exception 'Inactive participation still contributes to approved public totals';
  end if;
  if exists (
    select 1
    from public.campaign_leaderboard('20000000-0000-4000-8000-000000000001')
    where school_id = '10000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'Inactive participation remained on the public leaderboard';
  end if;
end;
$$;

update public.campaign_schools
set active = true
where campaign_id = '20000000-0000-4000-8000-000000000001'
  and school_id = '10000000-0000-4000-8000-000000000001';

update public.schools
set active = false
where id = '10000000-0000-4000-8000-000000000001';

do $$
begin
  if exists (
    select 1
    from public.public_school_profile('active-test-school', '20000000-0000-4000-8000-000000000001')
  ) then
    raise exception 'Inactive school retained a public campaign profile';
  end if;
end;
$$;

update public.schools
set active = true
where id = '10000000-0000-4000-8000-000000000001';
