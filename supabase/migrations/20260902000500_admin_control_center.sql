create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.administrators(user_id) on delete restrict,
  action text not null check (action ~ '^[a-z0-9_.-]{3,80}$'),
  target_type text not null check (target_type ~ '^[a-z0-9_]{2,40}$'),
  target_id uuid,
  target_label text not null check (length(btrim(target_label)) between 1 and 240),
  result text not null default 'success' check (result in ('success', 'failure')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log (actor_user_id, created_at desc);

alter table public.admin_audit_log enable row level security;

create policy admin_audit_super_admin_read
on public.admin_audit_log for select
to authenticated
using (public.has_admin_role('super_admin'));

grant select on public.admin_audit_log to authenticated;
grant all on public.admin_audit_log to service_role;

create function public.prevent_admin_audit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'administrator audit records are append-only' using errcode = '55000';
end;
$$;

create trigger admin_audit_log_append_only
before update or delete on public.admin_audit_log
for each row execute function public.prevent_admin_audit_mutation();

create function public.write_admin_audit(
  requested_action text,
  requested_target_type text,
  requested_target_id uuid,
  requested_target_label text,
  requested_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_active_admin() then
    raise exception 'active administrator required' using errcode = '42501';
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action, target_type, target_id, target_label, metadata
  ) values (
    auth.uid(), requested_action, requested_target_type, requested_target_id,
    left(btrim(requested_target_label), 240), coalesce(requested_metadata, '{}'::jsonb)
  );
end;
$$;

create function public.admin_save_campaign(
  requested_campaign_id uuid,
  requested_name text,
  requested_slug text,
  requested_description text,
  requested_target_amount bigint,
  requested_start_date date,
  requested_end_date date
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
  normalized_slug text := lower(btrim(requested_slug));
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;
  if length(normalized_name) < 2
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or requested_target_amount <= 0
    or requested_end_date < requested_start_date
  then
    raise exception 'invalid campaign values' using errcode = '22023';
  end if;

  if requested_campaign_id is null then
    insert into public.campaigns (
      name, slug, description, target_amount, start_date, end_date, active
    ) values (
      normalized_name, normalized_slug, btrim(requested_description), requested_target_amount,
      requested_start_date, requested_end_date, false
    ) returning id into resulting_id;
    perform public.write_admin_audit(
      'campaign.created', 'campaign', resulting_id, normalized_name,
      jsonb_build_object('target_amount', requested_target_amount)
    );
  else
    update public.campaigns
    set name = normalized_name,
        slug = normalized_slug,
        description = btrim(requested_description),
        target_amount = requested_target_amount,
        start_date = requested_start_date,
        end_date = requested_end_date
    where id = requested_campaign_id
    returning id into resulting_id;
    if resulting_id is null then
      raise exception 'campaign not found' using errcode = 'P0002';
    end if;
    perform public.write_admin_audit(
      'campaign.updated', 'campaign', resulting_id, normalized_name,
      jsonb_build_object('target_amount', requested_target_amount)
    );
  end if;
  return resulting_id;
end;
$$;

create function public.admin_set_campaign_active(
  requested_campaign_id uuid,
  requested_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  campaign_name text;
  conflicting_name text;
  participant_count bigint;
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;

  select name into campaign_name from public.campaigns where id = requested_campaign_id for update;
  if campaign_name is null then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;

  if requested_active then
    select name into conflicting_name
    from public.campaigns
    where active and id <> requested_campaign_id
    limit 1;
    if conflicting_name is not null then
      raise exception 'another campaign is active' using errcode = '23505';
    end if;
  end if;

  update public.campaigns set active = requested_active where id = requested_campaign_id;
  select count(*) into participant_count
  from public.campaign_schools
  where campaign_id = requested_campaign_id and active;

  perform public.write_admin_audit(
    case when requested_active then 'campaign.activated' else 'campaign.deactivated' end,
    'campaign', requested_campaign_id, campaign_name,
    jsonb_build_object('participating_schools', participant_count)
  );
end;
$$;

create function public.admin_set_campaign_school(
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
begin
  if not public.has_admin_role('admin') then
    raise exception 'administrator authorization required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.campaigns where id = requested_campaign_id) then
    raise exception 'campaign not found' using errcode = 'P0002';
  end if;
  select name into school_name from public.schools where id = requested_school_id;
  if school_name is null then
    raise exception 'school not found' using errcode = 'P0002';
  end if;

  if requested_active then
    insert into public.campaign_schools (campaign_id, school_id, active)
    values (requested_campaign_id, requested_school_id, true)
    on conflict (campaign_id, school_id) do update set active = true;
  else
    update public.campaign_schools
    set active = false
    where campaign_id = requested_campaign_id and school_id = requested_school_id;
  end if;

  perform public.write_admin_audit(
    case when requested_active then 'participation.added' else 'participation.removed' end,
    'school', requested_school_id, school_name,
    jsonb_build_object('campaign_id', requested_campaign_id)
  );
end;
$$;

create function public.admin_bulk_set_filtered_campaign_schools(
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
      );
    get diagnostics changed_count = row_count;
  end if;

  perform public.write_admin_audit(
    case when requested_active then 'participation.bulk_added' else 'participation.bulk_removed' end,
    'campaign', requested_campaign_id, campaign_name,
    jsonb_build_object('changed_count', changed_count)
  );
  return changed_count;
end;
$$;

create function public.admin_list_schools(
  requested_query text default '',
  requested_county text default '',
  requested_city text default '',
  requested_active boolean default null,
  requested_campaign_id uuid default null,
  requested_participation text default 'all',
  requested_page integer default 1,
  requested_page_size integer default 25
)
returns table (
  id uuid, name text, slug text, type public.school_type, city text, county text,
  postal_code text, address text, active boolean, campaign_count bigint,
  participating boolean, total_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with input as (
    select
      public.normalize_school_search(left(requested_query, 120)) query,
      public.normalize_school_search(left(requested_county, 80)) county,
      public.normalize_school_search(left(requested_city, 80)) city,
      greatest(coalesce(requested_page, 1), 1) page,
      greatest(1, least(coalesce(requested_page_size, 25), 50)) page_size
  ), filtered as (
    select school.*,
      (select count(*) from public.campaign_schools cs where cs.school_id = school.id and cs.active)::bigint campaign_count,
      case when requested_campaign_id is null then false else exists (
        select 1 from public.campaign_schools cs
        where cs.school_id = school.id and cs.campaign_id = requested_campaign_id and cs.active
      ) end participating
    from public.schools school cross join input
    where public.has_admin_role('admin')
      and (requested_active is null or school.active = requested_active)
      and (input.query = '' or school.search_document like '%' || input.query || '%')
      and (input.county = '' or school.search_county = input.county)
      and (input.city = '' or school.search_city = input.city)
  ), scoped as (
    select * from filtered
    where requested_participation = 'all'
      or (requested_participation = 'selected' and participating)
      or (requested_participation = 'unselected' and not participating)
  )
  select scoped.id, scoped.name, scoped.slug, scoped.type, scoped.city, scoped.county,
    scoped.postal_code, scoped.address, scoped.active, scoped.campaign_count,
    scoped.participating, count(*) over ()::bigint
  from scoped cross join input
  order by scoped.name collate "C", scoped.city collate "C", scoped.id
  limit (select page_size from input)
  offset (select (page - 1) * page_size from input);
$$;

create function public.admin_update_school(
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

  select active into old_active from public.schools where id = requested_school_id for update;
  if old_active is null then raise exception 'school not found' using errcode = 'P0002'; end if;

  update public.schools set
    name = normalized_name,
    slug = lower(btrim(requested_slug)),
    type = requested_type,
    city = btrim(requested_city),
    county = btrim(requested_county),
    postal_code = nullif(btrim(requested_postal_code), ''),
    address = nullif(btrim(requested_address), ''),
    active = requested_active
  where id = requested_school_id;

  perform public.write_admin_audit(
    case
      when old_active and not requested_active then 'school.deactivated'
      when not old_active and requested_active then 'school.reactivated'
      else 'school.updated'
    end,
    'school', requested_school_id, normalized_name, '{}'::jsonb
  );
end;
$$;

create function public.admin_save_news(
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
    values (normalized_title, lower(btrim(requested_slug)), btrim(requested_excerpt),
      btrim(requested_content), requested_published, requested_published_at)
    returning id into resulting_id;
    perform public.write_admin_audit('news.created', 'news', resulting_id, normalized_title,
      jsonb_build_object('published', requested_published));
  else
    update public.news set
      title = normalized_title,
      slug = lower(btrim(requested_slug)),
      excerpt = btrim(requested_excerpt),
      content = btrim(requested_content),
      published = requested_published,
      published_at = requested_published_at
    where id = requested_news_id returning id into resulting_id;
    if resulting_id is null then raise exception 'news not found' using errcode = 'P0002'; end if;
    perform public.write_admin_audit('news.updated', 'news', resulting_id, normalized_title,
      jsonb_build_object('published', requested_published));
  end if;
  return resulting_id;
end;
$$;

create function public.admin_manage_administrator(
  requested_user_id uuid,
  requested_role public.administrator_role,
  requested_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  existing_role public.administrator_role;
  existing_active boolean;
  remaining_super_admins integer;
begin
  if not public.has_admin_role('super_admin') then
    raise exception 'super administrator authorization required' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users where id = requested_user_id) then
    raise exception 'auth user not found' using errcode = 'P0002';
  end if;

  select role, active into existing_role, existing_active
  from public.administrators where user_id = requested_user_id for update;

  if requested_user_id = auth.uid()
    and (not requested_active or requested_role <> 'super_admin')
  then
    select count(*) into remaining_super_admins
    from public.administrators
    where active and role = 'super_admin' and user_id <> requested_user_id;
    if remaining_super_admins = 0 then
      raise exception 'cannot remove the last active super administrator' using errcode = '55000';
    end if;
  end if;

  insert into public.administrators (user_id, role, active)
  values (requested_user_id, requested_role, requested_active)
  on conflict (user_id) do update set role = excluded.role, active = excluded.active;

  perform public.write_admin_audit(
    case
      when existing_role is null then 'administrator.invited'
      when existing_active and not requested_active then 'administrator.deactivated'
      when not existing_active and requested_active then 'administrator.reactivated'
      else 'administrator.role_changed'
    end,
    'administrator', requested_user_id, requested_user_id::text,
    jsonb_build_object('role', requested_role, 'active', requested_active)
  );
end;
$$;

-- Force all operational writes through the audited, role-checking functions.
revoke insert, update, delete on public.schools from authenticated;
revoke insert, update, delete on public.campaigns from authenticated;
revoke insert, update, delete on public.campaign_schools from authenticated;
revoke insert, update, delete on public.news from authenticated;
revoke insert, update, delete on public.administrators from authenticated;

revoke all on function public.write_admin_audit(text, text, uuid, text, jsonb) from public;
revoke all on function public.admin_save_campaign(uuid, text, text, text, bigint, date, date) from public;
revoke all on function public.admin_set_campaign_active(uuid, boolean) from public;
revoke all on function public.admin_set_campaign_school(uuid, uuid, boolean) from public;
revoke all on function public.admin_bulk_set_filtered_campaign_schools(uuid, text, text, text, text, boolean) from public;
revoke all on function public.admin_list_schools(text, text, text, boolean, uuid, text, integer, integer) from public;
revoke all on function public.admin_update_school(uuid, text, text, public.school_type, text, text, text, text, boolean) from public;
revoke all on function public.admin_save_news(uuid, text, text, text, text, boolean, timestamptz) from public;
revoke all on function public.admin_manage_administrator(uuid, public.administrator_role, boolean) from public;

grant execute on function public.admin_save_campaign(uuid, text, text, text, bigint, date, date) to authenticated;
grant execute on function public.admin_set_campaign_active(uuid, boolean) to authenticated;
grant execute on function public.admin_set_campaign_school(uuid, uuid, boolean) to authenticated;
grant execute on function public.admin_bulk_set_filtered_campaign_schools(uuid, text, text, text, text, boolean) to authenticated;
grant execute on function public.admin_list_schools(text, text, text, boolean, uuid, text, integer, integer) to authenticated;
grant execute on function public.admin_update_school(uuid, text, text, public.school_type, text, text, text, text, boolean) to authenticated;
grant execute on function public.admin_save_news(uuid, text, text, text, text, boolean, timestamptz) to authenticated;
grant execute on function public.admin_manage_administrator(uuid, public.administrator_role, boolean) to authenticated;

comment on table public.admin_audit_log is
  'Append-only, privacy-minimized audit trail for administrator operational changes.';
