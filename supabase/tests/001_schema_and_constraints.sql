set client_min_messages = warning;

do $$
declare
  missing_rls text;
begin
  select string_agg(c.relname, ', ' order by c.relname)
  into missing_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and c.relname in (
      'schools',
      'campaigns',
      'campaign_schools',
      'administrators',
      'submissions',
      'submission_flags',
      'submission_reviews',
      'submission_rate_limits',
      'news',
      'admin_audit_log'
    )
    and not c.relrowsecurity;

  if missing_rls is not null then
    raise exception 'RLS is disabled on: %', missing_rls;
  end if;
end;
$$;

do $$
begin
  if (select count(*) from pg_policies where schemaname = 'public') < 20 then
    raise exception 'Expected the complete application policy set';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename in ('objects', 'buckets')
      and ('anon' = any(roles) or 'authenticated' = any(roles))
  ) then
    raise exception 'Receipt storage must not have direct anon/authenticated policies';
  end if;
end;
$$;

insert into auth.users (id, email)
values
  ('00000000-0000-4000-8000-000000000001', 'person@example.test'),
  ('00000000-0000-4000-8000-000000000002', 'reviewer@example.test'),
  ('00000000-0000-4000-8000-000000000003', 'admin@example.test'),
  ('00000000-0000-4000-8000-000000000004', 'super@example.test'),
  ('00000000-0000-4000-8000-000000000005', 'inactive@example.test');

insert into public.administrators (user_id, role, active, display_name)
values
  ('00000000-0000-4000-8000-000000000002', 'reviewer', true, 'Test Reviewer'),
  ('00000000-0000-4000-8000-000000000003', 'admin', true, 'Test Admin'),
  ('00000000-0000-4000-8000-000000000004', 'super_admin', true, 'Test Super Admin'),
  ('00000000-0000-4000-8000-000000000005', 'super_admin', false, 'Inactive Admin');

insert into public.schools (id, name, slug, type, city, county, postal_code, address, active)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Active Test School',
    'active-test-school',
    'primary_school',
    'Test City',
    'Test County',
    '1000',
    'Test Street 1',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Second Test School',
    'second-test-school',
    'secondary_school',
    'Test City',
    'Test County',
    '1001',
    'Test Street 2',
    true
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Inactive Test School',
    'inactive-test-school',
    'other',
    'Test City',
    'Test County',
    '1002',
    'Test Street 3',
    false
  );

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
values
  (
    '20000000-0000-4000-8000-000000000001',
    'Active Test Campaign',
    'active-test-campaign',
    'Test-only active campaign',
    1000000,
    '2026-01-01',
    '2026-12-31',
    true
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Inactive Test Campaign',
    'inactive-test-campaign',
    'Test-only inactive campaign',
    1000000,
    '2025-01-01',
    '2025-12-31',
    false
  );

insert into public.campaign_schools (campaign_id, school_id)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002');

insert into public.submissions (
  id,
  school_id,
  campaign_id,
  receipt_image_path,
  status,
  approved_amount,
  approved_bottle_count,
  reviewed_at,
  reviewed_by,
  rejection_reason
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001.jpg',
    'approved',
    2500,
    50,
    now(),
    '00000000-0000-4000-8000-000000000002',
    null
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000002/40000000-0000-4000-8000-000000000002.jpg',
    'pending',
    900000,
    18000,
    null,
    null,
    null
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000003/40000000-0000-4000-8000-000000000003.jpg',
    'rejected',
    800000,
    16000,
    now(),
    '00000000-0000-4000-8000-000000000002',
    'Test rejection'
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000004/40000000-0000-4000-8000-000000000004.jpg',
    'needs_review',
    700000,
    14000,
    null,
    null,
    null
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000005/40000000-0000-4000-8000-000000000005.png',
    'approved',
    1000,
    20,
    now(),
    '00000000-0000-4000-8000-000000000003',
    null
  );

insert into public.submission_flags (submission_id, type, severity, score)
values (
  '30000000-0000-4000-8000-000000000002',
  'exact_image_hash',
  5,
  90
);

insert into public.submission_reviews (
  id,
  submission_id,
  reviewer_id,
  from_status,
  to_status,
  approved_amount,
  approved_bottle_count
)
values (
  '50000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  'pending',
  'approved',
  2500,
  50
);

insert into public.news (title, slug, excerpt, content, published, published_at)
values
  ('Published Test News', 'published-test-news', 'Published', 'Published content', true, now()),
  ('Draft Test News', 'draft-test-news', 'Draft', 'Draft content', false, null);

insert into storage.objects (bucket_id, name)
values (
  'receipt-images',
  '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000001.jpg'
);

do $$
begin
  begin
    insert into public.submissions (
      school_id,
      campaign_id,
      receipt_image_path
    ) values (
      '10000000-0000-4000-8000-000000000003',
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000099/40000000-0000-4000-8000-000000000099.jpg'
    );
    raise exception 'Inactive participation unexpectedly accepted';
  exception
    when check_violation or foreign_key_violation then null;
  end;

  begin
    update public.submission_reviews
    set reason = 'mutated'
    where id = '50000000-0000-4000-8000-000000000001';
    raise exception 'Append-only audit row unexpectedly updated';
  exception
    when object_not_in_prerequisite_state then null;
  end;
end;
$$;
