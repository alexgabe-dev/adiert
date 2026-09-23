-- A verified signup creates a pending school application, never a membership.
-- This runs in the same transaction as verification, so a saved signup cannot
-- silently lose its school choice between the browser and the callback.
create function public.create_signup_school_application() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  details jsonb := new.raw_user_meta_data -> 'school_registration';
  school public.schools%rowtype;
begin
  if new.email_confirmed_at is null or details is null then return new; end if;
  if tg_op = 'UPDATE' then
    if old.email_confirmed_at is not null then return new; end if;
  end if;
  if exists(select 1 from public.school_applications where user_id=new.id)
     or exists(select 1 from public.school_memberships where user_id=new.id) then return new; end if;
  select * into school from public.schools
    where id=(details->>'school_id')::uuid and active and (type='primary_school' or (type='other' and import_key is not null));
  if not found or (details->>'postal_code') is null
    or (details->>'postal_code') !~ '^[0-9]{4}$'
    or coalesce(length(btrim(details->>'contact_name')),0) not between 2 and 120 then
    raise exception 'invalid_school_registration' using errcode='22023';
  end if;
  -- Existing school admins invite colleagues through the team workflow.
  if exists(select 1 from public.school_invitations
      where email=lower(new.email) and school_id=school.id
        and status='pending' and expires_at>now()) then return new; end if;
  insert into public.school_applications(user_id,school_id,school_name,city,postal_code,contact_name,email)
  values(new.id,school.id,school.name,school.city,details->>'postal_code',btrim(details->>'contact_name'),lower(new.email));
  return new;
end; $$;

revoke all on function public.create_signup_school_application() from public,anon,authenticated;
create trigger signup_school_application
after insert or update of email_confirmed_at on auth.users
for each row execute function public.create_signup_school_application();

-- Imported directory records have unknown type (other). Keep the source
-- classification and let administrators review them rather than hiding them.
create or replace function public.apply_for_school(p_school uuid,p_name text,p_city text,p_postal text,p_contact text) returns uuid
language plpgsql security definer set search_path='' as $$
declare address text:=public.verified_school_email(); result_id uuid; existing public.school_applications%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.school_memberships where user_id=auth.uid() and active) then raise exception 'already_member' using errcode='55000'; end if;
 if p_school is not null and not exists(select 1 from public.schools where id=p_school and active and (type='primary_school' or (type='other' and import_key is not null))) then raise exception 'invalid_school' using errcode='22023'; end if;
 select * into existing from public.school_applications where user_id=auth.uid() for update;
 if existing.status in ('pending','approved','rejected') then raise exception 'application_locked' using errcode='55000'; end if;
 insert into public.school_applications(user_id,school_id,school_name,city,postal_code,contact_name,email)
 values(auth.uid(),p_school,btrim(p_name),btrim(p_city),p_postal,btrim(p_contact),address)
 on conflict(user_id) do update set school_id=excluded.school_id,school_name=excluded.school_name,city=excluded.city,postal_code=excluded.postal_code,contact_name=excluded.contact_name,email=excluded.email,status='pending',reason=null,version=school_applications.version+1,updated_at=now()
 returning id into result_id;
 return result_id;
end; $$;

create or replace function public.decide_school_application(p_id uuid,p_version integer,p_status text,p_reason text default null,p_school uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare a public.school_applications%rowtype; sid uuid; cname text;
begin
 if not public.has_admin_role('admin') then raise exception 'forbidden' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended((select user_id::text from public.school_applications where id=p_id),0));
 select * into a from public.school_applications where id=p_id for update;
 if not found then raise exception 'missing_application' using errcode='P0002'; end if;
 if a.version<>p_version then raise exception 'stale' using errcode='40001'; end if;
 if a.status='approved' or p_status not in ('approved','needs_changes','rejected') then raise exception 'invalid_transition' using errcode='55000'; end if;
 if p_status<>'approved' and nullif(btrim(p_reason),'') is null then raise exception 'reason_required' using errcode='22023'; end if;
 sid:=coalesce(p_school,a.school_id);
 if p_status='approved' then
   if sid is null then
     -- Serialize matching new-school approvals; never silently create a duplicate.
     perform pg_advisory_xact_lock(hashtextextended(public.normalize_school_search(a.school_name)||a.postal_code,0));
     if exists(select 1 from public.schools where search_name=public.normalize_school_search(a.school_name) and postal_code=a.postal_code) then raise exception 'school_exists_select_it' using errcode='23505'; end if;
     sid:=gen_random_uuid();
     insert into public.schools(id,name,slug,type,city,county,postal_code,active) values(sid,a.school_name,'iskola-'||sid,'primary_school',a.city,'Nincs megadva',a.postal_code,true);
   end if;
   perform 1 from public.schools where id=sid and active and (type='primary_school' or (type='other' and import_key is not null)) for update;
   if not found then raise exception 'invalid_school' using errcode='22023'; end if;
   if exists(select 1 from public.school_memberships where school_id=sid and role='owner' and active) then raise exception 'school_has_owner' using errcode='23505'; end if;
   if exists(select 1 from public.school_memberships where user_id=a.user_id and active) then raise exception 'already_member' using errcode='55000'; end if;
   insert into public.school_memberships(user_id,school_id,role,display_name,email) values(a.user_id,sid,'owner',a.contact_name,a.email)
   on conflict(user_id) do update set school_id=excluded.school_id,role='owner',active=true,display_name=excluded.display_name,email=excluded.email;
   insert into public.campaign_schools(campaign_id,school_id) select id,sid from public.campaigns where active on conflict(campaign_id,school_id) do update set active=true;
 end if;
 update public.school_applications set status=p_status,reason=nullif(btrim(p_reason),''),school_id=sid,version=version+1,updated_at=now() where id=p_id;
 select name into cname from public.schools where id=sid;
 insert into public.email_outbox(recipient,subject,body,link_path) values(a.email,
 case when p_status='approved' then 'Elfogadtuk az iskolai regisztrációdat!' when p_status='needs_changes' then 'Pontosítást kérünk az iskolai regisztrációhoz' else 'Döntés az iskolai regisztrációról' end,
 case when p_status='approved' then coalesce(cname,a.school_name)||' iskolai adminja lettél. Már feltölthetsz és meghívhatod a kollégáidat.' else coalesce(p_reason,'') end,'/tanar');
 perform public.write_admin_audit('school.application_'||p_status,'school',sid,coalesce(cname,a.school_name),jsonb_build_object('application_id',p_id,'reason',p_reason));
 insert into public.portal_events(school_id,actor_id,action,target_id,detail) values(sid,auth.uid(),'application.'||p_status,p_id,jsonb_build_object('reason',p_reason));
 return sid;
end; $$;

