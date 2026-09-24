-- Application intake and receipts are atomic with Auth account creation.
alter table public.email_outbox add column kind text not null default 'notification'
  check(kind in ('notification','registration_received','activation','admin_message'));
alter table public.email_outbox add column target_user_id uuid references auth.users(id);
create table public.teacher_activations (
 mail_id uuid primary key references public.email_outbox(id) on delete cascade,
 token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
 user_id uuid not null references auth.users(id) on delete cascade,
 used_at timestamptz,
 expires_at timestamptz not null default now()+interval '7 days'
);
alter table public.teacher_activations enable row level security;
revoke all on public.teacher_activations from anon,authenticated;
grant all on public.teacher_activations to service_role;

create or replace function public.create_signup_school_application() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  details jsonb := new.raw_user_meta_data -> 'school_registration';
  school public.schools%rowtype;
begin
  if details is null then return new; end if;
  if tg_op = 'UPDATE' then
    if old.email_confirmed_at is not null or exists(select 1 from public.email_outbox where target_user_id=new.id and kind in ('activation','registration_received')) then return new; end if;
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
        and status='pending' and expires_at>now()) then
    insert into public.email_outbox(recipient,subject,body,link_path,kind,target_user_id)
    values(lower(new.email),'Erősítsd meg a tanári fiókodat','Az iskolád meghívott a csapatába. Erősítsd meg az e-mail-címedet, majd fogadd el a meghívást a tanári felületen.','/tanar/meghivasok','activation',new.id);
    return new;
  end if;
  insert into public.school_applications(user_id,school_id,school_name,city,postal_code,contact_name,email)
  values(new.id,school.id,school.name,school.city,details->>'postal_code',btrim(details->>'contact_name'),lower(new.email));
  insert into public.email_outbox(recipient,subject,body,link_path,kind,target_user_id)
  values(lower(new.email),'Megkaptuk a jelentkezésedet — Palackverseny',
    'Köszönjük a regisztrációdat! A szervezők rövidesen ellenőrzik a jelentkezésedet. Most nincs további teendőd. Az elfogadásról külön e-mailt küldünk: abban találod majd a fiókod megerősítéséhez és a belépéshez szükséges linket.',
    '/tanar/belepes','registration_received',new.id);
  return new;
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
 insert into public.email_outbox(recipient,subject,body,link_path,kind,target_user_id) values(a.email,
 case when p_status='approved' then 'Elfogadtuk az iskolai regisztrációdat!' when p_status='needs_changes' then 'Pontosítást kérünk az iskolai regisztrációhoz' else 'Döntés az iskolai regisztrációról' end,
 case when p_status='approved' then coalesce(cname,a.school_name)||' iskolai jelentkezését elfogadtuk. Erősítsd meg a regisztrációdat az alábbi gombbal. Ezzel az e-mail-címedet is megerősíted, és megnyílik a tanári felület.' else coalesce(p_reason,'') || E'\n\nHa pontosításra van szükség, írj az info@palackverseny.hu címre a regisztrációnál használt e-mail-címedről.' end,'/tanar',case when p_status='approved' then 'activation' else 'notification' end,a.user_id);
 perform public.write_admin_audit('school.application_'||p_status,'school',sid,coalesce(cname,a.school_name),jsonb_build_object('application_id',p_id,'reason',p_reason));
 insert into public.portal_events(school_id,actor_id,action,target_id,detail) values(sid,auth.uid(),'application.'||p_status,p_id,jsonb_build_object('reason',p_reason));
 return sid;
end; $$;


-- Only the service may redeem a token, and only while access is still approved.
create function public.consume_teacher_activation(p_hash text) returns uuid
language plpgsql security definer set search_path='' as $$
declare t public.teacher_activations%rowtype;
begin
 select * into t from public.teacher_activations where token_hash=p_hash for update;
 if not found or t.used_at is not null or t.expires_at<=now() then return null; end if;
 if not exists(select 1 from public.school_memberships m join public.schools s on s.id=m.school_id
   where m.user_id=t.user_id and m.active and s.active)
   and not exists(select 1 from public.school_invitations i join auth.users u on lower(u.email)=i.email
     join public.schools s on s.id=i.school_id where u.id=t.user_id and i.status='pending' and i.expires_at>now() and s.active)
 then return null; end if;
 update public.teacher_activations set used_at=now() where mail_id=t.mail_id;
 return t.user_id;
end; $$;
revoke all on function public.consume_teacher_activation(text) from public,anon,authenticated;
grant execute on function public.consume_teacher_activation(text) to service_role;

create table public.admin_messages (
 id uuid primary key,
 author_id uuid not null references auth.users(id),
 subject text not null check(length(btrim(subject)) between 3 and 160),
 body text not null check(length(btrim(body)) between 10 and 5000),
 created_at timestamptz not null default now()
);
alter table public.admin_messages enable row level security;
revoke all on public.admin_messages from anon,authenticated;
grant select on public.admin_messages to authenticated;
grant all on public.admin_messages to service_role;
create policy admin_messages_read on public.admin_messages for select to authenticated using(public.has_admin_role('admin'));
alter table public.email_outbox add column message_id uuid references public.admin_messages(id);
create unique index email_message_recipient on public.email_outbox(message_id,target_user_id) where message_id is not null;
create function public.send_teacher_message(p_id uuid,p_users uuid[],p_subject text,p_body text) returns integer
language plpgsql security definer set search_path='' as $$
declare amount integer; prior public.admin_messages%rowtype;
begin
 if not public.has_admin_role('admin') then raise exception 'forbidden' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_id::text,0));
 select * into prior from public.admin_messages where id=p_id;
 if found then
   if prior.author_id<>auth.uid() or prior.subject<>btrim(p_subject) or prior.body<>btrim(p_body) then raise exception 'stale' using errcode='40001'; end if;
   return (select count(*)::integer from public.email_outbox where message_id=p_id);
 end if;
 if coalesce(cardinality(p_users),0) not between 1 and 50 then raise exception 'invalid_recipients' using errcode='22023'; end if;
 if exists(select 1 from unnest(p_users) u where not exists(select 1 from public.school_memberships m join public.schools s on s.id=m.school_id where m.user_id=u and m.active and s.active)) then raise exception 'invalid_recipients' using errcode='22023'; end if;
 insert into public.admin_messages values(p_id,auth.uid(),btrim(p_subject),btrim(p_body),now());
 insert into public.email_outbox(recipient,subject,body,link_path,kind,target_user_id,message_id)
 select m.email,btrim(p_subject),btrim(p_body),'/tanar','admin_message',m.user_id,p_id from public.school_memberships m where m.user_id=any(p_users);
 get diagnostics amount=row_count;
 perform public.write_admin_audit('teacher.message_sent','administrator',auth.uid(),p_subject,jsonb_build_object('message_id',p_id,'recipients',amount));
 return amount;
end; $$;
revoke all on function public.send_teacher_message(uuid,uuid[],text,text) from public,anon;
grant execute on function public.send_teacher_message(uuid,uuid[],text,text) to authenticated;
