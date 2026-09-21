-- School portal. All writes go through transactional, identity-checking RPCs.
create table public.school_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id),
  school_id uuid references public.schools(id),
  school_name text not null check (length(btrim(school_name)) between 2 and 240),
  city text not null check (length(btrim(city)) between 2 and 120),
  postal_code text not null check (postal_code ~ '^[0-9]{4}$'),
  contact_name text not null check (length(btrim(contact_name)) between 2 and 120),
  email text not null,
  status text not null default 'pending' check (status in ('pending','needs_changes','approved','rejected')),
  reason text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.school_memberships (
  user_id uuid primary key references auth.users(id),
  school_id uuid not null references public.schools(id),
  role text not null check (role in ('owner','teacher')),
  display_name text not null,
  email text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index school_single_owner on public.school_memberships(school_id) where role = 'owner' and active;
create index school_members_by_school on public.school_memberships(school_id);
create table public.school_invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id),
  email text not null check (length(email) between 3 and 254 and email = lower(btrim(email))),
  invited_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);
create unique index school_pending_invitation on public.school_invitations(school_id,email) where status = 'pending';
create table public.portal_events (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id),
  actor_id uuid references auth.users(id),
  action text not null,
  target_id uuid,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create trigger portal_events_append_only before update or delete on public.portal_events
for each row execute function public.prevent_admin_audit_mutation();
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  body text not null,
  link_path text not null check (link_path like '/tanar%'),
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempts integer not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index email_outbox_pending on public.email_outbox(status,created_at);
alter table public.submissions
  add column submitted_by uuid references auth.users(id),
  add column submitted_bottle_count integer check (submitted_bottle_count between 1 and 100000),
  add column returned_on date,
  add column teacher_note text check (length(teacher_note) <= 500),
  add column feedback text;
create table public.submission_revisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id),
  actor_id uuid not null references auth.users(id),
  receipt_image_path text not null,
  bottle_count integer,
  returned_on date,
  teacher_note text,
  version integer not null,
  created_at timestamptz not null default now()
);
create trigger submission_revisions_append_only before update or delete on public.submission_revisions
for each row execute function public.prevent_admin_audit_mutation();

create function public.school_member(school uuid, owner_only boolean default false) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.school_memberships m join public.schools s on s.id=m.school_id
 where m.user_id=auth.uid() and m.school_id=school and m.active and s.active and (not owner_only or m.role='owner'));
$$;
create function public.verified_school_email() returns text
language plpgsql stable security definer set search_path = '' as $$
declare address text;
begin
 select lower(email) into address from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if address is null then raise exception 'confirmed email required' using errcode='42501'; end if;
 return address;
end; $$;

alter table public.school_applications enable row level security;
alter table public.school_memberships enable row level security;
alter table public.school_invitations enable row level security;
alter table public.portal_events enable row level security;
alter table public.email_outbox enable row level security;
alter table public.submission_revisions enable row level security;
create policy applications_read on public.school_applications for select to authenticated using(user_id=auth.uid() or public.has_admin_role('admin'));
create policy memberships_read on public.school_memberships for select to authenticated using(user_id=auth.uid() or public.school_member(school_id) or public.has_admin_role('reviewer'));
create policy invitations_read on public.school_invitations for select to authenticated using(public.school_member(school_id,true) or public.has_admin_role('admin') or email=(select lower(email) from auth.users where id=auth.uid()));
-- Avoid requiring direct access to auth.users in RLS expressions.
alter policy invitations_read on public.school_invitations using(public.school_member(school_id,true) or public.has_admin_role('admin') or email=public.verified_school_email());
create policy events_read on public.portal_events for select to authenticated using(public.school_member(school_id) or public.has_admin_role('admin'));
create policy email_admin_read on public.email_outbox for select to authenticated using(public.has_admin_role('admin'));
create policy revisions_read on public.submission_revisions for select to authenticated using(exists(select 1 from public.submissions s where s.id=submission_id and (public.school_member(s.school_id) or public.has_admin_role('reviewer'))));
create policy submissions_member_read on public.submissions for select to authenticated using(public.school_member(school_id));
create policy schools_member_read on public.schools for select to authenticated using(public.school_member(id));
revoke all on public.school_applications,public.school_memberships,public.school_invitations,public.portal_events,public.email_outbox,public.submission_revisions from anon,authenticated;
grant select on public.school_applications,public.school_memberships,public.school_invitations,public.portal_events,public.email_outbox,public.submission_revisions to authenticated;
grant all on public.school_applications,public.school_memberships,public.school_invitations,public.portal_events,public.email_outbox,public.submission_revisions to service_role;

create function public.apply_for_school(p_school uuid,p_name text,p_city text,p_postal text,p_contact text) returns uuid
language plpgsql security definer set search_path='' as $$
declare address text:=public.verified_school_email(); result_id uuid; existing public.school_applications%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.school_memberships where user_id=auth.uid() and active) then raise exception 'already_member' using errcode='55000'; end if;
 if p_school is not null and not exists(select 1 from public.schools where id=p_school and active and type='primary_school') then raise exception 'invalid_school' using errcode='22023'; end if;
 select * into existing from public.school_applications where user_id=auth.uid() for update;
 if existing.status in ('pending','approved','rejected') then raise exception 'application_locked' using errcode='55000'; end if;
 insert into public.school_applications(user_id,school_id,school_name,city,postal_code,contact_name,email)
 values(auth.uid(),p_school,btrim(p_name),btrim(p_city),p_postal,btrim(p_contact),address)
 on conflict(user_id) do update set school_id=excluded.school_id,school_name=excluded.school_name,city=excluded.city,postal_code=excluded.postal_code,contact_name=excluded.contact_name,email=excluded.email,status='pending',reason=null,version=school_applications.version+1,updated_at=now()
 returning id into result_id;
 return result_id;
end; $$;

create function public.decide_school_application(p_id uuid,p_version integer,p_status text,p_reason text default null,p_school uuid default null) returns uuid
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
   perform 1 from public.schools where id=sid and active and type='primary_school' for update;
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

create function public.invite_school_teacher(p_school uuid,p_email text) returns uuid
language plpgsql security definer set search_path='' as $$
declare invitation_id uuid; normalized text:=lower(btrim(p_email)); seats integer;
begin
 if not (public.school_member(p_school,true) or public.has_admin_role('admin')) then raise exception 'forbidden' using errcode='42501'; end if;
 perform 1 from public.schools where id=p_school and active for update;
 if not found then raise exception 'inactive_school' using errcode='55000'; end if;
 if normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_email' using errcode='22023'; end if;
 update public.school_invitations set status='expired' where school_id=p_school and status='pending' and expires_at<=now();
 if exists(select 1 from public.school_memberships where school_id=p_school and lower(email)=normalized and active) then raise exception 'already_member' using errcode='23505'; end if;
 select (select count(*) from public.school_memberships where school_id=p_school and active and role='teacher')+(select count(*) from public.school_invitations where school_id=p_school and status='pending') into seats;
 if seats>=10 then raise exception 'teacher_limit' using errcode='23514'; end if;
 insert into public.school_invitations(school_id,email,invited_by) values(p_school,normalized,auth.uid()) returning id into invitation_id;
 insert into public.email_outbox(recipient,subject,body,link_path) values(normalized,'Meghívó az Ádiért iskolai csapatába','Meghívtak a(z) '||(select name from public.schools where id=p_school)||' csapatába. Lépj be vagy regisztrálj ezzel az e-mail-címmel, majd fogadd el a meghívást. A meghívó 7 napig érvényes.','/tanar/meghivasok');
 insert into public.portal_events(school_id,actor_id,action,target_id) values(p_school,auth.uid(),'teacher.invited',invitation_id);
 return invitation_id;
end; $$;

create function public.accept_school_invitation(p_id uuid,p_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare address text:=public.verified_school_email(); inv public.school_invitations%rowtype; sid uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select school_id into sid from public.school_invitations where id=p_id and email=address;
 if sid is null then raise exception 'forbidden' using errcode='42501'; end if;
 perform 1 from public.schools where id=sid and active for update;
 if not found then raise exception 'inactive_school' using errcode='55000'; end if;
 select * into inv from public.school_invitations where id=p_id for update;
 if inv.status<>'pending' or inv.expires_at<=now() then raise exception 'invitation_expired' using errcode='55000'; end if;
 if length(btrim(p_name)) not between 2 and 120 then raise exception 'invalid_name' using errcode='22023'; end if;
 if exists(select 1 from public.school_memberships where user_id=auth.uid() and active) then raise exception 'already_member' using errcode='55000'; end if;
 if (select count(*) from public.school_memberships where school_id=sid and active and role='teacher')>=10 then raise exception 'teacher_limit' using errcode='23514'; end if;
 insert into public.school_memberships(user_id,school_id,role,display_name,email) values(auth.uid(),sid,'teacher',btrim(p_name),address)
 on conflict(user_id) do update set school_id=excluded.school_id,role='teacher',active=true,display_name=excluded.display_name,email=excluded.email;
 update public.school_invitations set status='accepted' where id=p_id;
 insert into public.portal_events(school_id,actor_id,action,target_id) values(sid,auth.uid(),'teacher.joined',auth.uid());
 return sid;
end; $$;

create function public.manage_school_member(p_school uuid,p_target uuid,p_action text) returns void
language plpgsql security definer set search_path='' as $$
declare target public.school_memberships%rowtype;
begin
 if not (public.school_member(p_school,true) or public.has_admin_role('admin')) then raise exception 'forbidden' using errcode='42501'; end if;
 perform 1 from public.schools where id=p_school for update;
 if p_action='revoke_invite' then
   update public.school_invitations set status='revoked' where id=p_target and school_id=p_school and status='pending';
 else
   select * into target from public.school_memberships where user_id=p_target and school_id=p_school and active for update;
   if not found then raise exception 'member_missing' using errcode='P0002'; end if;
   if p_action='remove' and (target.role='teacher' or public.has_admin_role('admin')) then
     update public.school_memberships set active=false where user_id=p_target;
   elsif p_action='transfer_owner' and public.has_admin_role('admin') and target.role='teacher' then
     update public.school_memberships set role='teacher' where school_id=p_school and role='owner' and active;
     update public.school_memberships set role='owner' where user_id=p_target;
   else raise exception 'invalid_action' using errcode='42501'; end if;
 end if;
 insert into public.portal_events(school_id,actor_id,action,target_id) values(p_school,auth.uid(),'member.'||p_action,p_target);
end; $$;

-- Only the server may commit normalized image uploads, after identity verification.
create function public.save_teacher_submission(p_user uuid,p_school uuid,p_campaign uuid,p_id uuid,p_path text,p_hash text,p_key text,p_count integer,p_date date,p_note text,p_revision uuid default null,p_version integer default null)
returns table(public_reference uuid,duplicate boolean)
language plpgsql security definer set search_path='' as $$
declare m public.school_memberships%rowtype; prior public.submissions%rowtype; existing public.submissions%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_key,0));
 select * into m from public.school_memberships where user_id=p_user and school_id=p_school and active for share;
 if not found or not exists(select 1 from public.schools where id=p_school and active) then raise exception 'forbidden' using errcode='42501'; end if;
 select * into existing from public.submissions where idempotency_key_hash=p_key;
 if found then
   if existing.submitted_by<>p_user or existing.school_id<>p_school or existing.submitted_bottle_count<>p_count or existing.receipt_image_sha256<>p_hash or existing.returned_on<>p_date or coalesce(existing.teacher_note,'')<>coalesce(p_note,'') or (p_revision is not null and existing.id<>p_revision) then raise exception 'idempotency_conflict' using errcode='40001'; end if;
   return query select existing.public_reference,true; return;
 end if;
 if not exists(select 1 from public.campaign_schools cs join public.campaigns c on c.id=cs.campaign_id where cs.school_id=p_school and cs.campaign_id=p_campaign and cs.active and c.active and (now() at time zone 'Europe/Budapest')::date between c.start_date and c.end_date) then raise exception 'inactive_campaign' using errcode='55000'; end if;
 if p_count is null or p_count not between 1 and 100000 or p_date is null or p_date>(now() at time zone 'Europe/Budapest')::date or p_date<date '2024-01-01' or length(coalesce(p_note,''))>500 or (p_count<50 and length(btrim(coalesce(p_note,'')))<5) then raise exception 'invalid_details' using errcode='22023'; end if;
 if p_path<>p_campaign::text||'/'||p_id::text||'/'||split_part(p_path,'/',3) then raise exception 'invalid_path' using errcode='22023'; end if;
 if p_revision is null then
   insert into public.submissions(id,school_id,campaign_id,receipt_image_path,receipt_image_sha256,idempotency_key_hash,submitted_by,submitted_bottle_count,returned_on,teacher_note)
   values(p_id,p_school,p_campaign,p_path,p_hash,p_key,p_user,p_count,p_date,nullif(btrim(p_note),'')) returning * into prior;
 else
   select * into prior from public.submissions where id=p_revision and school_id=p_school and campaign_id=p_campaign for update;
   if not found or prior.status<>'needs_review' or prior.version<>p_version then raise exception 'stale' using errcode='40001'; end if;
   insert into public.submission_revisions(submission_id,actor_id,receipt_image_path,bottle_count,returned_on,teacher_note,version) values(prior.id,p_user,prior.receipt_image_path,prior.submitted_bottle_count,prior.returned_on,prior.teacher_note,prior.version);
   update public.submissions set receipt_image_path=p_path,receipt_image_sha256=p_hash,idempotency_key_hash=p_key,submitted_by=p_user,submitted_bottle_count=p_count,returned_on=p_date,teacher_note=nullif(btrim(p_note),''),status='pending',feedback=null,version=version+1 where id=p_revision returning * into prior;
 end if;
 insert into public.portal_events(school_id,actor_id,action,target_id) values(p_school,p_user,case when p_revision is null then 'submission.created' else 'submission.resubmitted' end,prior.id);
 if exists(select 1 from public.submissions where receipt_image_sha256=p_hash and id<>prior.id) then
   insert into public.submission_flags(submission_id,type,severity,score,details) values(prior.id,'exact_image_hash',4,80,'{"message":"Korábban már beküldött kép"}');
 end if;
 return query select prior.public_reference,false;
end; $$;

create function public.claim_email_batch() returns setof public.email_outbox
language sql security definer set search_path='' as $$
 update public.email_outbox set status='sending',locked_at=now(),attempts=attempts+1 where id in (
 select id from public.email_outbox where (status in ('pending','failed') or (status='sending' and locked_at<now()-interval '5 minutes')) and attempts<5
 order by created_at for update skip locked limit 5) returning *;
$$;

revoke all on function public.school_member(uuid,boolean), public.verified_school_email(),public.apply_for_school(uuid,text,text,text,text),public.decide_school_application(uuid,integer,text,text,uuid),public.invite_school_teacher(uuid,text),public.accept_school_invitation(uuid,text),public.manage_school_member(uuid,uuid,text),public.save_teacher_submission(uuid,uuid,uuid,uuid,text,text,text,integer,date,text,uuid,integer),public.claim_email_batch() from public;
grant execute on function public.school_member(uuid,boolean),public.verified_school_email(),public.apply_for_school(uuid,text,text,text,text),public.decide_school_application(uuid,integer,text,text,uuid),public.invite_school_teacher(uuid,text),public.accept_school_invitation(uuid,text),public.manage_school_member(uuid,uuid,text) to authenticated;
grant execute on function public.save_teacher_submission(uuid,uuid,uuid,uuid,text,text,text,integer,date,text,uuid,integer),public.claim_email_batch() to service_role;

alter table public.submission_reviews drop constraint submission_reviews_changed_status;
create or replace function public.review_submission(
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

  if requested_status not in ('approved', 'rejected', 'needs_review')
    or (current_submission.status in ('approved','rejected') and not public.has_admin_role('admin'))
    or (current_submission.status = requested_status and not public.has_admin_role('admin'))
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

  if (requested_status in ('rejected','needs_review') or current_submission.status in ('approved','rejected') or (requested_status='approved' and current_submission.submitted_bottle_count is not null and current_submission.submitted_bottle_count<>requested_approved_bottle_count)) and normalized_reason is null then
    raise exception 'rejection reason is required' using errcode = '22023';
  end if;

  if requested_status='approved' and requested_approved_amount <> requested_approved_bottle_count::bigint * 50 then raise exception 'amount_count_mismatch' using errcode='22023'; end if;

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
    feedback = normalized_reason,
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

  if current_submission.submitted_by is not null then
    insert into public.email_outbox(recipient,subject,body,link_path)
    select email,case when requested_status='approved' then 'Jóváhagytuk a gyűjtéseteket!' when requested_status='needs_review' then 'Javítást kérünk a beküldéshez' else 'Döntés a beküldésről' end,
    case when requested_status='approved' then requested_approved_bottle_count::text||' palackot jóváírtunk az iskolának. Köszönjük!' else normalized_reason end,
    '/tanar/bekuldesek/'||current_submission.id from auth.users where id=current_submission.submitted_by;
  end if;
  insert into public.portal_events(school_id,actor_id,action,target_id,detail) values(current_submission.school_id,auth.uid(),'submission.'||requested_status,current_submission.id,jsonb_build_object('reason',normalized_reason,'bottles',requested_approved_bottle_count,'previous_bottles',current_submission.approved_bottle_count));
  return next;
end;
$$;


create function public.invited_school_name(p_invitation uuid) returns text language sql stable security definer set search_path='' as $$
 select s.name from public.school_invitations i join public.schools s on s.id=i.school_id where i.id=p_invitation and i.email=public.verified_school_email() and i.status='pending' and i.expires_at>now();
$$;
create function public.school_portal_summary(p_school uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare total bigint; pending bigint; changes bigint; ranking bigint; campaign uuid;
begin
 if not(public.school_member(p_school) or public.has_admin_role('reviewer')) then raise exception 'forbidden' using errcode='42501'; end if;
 select id into campaign from public.campaigns where active;
 select coalesce(sum(approved_bottle_count) filter(where status='approved'),0),coalesce(sum(submitted_bottle_count) filter(where status='pending'),0),count(*) filter(where status='needs_review') into total,pending,changes from public.submissions where school_id=p_school and campaign_id=campaign;
 select national_rank into ranking from public.campaign_leaderboard(campaign) where school_id=p_school;
 return jsonb_build_object('approved',total,'pending',pending,'changes',changes,'rank',ranking,'milestone',(floor(total/500.0)+1)*500);
end; $$;
revoke all on function public.invited_school_name(uuid),public.school_portal_summary(uuid) from public;
grant execute on function public.invited_school_name(uuid),public.school_portal_summary(uuid) to authenticated;

create function public.admin_school_cards(p_ids uuid[]) returns table(school_id uuid,owner_name text,owner_email text,teacher_count bigint,approved bigint,pending_count bigint,pending_bottles bigint)
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.has_admin_role('admin') then raise exception 'forbidden' using errcode='42501'; end if;
 if cardinality(p_ids)>100 then raise exception 'too_many_ids' using errcode='22023'; end if;
 return query select s.id,m.display_name,m.email,
 (select count(*) from public.school_memberships mm where mm.school_id=s.id and mm.active and mm.role='teacher'),
 coalesce((select sum(ss.approved_bottle_count) from public.submissions ss where ss.school_id=s.id and ss.status='approved'),0)::bigint,
 (select count(*) from public.submissions ss where ss.school_id=s.id and ss.status in ('pending','needs_review')),
 coalesce((select sum(ss.submitted_bottle_count) from public.submissions ss where ss.school_id=s.id and ss.status in ('pending','needs_review')),0)::bigint
 from public.schools s left join public.school_memberships m on m.school_id=s.id and m.role='owner' and m.active where s.id=any(p_ids);
end; $$;
revoke all on function public.admin_school_cards(uuid[]) from public;
grant execute on function public.admin_school_cards(uuid[]) to authenticated;

create function public.audit_school_portal_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is not null and (tg_op='INSERT' or row(new.name,new.city,new.county,new.postal_code,new.address,new.active) is distinct from row(old.name,old.city,old.county,old.postal_code,old.address,old.active)) then
 insert into public.portal_events(school_id,actor_id,action,target_id,detail) values(new.id,auth.uid(),'school.data_changed',new.id,jsonb_build_object('name',new.name,'city',new.city,'active',new.active));
 end if;
 return new;
end; $$;
create trigger school_portal_audit after insert or update on public.schools for each row execute function public.audit_school_portal_change();
revoke all on function public.audit_school_portal_change() from public;

create function public.update_school_contact(p_user uuid,p_name text) returns void language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if not public.has_admin_role('admin') then raise exception 'forbidden' using errcode='42501'; end if;
 if length(btrim(p_name)) not between 2 and 120 then raise exception 'invalid_name' using errcode='22023'; end if;
 update public.school_memberships set display_name=btrim(p_name) where user_id=p_user returning school_id into sid;
 if sid is null then raise exception 'missing_member' using errcode='P0002'; end if;
 insert into public.portal_events(school_id,actor_id,action,target_id,detail) values(sid,auth.uid(),'contact.updated',p_user,jsonb_build_object('name',p_name));
end; $$;
revoke all on function public.update_school_contact(uuid,text) from public;
grant execute on function public.update_school_contact(uuid,text) to authenticated;
