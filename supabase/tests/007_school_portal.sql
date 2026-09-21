-- Real PostgreSQL integration coverage: RLS, workflow transitions, limits and totals.
begin;
update auth.users set email_confirmed_at=now() where id in ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003');
insert into auth.users(id,email,email_confirmed_at) values
 ('80000000-0000-4000-8000-000000000001','owner@school.test',now()),
 ('80000000-0000-4000-8000-000000000002','teacher@school.test',now()),
 ('80000000-0000-4000-8000-000000000003','outsider@school.test',now()),
 ('80000000-0000-4000-8000-000000000004','unconfirmed@school.test',null);
insert into public.schools(id,name,slug,type,city,county,postal_code) values
 ('81000000-0000-4000-8000-000000000001','Portal School','portal-school','primary_school','Budapest','Budapest','1000'),
 ('81000000-0000-4000-8000-000000000002','Other Portal School','other-portal-school','primary_school','Budapest','Budapest','1000');
set role authenticated;
set request.jwt.claim.sub='80000000-0000-4000-8000-000000000004';
do $$ begin
 begin perform public.apply_for_school('81000000-0000-4000-8000-000000000001','Portal School','Budapest','1000','Owner');raise exception 'unconfirmed accepted';exception when insufficient_privilege then null;end;
end; $$;
set request.jwt.claim.sub='80000000-0000-4000-8000-000000000001';
select public.apply_for_school('81000000-0000-4000-8000-000000000001','Portal School','Budapest','1000','School Owner');
do $$ begin
 if public.school_member('81000000-0000-4000-8000-000000000001') then raise exception 'pending applicant became member';end if;
 begin insert into public.school_memberships(user_id,school_id,role,display_name,email) values(auth.uid(),'81000000-0000-4000-8000-000000000001','owner','Owner','owner@school.test');raise exception 'direct membership insert allowed';exception when insufficient_privilege then null;end;
 begin perform public.decide_school_application((select id from public.school_applications where user_id=auth.uid()),1,'approved');raise exception 'self approval allowed';exception when insufficient_privilege then null;end;
end; $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.decide_school_application((select id from public.school_applications where user_id='80000000-0000-4000-8000-000000000001'),1,'approved');
do $$ begin
 if not exists(select 1 from public.email_outbox where recipient='owner@school.test' and status='pending') then raise exception 'approval email not queued';end if;
end; $$;
set request.jwt.claim.sub='80000000-0000-4000-8000-000000000001';
select public.invite_school_teacher('81000000-0000-4000-8000-000000000001','teacher@school.test');
do $$ begin
 for i in 1..9 loop perform public.invite_school_teacher('81000000-0000-4000-8000-000000000001','seat'||i||'@school.test');end loop;
 begin perform public.invite_school_teacher('81000000-0000-4000-8000-000000000001','eleventh@school.test');raise exception 'seat limit not enforced';exception when check_violation then null;end;
end; $$;
set request.jwt.claim.sub='80000000-0000-4000-8000-000000000002';
select public.accept_school_invitation((select id from public.school_invitations where email='teacher@school.test'),'Teacher');
do $$ begin
 if not public.school_member('81000000-0000-4000-8000-000000000001') then raise exception 'invitation did not activate membership';end if;
 begin perform public.invite_school_teacher('81000000-0000-4000-8000-000000000001','forged@school.test');raise exception 'teacher invited a colleague';exception when insufficient_privilege then null;end;
 begin perform public.manage_school_member('81000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000002','transfer_owner');raise exception 'teacher became owner';exception when insufficient_privilege then null;end;
end; $$;
reset role;
-- A second school/member exists so isolation is checked against actual rows.
insert into public.school_memberships(user_id,school_id,role,display_name,email) values('80000000-0000-4000-8000-000000000003','81000000-0000-4000-8000-000000000002','owner','Other owner','outsider@school.test');
set role authenticated;
set request.jwt.claim.sub='80000000-0000-4000-8000-000000000003';
do $$ begin
 if exists(select 1 from public.school_memberships where school_id='81000000-0000-4000-8000-000000000001') then raise exception 'cross-school membership leak';end if;
 if exists(select 1 from public.school_applications where user_id='80000000-0000-4000-8000-000000000001') then raise exception 'cross-school application leak';end if;
 begin perform public.school_portal_summary('81000000-0000-4000-8000-000000000001');raise exception 'cross-school summary leak';exception when insufficient_privilege then null;end;
end; $$;
reset role;
-- Keep the campaign active independent of the date on which this test is run.
update public.campaigns set start_date=current_date-1,end_date=current_date+1 where id='20000000-0000-4000-8000-000000000001';
set role service_role;
select * from public.save_teacher_submission('80000000-0000-4000-8000-000000000002','81000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001/82000000-0000-4000-8000-000000000001/83000000-0000-4000-8000-000000000001.jpg',repeat('a',64),repeat('b',64),100,current_date,'');
do $$ declare result record;begin
 select * into result from public.save_teacher_submission('80000000-0000-4000-8000-000000000002','81000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001/82000000-0000-4000-8000-000000000001/83000000-0000-4000-8000-000000000002.jpg',repeat('a',64),repeat('b',64),100,current_date,'');
 if not result.duplicate then raise exception 'duplicate retry inserted twice';end if;
 begin perform public.save_teacher_submission('80000000-0000-4000-8000-000000000003','81000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',gen_random_uuid(),'unused',repeat('a',64),repeat('c',64),100,current_date,'');raise exception 'cross-school upload allowed';exception when insufficient_privilege then null;end;
end; $$;
reset role;
set role authenticated;
set request.jwt.claim.sub='80000000-0000-4000-8000-000000000003';
do $$ begin if exists(select 1 from public.submissions where id='82000000-0000-4000-8000-000000000001') then raise exception 'cross-school image path leaked';end if;end; $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$ begin
 begin perform public.review_submission('82000000-0000-4000-8000-000000000001',1,'needs_review');raise exception 'blank revision reason accepted';exception when invalid_parameter_value then null;end;
end; $$;
select public.review_submission('82000000-0000-4000-8000-000000000001',1,'needs_review',null,null,null,null,'Kérjük, tölts fel élesebb fotót.');
reset role;
set role service_role;
select * from public.save_teacher_submission('80000000-0000-4000-8000-000000000002','81000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','82000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001/82000000-0000-4000-8000-000000000001/83000000-0000-4000-8000-000000000003.jpg',repeat('d',64),repeat('e',64),100,current_date,'Élesebb fotó','82000000-0000-4000-8000-000000000001',2);
reset role;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
do $$ begin
 begin perform public.review_submission('82000000-0000-4000-8000-000000000001',1,'approved',5000,100);raise exception 'stale review accepted';exception when serialization_failure then null;end;
 begin perform public.review_submission('82000000-0000-4000-8000-000000000001',3,'approved',4500,90);raise exception 'unexplained count correction';exception when invalid_parameter_value then null;end;
end; $$;
select public.review_submission('82000000-0000-4000-8000-000000000001',3,'approved',5000,100);
do $$ begin
 begin perform public.review_submission('82000000-0000-4000-8000-000000000001',4,'approved',4500,90,null,null,'Correction');raise exception 'reviewer corrected final result';exception when object_not_in_prerequisite_state then null;end;
end; $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.review_submission('82000000-0000-4000-8000-000000000001',4,'approved',4500,90,null,null,'A kijelzőn 90 darab szerepel.');
set request.jwt.claim.sub='80000000-0000-4000-8000-000000000001';
do $$ declare summary jsonb;begin
 summary:=public.school_portal_summary('81000000-0000-4000-8000-000000000001');
 if (summary->>'approved')::int<>90 then raise exception 'corrected total is wrong: %',summary;end if;
 if (select count(*) from public.submission_revisions where submission_id='82000000-0000-4000-8000-000000000001')<>1 then raise exception 'revision history missing';end if;
 perform public.manage_school_member('81000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000002','remove');
end; $$;
set request.jwt.claim.sub='80000000-0000-4000-8000-000000000002';
do $$ begin if exists(select 1 from public.submissions where id='82000000-0000-4000-8000-000000000001') then raise exception 'removed teacher still has access';end if;end; $$;
reset role;
rollback;
