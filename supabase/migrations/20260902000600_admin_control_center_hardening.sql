-- Complete the interrupted control-center migration without reopening direct table writes.

create or replace function public.admin_set_campaign_school(
  requested_campaign_id uuid,
  requested_school_id uuid,
  requested_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  school_name text;
  school_active boolean;
  previous_active boolean;
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.campaigns where id = requested_campaign_id) then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;

  select name, active into school_name, school_active
  from public.schools where id = requested_school_id;
  if not found then
    raise exception 'school not found' using errcode = 'P0002';
  end if;
  if requested_active and not school_active then
    raise exception 'inactive school cannot participate' using errcode = '55000';
  end if;

  select active into previous_active
  from public.campaign_schools
  where campaign_id = requested_campaign_id and school_id = requested_school_id;

  if requested_active then
    insert into public.campaign_schools (campaign_id, school_id, active)
    values (requested_campaign_id, requested_school_id, true)
    on conflict (campaign_id, school_id) do update set active = true
    where campaign_schools.active is distinct from true;
  else
    update public.campaign_schools
    set active = false
    where campaign_id = requested_campaign_id
      and school_id = requested_school_id
      and active;
  end if;

  perform public.write_admin_audit(
    case when requested_active then 'participation.added' else 'participation.removed' end,
    'school', requested_school_id, school_name,
    jsonb_build_object(
      'campaign_id', requested_campaign_id,
      'changed', coalesce(previous_active, false) is distinct from requested_active
    )
  );
end;
$$;

create or replace function public.admin_bulk_set_filtered_campaign_schools(
  requested_campaign_id uuid,
  requested_query text default '',
  requested_county text default '',
  requested_city text default '',
  requested_participation text default 'all',
  requested_active boolean default true
)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  changed_count integer := 0;
  campaign_name text;
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;
  select name into campaign_name from public.campaigns where id = requested_campaign_id;
  if campaign_name is null then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;
  if requested_participation not in ('all', 'selected', 'unselected') then
    raise exception 'invalid participation filter' using errcode = '22023';
  end if;

  if requested_active then
    insert into public.campaign_schools as participation (campaign_id, school_id, active)
    select requested_campaign_id, school.id, true
    from public.schools school
    where school.active
      and (
        public.normalize_school_search(left(requested_query, 120)) = ''
        or school.search_document like '%' || public.normalize_school_search(left(requested_query, 120)) || '%'
      )
      and (
        public.normalize_school_search(left(requested_county, 80)) = ''
        or school.search_county = public.normalize_school_search(left(requested_county, 80))
      )
      and (
        public.normalize_school_search(left(requested_city, 80)) = ''
        or school.search_city = public.normalize_school_search(left(requested_city, 80))
      )
      and (
        requested_participation = 'all'
        or (requested_participation = 'selected' and exists (
          select 1 from public.campaign_schools existing
          where existing.campaign_id = requested_campaign_id
            and existing.school_id = school.id and existing.active
        ))
        or (requested_participation = 'unselected' and not exists (
          select 1 from public.campaign_schools existing
          where existing.campaign_id = requested_campaign_id
            and existing.school_id = school.id and existing.active
        ))
      )
    on conflict (campaign_id, school_id) do update set active = true
    where participation.active is distinct from true;
    get diagnostics changed_count = row_count;
  else
    update public.campaign_schools participation
    set active = false
    from public.schools school
    where participation.campaign_id = requested_campaign_id
      and participation.school_id = school.id
      and participation.active
      and (
        public.normalize_school_search(left(requested_query, 120)) = ''
        or school.search_document like '%' || public.normalize_school_search(left(requested_query, 120)) || '%'
      )
      and (
        public.normalize_school_search(left(requested_county, 80)) = ''
        or school.search_county = public.normalize_school_search(left(requested_county, 80))
      )
      and (
        public.normalize_school_search(left(requested_city, 80)) = ''
        or school.search_city = public.normalize_school_search(left(requested_city, 80))
      )
      and requested_participation in ('all', 'selected');
    get diagnostics changed_count = row_count;
  end if;

  perform public.write_admin_audit(
    case when requested_active then 'participation.bulk_added' else 'participation.bulk_removed' end,
    'campaign', requested_campaign_id, campaign_name,
    jsonb_build_object(
      'changed_count', changed_count,
      'query_applied', btrim(coalesce(requested_query, '')) <> '',
      'county_applied', btrim(coalesce(requested_county, '')) <> '',
      'city_applied', btrim(coalesce(requested_city, '')) <> '',
      'participation_filter', requested_participation
    )
  );
  return changed_count;
end;
$$;

create function public.admin_create_school(
  requested_name text,
  requested_slug text,
  requested_type public.school_type,
  requested_city text,
  requested_county text,
  requested_postal_code text,
  requested_address text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  resulting_id uuid;
  normalized_name text := btrim(requested_name);
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;
  if length(normalized_name) < 2
    or lower(btrim(requested_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or length(btrim(requested_city)) < 1
    or length(btrim(requested_county)) < 1
    or (requested_postal_code is not null and requested_postal_code !~ '^[0-9]{4}$')
  then
    raise exception 'invalid school values' using errcode = '22023';
  end if;

  insert into public.schools (
    name, slug, type, city, county, postal_code, address, active
  ) values (
    normalized_name, lower(btrim(requested_slug)), requested_type,
    btrim(requested_city), btrim(requested_county),
    nullif(btrim(requested_postal_code), ''), nullif(btrim(requested_address), ''), true
  ) returning id into resulting_id;

  perform public.write_admin_audit(
    'school.created', 'school', resulting_id, normalized_name, '{}'::jsonb
  );
  return resulting_id;
end;
$$;

create or replace function public.admin_update_school(
  requested_school_id uuid,
  requested_name text,
  requested_slug text,
  requested_type public.school_type,
  requested_city text,
  requested_county text,
  requested_postal_code text,
  requested_address text,
  requested_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  old_active boolean;
  normalized_name text := btrim(requested_name);
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;
  if length(normalized_name) < 2
    or lower(btrim(requested_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or length(btrim(requested_city)) < 1
    or length(btrim(requested_county)) < 1
    or (requested_postal_code is not null and requested_postal_code !~ '^[0-9]{4}$')
  then
    raise exception 'invalid school values' using errcode = '22023';
  end if;

  select active into old_active from public.schools
  where id = requested_school_id for update;
  if not found then
    raise exception 'school not found' using errcode = 'P0002';
  end if;
  if requested_active is distinct from old_active then
    raise exception 'school state requires explicit operation' using errcode = '55000';
  end if;

  update public.schools set
    name = normalized_name,
    slug = lower(btrim(requested_slug)),
    type = requested_type,
    city = btrim(requested_city),
    county = btrim(requested_county),
    postal_code = nullif(btrim(requested_postal_code), ''),
    address = nullif(btrim(requested_address), '')
  where id = requested_school_id;

  perform public.write_admin_audit(
    'school.updated', 'school', requested_school_id, normalized_name, '{}'::jsonb
  );
end;
$$;

create function public.admin_set_school_active(
  requested_school_id uuid,
  requested_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  school_name text;
  old_active boolean;
  history_count bigint;
  deactivated_participation_count integer := 0;
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;

  select name, active into school_name, old_active
  from public.schools where id = requested_school_id for update;
  if not found then
    raise exception 'school not found' using errcode = 'P0002';
  end if;

  update public.schools set active = requested_active
  where id = requested_school_id and active is distinct from requested_active;

  if not requested_active then
    update public.campaign_schools
    set active = false
    where school_id = requested_school_id and active;
    get diagnostics deactivated_participation_count = row_count;
  end if;

  select count(*) into history_count
  from public.submissions where school_id = requested_school_id;

  perform public.write_admin_audit(
    case when requested_active then 'school.reactivated' else 'school.deactivated' end,
    'school', requested_school_id, school_name,
    jsonb_build_object(
      'changed', old_active is distinct from requested_active,
      'preserved_submission_count', history_count,
      'deactivated_participation_count', deactivated_participation_count
    )
  );
end;
$$;

create or replace function public.admin_save_news(
  requested_news_id uuid,
  requested_title text,
  requested_slug text,
  requested_excerpt text,
  requested_content text,
  requested_published boolean,
  requested_published_at timestamptz
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  resulting_id uuid;
  normalized_title text := btrim(requested_title);
  old_published boolean;
  audit_action text;
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;
  if length(normalized_title) < 2
    or lower(btrim(requested_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or length(btrim(requested_excerpt)) < 1
    or length(btrim(requested_content)) < 1
    or (requested_published and requested_published_at is null)
  then
    raise exception 'invalid news values' using errcode = '22023';
  end if;

  if requested_news_id is null then
    insert into public.news (title, slug, excerpt, content, published, published_at)
    values (
      normalized_title, lower(btrim(requested_slug)), btrim(requested_excerpt),
      btrim(requested_content), requested_published, requested_published_at
    ) returning id into resulting_id;
    audit_action := 'news.created';
  else
    select published into old_published from public.news
    where id = requested_news_id for update;
    if not found then
      raise exception 'news not found' using errcode = 'P0002';
    end if;

    update public.news set
      title = normalized_title,
      slug = lower(btrim(requested_slug)),
      excerpt = btrim(requested_excerpt),
      content = btrim(requested_content),
      published = requested_published,
      published_at = requested_published_at
    where id = requested_news_id returning id into resulting_id;

    audit_action := case
      when not old_published and requested_published then 'news.published'
      when old_published and not requested_published then 'news.unpublished'
      else 'news.updated'
    end;
  end if;

  perform public.write_admin_audit(
    audit_action, 'news', resulting_id, normalized_title,
    jsonb_build_object('published', requested_published)
  );
  return resulting_id;
end;
$$;

revoke all on function public.admin_create_school(
  text, text, public.school_type, text, text, text, text
) from public;
revoke all on function public.admin_set_school_active(uuid, boolean) from public;

grant execute on function public.admin_create_school(
  text, text, public.school_type, text, text, text, text
) to authenticated;
grant execute on function public.admin_set_school_active(uuid, boolean) to authenticated;

-- Reassert the intended least-privilege table posture after replacing functions.
revoke insert, update, delete on public.schools from authenticated;
revoke insert, update, delete on public.campaigns from authenticated;
revoke insert, update, delete on public.campaign_schools from authenticated;
revoke insert, update, delete on public.news from authenticated;
revoke insert, update, delete on public.administrators from authenticated;

comment on function public.admin_set_school_active(uuid, boolean) is
  'Explicit, audited school activation/deactivation; historical records are preserved.';
