begin;
insert into public.schools(id,name,slug,type,city,county,import_key) values
('91000000-0000-4000-8000-000000000001','Imported registration school','registration-imported','other','Budapest','Budapest','registration-test-import');
insert into auth.users(id,email,raw_user_meta_data) values
('92000000-0000-4000-8000-000000000001','signup-registration@test.invalid',
'{"school_registration":{"school_id":"91000000-0000-4000-8000-000000000001","school_name":"Spoofed name","city":"Spoofed city","postal_code":"1111","contact_name":"Teacher Contact","status":"approved"}}');
do $$ begin
 if not exists(select 1 from public.school_applications where user_id='92000000-0000-4000-8000-000000000001' and status='pending') then raise exception 'unverified signup was not submitted for review';end if;
end; $$;
update auth.users set email_confirmed_at=now() where id='92000000-0000-4000-8000-000000000001';
do $$ begin
 if not exists(select 1 from public.school_applications where user_id='92000000-0000-4000-8000-000000000001' and status='pending' and school_name='Imported registration school' and city='Budapest') then raise exception 'verified signup did not create canonical pending application';end if;
 if exists(select 1 from public.school_memberships where user_id='92000000-0000-4000-8000-000000000001') then raise exception 'signup granted membership';end if;
end; $$;
-- Repeated confirmation must neither duplicate nor reset a reviewed application.
update auth.users set email_confirmed_at=now() where id='92000000-0000-4000-8000-000000000001';
set role authenticated;
set request.jwt.claim.sub='92000000-0000-4000-8000-000000000001';
do $$ begin
 begin perform public.decide_school_application((select id from public.school_applications where user_id=auth.uid()),1,'approved');raise exception 'self approval permitted';exception when insufficient_privilege then null;end;
 if public.school_member('91000000-0000-4000-8000-000000000001') then raise exception 'pending signup can access school';end if;
end; $$;
set request.jwt.claim.sub='00000000-0000-4000-8000-000000000003';
select public.decide_school_application((select id from public.school_applications where user_id='92000000-0000-4000-8000-000000000001'),1,'approved');
set request.jwt.claim.sub='92000000-0000-4000-8000-000000000001';
do $$ begin
 if not public.school_member('91000000-0000-4000-8000-000000000001') then raise exception 'admin approval did not activate imported school membership';end if;
end; $$;
reset role;
update auth.users set email_confirmed_at=now() where id='92000000-0000-4000-8000-000000000001';
do $$ begin
 if (select status from public.school_applications where user_id='92000000-0000-4000-8000-000000000001') <> 'approved' then raise exception 'confirmation reset approval';end if;
end; $$;
rollback;
