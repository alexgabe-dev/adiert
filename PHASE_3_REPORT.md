# Ádiért Phase 3 report

Date: 2026-09-02

## PHASE 3 COMPLETE

The repository satisfies the Phase 3 — Secure Receipt Submission MVP exit criteria in
`IMPLEMENTATION_PLAN.md`. A public user can submit one validated receipt for an active participating
school, receive an honest pending confirmation, and safely retry without creating another receipt.
An active reviewer can inspect the private submission through the protected admin workflow and
atomically approve, reject, or mark it for further review. Approved totals change only after a valid
review transaction.

No OCR provider, OCR worker, automatic fraud decision, public aggregate-data replacement, Phase 4
work, or visual redesign was added.

## State found

- Phase 2 was approved and complete at commit `a6a95b8` when this phase began.
- The Supabase foundation, private receipt bucket, role-backed admin authentication, protected admin
  route group, approved-only aggregate functions, and Phase 2 security suites were already present.
- There was no Phase 3 migration, receipt submission API, real public submission state, submission
  queue, review mutation, authorized receipt-image route, or `PHASE_3_REPORT.md`.
- The local checkout has no linked Supabase project credentials. Repository verification therefore
  uses the isolated PostgreSQL harness and HTTP/application integration tests; no remote environment
  or production data was changed.

## Public receipt submission

- Reused the existing public receipt modal and its established styling. Campaign and participating
  school choices now come from the active database configuration rather than mock labels.
- Removed the student-name and bottle-count submission fields. The browser sends only
  `campaign_id`, `school_id`, and `receipt`; the server rejects every additional form field,
  including status, approved values, detected values, or identity-like fields.
- Added a same-origin, Node-runtime multipart endpoint with strict UUID validation, content-length
  preflight, a 10 MiB image limit, and generic failure responses.
- Validates the actual file signature and exact declared MIME type for JPEG, PNG, and WebP, decodes
  with pixel/dimension/page limits, applies orientation, flattens transparency, and re-encodes to a
  metadata-free JPEG. Original filenames and EXIF data are not stored.
- Uses server-generated UUID object paths and stores a SHA-256 digest of the normalized image. The
  receipt remains in the private `receipt-images` bucket.
- Revalidates the campaign, campaign dates, school activity, and campaign participation immediately
  before upload. A stale or malicious client cannot submit for an inactive, future, ended, unknown,
  or non-participating selection.
- Creates only `pending` / `not_requested` submissions. Approved and detected values are explicitly
  null and cannot be supplied by the browser.
- Uploads the private object before inserting the database record and compensates for insert failure
  by retrying object removal. Concurrent idempotency races remove the losing object before returning
  the already-created public reference.
- Added a UUID idempotency contract backed by a unique HMAC hash. A retry returns the original public
  reference with HTTP 200 and does not upload another object.
- Added layered atomic limits for short-term IP, daily IP, short-term device, daily device, and a
  global minute ceiling. Only server-keyed HMAC digests are persisted; raw IP addresses and device
  tokens are not stored. The limiter fails closed when unavailable.
- The modal now has real loading, preview, submitting, pending-confirmation, failure, and retry states.
  Success copy says that the receipt is pending review and does not claim an immediate result change.
- Existing illustrative receipt values are visibly labelled as a sample manual-review flow and not
  as live OCR output.

## Administrator review workflow

- Replaced the submission placeholder with a newest-first, 20-row paginated queue. It supports
  status filters and bounded school-name search without loading the complete submission table.
- Added a reviewer-only detail page with campaign, school, timestamps, state, approved fields,
  schema-backed detected fields when present, risk flags when present, and the immutable audit trail.
- Receipt paths are read with the reviewer's authenticated RLS client. A separate internal endpoint
  checks the active reviewer role again and creates a 60-second private signed URL on the server.
  Anonymous/inactive access, malformed IDs, missing rows, and signing errors are concealed as 404;
  redirects are no-store and no-referrer.
- Added a fixed-search-path `security definer` review function with a row lock and optimistic version
  check. Only active `reviewer`, `admin`, and `super_admin` users pass its database-backed role gate.
- The transaction permits `pending` or `needs_review` to move to `approved`, `rejected`, or
  `needs_review`; same-state and final-state changes are rejected. Approval requires positive
  approved amount and bottle count, while rejection requires a nonblank reason.
- The submission update and one append-only `submission_reviews` audit insert happen in the same
  transaction. Stale reviews fail rather than overwriting another review.
- Every admin mutation has a same-origin check in addition to Next.js Server Action origin
  protection and server-side reviewer authorization.

## Schema and security changes

- Added a constrained nullable idempotency hash with a unique partial index.
- Added the RLS-enabled, service-only rate-limit counter table and atomic counter function.
- Added reviewer read policies for school, campaign, and campaign-participation metadata needed by
  the private queue, including inactive historical relationships.
- The review RPC is executable only by the authenticated role and still verifies the active
  database-backed reviewer hierarchy internally. It is not exposed to anonymous or service-role
  clients.
- Existing raw-submission RLS, private Storage posture, administrator hierarchy, and approved-only
  aggregate implementation remain intact.
- The production build continues to inject a sentinel service-role value and scan every client
  static asset, failing if service-role credential material appears.
- Fictional fixtures remain disabled by default and abort unless a deliberate session flag enables
  them. The database harness verifies that unguarded seed execution fails.

## Required security verification

| Invariant                                                      | Verified result                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Public user cannot choose approval status                      | Pass — strict form-field allowlist and server-controlled pending insert                    |
| Public user cannot choose approved amount/count                | Pass — hostile fields rejected; insert explicitly writes null approved values              |
| Original filenames and unsafe metadata are not stored          | Pass — randomized path and normalized metadata-free JPEG assertions                        |
| Receipt objects are not publicly enumerable/readable           | Pass — private bucket, no client object policy, RLS tests, reviewer-only signed route      |
| Repeated requests cannot create uncontrolled duplicates        | Pass — HMAC idempotency key, unique index, race cleanup, retry integration test            |
| Abuse controls do not retain raw IP/device data                | Pass — only 64-character HMAC values reach RPC/storage                                     |
| Insert failure does not silently orphan the normal upload path | Pass — compensating three-attempt deletion and error-path tests                            |
| Reviewer/admin/super-admin permissions behave correctly        | Pass — all three roles execute review transitions; non-admin and inactive users are denied |
| Review changes are transactional and audited                   | Pass — row lock, version check, update plus exactly one append-only audit row              |
| Anonymous users cannot access receipt paths/images             | Pass — SQL RLS/Storage tests and signed-route authorization tests                          |
| Aggregates ignore pending/rejected/needs-review rows           | Pass — exact totals after mixed Phase 3 transitions                                        |
| Aggregates use reviewer-approved values                        | Pass — expected sums use only `approved_amount` and `approved_bottle_count`                |
| Service-role material cannot enter the client bundle           | Pass — production static-asset scan                                                        |
| Seed/mock data cannot silently become production data          | Pass — seed guard is tested as an expected failure                                         |

## Phase 3 integration coverage

- Valid image submission through the HTTP handler, abuse limiter, real normalization, private upload,
  and pending insert.
- Invalid or inactive school, inactive campaign, not-started campaign, ended campaign, and inactive
  campaign participation.
- Missing image, unsupported MIME/signature, corrupt image, oversized request, unsafe dimensions,
  and metadata stripping.
- Cross-origin submission, hostile extra status/amount/identity fields, limiter outage, and rate-limit
  rejection.
- Idempotent retry and concurrent retry behavior, plus storage cleanup after insert failure.
- Anonymous/inactive signed-receipt denial and active-reviewer short-lived signed redirect.
- Review validation, optimistic-lock conflict, reviewer/admin/super-admin transitions, rejected final
  state, approved final state, audit creation, and approved-only totals.

## Quality gate

| Check                                     | Result                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Formatting                                | Pass — `npm run format:check`                                                               |
| TypeScript                                | Pass — `npm run typecheck`                                                                  |
| ESLint                                    | Pass — `npm run lint`, zero warnings                                                        |
| Application and Phase 3 integration tests | Pass — 11 files, 61 tests                                                                   |
| Database migration tests                  | Pass — all ordered migrations applied to a new disposable PostgreSQL database               |
| RLS and role-policy tests                 | Pass — anon, non-admin, reviewer, admin, super-admin, inactive admin, service role          |
| Storage security tests                    | Pass — private bucket, metadata isolation, direct-access denial, signed-route authorization |
| Dependency production audit               | Pass — `npm audit --omit=dev`, zero vulnerabilities                                         |
| Production build                          | Pass — expected routes compiled and client secret scan passed                               |

The final `npm run check` reruns formatting, TypeScript, ESLint, all application/integration tests,
the clean database/RLS/Storage suite, fixture fail-closed check, production build, and client-bundle
secret scan.

## Deployment requirements and later scope

- Deployment must provide valid public Supabase settings, `SUPABASE_SERVICE_ROLE_KEY`, and an
  independent high-entropy `SUBMISSION_RATE_LIMIT_SECRET` of at least 32 characters. An optional
  server-only `SITE_URL` can override the canonical URL; Vercel otherwise supplies its production
  domain. Secrets remain server-only and uncommitted.
- The deployment proxy must supply trustworthy client-address headers for the IP layer. Device and
  global ceilings remain additional controls.
- No OCR or automatic fraud-processing capability exists in this phase. Detected fields remain null
  for new public submissions unless a later phase populates them.
- Public school totals, leaderboard, news, and campaign frontend data were not replaced. That is
  Phase 4 work.
- The approved Phase 1 visual regression baseline was preserved; changes are functional states and
  clearly labelled copy within the existing components.
