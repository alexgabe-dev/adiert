# Supabase environment and administrator setup

Phase 2 uses Supabase Auth, PostgreSQL, and private Storage. Local, staging, and production must
use separate Supabase projects and separate credentials. Never reuse a production service-role key
outside the production server environment.

## Environment bindings

Configure these variables in each deployment environment:

- `NEXT_PUBLIC_SITE_URL`: canonical HTTPS application origin.
- `NEXT_PUBLIC_SUPABASE_URL`: environment-specific Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: environment-specific public anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only environment-specific service-role key.

Only the first three values may be referenced by browser code. `SUPABASE_SERVICE_ROLE_KEY` is
loaded only from a module guarded by `server-only`; the production build also scans browser assets
and fails if the key or its variable name appears there.

## Reproducible migration

With Docker/Supabase CLI available, run `supabase db reset` against the local project. In the
repository quality gate, `npm run test:db` creates an isolated PostgreSQL database, bootstraps the
Supabase-owned `auth` and `storage` interfaces, applies every migration from scratch, executes the
database/RLS/Storage tests, and deletes the database.

Never run the test harness against a remote host. It rejects non-loopback database URLs.

## Invite-only authentication

Supabase local configuration disables public signup and anonymous sign-in. Apply the equivalent
settings in the staging and production dashboards. Administrators must be invited/provisioned in
Supabase Auth and then assigned a database role in `public.administrators`.

Bootstrap the first `super_admin` in a controlled SQL migration or dashboard session after the
corresponding Auth user exists:

```sql
insert into public.administrators (user_id, role)
values ('AUTH-USER-UUID', 'super_admin');
```

Do not put real Auth user IDs or administrator email addresses in repository migrations or seed
data. Later administrator lifecycle changes must be performed by an active `super_admin` through a
server-authorized operation.

## Development fixtures

`supabase/seed.sql` contains visibly fictional local fixtures. Automatic seeding is disabled. The
file refuses to execute unless the database session explicitly sets
`adiert.allow_fixtures=on`. Never set that guard in staging or production.
