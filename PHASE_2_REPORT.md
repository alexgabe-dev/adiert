# Ádiért Phase 2 report

Date: 2026-09-02

## PHASE 2 COMPLETE

The repository satisfies the Phase 2 — Supabase Foundation exit criteria in
`IMPLEMENTATION_PLAN.md`. Reproducible migrations, constrained schema, RLS, private receipt
Storage, invite-only administrator authentication, server-side `/admin` authorization, guarded
development fixtures, and executable database/policy tests are present. No Phase 3 receipt backend,
review mutation, OCR, or fraud-processing workflow was implemented.

## State found

- The worktree was clean on `main` at `b705131` when this continuation began.
- `PHASE_1_REPORT.md` marked Phase 1 complete and explicitly stated that Supabase, authentication,
  migrations, and an admin backend had not been added.
- No `PHASE_2_REPORT.md`, `supabase/` directory, Supabase dependency, environment binding, or auth
  integration existed.
- Every `/admin` page returned the reserved 404 state.
- The latest commit message was `fix: phase2`, but its diff contained Phase 1 completion work only;
  Phase 2 completeness was determined from repository content rather than the commit label.
- No linked Supabase project or local environment credentials were present. Project secrets remain
  intentionally uncommitted.

## Supabase foundation implemented

- Added Supabase CLI configuration for PostgreSQL 17, Auth, private Storage, migrations, and
  disabled-by-default seed loading.
- Added one ordered foundation migration covering the planned enums, schools, campaigns,
  campaign participation, administrators, submissions, submission flags, append-only reviews, and
  news.
- Added foreign keys, money/count/date/status constraints, UUID identifiers, update triggers,
  optimistic versioning, duplicate-analysis indexes, one-active-campaign enforcement, active
  campaign/school submission validation, and an approved-identifier uniqueness rule.
- Added fixed-search-path `security definer` role helpers backed by `public.administrators`, not
  user-editable JWT metadata.
- Enabled RLS on every application table and explicitly on Supabase Storage metadata.
- Added least-privilege policies for public, authenticated non-admin, reviewer, admin, and
  super-admin behavior. Raw submission writes remain server/service-only pending the Phase 3
  endpoint and transactional review function.
- Created the private `receipt-images` bucket with a 10 MiB limit and JPEG/PNG/WebP allowlist. No
  anonymous or authenticated direct object policy exists; later short-lived signed reads must be
  created by an authorized server operation.
- Added public-safe aggregate functions whose immutable base predicate is `status = 'approved'` and
  whose values come only from `approved_amount` and `approved_bottle_count`.
- Added visibly fictional local fixtures. Automatic seeding is disabled, and the seed script fails
  unless the session explicitly enables `adiert.allow_fixtures`.

## Authentication and `/admin`

- Added Supabase SSR clients for browser, server-cookie, and privileged server-only contexts.
- Added a fail-closed environment boundary. The service-role key is imported only behind
  `server-only` and is never available from the browser client helper.
- Added invite-only passwordless sign-in with `shouldCreateUser: false`, a PKCE callback, generic
  responses that do not reveal whether an email is invited, and session refresh through the Next.js
  proxy.
- Added a protected route group for all `/admin` application pages. Its server layout calls
  Supabase Auth and then requires a matching active `administrators` record on every request.
- Added server-side role gates: reviewers can enter submission shells, admins can additionally enter
  school shells, and super-admin is reserved for administrator lifecycle authority at the policy
  layer.
- Inactive or missing administrator records fail closed and cannot render the protected shell.
- The admin pages remain foundation placeholders; queue/review and school operations were not
  implemented early.

## Executable security verification

`npm run test:db` creates an isolated disposable PostgreSQL cluster/database, bootstraps only the
Supabase-owned Auth/Storage interfaces required by the migration, applies all migrations in sorted
order from scratch, runs the SQL security suites, verifies that fixtures fail closed, and removes
the test database.

| Required invariant                                 | Verified result                                                                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Migrations are reproducible                        | Pass — every test run applies all migrations to a new empty database                                                       |
| RLS is enabled where required                      | Pass — catalog assertions cover all eight application tables; Storage RLS is explicit                                      |
| Anonymous users cannot access raw submissions      | Pass — direct select/insert is privilege-denied                                                                            |
| Anonymous users cannot access receipt paths/images | Pass — private bucket and object metadata return no rows                                                                   |
| Anonymous users cannot access admin/review data    | Pass — administrators, flags, and review audit are privilege-denied                                                        |
| Authenticated non-admins cannot escalate           | Pass — role helpers are false; administrator update/insert cannot pass RLS                                                 |
| Reviewer permissions                               | Pass — private review data is readable; school/admin/direct-review mutations are denied                                    |
| Admin permissions                                  | Pass — reviewer abilities and school management are allowed; super-admin escalation is denied                              |
| Super-admin permissions                            | Pass — administrator lifecycle rows are visible and manageable                                                             |
| Inactive administrator access                      | Pass — RLS helpers, application authorization tests, and protected layout all fail closed                                  |
| `/admin` is protected server-side                  | Pass — an unauthenticated production request cannot render protected shell content and receives the server redirect target |
| Service role stays out of client bundle            | Pass — production build uses a sentinel and scans every `.next/static` asset                                               |
| Receipt Storage is private                         | Pass — bucket flag, size, MIME allowlist, no direct client policies, and service-only access tested                        |
| Aggregates ignore non-approved rows                | Pass — pending, rejected, and needs-review rows containing large approved-looking values do not affect totals/rank         |
| Aggregates use approved fields                     | Pass — exact expected sums assert `approved_amount` and `approved_bottle_count` behavior                                   |
| Fixtures cannot become production data silently    | Pass — automatic seed disabled and unguarded execution is an expected test failure                                         |

## Quality gate

| Check                     | Result                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Formatting                | Pass — `npm run format:check`                                                      |
| TypeScript                | Pass — `npm run typecheck`                                                         |
| ESLint                    | Pass — `npm run lint`, zero warnings                                               |
| Application tests         | Pass — 3 files, 8 tests                                                            |
| Database tests            | Pass — fresh migration plus schema/constraint assertions                           |
| RLS and role policy tests | Pass — anon, non-admin, reviewer, admin, super-admin, inactive-admin, service role |
| Storage security tests    | Pass — bucket configuration, metadata isolation, service-only visibility           |
| Production build          | Pass — all expected routes compiled; client secret scan passed                     |

The CI quality gate now starts an isolated PostgreSQL 17 service and runs the same complete
`npm run check` command.

## Scope intentionally left for later phases

- No public receipt submission endpoint, upload normalization, rate limiting, or pending-record
  creation was added.
- No review transaction, approval/rejection mutation, signed receipt read endpoint, or audit-writing
  application flow was added.
- No OCR provider, queue, worker, detected-field processing, hash calculation, or fraud scoring was
  added.
- Public mock campaign/leaderboard/news data remains unchanged for Phase 4 replacement. The new
  approved-only aggregate functions are schema/security foundations only and are not wired into the
  frontend.
- The public visual design and component structure were not redesigned.
