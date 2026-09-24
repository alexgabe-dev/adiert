-- New messages must not be blocked behind retries of old provider failures.
create or replace function public.claim_email_batch() returns setof public.email_outbox
language sql security definer set search_path='' as $$
 update public.email_outbox set status='sending',locked_at=now(),attempts=attempts+1 where id in (
 select id from public.email_outbox
 where (status='pending' or (status='failed' and locked_at<now()-interval '5 minutes') or (status='sending' and locked_at<now()-interval '5 minutes')) and attempts<5
 order by case when status='pending' then 0 else 1 end,created_at for update skip locked limit 5
 ) returning *;
$$;

-- Bring valid earlier unconfirmed registrations into the review queue as well.
update auth.users u set email_confirmed_at=u.email_confirmed_at
where u.email_confirmed_at is null
 and u.raw_user_meta_data->'school_registration' is not null
 and not exists(select 1 from public.school_applications a where a.user_id=u.id)
 and not exists(select 1 from public.school_memberships m where m.user_id=u.id)
 and not exists(select 1 from public.email_outbox e where e.target_user_id=u.id);

create or replace function public.consume_teacher_activation(p_hash text) returns uuid
language plpgsql security definer set search_path='' as $$
declare t public.teacher_activations%rowtype;
begin
 select * into t from public.teacher_activations where token_hash=p_hash for update;
 if not found or t.used_at is not null or t.expires_at<=now() then return null; end if;
 if not exists(select 1 from auth.users u join public.email_outbox e on lower(u.email)=lower(e.recipient) where u.id=t.user_id and e.id=t.mail_id) then return null; end if;
 if not exists(select 1 from public.school_memberships m join public.schools s on s.id=m.school_id
   where m.user_id=t.user_id and m.active and s.active)
   and not exists(select 1 from public.school_invitations i join auth.users u on lower(u.email)=i.email
     join public.schools s on s.id=i.school_id where u.id=t.user_id and i.status='pending' and i.expires_at>now() and s.active)
 then return null; end if;
 update public.teacher_activations set used_at=now() where mail_id=t.mail_id;
 return t.user_id;
end; $$;
