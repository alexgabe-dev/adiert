create extension if not exists pgcrypto with schema extensions;

create type public.school_type as enum (
  'kindergarten',
  'primary_school',
  'secondary_school',
  'vocational_school',
  'special_school',
  'other'
);

create type public.submission_status as enum (
  'pending',
  'approved',
  'rejected',
  'needs_review'
);

create type public.administrator_role as enum ('reviewer', 'admin', 'super_admin');

create type public.ocr_status as enum (
  'not_requested',
  'queued',
  'processing',
  'completed',
  'failed'
);

create type public.fraud_flag_type as enum (
  'exact_image_hash',
  'confirmed_identifier_collision',
  'ocr_identifier_match',
  'receipt_values_match',
  'perceptual_image_similarity',
  'abnormal_velocity',
  'other'
);

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  type public.school_type not null,
  city text not null check (length(btrim(city)) > 0),
  county text not null check (length(btrim(county)) > 0),
  postal_code text not null check (postal_code ~ '^[0-9]{4}$'),
  address text not null check (length(btrim(address)) > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null,
  target_amount bigint not null check (target_amount > 0),
  start_date date not null,
  end_date date not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_valid_date_range check (end_date >= start_date)
);

create unique index campaigns_one_active_idx on public.campaigns (active) where active;

create table public.campaign_schools (
  campaign_id uuid not null references public.campaigns(id) on delete restrict,
  school_id uuid not null references public.schools(id) on delete restrict,
  joined_at timestamptz not null default now(),
  active boolean not null default true,
  primary key (campaign_id, school_id)
);

create table public.administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.administrator_role not null,
  active boolean not null default true,
  display_name text check (display_name is null or length(btrim(display_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  public_reference uuid not null unique default gen_random_uuid(),
  school_id uuid not null,
  campaign_id uuid not null,
  receipt_image_path text not null unique check (
    receipt_image_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
  ),
  receipt_image_sha256 text check (
    receipt_image_sha256 is null or receipt_image_sha256 ~ '^[a-f0-9]{64}$'
  ),
  receipt_image_phash text,
  detected_amount bigint check (detected_amount >= 0),
  detected_bottle_count integer check (detected_bottle_count >= 0),
  detected_receipt_identifier text,
  detected_receipt_date date,
  approved_amount bigint check (approved_amount >= 0),
  approved_bottle_count integer check (approved_bottle_count >= 0),
  receipt_identifier text,
  receipt_date date,
  status public.submission_status not null default 'pending',
  rejection_reason text,
  fraud_score numeric(5, 2) check (fraud_score between 0 and 100),
  ocr_status public.ocr_status not null default 'not_requested',
  ocr_payload jsonb,
  ocr_provider text,
  ocr_model_version text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.administrators(user_id) on delete restrict,
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  foreign key (campaign_id, school_id)
    references public.campaign_schools(campaign_id, school_id)
    on delete restrict,
  constraint submissions_status_fields check (
    (
      status = 'approved'
      and approved_amount is not null
      and approved_bottle_count is not null
      and reviewed_at is not null
      and reviewed_by is not null
      and rejection_reason is null
    )
    or (
      status = 'rejected'
      and rejection_reason is not null
      and length(btrim(rejection_reason)) > 0
      and reviewed_at is not null
      and reviewed_by is not null
    )
    or status in ('pending', 'needs_review')
  )
);

create table public.submission_flags (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  type public.fraud_flag_type not null,
  severity smallint not null check (severity between 1 and 5),
  score numeric(5, 2) not null check (score between 0 and 100),
  matched_submission_id uuid references public.submissions(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  resolved_at timestamptz,
  resolved_by uuid references public.administrators(user_id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint submission_flags_resolution check (
    (resolved_at is null and resolved_by is null)
    or (resolved_at is not null and resolved_by is not null)
  ),
  constraint submission_flags_not_self_match check (
    matched_submission_id is null or matched_submission_id <> submission_id
  )
);

create table public.submission_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete restrict,
  reviewer_id uuid not null references public.administrators(user_id) on delete restrict,
  from_status public.submission_status not null,
  to_status public.submission_status not null,
  approved_amount bigint check (approved_amount >= 0),
  approved_bottle_count integer check (approved_bottle_count >= 0),
  reason text,
  created_at timestamptz not null default now(),
  constraint submission_reviews_changed_status check (from_status <> to_status)
);

create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) > 0),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text not null,
  content text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_publication_date check (not published or published_at is not null)
);

create index schools_active_county_idx on public.schools (active, county);
create index schools_active_city_idx on public.schools (active, city);
create index schools_active_type_idx on public.schools (active, type);
create index schools_normalized_name_idx on public.schools (lower(name) text_pattern_ops);
create index submissions_status_created_idx on public.submissions (status, created_at desc);
create index submissions_campaign_status_created_idx
  on public.submissions (campaign_id, status, created_at desc);
create index submissions_school_campaign_status_idx
  on public.submissions (school_id, campaign_id, status);
create index submissions_image_sha256_idx
  on public.submissions (receipt_image_sha256)
  where receipt_image_sha256 is not null;
create index submissions_detected_identifier_idx
  on public.submissions (lower(btrim(detected_receipt_identifier)))
  where detected_receipt_identifier is not null;
create index submissions_confirmed_identifier_idx
  on public.submissions (lower(btrim(receipt_identifier)))
  where receipt_identifier is not null;
create unique index submissions_approved_identifier_unique_idx
  on public.submissions (lower(btrim(receipt_identifier)))
  where status = 'approved' and receipt_identifier is not null;
create index submissions_receipt_date_idx on public.submissions (receipt_date);
create index submissions_approved_values_idx
  on public.submissions (approved_amount, approved_bottle_count);
create index submissions_fraud_score_idx
  on public.submissions (fraud_score desc nulls last);
create index submission_flags_submission_idx
  on public.submission_flags (submission_id, resolved_at);
create index submission_flags_match_idx
  on public.submission_flags (matched_submission_id)
  where matched_submission_id is not null;
create index submission_reviews_submission_idx
  on public.submission_reviews (submission_id, created_at desc);
create index news_published_at_idx on public.news (published, published_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger schools_set_updated_at
before update on public.schools
for each row execute function public.set_updated_at();

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create trigger administrators_set_updated_at
before update on public.administrators
for each row execute function public.set_updated_at();

create trigger submissions_set_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

create trigger news_set_updated_at
before update on public.news
for each row execute function public.set_updated_at();

create function public.ensure_active_campaign_school()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.campaign_schools cs
    join public.campaigns c on c.id = cs.campaign_id
    join public.schools s on s.id = cs.school_id
    where cs.campaign_id = new.campaign_id
      and cs.school_id = new.school_id
      and cs.active
      and c.active
      and s.active
  ) then
    raise exception 'submission campaign and school participation must be active'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger submissions_require_active_participation
before insert on public.submissions
for each row execute function public.ensure_active_campaign_school();

create function public.prevent_audit_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'submission review records are append-only'
    using errcode = '55000';
end;
$$;

create trigger submission_reviews_append_only
before update or delete on public.submission_reviews
for each row execute function public.prevent_audit_mutation();

create function public.administrator_role_rank(value public.administrator_role)
returns integer
language sql
immutable
strict
security invoker
set search_path = ''
as $$
  select case value
    when 'reviewer'::public.administrator_role then 1
    when 'admin'::public.administrator_role then 2
    when 'super_admin'::public.administrator_role then 3
  end;
$$;

create function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.administrators a
    where a.user_id = auth.uid() and a.active
  );
$$;

create function public.has_admin_role(required_role public.administrator_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.administrators a
    where a.user_id = auth.uid()
      and a.active
      and public.administrator_role_rank(a.role)
        >= public.administrator_role_rank(required_role)
  );
$$;

revoke all on function public.is_active_admin() from public;
revoke all on function public.has_admin_role(public.administrator_role) from public;
grant execute on function public.is_active_admin() to authenticated;
grant execute on function public.has_admin_role(public.administrator_role) to authenticated;

alter table public.schools enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_schools enable row level security;
alter table public.administrators enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_flags enable row level security;
alter table public.submission_reviews enable row level security;
alter table public.news enable row level security;

create policy schools_public_read
on public.schools for select
to anon, authenticated
using (active);

create policy schools_admin_read
on public.schools for select
to authenticated
using (public.has_admin_role('admin'));

create policy schools_admin_insert
on public.schools for insert
to authenticated
with check (public.has_admin_role('admin'));

create policy schools_admin_update
on public.schools for update
to authenticated
using (public.has_admin_role('admin'))
with check (public.has_admin_role('admin'));

create policy schools_super_admin_delete
on public.schools for delete
to authenticated
using (public.has_admin_role('super_admin'));

create policy campaigns_public_read
on public.campaigns for select
to anon, authenticated
using (active);

create policy campaigns_admin_read
on public.campaigns for select
to authenticated
using (public.has_admin_role('admin'));

create policy campaigns_admin_insert
on public.campaigns for insert
to authenticated
with check (public.has_admin_role('admin'));

create policy campaigns_admin_update
on public.campaigns for update
to authenticated
using (public.has_admin_role('admin'))
with check (public.has_admin_role('admin'));

create policy campaigns_super_admin_delete
on public.campaigns for delete
to authenticated
using (public.has_admin_role('super_admin'));

create policy campaign_schools_public_read
on public.campaign_schools for select
to anon, authenticated
using (
  active
  and exists (
    select 1 from public.campaigns c
    where c.id = campaign_id and c.active
  )
  and exists (
    select 1 from public.schools s
    where s.id = school_id and s.active
  )
);

create policy campaign_schools_admin_read
on public.campaign_schools for select
to authenticated
using (public.has_admin_role('admin'));

create policy campaign_schools_admin_insert
on public.campaign_schools for insert
to authenticated
with check (public.has_admin_role('admin'));

create policy campaign_schools_admin_update
on public.campaign_schools for update
to authenticated
using (public.has_admin_role('admin'))
with check (public.has_admin_role('admin'));

create policy campaign_schools_super_admin_delete
on public.campaign_schools for delete
to authenticated
using (public.has_admin_role('super_admin'));

create policy administrators_own_active_read
on public.administrators for select
to authenticated
using (user_id = auth.uid() and public.is_active_admin());

create policy administrators_super_admin_read
on public.administrators for select
to authenticated
using (public.has_admin_role('super_admin'));

create policy administrators_super_admin_insert
on public.administrators for insert
to authenticated
with check (public.has_admin_role('super_admin'));

create policy administrators_super_admin_update
on public.administrators for update
to authenticated
using (public.has_admin_role('super_admin'))
with check (public.has_admin_role('super_admin'));

create policy administrators_super_admin_delete
on public.administrators for delete
to authenticated
using (public.has_admin_role('super_admin'));

create policy submissions_admin_read
on public.submissions for select
to authenticated
using (public.has_admin_role('reviewer'));

create policy submission_flags_admin_read
on public.submission_flags for select
to authenticated
using (public.has_admin_role('reviewer'));

create policy submission_reviews_admin_read
on public.submission_reviews for select
to authenticated
using (public.has_admin_role('reviewer'));

create policy news_public_read
on public.news for select
to anon, authenticated
using (published and published_at <= now());

create policy news_admin_read
on public.news for select
to authenticated
using (public.has_admin_role('admin'));

create policy news_admin_insert
on public.news for insert
to authenticated
with check (public.has_admin_role('admin'));

create policy news_admin_update
on public.news for update
to authenticated
using (public.has_admin_role('admin'))
with check (public.has_admin_role('admin'));

create policy news_super_admin_delete
on public.news for delete
to authenticated
using (public.has_admin_role('super_admin'));

grant usage on schema public to anon, authenticated;
grant select (id, name, slug, type, city, county, postal_code, address, active)
  on public.schools to anon, authenticated;
grant select (id, name, slug, description, target_amount, start_date, end_date, active)
  on public.campaigns to anon, authenticated;
grant select on public.campaign_schools to anon, authenticated;
grant select (id, title, slug, excerpt, content, published, published_at)
  on public.news to anon, authenticated;

grant insert, update, delete on public.schools to authenticated;
grant insert, update, delete on public.campaigns to authenticated;
grant insert, update, delete on public.campaign_schools to authenticated;
grant insert, update, delete on public.news to authenticated;
grant select, insert, update, delete on public.administrators to authenticated;
grant select on public.submissions to authenticated;
grant select on public.submission_flags to authenticated;
grant select on public.submission_reviews to authenticated;

grant all on public.schools to service_role;
grant all on public.campaigns to service_role;
grant all on public.campaign_schools to service_role;
grant all on public.administrators to service_role;
grant all on public.submissions to service_role;
grant all on public.submission_flags to service_role;
grant all on public.submission_reviews to service_role;
grant all on public.news to service_role;

create function public.campaign_school_totals(requested_campaign_id uuid default null)
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
    s.campaign_id,
    s.school_id,
    coalesce(sum(s.approved_amount), 0)::bigint as approved_amount,
    coalesce(sum(s.approved_bottle_count), 0)::bigint as approved_bottle_count
  from public.submissions s
  where s.status = 'approved'
    and (requested_campaign_id is null or s.campaign_id = requested_campaign_id)
  group by s.campaign_id, s.school_id;
$$;

create function public.campaign_leaderboard(requested_campaign_id uuid)
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
  with totals as (
    select * from public.campaign_school_totals(requested_campaign_id)
  )
  select
    totals.campaign_id,
    totals.school_id,
    schools.name,
    schools.slug,
    totals.approved_amount,
    totals.approved_bottle_count,
    dense_rank() over (
      order by
        totals.approved_amount desc,
        totals.approved_bottle_count desc,
        schools.name asc,
        schools.id asc
    ) as national_rank
  from totals
  join public.schools on schools.id = totals.school_id;
$$;

revoke all on function public.campaign_school_totals(uuid) from public;
revoke all on function public.campaign_leaderboard(uuid) from public;
grant execute on function public.campaign_school_totals(uuid) to anon, authenticated;
grant execute on function public.campaign_leaderboard(uuid) to anon, authenticated;
grant execute on function public.campaign_school_totals(uuid) to service_role;
grant execute on function public.campaign_leaderboard(uuid) to service_role;

-- Supabase-managed Storage tables already have RLS enabled. Hosted projects keep
-- these tables under the storage service owner, so project migrations must not
-- attempt to alter their RLS setting. The isolated database test bootstrap
-- enables RLS before applying this migration.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipt-images',
  'receipt-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.submissions is
  'Private raw receipt submissions. Public writes are intentionally deferred to the Phase 3 server endpoint.';
comment on function public.campaign_school_totals(uuid) is
  'Public-safe aggregate of approved submissions using reviewer-confirmed approved fields only.';
comment on function public.campaign_leaderboard(uuid) is
  'Public-safe deterministic ranking built only from approved submission totals.';
comment on table public.administrators is
  'Invite-only Supabase Auth users and database-authoritative role/active state.';
