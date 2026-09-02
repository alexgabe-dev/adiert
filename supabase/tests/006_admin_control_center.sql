set client_min_messages = warning;

set role anon;
set request.jwt.claim.sub = '';

do $$
begin
  begin
    perform public.admin_save_campaign(
      null, 'Forbidden', 'forbidden', '', 1000, '2026-01-01', '2026-12-31'
    );
    raise exception 'Anonymous user unexpectedly managed campaigns';
  exception when insufficient_privilege then null;
  end;

  begin
    perform count(*) from public.admin_audit_log;
    raise exception 'Anonymous user unexpectedly read the operational audit log';
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
    perform public.admin_create_school(
      'Forbidden School', 'forbidden-school', 'other', 'City', 'County', null, null
    );
    raise exception 'Authenticated non-admin unexpectedly managed schools';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000002';

do $$
begin
  begin
    perform public.admin_save_campaign(
      null, 'Reviewer Campaign', 'reviewer-campaign', '', 1000, '2026-01-01', '2026-12-31'
    );
    raise exception 'Reviewer unexpectedly managed campaigns';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.admin_update_school(
      '10000000-0000-4000-8000-000000000001', 'Changed', 'changed', 'other',
      'City', 'County', null, null, true
    );
    raise exception 'Reviewer unexpectedly managed schools';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.admin_save_news(
      null, 'Forbidden', 'forbidden-news', 'Excerpt', 'Content', false, null
    );
    raise exception 'Reviewer unexpectedly managed news';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.admin_set_campaign_school(
      '20000000-0000-4000-8000-000000000001',
      '10000000-0000-4000-8000-000000000001', true
    );
    raise exception 'Reviewer unexpectedly managed campaign participation';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.admin_manage_administrator(
      '00000000-0000-4000-8000-000000000002', 'super_admin', true
    );
    raise exception 'Reviewer unexpectedly managed administrator lifecycle';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000003';

do $$
declare
  created_campaign uuid;
  created_school uuid;
  created_news uuid;
  changed_rows integer;
begin
  begin
    perform public.admin_manage_administrator(
      '00000000-0000-4000-8000-000000000002', 'admin', true
    );
    raise exception 'Admin unexpectedly managed administrator lifecycle';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.news (title, slug, excerpt, content)
    values ('Direct', 'direct-admin-news', 'Direct', 'Direct');
    raise exception 'Admin bypassed the audited news operation';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.admin_save_campaign(
      null, 'Invalid Dates', 'invalid-dates', '', 1000, '2026-12-31', '2026-01-01'
    );
    raise exception 'Campaign with invalid dates unexpectedly succeeded';
  exception when invalid_parameter_value then null;
  end;

  select public.admin_save_campaign(
    null, 'Control Center Campaign', 'control-center-campaign', 'Operational test',
    2500000, '2027-01-01', '2027-12-31'
  ) into created_campaign;

  begin
    perform public.admin_set_campaign_active(created_campaign, true);
    raise exception 'A second active campaign unexpectedly succeeded';
  exception when unique_violation then null;
  end;

  perform public.admin_set_campaign_active(
    '20000000-0000-4000-8000-000000000001', false
  );
  perform public.admin_set_campaign_active(created_campaign, true);
  perform public.admin_set_campaign_active(created_campaign, false);
  perform public.admin_set_campaign_active(
    '20000000-0000-4000-8000-000000000001', true
  );

  select public.admin_create_school(
    'Control Center School', 'control-center-school', 'other',
    'Audit City', 'Audit County', null, null
  ) into created_school;

  perform public.admin_update_school(
    created_school, 'Control Center School Updated', 'control-center-school-updated',
    'primary_school', 'Audit City', 'Audit County', '1234', 'Test address', true
  );

  begin
    perform public.admin_update_school(
      created_school, 'Control Center School Updated', 'control-center-school-updated',
      'primary_school', 'Audit City', 'Audit County', '1234', 'Test address', false
    );
    raise exception 'School state changed through the identity-edit operation';
  exception when object_not_in_prerequisite_state then null;
  end;

  perform public.admin_set_campaign_school(created_campaign, created_school, true);
  perform public.admin_set_campaign_school(created_campaign, created_school, true);
  if (
    select count(*) from public.campaign_schools
    where campaign_id = created_campaign and school_id = created_school
  ) <> 1 then
    raise exception 'Single participation operation is not idempotent';
  end if;

  perform public.admin_set_campaign_school(created_campaign, created_school, false);
  perform public.admin_set_campaign_school(created_campaign, created_school, true);
  perform public.admin_set_school_active(created_school, false);
  if exists (
    select 1 from public.campaign_schools
    where campaign_id = created_campaign and school_id = created_school and active
  ) then
    raise exception 'School deactivation left an active campaign participation';
  end if;
  begin
    perform public.admin_set_campaign_school(created_campaign, created_school, true);
    raise exception 'Inactive school was added to a campaign';
  exception when object_not_in_prerequisite_state then null;
  end;
  perform public.admin_set_school_active(created_school, true);

  select public.admin_bulk_set_filtered_campaign_schools(
    created_campaign, 'Control Center School Updated', 'Audit County', 'Audit City',
    'unselected', true
  ) into changed_rows;
  if changed_rows <> 1 then
    raise exception 'Filtered bulk add did not change exactly one school';
  end if;
  select public.admin_bulk_set_filtered_campaign_schools(
    created_campaign, 'Control Center School Updated', 'Audit County', 'Audit City',
    'unselected', true
  ) into changed_rows;
  if changed_rows <> 0 then
    raise exception 'Filtered bulk add is not idempotent';
  end if;
  select public.admin_bulk_set_filtered_campaign_schools(
    created_campaign, 'Control Center School Updated', 'Audit County', 'Audit City',
    'unselected', false
  ) into changed_rows;
  if changed_rows <> 0 then
    raise exception 'Bulk remove ignored the unselected participation filter';
  end if;
  select public.admin_bulk_set_filtered_campaign_schools(
    created_campaign, 'Control Center School Updated', 'Audit County', 'Audit City',
    'selected', false
  ) into changed_rows;
  if changed_rows <> 1 then
    raise exception 'Filtered bulk remove did not deactivate the selected participation';
  end if;

  select public.admin_save_news(
    null, 'Control Center News', 'control-center-news', 'Excerpt',
    '<script>plain text only</script>', false, null
  ) into created_news;
  perform public.admin_save_news(
    created_news, 'Control Center News', 'control-center-news', 'Excerpt',
    '<script>plain text only</script>', true, now()
  );
  perform public.admin_save_news(
    created_news, 'Control Center News', 'control-center-news', 'Excerpt',
    '<script>plain text only</script>', false, null
  );

end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000004';

do $$
begin
  begin
    update public.schools set name = 'Direct super-admin mutation'
    where id = '10000000-0000-4000-8000-000000000001';
    raise exception 'Super-admin bypassed the audited school operation';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.admin_audit_log (
      actor_user_id, action, target_type, target_label
    ) values (
      '00000000-0000-4000-8000-000000000004',
      'forged.event', 'school', 'Forged event'
    );
    raise exception 'Super-admin directly inserted an operational audit event';
  exception when insufficient_privilege then null;
  end;

  perform public.admin_manage_administrator(
    '00000000-0000-4000-8000-000000000005', 'reviewer', true
  );
  if not exists (
    select 1 from public.administrators
    where user_id = '00000000-0000-4000-8000-000000000005'
      and role = 'reviewer' and active
  ) then
    raise exception 'Super-admin could not reactivate an administrator';
  end if;
  perform public.admin_manage_administrator(
    '00000000-0000-4000-8000-000000000005', 'super_admin', false
  );

  if not exists (
    select 1 from public.admin_audit_log
    where action = 'administrator.reactivated'
      and target_id = '00000000-0000-4000-8000-000000000005'
  ) or not exists (
    select 1 from public.admin_audit_log
    where action = 'administrator.deactivated'
      and target_id = '00000000-0000-4000-8000-000000000005'
  ) then
    raise exception 'Administrator lifecycle audit events are incomplete';
  end if;

  if not exists (select 1 from public.admin_audit_log where action = 'campaign.created' and target_label = 'Control Center Campaign')
    or not exists (select 1 from public.admin_audit_log where action = 'campaign.activated' and target_label = 'Control Center Campaign')
    or not exists (select 1 from public.admin_audit_log where action = 'campaign.deactivated' and target_label = 'Control Center Campaign')
    or not exists (select 1 from public.admin_audit_log where action = 'school.created' and target_label = 'Control Center School')
    or not exists (select 1 from public.admin_audit_log where action = 'school.updated' and target_label = 'Control Center School Updated')
    or not exists (select 1 from public.admin_audit_log where action = 'school.deactivated' and target_label = 'Control Center School Updated')
    or not exists (select 1 from public.admin_audit_log where action = 'participation.bulk_added' and target_label = 'Control Center Campaign')
    or not exists (select 1 from public.admin_audit_log where action = 'participation.bulk_removed' and target_label = 'Control Center Campaign')
    or not exists (select 1 from public.admin_audit_log where action = 'participation.added' and target_label like 'Control Center School%')
    or not exists (select 1 from public.admin_audit_log where action = 'participation.removed' and target_label like 'Control Center School%')
    or not exists (select 1 from public.admin_audit_log where action = 'news.created' and target_label = 'Control Center News')
    or not exists (select 1 from public.admin_audit_log where action = 'news.published' and target_label = 'Control Center News')
    or not exists (select 1 from public.admin_audit_log where action = 'news.unpublished' and target_label = 'Control Center News')
  then
    raise exception 'Expected operational audit actions are incomplete';
  end if;
end;
$$;

reset role;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-4000-8000-000000000005';

do $$
begin
  begin
    perform public.admin_save_news(
      null, 'Inactive', 'inactive-admin-news', 'Excerpt', 'Content', false, null
    );
    raise exception 'Inactive administrator unexpectedly managed news';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
set role service_role;

do $$
begin
  begin
    update public.admin_audit_log set result = 'failure';
    raise exception 'Operational audit rows were rewritten';
  exception when object_not_in_prerequisite_state then null;
  end;
  begin
    delete from public.admin_audit_log;
    raise exception 'Operational audit rows were deleted';
  exception when object_not_in_prerequisite_state then null;
  end;

  begin
    delete from public.schools
    where id = '10000000-0000-4000-8000-000000000001';
    raise exception 'School with history was hard-deleted';
  exception when foreign_key_violation then null;
  end;

  if exists (
    select 1 from public.admin_audit_log
    where metadata::text ~* '(receipt_image|service_role|secret|token|ocr_payload)'
  ) then
    raise exception 'Operational audit metadata contains a forbidden sensitive field';
  end if;
end;
$$;

reset role;
