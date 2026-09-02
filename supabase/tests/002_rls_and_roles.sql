set client_min_messages = warning;

set role anon;
set request.jwt.claim.sub = '';

do $$
begin
  if not exists (
    select 1 from public.schools
    where id = '10000000-0000-4000-8000-000000000001'
  ) or exists (
    select 1 from public.schools
    where id = '10000000-0000-4000-8000-000000000003'
  ) then
    raise exception 'Anonymous school visibility is not active-only';
  end if;
  if (select count(*) from public.campaigns) <> 1 then
    raise exception 'Anonymous campaign visibility is not active-only';
  end if;
  if (select count(*) from public.news) <> 1 then
    raise exception 'Anonymous news visibility is not published-only';
  end if;

  begin
    perform count(*) from public.submissions;
    raise exception 'Anonymous raw submission read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    perform count(*) from public.administrators;
    raise exception 'Anonymous administrator read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    perform count(*) from public.submission_reviews;
    raise exception 'Anonymous review audit read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    perform count(*) from public.submission_flags;
    raise exception 'Anonymous fraud flag read unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.submissions (school_id, campaign_id, receipt_image_path)
    values (
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000098/40000000-0000-4000-8000-000000000098.jpg'
    );
    raise exception 'Anonymous submission insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000001';

do $$
begin
  if public.is_active_admin() then
    raise exception 'Non-admin was recognized as an administrator';
  end if;
  if (select count(*) from public.submissions) <> 0 then
    raise exception 'Non-admin can read raw submissions';
  end if;
  if (select count(*) from public.administrators) <> 0 then
    raise exception 'Non-admin can read administrator data';
  end if;

  begin
    update public.administrators
    set role = 'super_admin'
    where user_id = '00000000-0000-4000-8000-000000000001';
    if found then
      raise exception 'Non-admin escalated privileges';
    end if;
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.administrators (user_id, role)
    values ('00000000-0000-4000-8000-000000000001', 'super_admin');
    raise exception 'Non-admin inserted a privileged administrator record';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';

do $$
begin
  if not public.has_admin_role('reviewer') or public.has_admin_role('admin') then
    raise exception 'Reviewer role hierarchy is incorrect';
  end if;
  if (select count(*) from public.submissions) <> 5 then
    raise exception 'Reviewer cannot read submissions';
  end if;
  if (select count(*) from public.submission_flags) <> 1 then
    raise exception 'Reviewer cannot read flags';
  end if;
  if (select count(*) from public.submission_reviews) <> 1 then
    raise exception 'Reviewer cannot read review history';
  end if;
  if (select count(*) from public.administrators) <> 1 then
    raise exception 'Reviewer role visibility is not limited to self';
  end if;

  begin
    insert into public.schools (name, slug, type, city, county, postal_code, address)
    values ('Forbidden', 'forbidden-reviewer-school', 'other', 'City', 'County', '1000', 'Street');
    raise exception 'Reviewer unexpectedly managed schools';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.submissions set status = 'needs_review'
    where id = '30000000-0000-4000-8000-000000000002';
    raise exception 'Reviewer bypassed the future transactional review API';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';

do $$
declare
  inserted_id uuid;
begin
  if not public.has_admin_role('reviewer') or not public.has_admin_role('admin') then
    raise exception 'Admin role hierarchy is incorrect';
  end if;
  if public.has_admin_role('super_admin') then
    raise exception 'Admin was granted super-admin privileges';
  end if;

  insert into public.schools (name, slug, type, city, county, postal_code, address)
  values ('Admin Managed School', 'admin-managed-school', 'other', 'City', 'County', '1000', 'Street')
  returning id into inserted_id;

  if inserted_id is null then
    raise exception 'Admin could not manage schools';
  end if;

  begin
    update public.administrators
    set role = 'super_admin'
    where user_id = '00000000-0000-4000-8000-000000000003';
    if found then
      raise exception 'Admin escalated to super-admin';
    end if;
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000004';

do $$
begin
  if not public.has_admin_role('super_admin') then
    raise exception 'Super-admin role hierarchy is incorrect';
  end if;
  if (select count(*) from public.administrators) <> 4 then
    raise exception 'Super-admin cannot inspect administrator lifecycle records';
  end if;

  update public.administrators
  set display_name = 'Updated Inactive Admin'
  where user_id = '00000000-0000-4000-8000-000000000005';
  if not found then
    raise exception 'Super-admin could not manage administrators';
  end if;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000005';

do $$
begin
  if public.is_active_admin() or public.has_admin_role('reviewer') then
    raise exception 'Inactive administrator retained admin access';
  end if;
  if (select count(*) from public.submissions) <> 0 then
    raise exception 'Inactive administrator can read submissions';
  end if;
  if (select count(*) from public.administrators) <> 0 then
    raise exception 'Inactive administrator can read admin records';
  end if;
end;
$$;

reset role;
