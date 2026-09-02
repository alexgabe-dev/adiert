set client_min_messages = warning;

insert into public.submissions (id, school_id, campaign_id, receipt_image_path)
values
  (
    '30000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000006/40000000-0000-4000-8000-000000000006.jpg'
  ),
  (
    '30000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000007/40000000-0000-4000-8000-000000000007.jpg'
  ),
  (
    '30000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000008/40000000-0000-4000-8000-000000000008.jpg'
  );

set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform public.review_submission(
      '30000000-0000-4000-8000-000000000006', 1, 'approved', 500, 10
    );
    raise exception 'Authenticated non-admin unexpectedly reviewed a submission';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000005';

do $$
begin
  begin
    perform public.review_submission(
      '30000000-0000-4000-8000-000000000006', 1, 'approved', 500, 10
    );
    raise exception 'Inactive administrator unexpectedly reviewed a submission';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';

do $$
declare
  result_status public.submission_status;
  result_version integer;
begin
  select new_status, new_version
  into result_status, result_version
  from public.review_submission(
    '30000000-0000-4000-8000-000000000002',
    1,
    'needs_review',
    null,
    null,
    null,
    null,
    'Kézi összehasonlítás szükséges'
  );
  if result_status <> 'needs_review' or result_version <> 2 then
    raise exception 'Reviewer could not mark needs-review';
  end if;

  begin
    perform public.review_submission(
      '30000000-0000-4000-8000-000000000002', 1, 'approved', 3000, 60
    );
    raise exception 'Stale review version unexpectedly succeeded';
  exception when serialization_failure then null;
  end;

  select new_status, new_version
  into result_status, result_version
  from public.review_submission(
    '30000000-0000-4000-8000-000000000002',
    2,
    'approved',
    3000,
    60,
    'RECEIPT-PHASE3-001',
    '2026-08-30',
    null
  );
  if result_status <> 'approved' or result_version <> 3 then
    raise exception 'Reviewer could not approve needs-review submission';
  end if;

  perform public.review_submission(
    '30000000-0000-4000-8000-000000000004',
    1,
    'rejected',
    null,
    null,
    null,
    null,
    'Nem olvasható bizonylat'
  );

  begin
    perform public.review_submission(
      '30000000-0000-4000-8000-000000000008', 1, 'approved', null, null
    );
    raise exception 'Approval without amount/count unexpectedly succeeded';
  exception when invalid_parameter_value then null;
  end;

  begin
    perform public.review_submission(
      '30000000-0000-4000-8000-000000000008', 1, 'rejected', null, null
    );
    raise exception 'Rejection without reason unexpectedly succeeded';
  exception when invalid_parameter_value then null;
  end;

  perform public.review_submission(
    '30000000-0000-4000-8000-000000000008',
    1,
    'needs_review',
    null,
    null,
    null,
    null,
    'Második ellenőr szükséges'
  );
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';

do $$
begin
  perform public.review_submission(
    '30000000-0000-4000-8000-000000000006',
    1,
    'approved',
    500,
    10,
    'RECEIPT-PHASE3-002',
    '2026-08-31',
    null
  );
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000004';

do $$
begin
  perform public.review_submission(
    '30000000-0000-4000-8000-000000000007',
    1,
    'rejected',
    null,
    null,
    null,
    null,
    'Duplikált tesztbizonylat'
  );
end;
$$;

reset role;

do $$
begin
  if (
    select count(*)
    from public.submission_reviews
    where submission_id in (
      '30000000-0000-4000-8000-000000000002',
      '30000000-0000-4000-8000-000000000004',
      '30000000-0000-4000-8000-000000000006',
      '30000000-0000-4000-8000-000000000007',
      '30000000-0000-4000-8000-000000000008'
    )
  ) <> 6 then
    raise exception 'Every successful transition did not create exactly one audit row';
  end if;

  if (
    select coalesce(sum(approved_amount), 0)
    from public.campaign_school_totals('20000000-0000-4000-8000-000000000001')
  ) <> 7000 then
    raise exception 'Phase 3 status transitions violated approved-only amount aggregation';
  end if;

  if (
    select coalesce(sum(approved_bottle_count), 0)
    from public.campaign_school_totals('20000000-0000-4000-8000-000000000001')
  ) <> 140 then
    raise exception 'Phase 3 status transitions violated approved-only bottle aggregation';
  end if;
end;
$$;

set role anon;
do $$
begin
  begin
    perform public.check_submission_rate_limit(
      'ip_short', repeat('a', 64), 1, 60
    );
    raise exception 'Anonymous role unexpectedly executed the rate limiter';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

do $$
begin
  begin
    perform public.check_submission_rate_limit(
      'ip_short', repeat('a', 64), 1, 60
    );
    raise exception 'Authenticated role unexpectedly executed the rate limiter';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role service_role;

do $$
declare
  first_allowed boolean;
  second_allowed boolean;
begin
  select allowed into first_allowed
  from public.check_submission_rate_limit('ip_short', repeat('b', 64), 1, 60);
  select allowed into second_allowed
  from public.check_submission_rate_limit('ip_short', repeat('b', 64), 1, 60);

  if not first_allowed or second_allowed then
    raise exception 'Atomic rate-limit counter did not enforce its maximum';
  end if;

  if exists (
    select 1 from public.submission_rate_limits
    where key_hash !~ '^[a-f0-9]{64}$'
  ) then
    raise exception 'Rate-limit storage contains a non-hashed key';
  end if;
end;
$$;

reset role;
