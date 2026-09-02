alter table public.submissions
add column idempotency_key_hash text
check (idempotency_key_hash is null or idempotency_key_hash ~ '^[a-f0-9]{64}$');

create unique index submissions_idempotency_key_hash_unique_idx
on public.submissions (idempotency_key_hash)
where idempotency_key_hash is not null;

create table public.submission_rate_limits (
  scope text not null check (scope ~ '^[a-z0-9_]{1,40}$'),
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  request_count integer not null default 1 check (request_count > 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash)
);

create index submission_rate_limits_reset_at_idx
on public.submission_rate_limits (reset_at);

alter table public.submission_rate_limits enable row level security;
revoke all on public.submission_rate_limits from anon, authenticated;
grant all on public.submission_rate_limits to service_role;

create function public.check_submission_rate_limit(
  requested_scope text,
  requested_key_hash text,
  maximum_requests integer,
  window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  rate_limit_now timestamptz := clock_timestamp();
  resulting_count integer;
  resulting_reset_at timestamptz;
begin
  if requested_scope !~ '^[a-z0-9_]{1,40}$'
    or requested_key_hash !~ '^[a-f0-9]{64}$'
    or maximum_requests < 1
    or window_seconds < 1
    or window_seconds > 86400
  then
    raise exception 'invalid rate-limit parameters' using errcode = '22023';
  end if;

  insert into public.submission_rate_limits as rate_limit (
    scope,
    key_hash,
    request_count,
    reset_at,
    updated_at
  )
  values (
    requested_scope,
    requested_key_hash,
    1,
    rate_limit_now + make_interval(secs => window_seconds),
    rate_limit_now
  )
  on conflict (scope, key_hash) do update
  set
    request_count = case
      when rate_limit.reset_at <= rate_limit_now then 1
      else rate_limit.request_count + 1
    end,
    reset_at = case
      when rate_limit.reset_at <= rate_limit_now
        then rate_limit_now + make_interval(secs => window_seconds)
      else rate_limit.reset_at
    end,
    updated_at = rate_limit_now
  returning request_count, reset_at
  into resulting_count, resulting_reset_at;

  return query
  select
    resulting_count <= maximum_requests,
    greatest(1, ceil(extract(epoch from resulting_reset_at - rate_limit_now)))::integer;
end;
$$;

revoke all on function public.check_submission_rate_limit(text, text, integer, integer)
from public;
grant execute on function public.check_submission_rate_limit(text, text, integer, integer)
to service_role;

create policy schools_reviewer_read
on public.schools for select
to authenticated
using (public.has_admin_role('reviewer'));

create policy campaigns_reviewer_read
on public.campaigns for select
to authenticated
using (public.has_admin_role('reviewer'));

create policy campaign_schools_reviewer_read
on public.campaign_schools for select
to authenticated
using (public.has_admin_role('reviewer'));

create function public.review_submission(
  requested_submission_id uuid,
  expected_version integer,
  requested_status public.submission_status,
  requested_approved_amount bigint default null,
  requested_approved_bottle_count integer default null,
  requested_receipt_identifier text default null,
  requested_receipt_date date default null,
  requested_reason text default null
)
returns table (
  submission_id uuid,
  new_status public.submission_status,
  new_version integer,
  new_reviewed_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_submission public.submissions%rowtype;
  reviewer_id uuid := auth.uid();
  review_time timestamptz := clock_timestamp();
  normalized_reason text := nullif(btrim(requested_reason), '');
  normalized_identifier text := nullif(btrim(requested_receipt_identifier), '');
begin
  if not public.has_admin_role('reviewer') then
    raise exception 'reviewer authorization required' using errcode = '42501';
  end if;

  select *
  into current_submission
  from public.submissions
  where id = requested_submission_id
  for update;

  if not found then
    raise exception 'submission not found' using errcode = 'P0002';
  end if;

  if current_submission.version <> expected_version then
    raise exception 'stale submission version' using errcode = '40001';
  end if;

  if current_submission.status not in ('pending', 'needs_review')
    or requested_status not in ('approved', 'rejected', 'needs_review')
    or current_submission.status = requested_status
  then
    raise exception 'invalid submission status transition' using errcode = '55000';
  end if;

  if requested_status = 'approved'
    and (
      requested_approved_amount is null
      or requested_approved_amount <= 0
      or requested_approved_bottle_count is null
      or requested_approved_bottle_count <= 0
    )
  then
    raise exception 'approval requires positive amount and bottle count' using errcode = '22023';
  end if;

  if requested_status = 'rejected' and normalized_reason is null then
    raise exception 'rejection reason is required' using errcode = '22023';
  end if;

  update public.submissions as submission
  set
    status = requested_status,
    approved_amount = case
      when requested_status = 'approved' then requested_approved_amount
      else null
    end,
    approved_bottle_count = case
      when requested_status = 'approved' then requested_approved_bottle_count
      else null
    end,
    receipt_identifier = case
      when requested_status = 'approved' then normalized_identifier
      else submission.receipt_identifier
    end,
    receipt_date = case
      when requested_status = 'approved' then requested_receipt_date
      else submission.receipt_date
    end,
    rejection_reason = case
      when requested_status = 'rejected' then normalized_reason
      else null
    end,
    reviewed_at = review_time,
    reviewed_by = reviewer_id,
    version = submission.version + 1
  where submission.id = requested_submission_id
  returning submission.id, submission.status, submission.version, submission.reviewed_at
  into submission_id, new_status, new_version, new_reviewed_at;

  insert into public.submission_reviews (
    submission_id,
    reviewer_id,
    from_status,
    to_status,
    approved_amount,
    approved_bottle_count,
    reason
  )
  values (
    current_submission.id,
    reviewer_id,
    current_submission.status,
    requested_status,
    case when requested_status = 'approved' then requested_approved_amount else null end,
    case when requested_status = 'approved' then requested_approved_bottle_count else null end,
    normalized_reason
  );

  return next;
end;
$$;

revoke all on function public.review_submission(
  uuid,
  integer,
  public.submission_status,
  bigint,
  integer,
  text,
  date,
  text
)
from public;
grant execute on function public.review_submission(
  uuid,
  integer,
  public.submission_status,
  bigint,
  integer,
  text,
  date,
  text
)
to authenticated;

comment on table public.submission_rate_limits is
  'Short-lived anonymous submission counters keyed only by server-side HMAC hashes.';
comment on function public.review_submission(
  uuid,
  integer,
  public.submission_status,
  bigint,
  integer,
  text,
  date,
  text
) is
  'Authorized optimistic transactional submission transition with append-only audit insertion.';
