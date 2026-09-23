# Supabase environment and administrator setup

Phase 2 uses Supabase Auth, PostgreSQL, and private Storage. Local, staging, and production must
use separate Supabase projects and separate credentials. Never reuse a production service-role key
outside the production server environment.

## Environment bindings

Configure these variables in each deployment environment:

- `SITE_URL`: optional canonical HTTPS application origin; Vercel can derive this automatically.
- `SUPABASE_URL`: server-only environment-specific Supabase project URL.
- `SUPABASE_ANON_KEY`: server-only anon key used by SSR and authentication routes.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only environment-specific service-role key.
- `SUBMISSION_RATE_LIMIT_SECRET`: server-only HMAC secret of at least 32 random characters.

For existing Vercel configurations, the server also accepts `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` when their unprefixed counterparts are absent. Explicit server
values take precedence. Never use a service-role key as the anon key or in a `NEXT_PUBLIC_*` variable.

Vercel environment changes apply to new deployments: redeploy after adding a missing variable.
React error #441 hides the underlying Server Component exception in production; inspect Vercel
runtime logs for the actual cause. For example, `Invalid server Supabase configuration` followed by
`SUPABASE_ANON_KEY` means the deployment has no valid anon-key binding, not a client rendering bug.

No environment binding is referenced by browser code. Supabase configuration is loaded only from
server modules; the production build scans browser assets and fails if a Supabase variable name or
configured value appears there.

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
