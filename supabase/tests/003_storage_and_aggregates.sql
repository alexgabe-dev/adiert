set client_min_messages = warning;

do $$
declare
  bucket_public boolean;
  bucket_limit bigint;
  bucket_types text[];
begin
  select public, file_size_limit, allowed_mime_types
  into bucket_public, bucket_limit, bucket_types
  from storage.buckets
  where id = 'receipt-images';

  if bucket_public is distinct from false then
    raise exception 'Receipt image bucket is public';
  end if;
  if bucket_limit <> 10485760 then
    raise exception 'Receipt image bucket limit is not 10 MiB';
  end if;
  if bucket_types <> array['image/jpeg', 'image/png', 'image/webp'] then
    raise exception 'Receipt image bucket MIME allowlist is incorrect';
  end if;
end;
$$;

set role anon;
set request.jwt.claim.sub = '';

do $$
declare
  first_amount bigint;
  first_bottles bigint;
  total_rows bigint;
begin
  if (select count(*) from storage.buckets) <> 0 then
    raise exception 'Anonymous user can list receipt buckets';
  end if;
  if (select count(*) from storage.objects) <> 0 then
    raise exception 'Anonymous user can access receipt paths';
  end if;

  select count(*), max(approved_amount), max(approved_bottle_count)
  into total_rows, first_amount, first_bottles
  from public.campaign_school_totals('20000000-0000-4000-8000-000000000001');

  if total_rows <> 2 then
    raise exception 'Approved-only aggregate returned an unexpected school count';
  end if;
  if first_amount <> 2500 or first_bottles <> 50 then
    raise exception 'Aggregate used pending/rejected/needs-review or detected/derived values';
  end if;

  if (
    select coalesce(sum(approved_amount), 0)
    from public.campaign_school_totals('20000000-0000-4000-8000-000000000001')
  ) <> 3500 then
    raise exception 'Campaign total is not based exclusively on approved_amount';
  end if;

  if (
    select coalesce(sum(approved_bottle_count), 0)
    from public.campaign_school_totals('20000000-0000-4000-8000-000000000001')
  ) <> 70 then
    raise exception 'Bottle total is not based exclusively on approved_bottle_count';
  end if;

  if (
    select approved_amount
    from public.campaign_leaderboard('20000000-0000-4000-8000-000000000001')
    where national_rank = 1
  ) <> 2500 then
    raise exception 'Leaderboard ordering is not approved-only';
  end if;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';

do $$
begin
  if (select count(*) from storage.objects) <> 0 then
    raise exception 'Reviewer can directly access private receipt paths';
  end if;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';

do $$
begin
  if (select count(*) from storage.objects) <> 0 then
    raise exception 'Admin can directly access private receipt paths';
  end if;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000004';

do $$
begin
  if (select count(*) from storage.objects) <> 0 then
    raise exception 'Super-admin can directly access private receipt paths';
  end if;
end;
$$;

reset role;
set role service_role;

do $$
begin
  if (select count(*) from storage.objects where bucket_id = 'receipt-images') <> 1 then
    raise exception 'Service role cannot access receipt storage for authorized server operations';
  end if;
end;
$$;

reset role;
