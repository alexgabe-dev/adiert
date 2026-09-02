create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

alter table public.schools
  alter column postal_code drop not null,
  alter column address drop not null;

alter table public.schools
  add column import_key text unique,
  add column search_name text,
  add column search_city text,
  add column search_county text,
  add column search_document text;

create function public.normalize_school_search(value text)
returns text
language sql
immutable
parallel safe
security definer
set search_path = ''
as $$
  select trim(
    regexp_replace(
      lower(extensions.unaccent('extensions.unaccent'::pg_catalog.regdictionary, coalesce(value, ''))),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;

create function public.set_school_search_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.search_name := public.normalize_school_search(new.name);
  new.search_city := public.normalize_school_search(new.city);
  new.search_county := public.normalize_school_search(new.county);
  new.search_document := concat_ws(' ', new.search_name, new.search_city, new.search_county);
  return new;
end;
$$;

create trigger schools_set_search_columns
before insert or update of name, city, county on public.schools
for each row execute function public.set_school_search_columns();

update public.schools
set name = name;

alter table public.schools
  alter column search_name set not null,
  alter column search_city set not null,
  alter column search_county set not null,
  alter column search_document set not null;

create index schools_search_name_prefix_idx
  on public.schools (search_name text_pattern_ops)
  where active;
create index schools_search_city_prefix_idx
  on public.schools (search_city text_pattern_ops)
  where active;
create index schools_search_name_trgm_idx
  on public.schools using gin (search_name extensions.gin_trgm_ops)
  where active;
create index schools_search_document_trgm_idx
  on public.schools using gin (search_document extensions.gin_trgm_ops)
  where active;

create function public.search_schools(
  requested_query text,
  requested_campaign_id uuid default null,
  requested_limit integer default 15,
  requested_school_id uuid default null
)
returns table (
  id uuid,
  name text,
  slug text,
  type public.school_type,
  city text,
  county text
)
language sql
stable
security definer
set search_path = ''
as $$
  with input as (
    select
      public.normalize_school_search(left(requested_query, 120)) as query,
      greatest(1, least(coalesce(requested_limit, 15), 20)) as result_limit
  ),
  tokens as (
    select token
    from input,
      unnest(regexp_split_to_array(input.query, '\s+')) as token
    where length(token) > 0
  ),
  candidates as (
    select
      school.id,
      school.name,
      school.slug,
      school.type,
      school.city,
      school.county,
      case
        when requested_school_id is not null and school.id = requested_school_id then 2000
        when school.search_name = input.query then 1000
        when school.search_name like input.query || '%' then 900
        when not exists (
          select 1 from tokens where school.search_name not like '%' || tokens.token || '%'
        ) then 800
        when not exists (
          select 1 from tokens where school.search_document not like '%' || tokens.token || '%'
        ) then 700
        when school.search_city = input.query then 600
        else 0
      end as match_class,
      greatest(
        extensions.similarity(school.search_name, input.query),
        extensions.similarity(school.search_document, input.query) * 0.8,
        extensions.similarity(school.search_city, input.query) * 0.7
      ) as fuzzy_score
    from public.schools school
    cross join input
    where school.active
      and (
        requested_campaign_id is null
        or exists (
          select 1
          from public.campaign_schools participation
          join public.campaigns campaign on campaign.id = participation.campaign_id
          where participation.campaign_id = requested_campaign_id
            and participation.school_id = school.id
            and participation.active
            and campaign.active
        )
      )
      and (
        (requested_school_id is not null and school.id = requested_school_id)
        or (
          requested_school_id is null
          and length(input.query) >= 2
          and (
            school.search_name like input.query || '%'
            or school.search_city like input.query || '%'
            or school.search_name like '%' || input.query || '%'
            or school.search_document like '%' || input.query || '%'
            or school.search_name operator(extensions.%) input.query
            or school.search_document operator(extensions.%) input.query
          )
        )
      )
  )
  select id, name, slug, type, city, county
  from candidates
  order by match_class desc, fuzzy_score desc, name collate "C", city collate "C", id
  limit (select result_limit from input);
$$;

create or replace function public.campaign_school_totals(requested_campaign_id uuid default null)
returns table (
  campaign_id uuid,
  school_id uuid,
  approved_amount bigint,
  approved_bottle_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    submission.campaign_id,
    submission.school_id,
    sum(submission.approved_amount)::bigint,
    sum(submission.approved_bottle_count)::bigint
  from public.submissions submission
  join public.campaign_schools participation
    on participation.campaign_id = submission.campaign_id
    and participation.school_id = submission.school_id
    and participation.active
  join public.campaigns campaign
    on campaign.id = participation.campaign_id
    and campaign.active
  join public.schools school
    on school.id = participation.school_id
    and school.active
  where submission.status = 'approved'
    and submission.approved_amount is not null
    and submission.approved_bottle_count is not null
    and (requested_campaign_id is null or submission.campaign_id = requested_campaign_id)
  group by submission.campaign_id, submission.school_id;
$$;

create or replace function public.campaign_leaderboard(requested_campaign_id uuid)
returns table (
  campaign_id uuid,
  school_id uuid,
  school_name text,
  school_slug text,
  approved_amount bigint,
  approved_bottle_count bigint,
  national_rank bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    totals.campaign_id,
    totals.school_id,
    school.name,
    school.slug,
    totals.approved_amount,
    totals.approved_bottle_count,
    row_number() over (
      order by
        totals.approved_amount desc,
        totals.approved_bottle_count desc,
        school.name collate "C",
        totals.school_id
    )
  from public.campaign_school_totals(requested_campaign_id) totals
  join public.schools school on school.id = totals.school_id and school.active
  order by
    totals.approved_amount desc,
    totals.approved_bottle_count desc,
    school.name collate "C",
    totals.school_id;
$$;

create function public.public_campaign_summary(requested_campaign_id uuid default null)
returns table (
  campaign_id uuid,
  campaign_name text,
  campaign_slug text,
  target_amount bigint,
  start_date date,
  end_date date,
  approved_amount bigint,
  approved_bottle_count bigint,
  participating_school_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with selected_campaign as (
    select campaign.*
    from public.campaigns campaign
    where campaign.active
      and (requested_campaign_id is null or campaign.id = requested_campaign_id)
    order by campaign.start_date desc, campaign.id
    limit 1
  ),
  totals as (
    select
      coalesce(sum(school_total.approved_amount), 0)::bigint as approved_amount,
      coalesce(sum(school_total.approved_bottle_count), 0)::bigint as approved_bottle_count
    from selected_campaign campaign
    left join public.campaign_school_totals(campaign.id) school_total on true
  ),
  participants as (
    select count(*)::bigint as school_count
    from selected_campaign campaign
    join public.campaign_schools participation
      on participation.campaign_id = campaign.id and participation.active
    join public.schools school on school.id = participation.school_id and school.active
  )
  select
    campaign.id,
    campaign.name,
    campaign.slug,
    campaign.target_amount,
    campaign.start_date,
    campaign.end_date,
    totals.approved_amount,
    totals.approved_bottle_count,
    participants.school_count
  from selected_campaign campaign
  cross join totals
  cross join participants;
$$;

create function public.public_campaign_leaderboard(
  requested_campaign_id uuid,
  requested_query text default '',
  requested_county text default '',
  requested_city text default '',
  requested_type public.school_type default null,
  requested_page integer default 1,
  requested_page_size integer default 20
)
returns table (
  campaign_id uuid,
  school_id uuid,
  school_name text,
  school_slug text,
  school_type public.school_type,
  city text,
  county text,
  approved_amount bigint,
  approved_bottle_count bigint,
  national_rank bigint,
  total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with input as (
    select
      public.normalize_school_search(left(requested_query, 120)) as query,
      public.normalize_school_search(left(requested_county, 80)) as county,
      public.normalize_school_search(left(requested_city, 80)) as city,
      greatest(coalesce(requested_page, 1), 1) as page,
      greatest(1, least(coalesce(requested_page_size, 20), 50)) as page_size
  ),
  ranked as (
    select
      leaderboard.*,
      school.type,
      school.city,
      school.county,
      school.search_name,
      school.search_city,
      school.search_county,
      school.search_document
    from public.campaign_leaderboard(requested_campaign_id) leaderboard
    join public.schools school on school.id = leaderboard.school_id and school.active
  ),
  filtered as (
    select ranked.*
    from ranked
    cross join input
    where (input.query = '' or ranked.search_document like '%' || input.query || '%')
      and (input.county = '' or ranked.search_county = input.county)
      and (input.city = '' or ranked.search_city = input.city)
      and (requested_type is null or ranked.type = requested_type)
  )
  select
    filtered.campaign_id,
    filtered.school_id,
    filtered.school_name,
    filtered.school_slug,
    filtered.type,
    filtered.city,
    filtered.county,
    filtered.approved_amount,
    filtered.approved_bottle_count,
    filtered.national_rank,
    count(*) over ()::bigint
  from filtered
  order by filtered.national_rank
  limit (select page_size from input)
  offset (select (page - 1) * page_size from input);
$$;

create function public.public_school_profile(
  requested_slug text,
  requested_campaign_id uuid default null
)
returns table (
  school_id uuid,
  school_name text,
  school_slug text,
  school_type public.school_type,
  city text,
  county text,
  campaign_id uuid,
  campaign_name text,
  approved_amount bigint,
  approved_bottle_count bigint,
  national_rank bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with selected_campaign as (
    select campaign.id, campaign.name
    from public.campaigns campaign
    where campaign.active
      and (requested_campaign_id is null or campaign.id = requested_campaign_id)
    order by campaign.start_date desc, campaign.id
    limit 1
  ),
  ranked as (
    select *
    from public.campaign_leaderboard((select id from selected_campaign))
  )
  select
    school.id,
    school.name,
    school.slug,
    school.type,
    school.city,
    school.county,
    campaign.id,
    campaign.name,
    coalesce(ranked.approved_amount, 0)::bigint,
    coalesce(ranked.approved_bottle_count, 0)::bigint,
    ranked.national_rank
  from public.schools school
  cross join selected_campaign campaign
  join public.campaign_schools participation
    on participation.campaign_id = campaign.id
    and participation.school_id = school.id
    and participation.active
  left join ranked on ranked.school_id = school.id
  where school.active and school.slug = left(requested_slug, 200)
  limit 1;
$$;

revoke all on function public.normalize_school_search(text) from public;
revoke all on function public.set_school_search_columns() from public;
revoke all on function public.search_schools(text, uuid, integer, uuid) from public;
revoke all on function public.public_campaign_summary(uuid) from public;
revoke all on function public.public_campaign_leaderboard(
  uuid, text, text, text, public.school_type, integer, integer
) from public;
revoke all on function public.public_school_profile(text, uuid) from public;

grant execute on function public.search_schools(text, uuid, integer, uuid)
  to anon, authenticated, service_role;
grant execute on function public.public_campaign_summary(uuid) to anon, authenticated, service_role;
grant execute on function public.public_campaign_leaderboard(
  uuid, text, text, text, public.school_type, integer, integer
) to anon, authenticated, service_role;
grant execute on function public.public_school_profile(text, uuid)
  to anon, authenticated, service_role;

comment on column public.schools.import_key is
  'Deterministic normalized source identity. Import reruns never overwrite curated school records.';
comment on function public.search_schools(text, uuid, integer, uuid) is
  'Bounded, indexed, accent-insensitive public school lookup with optional active-campaign scope.';
comment on function public.public_campaign_summary(uuid) is
  'Public campaign summary sourced only from approved reviewer-entered values.';
comment on function public.public_campaign_leaderboard(
  uuid, text, text, text, public.school_type, integer, integer
) is
  'Paginated public leaderboard with deterministic national ranks and server-side filters.';
comment on function public.public_school_profile(text, uuid) is
  'Privacy-safe active school campaign profile based only on approved aggregates.';
