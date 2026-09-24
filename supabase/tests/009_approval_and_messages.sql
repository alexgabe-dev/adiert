begin;
insert into public.schools(id,name,slug,type,city,county) values('93000000-0000-4000-8000-000000000001','Approval test','approval-test','primary_school','Budapest','Budapest');
insert into auth.users(id,email,raw_user_meta_data) values('94000000-0000-4000-8000-000000000001','approval@test.invalid','{"school_registration":{"school_id":"93000000-0000-4000-8000-000000000001","postal_code":"1111","contact_name":"Approval Teacher"}}');
do $$ begin
 if not exists(select 1 from public.school_applications where user_id='94000000-0000-4000-8000-000000000001' and status='pending') then raise exception 'pending application missing'; end if;
 if not exists(select 1 from public.email_outbox where target_user_id='94000000-0000-4000-8000-000000000001' and kind='registration_received') then raise exception 'receipt missing'; end if;
 if exists(select 1 from public.email_outbox where target_user_id='94000000-0000-4000-8000-000000000001' and kind='activation') then raise exception 'early activation'; end if;
end; $$;
insert into public.teacher_activations(mail_id,token_hash,user_id)
 select id,repeat('a',64),target_user_id from public.email_outbox where target_user_id='94000000-0000-4000-8000-000000000001';
do $$ begin
 if public.consume_teacher_activation(repeat('a',64)) is not null then raise exception 'pending activation allowed'; end if;
end; $$;
set role authenticated;
set request.jwt.claim.sub='94000000-0000-4000-8000-000000000001';
do $$ begin
 begin perform public.send_teacher_message('95000000-0000-4000-8000-000000000001',array[auth.uid()],'Test subject','Test message body');raise exception 'teacher can send admin messages';exception when insufficient_privilege then null;end;
 begin perform public.consume_teacher_activation(repeat('a',64));raise exception 'teacher can redeem directly';exception when insufficient_privilege then null;end;
end; $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.decide_school_application((select id from public.school_applications where user_id='94000000-0000-4000-8000-000000000001'),1,'approved');
select public.send_teacher_message('95000000-0000-4000-8000-000000000001',array['94000000-0000-4000-8000-000000000001'::uuid],'Test subject','Test message body');
select public.send_teacher_message('95000000-0000-4000-8000-000000000001',array['94000000-0000-4000-8000-000000000001'::uuid],'Test subject','Test message body');
reset role;
do $$ begin
 if (select count(*) from public.email_outbox where message_id='95000000-0000-4000-8000-000000000001')<>1 then raise exception 'message duplicated';end if;
 if (select email_confirmed_at from auth.users where id='94000000-0000-4000-8000-000000000001') is not null then raise exception 'approval confirmed email';end if;
 if public.consume_teacher_activation(repeat('a',64))<>'94000000-0000-4000-8000-000000000001'::uuid then raise exception 'approved activation failed';end if;
 if public.consume_teacher_activation(repeat('a',64)) is not null then raise exception 'token replay allowed';end if;
end; $$;
insert into public.teacher_activations(mail_id,token_hash,user_id,expires_at)
 select id,repeat('b',64),target_user_id,now()-interval '1 day' from public.email_outbox where target_user_id='94000000-0000-4000-8000-000000000001' and kind='activation';
do $$ begin
 if public.consume_teacher_activation(repeat('b',64)) is not null then raise exception 'expired token accepted';end if;
end; $$;
rollback;
