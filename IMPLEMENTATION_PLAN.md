# Ádiért production implementation plan

Audit date: 2026-09-01

This document is the result of a repository-wide audit. It deliberately does not implement the backend. The existing visual design, copy hierarchy, illustrations, responsive layout, and interaction style are the baseline to preserve. Any changes proposed below are for correctness, accessibility, security, maintainability, or production data integration—not a redesign.

## Executive recommendation

The current project is a polished, static React/Vite prototype. It builds and type-checks, but every product-critical flow is simulated: receipt submissions are not uploaded, amounts are trusted from the browser, school registration is not stored, the leaderboard is hardcoded, and the displayed/downloadable QR is a decorative fake.

The safest production path is:

1. Capture a visual/regression baseline of the current UI.
2. Move the existing component markup and Tailwind classes into a small Next.js App Router application without changing the design.
3. Add Supabase/PostgreSQL migrations, private Storage, and invite-only admin authentication.
4. Implement anonymous receipt submission through validated server endpoints.
5. Replace mocks with approved-only aggregate queries and explicit empty/loading states.
6. Build the admin review workflow.
7. Add asynchronous OCR and duplicate-risk signals only after manual review is reliable.

A Vite SPA plus Supabase Edge Functions could support an MVP, but it would require adding a router, a separate server/edge deployment, custom SEO handling for school pages, and a second set of server conventions. Because this repository has only one route and no backend to preserve, a controlled Next.js migration is justified. The current components and styling should be reused nearly verbatim.

## 1. Current architecture

| Area                  | Current state                                                                                    | Assessment                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Framework             | React 19.2.8 rendered with `createRoot`                                                          | Current and suitable UI layer                                                          |
| Build tool            | Vite 6.4.3 with `@vitejs/plugin-react`                                                           | Builds successfully; SPA only                                                          |
| Language              | TypeScript 5.8.3                                                                                 | Present, but non-strict configuration weakens guarantees                               |
| Styling               | Tailwind CSS 4.3.3 via `@tailwindcss/vite`; `src/index.css` only imports Tailwind                | Lightweight and worth preserving                                                       |
| Routing               | None; a single `App` and hash-anchor navigation                                                  | Insufficient for `/admin` and `/iskolak/[slug]`                                        |
| State                 | Local React state in `App` and individual sections/modals                                        | Appropriate for prototype UI state; no data/cache layer                                |
| Data                  | `src/data/mockData.ts` plus inline constants                                                     | Entirely mock/static                                                                   |
| Backend/API           | None                                                                                             | Missing                                                                                |
| Database/storage/auth | None                                                                                             | Missing                                                                                |
| Forms                 | Controlled React inputs with browser-native validation                                           | Demo-only; no shared schema or server validation                                       |
| Tests/quality         | `npm run lint` runs only `tsc --noEmit`; no unit, integration, E2E, ESLint, or formatting checks | Not production-ready                                                                   |
| Package management    | Both `package-lock.json` and `bun.lock` exist and currently resolve consistently                 | Choose and enforce one package manager in CI                                           |
| Build result          | Successful: one ~454.84 kB JS chunk (~136.54 kB gzip), ~60.52 kB CSS (~9.90 kB gzip)             | Functional, but lacks route-level splitting                                            |
| Dependency audit      | `npm audit --omit=dev` reports 0 known vulnerabilities at audit time                             | Good snapshot, not a substitute for continuous scanning                                |
| Version control       | No `.git` directory exists in this workspace; Git resolves to a broken parent-home repository    | History/diff baseline is unavailable until repository metadata is restored or recloned |

The `package.json` includes unused prototype/server dependencies (`@google/genai`, `express`, `dotenv`) and several direct development dependencies that are not used by application code. There is no current Gemini integration despite the AI Studio README and environment template.

## 2. Current frontend structure

```text
src/
  main.tsx                         React entry point
  App.tsx                          Single-page composition and modal state
  index.css                        Tailwind import
  types.ts                         Mock-facing UI types
  data/mockData.ts                 Campaign, school, news, FAQ, achievement mocks
  components/
    layout/                        Header and footer
    sections/                      Landing-page sections
    modals/                        Receipt, guide, leaderboard, school registration
    illustrations/                Custom inline SVG artwork and QR-like graphic
```

`App.tsx` owns four modal-open flags and the selected school name, then renders all landing-page sections eagerly. There are no route boundaries, layouts, server components, lazy-loaded sections, error boundaries, or persistent data stores.

The design system is implicit in repeated Tailwind utilities: Plus Jakarta Sans, navy/blue/emerald/amber palette, rounded cards, restrained shadows, and custom SVG illustration style. These are production-usable visual assets. A later foundation pass should name the existing colors/radii/shadows as tokens, but should not visually alter them.

Responsive behavior is implemented through Tailwind breakpoints and generally follows a sensible mobile-first structure. Concrete issues found in source:

- At 640–767 px, the mobile menu is hidden at `sm` while desktop navigation does not appear until `md`; only the submit CTA remains.
- Leaderboard cards and rows are clickable `div` elements, so they are not keyboard-operable links/buttons.
- Modals lack `role="dialog"`, `aria-modal`, focus trapping, Escape handling, focus return, and background scroll locking.
- No `prefers-reduced-motion` handling exists for perpetual hero motion, auto-toggling verification state, confetti, or transitions.
- `animate-in`, `slide-in-from-top-2`, and `animate-spin-slow` are referenced but absent from the compiled CSS, so those intended animations do not run.
- Visual browser testing could not be executed in the audit environment because no browser runtime was available. Source inspection and production build verification were completed; screenshot-based regression testing remains a Phase 0 gate.

## 3. Existing functionality

Production-usable frontend pieces:

- Polished responsive landing-page composition.
- Header anchor navigation and mobile drawer structure.
- Custom, lightweight SVG illustrations.
- Campaign explanation, FAQ accordion, guide modal, news cards, stats, milestones, and calls to action.
- Leaderboard presentation, podium, list layout, client-side region/type filtering, and a separate full-list modal.
- Receipt submission and school registration form layouts.
- Receipt review-state illustration and admin-review messaging.
- Impact calculator; its `count × 50 Ft` behavior is acceptable only as a clearly labelled estimate.
- Motion/transition language using Motion, CSS transitions, and confetti.
- Successful TypeScript check and Vite production build.

Existing interactions that are only simulations:

- Receipt upload reads any browser-recognized image into an in-memory data URL; it does not upload or validate it.
- Submitting waits 1.2 seconds and shows success/confetti without calling a server.
- School registration shows success without persistence or notification.
- QR download generates a decorative canvas image that is not a functional donation QR.
- Share copies the current page URL only.
- Verification/OCR UI auto-toggles between states using hardcoded receipt data.
- News “read more” controls are non-functional spans.
- Legal links point to `#`.

## 4. Mock functionality and hardcoded values

All of the following must be treated as fixtures, not production truth:

| Current source            | Hardcoded/demo content                                                                          | Production source                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `CAMPAIGN_STATS`          | 12,458,750 Ft, 249,175 bottles, 245 schools, 20M target, 62%                                    | Approved-only campaign aggregate plus campaign target                                          |
| `INITIAL_SCHOOLS`         | Ten schools, global ranks, previous ranks, amount, bottle count, region/type, badges            | `schools` plus approved submission aggregate/ranking query                                     |
| `HeroSection`             | “245 iskola” and four social-proof avatars                                                      | Aggregate query or omit until data exists                                                      |
| `GamificationTeaser`      | 249,175 collected, completed milestones, all achievements                                       | Campaign aggregate and explicit achievement rules/snapshots                                    |
| `NEWS_ITEMS`              | Three dated stories                                                                             | Published `news` records                                                                       |
| `FAQS`                    | Five static FAQs                                                                                | May remain reviewed, version-controlled content for MVP; add CMS table only if editors need it |
| `ReceiptVerificationDemo` | Receipt ID, date, school, 2,500 Ft, 50 bottles, two-minute timing                               | Keep only as a visibly labelled “minta”; never imply live OCR                                  |
| `SubmitReceiptModal`      | Demo receipt, default 50 bottles, calculated amount, fake machine ID/validity, 2–4 hour promise | Real selected file and school; response only confirms `pending` receipt of submission          |
| `QrCodeGraphic`/download  | QR-like SVG and downloadable fake canvas                                                        | Explicit non-scannable placeholder until official asset is supplied; no download action        |
| Footer/copy               | Legal entity, address, legal links, support address, copyright year                             | Legal/product-owner-confirmed content and real pages                                           |

Additional copy claims requiring product/legal verification before launch include “100% Ádi kezelésére,” compatibility with every Hungarian REpont, direct transfer behavior, transaction identifier availability, average review time, campaign-kit delivery, and the ability to use an app transaction screenshot instead of a receipt.

Mock data also contains factual inconsistencies that demonstrate why it cannot seed production unchanged—for example, Szeged is categorized as “Dunántúl,” and broad regions do not support the required county/city filters.

## 5. Technical debt and fragility

### Critical correctness/security issues

- The client controls bottle count and derives a purported donation amount with `bottleCount * 50`; this value is then reported as if submitted. It must never become a verified value or leaderboard input.
- The decorative QR is presented and downloaded as if genuine. This must be disabled and explicitly labelled before any public deployment.
- Receipt submission has no backend, authentication boundary, file validation, storage policy, rate limiting, or persistence.
- `accept="image/*"` permits types that should not be accepted (including potentially SVG), and the UI’s 10 MB/type claim is not enforced.
- Files are loaded entirely into base64 memory, which increases memory use and retains EXIF metadata in the preview.
- Receipt submission can succeed without a receipt because the hidden file input/state is not actually required by submit logic.
- Optional student name/class collection is unnecessary for the core flow and increases privacy risk, especially because the audience includes minors.

### Functional fragility

- `defaultSchool` initializes modal state only on first mount; later opens can retain stale school/form/success state.
- Closing/reopening modals does not consistently reset state or cancel timers.
- The receipt selector contains a non-backed “other school” value.
- `schoolSearch` exists but is unused; the receipt form only has a native select.
- The main leaderboard has `searchQuery` state but no search input.
- Filtering preserves global rank labels and can produce confusing/partial podiums. It does not support county or city filters.
- “Previous rank” arrows have no snapshot model.
- School names, rather than immutable school IDs, are passed between components.
- Clipboard operations have no error handling or secure-context fallback.

### Accessibility/usability debt

- Modal focus management and semantics are missing.
- Several clickable rows/cards are not keyboard accessible.
- News actions are styled controls without links.
- Automatic motion does not respect reduced-motion preferences.
- Error messages, upload progress, server failure/retry states, and live-region announcements are absent.
- The header breakpoint gap needs correction without altering visual direction.

### Engineering debt

- TypeScript is not `strict`; `allowJs`, `skipLibCheck`, and absent unused checks hide defects.
- The alias maps `@` to the repository root rather than `src` and is not used.
- The “lint” command is only a type check.
- No tests, CI, formatting policy, database migrations, environment validation, logging, or monitoring exist.
- Modal containers, close behavior, field styles, school filtering, and leaderboard rows are duplicated.
- Many imports are unused because compiler/lint settings do not report them.
- All page code and animation libraries ship in one client bundle.
- External Google Fonts are loaded from the browser; a framework migration should self-host/subset the same font to improve privacy and performance without changing typography.

Do not refactor repeated visual markup solely for aesthetics. Extract shared pieces only when connecting real data, fixing accessibility, or reducing divergent behavior.

## 6. Proposed production architecture

### Framework decision

Use Next.js App Router with TypeScript and Tailwind CSS, preserving the current React components and Tailwind class strings. The migration should be mechanical:

- Server-render the public landing page and school/news pages.
- Keep only interactive islands (`Header`, filters, calculators, accordions, modals/forms, animated hero) as client components.
- Lazy-load modals, confetti, and other interaction-only code.
- Use route handlers/server actions only for trusted server operations.
- Use Supabase PostgreSQL, private Storage, and Auth.
- Use Zod schemas shared by server endpoints and form adapters.
- Use React Hook Form where it materially improves upload/admin forms; simple local UI controls can stay as state.

Proposed structure:

```text
src/
  app/
    (public)/page.tsx
    iskolak/[slug]/page.tsx
    hirek/[slug]/page.tsx
    admin/layout.tsx
    admin/page.tsx
    admin/bekuldesek/page.tsx
    admin/bekuldesek/[id]/page.tsx
    admin/iskolak/page.tsx
    admin/iskolak/[id]/page.tsx
    api/submissions/route.ts
    api/admin/submissions/[id]/review/route.ts
  components/                    Existing visual components, minimally adapted
  features/
    submissions/                 Schemas, form, server service, status model
    leaderboard/                 Query DTOs and filters
    admin/                       Review and school management components
  lib/
    supabase/client.ts
    supabase/server.ts
    supabase/admin.ts            Server-only; never imported by client code
    auth/authorization.ts
    rate-limit.ts
    env.ts
  data/                          Development fixtures only
supabase/
  migrations/
  seed.sql                       Explicit local/dev seed only
  tests/
```

If deployment constraints make Next.js unacceptable, retain Vite and add React Router plus Supabase Edge Functions. This fallback must still keep privileged writes, upload validation, OCR, review transitions, and aggregate queries off the browser.

### Performance boundaries

- Render campaign stats/top schools on the server and cache by campaign/filter.
- Invalidate campaign/leaderboard cache after an approval transaction, not after pending submissions.
- Paginate the full leaderboard and admin queues; do not load all schools/submissions into the browser.
- Optimize public illustrations as existing inline SVG where appropriate.
- Use responsive image handling for news; never optimize private receipt images through a public image route.
- Dynamically import Motion/confetti-dependent client components where possible.
- Avoid a general client data-fetching library until interaction requirements justify it.

## 7. Database schema

Use UUID primary keys (`gen_random_uuid()`), `timestamptz` in UTC, integer Hungarian forint amounts (`bigint`), and generated/trigger-maintained `updated_at`. Never use floating point for money.

### Enums

- `school_type`: initial controlled values mapped to confirmed product terminology; avoid encoding Hungarian labels directly if translations are expected.
- `submission_status`: `pending`, `approved`, `rejected`, `needs_review`.
- `administrator_role`: `reviewer`, `admin`, `super_admin`.
- `ocr_status`: `not_requested`, `queued`, `processing`, `completed`, `failed`.
- `fraud_flag_type`: controlled signal types such as exact image hash, confirmed identifier collision, OCR similarity, and perceptual image similarity.

### `schools`

- `id uuid primary key`
- `name text not null`
- `slug text not null unique`
- `type school_type not null`
- `city text not null`
- `county text not null`
- `postal_code text not null`
- `address text not null`
- `active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes: normalized/search index for `name`, indexes on `(active, county)`, `(active, city)`, `(active, type)`. Enable `pg_trgm` only if needed for accent-tolerant school search; otherwise begin with a normalized searchable column and prefix search.

Schools with submission history are deactivated, never hard-deleted. A database trigger or restricted delete policy should enforce this.

### `campaigns`

- `id uuid primary key`
- `name text not null`
- `slug text not null unique`
- `description text not null`
- `target_amount bigint not null check (target_amount > 0)`
- `start_date date not null`
- `end_date date not null`
- `active boolean not null default false`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Constraint: `end_date >= start_date`.

Use a partial unique index if product rules permit only one active campaign. Prefer explicit campaign selection over silently choosing the first active row.

### `campaign_schools`

Recommended join table so participation is campaign-specific:

- `campaign_id uuid references campaigns on delete restrict`
- `school_id uuid references schools on delete restrict`
- `joined_at timestamptz not null default now()`
- `active boolean not null default true`
- Primary key `(campaign_id, school_id)`.

### `administrators`

- `user_id uuid primary key references auth.users(id) on delete cascade`
- `role administrator_role not null`
- `active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Optional `display_name text` only if operationally needed.

No password or password hash is stored here; Supabase Auth owns credentials.

### `submissions`

- `id uuid primary key`
- `public_reference uuid not null unique default gen_random_uuid()` for a non-enumerable confirmation reference
- `school_id uuid not null references schools(id) on delete restrict`
- `campaign_id uuid not null references campaigns(id) on delete restrict`
- `receipt_image_path text not null unique`
- `receipt_image_sha256 text null` (exact normalized-file signal)
- `receipt_image_phash text null` (optional later similarity signal)
- `detected_amount bigint null check (detected_amount >= 0)`
- `detected_bottle_count integer null check (detected_bottle_count >= 0)`
- `detected_receipt_identifier text null`
- `detected_receipt_date date null`
- `approved_amount bigint null check (approved_amount >= 0)`
- `approved_bottle_count integer null check (approved_bottle_count >= 0)`
- `receipt_identifier text null` (reviewer-confirmed canonical identifier)
- `receipt_date date null` (reviewer-confirmed date)
- `status submission_status not null default 'pending'`
- `rejection_reason text null`
- `fraud_score numeric(5,2) null check (fraud_score between 0 and 100)`
- `ocr_status ocr_status not null default 'not_requested'`
- `ocr_payload jsonb null` (provider response/audit metadata, never public)
- `ocr_provider text null`
- `ocr_model_version text null`
- `created_at timestamptz not null default now()`
- `reviewed_at timestamptz null`
- `reviewed_by uuid null references administrators(user_id) on delete restrict`
- `updated_at timestamptz not null default now()`
- `version integer not null default 1` for optimistic concurrency in admin review.

Constraints:

- `approved` requires non-null `approved_amount`, `approved_bottle_count`, `reviewed_at`, and `reviewed_by`.
- `rejected` requires `rejection_reason`, `reviewed_at`, and `reviewed_by`.
- Non-approved records must never contribute to public aggregates, even if approved fields happen to be populated.
- A submission’s campaign/school pair should reference an active `campaign_schools` row at creation time; historical rows remain valid if later deactivated.
- Create a partial unique index on normalized, reviewer-confirmed `receipt_identifier` where `status = 'approved'` and the identifier is non-null. OCR-only identifiers are not unique constraints.

Indexes:

- `(status, created_at)` for review queues.
- `(campaign_id, status, created_at)`.
- `(school_id, campaign_id, status)` for school aggregates.
- `receipt_image_sha256`, normalized `detected_receipt_identifier`, normalized confirmed `receipt_identifier`, `receipt_date`, and `(approved_amount, approved_bottle_count)` for duplicate analysis.
- `(fraud_score desc)` for review prioritization.

### `submission_flags`

- `id uuid primary key`
- `submission_id uuid not null references submissions on delete cascade`
- `type fraud_flag_type not null`
- `severity smallint not null check (severity between 1 and 5)`
- `score numeric(5,2) not null`
- `matched_submission_id uuid null references submissions on delete set null`
- `details jsonb not null default '{}'`
- `resolved_at timestamptz null`
- `resolved_by uuid null references administrators(user_id) on delete restrict`
- `created_at timestamptz not null default now()`

This preserves explanations behind a fraud score and supports manual resolution.

### `submission_reviews`

Append-only audit log:

- `id uuid primary key`
- `submission_id uuid not null references submissions on delete restrict`
- `reviewer_id uuid not null references administrators(user_id) on delete restrict`
- `from_status submission_status not null`
- `to_status submission_status not null`
- `approved_amount bigint null`
- `approved_bottle_count integer null`
- `reason text null`
- `created_at timestamptz not null default now()`

Approval/rejection/needs-review transitions should occur through one transaction/function that locks the submission, validates the transition and role, updates the row, and writes this audit record.

### `news`

- `id uuid primary key`
- `title text not null`
- `slug text not null unique`
- `excerpt text not null`
- `content text not null` (Markdown or a narrowly sanitized rich-text format; decide before implementation)
- `published boolean not null default false`
- `published_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- Constraint: published content requires `published_at`.
- Index `(published, published_at desc)`.

### Optional supporting tables

- `school_registration_requests`: keep contact data separate from public `schools`, restrict access, and apply a short retention schedule.
- `leaderboard_snapshots`: daily/final snapshots only if previous-rank arrows and historical achievements are retained.
- `achievement_definitions` and `school_achievements`: only after rules are confirmed; do not infer achievements from mocks.
- `processing_jobs` or Supabase queue/`pgmq`: idempotent OCR/image-processing work.

### Public aggregate views/functions

Create `campaign_school_totals` and `campaign_leaderboard` as security-invoker views or carefully permissioned SQL functions. Their base predicate must always be:

```sql
where submissions.status = 'approved'
```

Amounts come from `sum(approved_amount)` and bottle counts from `sum(approved_bottle_count)`. Use `dense_rank()` with a deterministic tiebreaker defined by product (for example amount descending, bottle count descending, then school name/id). Never aggregate `detected_*` fields and never derive verified money from bottle count.

## 8. Authentication strategy

### Public users

Do not require accounts for MVP receipt submission. Accounts add abandonment, personal-data obligations, support load, and little value to the core three-step flow. Anonymous users receive a non-enumerable submission reference; status lookup should be omitted unless a secure, useful UX is defined.

Do not collect submitter/student name or class by default. If the product later needs optional attribution, conduct a privacy/legal review first and separate it from public leaderboard data.

### Administrators

- Use Supabase Auth with invite-only accounts.
- Prefer magic link/OTP or organization SSO; require MFA for `super_admin` and ideally all admin roles.
- Store role/active state in `administrators`, not user-editable JWT metadata alone.
- Use secure, HTTP-only auth cookies through the server framework.
- Recheck role and active status server-side for every admin mutation.
- `reviewer`: review submissions only.
- `admin`: reviewer abilities plus school/news/campaign operations as explicitly granted.
- `super_admin`: administrator lifecycle and highest-risk configuration.
- Do not expose whether an email is an admin in public auth responses.

## 9. Authorization and RLS strategy

Enable RLS on every application table and private Storage metadata. Use small, audited `security definer` helper functions such as `is_active_admin()`/`has_admin_role()` with a fixed `search_path`; do not duplicate recursive role-table policy logic.

Recommended policy matrix:

| Resource                   | Anonymous/public              | Authenticated non-admin | Reviewer                                        | Admin/super admin            |
| -------------------------- | ----------------------------- | ----------------------- | ----------------------------------------------- | ---------------------------- |
| Active schools/campaigns   | Read safe public columns      | Same                    | Read                                            | Manage according to role     |
| Published news             | Read                          | Read                    | Read                                            | Manage according to role     |
| Raw submissions            | No direct read/write          | No access               | Read/review                                     | Read/review                  |
| Receipt images             | No direct bucket listing/read | No access               | Short-lived signed read URL for assigned review | Same                         |
| Aggregate leaderboard view | Read approved-only aggregates | Read                    | Read                                            | Read                         |
| Admin roles/audit          | No access                     | No access               | Own/minimal role visibility                     | Restricted role-based access |

Public submission creation should go through a same-origin server endpoint, not direct anonymous table inserts. The endpoint may use a server-only service-role client after validation and rate limiting. Never expose `SUPABASE_SERVICE_ROLE_KEY` or any privileged credential through browser-exposed framework variables, browser code, logs, or error payloads.

Storage bucket `receipt-images` must be private. Object paths are generated by the server and must not include user filenames or personal information. Signed read URLs should be short lived and created only after admin authorization.

Database grants and RLS must be tested with anon, authenticated non-admin, reviewer, admin, and service roles. RLS is defense in depth; server authorization remains mandatory.

## 10. Receipt upload architecture

Target UX remains: upload receipt → select school → submit.

Recommended request flow:

1. Browser performs UX-only checks and preview using an object URL, not a base64 data URL.
2. Browser submits file plus immutable `school_id` and `campaign_id` to a same-origin endpoint.
3. Endpoint validates origin/CSRF strategy, rate limit, active campaign/participation, and Zod input schema.
4. Server validates actual file signature, not just extension/MIME. Initially allow JPEG, PNG, and WebP. Support HEIC only after a tested server conversion path exists; otherwise remove the UI claim.
5. Enforce a 10 MB compressed-size limit and a decoded pixel/dimension limit to prevent decompression bombs.
6. Decode and re-encode the image to a safe format, normalize orientation, strip EXIF/GPS/metadata, and calculate exact/perceptual hashes. Keep the receipt legible; do not over-compress OCR inputs.
7. Generate `campaign-id/submission-id/random-uuid.ext`; never retain the original filename.
8. Upload to the private Storage bucket and insert the `pending` submission. If one side fails, perform idempotent cleanup/retry so orphan objects/rows are reconciled.
9. Enqueue asynchronous OCR/image work and return a generic confirmation/reference. Do not return or echo an accepted monetary value.

Depending on host request-body limits, use either a streaming server endpoint or a two-step, short-lived signed upload flow. In a signed flow, the server reserves the exact object path and a finalize endpoint re-validates the stored object before it becomes a reviewable submission. Anonymous broad Storage insert policies are not acceptable.

Rate limiting should combine:

- Per-IP or privacy-preserving salted IP hash bucket with short TTL.
- Per-device/session token bucket as a secondary signal, not identity.
- Global/campaign circuit breaker.
- Progressive challenge (for example Turnstile) after suspicious volume rather than mandatory friction for everyone.
- Conservative concurrent upload and daily volume limits.

Do not store raw IP addresses long term. Document rate-limit data retention and rotate hash salts appropriately.

## 11. OCR integration architecture

OCR is asynchronous and advisory. The initial secure MVP can operate with manual review before an OCR provider is selected.

Flow:

1. Successful upload creates `pending` plus an idempotent OCR job keyed by submission ID/image hash.
2. Worker marks `ocr_status = processing`, fetches the private image with server credentials, and calls a provider adapter.
3. Adapter returns raw provider output plus normalized candidate fields and confidence: amount, bottle count, receipt date, receipt identifier, and relevant REpont indicators.
4. Store candidates only in `detected_*`, `ocr_payload`, provider, and model-version fields.
5. Run duplicate/risk signals and attach explainable flags.
6. Keep normal cases `pending`; set `needs_review` when defined risk/quality rules require prioritization. OCR failure must remain manually reviewable.
7. Reviewer sees the image, detected fields/confidence, and flags. Reviewer enters/confirms `approved_*`, `receipt_identifier`, and `receipt_date`.
8. Approval transaction preserves detected data and writes the audit log. It never overwrites OCR fields.

Provider calls need timeout, bounded retry with backoff, dead-letter handling, cost/volume budgets, observability, and redacted logs. Never synthesize missing OCR values. Null plus “not detected” is valid.

## 12. Duplicate detection strategy

Duplicate detection produces review signals, not automatic rejection based on weak similarity.

Signals, from strongest to weakest:

- Reviewer-confirmed receipt identifier already approved (strong; approval should be blocked pending resolution).
- Exact normalized image SHA-256 match.
- Exact/normalized OCR receipt identifier match.
- Same receipt date, amount, and bottle count within a defined time window.
- Perceptual image-hash similarity or crop/rotation similarity.
- Similar OCR text layout/REpont metadata.
- Abnormal submission velocity from the same rate-limit key.

Architecture:

- Store each signal as a `submission_flags` row with weight, matched submission, and evidence.
- Calculate a bounded `fraud_score` for queue ordering only.
- Exact, reviewer-confirmed identifier collision prevents accidental double approval but routes to a human resolution path.
- Hash/similarity/OCR combinations can move a row to `needs_review`; they do not reject it.
- Reviewers can compare both private images and resolve false positives.
- Thresholds and scoring versions should be recorded and adjustable without rewriting historical OCR evidence.

## 13. Admin architecture

`/admin` is an authenticated server-rendered application with role checks in both layout/page access and every mutation.

### Dashboard

- Total approved donations: sum of `approved_amount` where status is approved.
- Approved bottle count: sum of `approved_bottle_count` where status is approved.
- Participating schools: active campaign participation count.
- Pending and needs-review counts.
- Recent audit/review activity.
- Leading schools from the same approved-only leaderboard query used publicly.

### Submission queue/review

- Tabs/filters for pending, needs review, approved, rejected, campaign, date, school, and risk.
- Paginated server query; no full dataset in the client.
- Review screen shows signed private image, selected school, detected values/confidence, confirmed identifier/date, flags/matches, submission timestamp, and immutable audit history.
- Actions: approve, reject, needs review.
- Approval requires manually confirmed amount and bottle count; identifier/date can also be corrected/confirmed.
- Rejection requires a controlled reason plus optional note.
- Use a transaction and optimistic `version` check so two reviewers cannot silently overwrite each other.

### School management

- Create/edit/search/filter/activate/deactivate.
- Validate unique slug and normalized official data.
- Deactivation preserves historical submissions and public history according to campaign rules.
- Deletion is unavailable when history exists.

Admin mutations should use server actions/route handlers with Zod validation, authorization, CSRF/origin protection, audit logging, and generic client errors. Receipt signed URLs must never appear in analytics or logs.

## 14. Leaderboard architecture

The leaderboard has one source of truth: approved submissions in PostgreSQL.

```text
submissions.status = approved
        ↓
group by campaign + school
        ↓
sum approved_amount + approved_bottle_count
        ↓
rank/filter/paginate
        ↓
public DTO with school aggregates only
```

Requirements:

- National rank is based on the complete active campaign before pagination.
- County, city, type, and normalized school search filters are server-side query parameters.
- Define whether filtered views display national rank or rank within the filtered cohort; label it explicitly. Do not reuse global podium labels ambiguously.
- Use deterministic tie rules.
- Return only school/campaign aggregate fields; never submission images, identifiers, reviewer data, or submitter data.
- Campaign totals, progress, top schools, full leaderboard, and school pages all consume the same aggregate layer.
- `/iskolak/[slug]` contains national rank, approved amount/count, target progress, recent verified activity expressed as aggregate/non-identifying events, and only rule-backed achievements.
- “Previous rank” requires dated leaderboard snapshots. Hide movement indicators until snapshots exist rather than showing demo arrows.
- Cache public queries with a short revalidation window and invalidate after successful approval/reversal. Pending/rejected writes do not change public caches.

For scale, begin with indexed aggregate SQL views/functions. Add a materialized aggregate table/view only after query metrics justify it; refresh it transactionally or via reliable post-approval jobs.

## 15. Privacy and security considerations

- Complete a GDPR data inventory and lawful-basis/retention review before launch.
- Collect no public submitter identity for MVP.
- Remove the optional student name/class field.
- Strip EXIF/GPS and other metadata from uploaded images.
- Keep receipt images private and define automatic deletion/archival after the contest, dispute, accounting, and fraud-retention periods are legally confirmed.
- Keep school-registration contact requests in a restricted table with explicit retention; do not mix them with public school records.
- Publish real privacy notice, terms, imprint, contact/controller details, and cookie policy where applicable.
- Avoid third-party analytics/session replay on upload/admin routes; never capture receipt images or form payloads.
- Add CSP, HSTS, `nosniff`, strict referrer policy, permissions policy, secure cookies, and clickjacking protection.
- Sanitize rendered news content and restrict allowed markup.
- Validate redirects and signed URL lifetimes.
- Redact OCR payloads, identifiers, storage paths, auth tokens, and user network data from logs.
- Maintain dependency scanning, secret scanning, database backups/PITR, restore tests, and incident procedures.
- Separate development/staging/production Supabase projects and Storage buckets.
- Use least-privilege environment secrets and rotate them; never use a browser-exposed service role.
- Add structured audit logs for review and school/admin changes.
- Test abuse cases: oversized/decompression-bomb files, polyglots, corrupted images, repeated receipts, concurrent approvals, forged IDs, inactive schools/campaigns, signed URL leakage, and enumeration.

## 16. Migration plan from mock to real data

Use typed repository/query boundaries so visual components receive DTOs rather than importing Supabase or `mockData` directly.

| UI area                           | Migration action                                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Campaign stats/hero social proof  | Replace with one approved-only campaign summary query                                                                                     |
| Leaderboard/modal/school selector | Split into public aggregate DTO and active-school selector DTO; pass school IDs, not names                                                |
| News                              | Query published records; retain empty state if none                                                                                       |
| Achievements/milestones           | Keep hidden or labelled informational until rules are defined and database-backed                                                         |
| FAQ/how-it-works                  | Keep as reviewed static content initially; they are editorial copy, not live metrics                                                      |
| Receipt verification demo         | Add an unmistakable “Minta” label and keep data local, or connect only after real anonymized demo data is approved                        |
| Receipt form                      | Remove count-as-truth, optional student name, demo receipt, fake validity, and fake success timer; connect to submission endpoint         |
| School registration               | Decide whether it is an application request or admin-only operation; persist only after privacy workflow is defined                       |
| QR                                | Replace current graphic with an explicit placeholder and disable download; add official asset through one configured component/path later |
| Legal/footer claims               | Replace only with approved legal/product content                                                                                          |

Development fixtures may remain for Storybook/tests/local seed data, but:

- Production builds must never fall back silently to mock totals.
- Local mock mode must be controlled by an explicit non-production flag and display a visible fixture badge.
- Missing production data should render honest zero/empty/unavailable states.
- Seed data must be clearly fictional and isolated from production migrations.

## 17. Recommended implementation phases

### Phase 0 — Baseline and decisions

- Restore/reclone repository metadata and choose npm or Bun.
- Capture desktop/tablet/mobile screenshots and interaction recordings.
- Record existing colors, typography, spacing, breakpoints, illustrations, and motion as regression fixtures.
- Confirm official QR behavior/asset, legal claims, campaign rules, school source, retention, deployment host, and receipt formats.
- Immediately replace/disable the fake downloadable QR if the prototype can be accessed publicly.

Exit: approved architecture decision record and visual baseline; no ambiguous product/security blockers for MVP.

### Phase 1 — Application foundation

- Mechanically migrate to Next.js App Router while preserving components/classes.
- Add strict TypeScript, real lint/format checks, environment validation, CI, test harness, and route-level error/loading states.
- Fix accessibility defects and the header breakpoint gap with minimal visual change.
- Self-host the existing font and establish existing style tokens.

Exit: landing page matches baseline at supported viewports; build/lint/tests pass.

### Phase 2 — Supabase foundation

- Create SQL migrations, constraints, indexes, RLS, Storage bucket/policies, admin role helpers, seed fixtures, and policy tests.
- Configure separate environments and server-only credentials.
- Implement invite-only admin auth and protected `/admin` shell.

Exit: policy tests prove public users cannot access submissions/images/admin data.

### Phase 3 — Secure receipt MVP

- Build validated anonymous upload flow, image normalization/metadata stripping, rate limiting, private storage, pending records, and honest success/error states.
- Build admin queue/review transaction and append-only audit log.
- Remove client-provided verified amount behavior.

Exit: uploaded receipt remains private, creates `pending`, cannot affect leaderboard, and can be safely approved/rejected by authorized reviewers.

### Phase 4 — Real public data

- Implement approved-only aggregates, campaign stats, leaderboard filters/search/pagination, cache invalidation, and `/iskolak/[slug]`.
- Replace hardcoded stats/schools/news with queries and explicit empty states.
- Keep snapshot-dependent trends and undefined achievements hidden.

Exit: only approved admin-confirmed fields affect every public total/rank.

### Phase 5 — Admin operations

- Complete dashboard, school CRUD/activation, search/filters, news management if required, reviewer concurrency handling, and operational audit views.

Exit: daily operations do not require direct database access.

### Phase 6 — OCR and duplicate-risk assistance

- Add provider adapter/queue, detected fields/raw audit data, retry/dead-letter handling, hashes, explainable flags, comparison UI, and tuning metrics.

Exit: OCR never auto-credits money, never overwrites approved values, and weak similarity never auto-rejects.

### Phase 7 — Production QA and launch

- Accessibility audit, responsive/browser/device test matrix, E2E abuse/security tests, load tests, observability/alerts, backup restore drill, privacy/legal sign-off, and deployment runbook.

Exit: signed launch checklist and rollback plan.

## 18. Risks and unresolved questions

1. What is the exact official MOHU/REpont QR asset and approved usage/download behavior?
2. Does the receipt reliably prove that the Ádiért QR was used, and which identifiers/fields appear across real machine/app receipt variants?
3. What entity is the data controller/fund recipient, and which public claims are legally approved?
4. What are the campaign dates, target, active-campaign rules, tie rules, and school eligibility rules?
5. Is amount the primary leaderboard score, bottle count, or both? How are non-50-Ft or future variable deposit items handled?
6. Must a bottle count be present to approve an amount, and can administrators approve amount when count is unreadable?
7. What is the source of truth for Hungarian schools, types, counties, addresses, and slugs? Who verifies new-school requests?
8. Is school registration a public request, an authenticated school workflow, or admin-only onboarding?
9. Which upload formats must be supported in practice, especially iPhone HEIC, multi-page images, and app screenshots?
10. What receipt-image/OCR/audit retention period is required for review, disputes, accounting, and fraud prevention?
11. Which OCR provider/data region and subprocessors are acceptable under GDPR, and what is the cost/latency budget?
12. Which hosting platform and request-size limits apply? This decides streaming versus signed direct upload.
13. Should anonymous users be able to check status? If yes, use a private one-time secret/reference—not enumerable IDs or personal accounts by default.
14. Who can create administrators and campaigns, reverse an approval, or resolve duplicate conflicts?
15. Are news, FAQs, and achievements admin-editable in MVP, and what are the exact achievement rules?
16. What accessibility/browser support level is required, and who approves unavoidable differences from the current prototype?
17. Repository history is unavailable in this workspace; can the canonical repository be restored before Phase 0?

## Proposed implementation sequence

1. Resolve the questions that affect data validity, privacy, QR behavior, and deployment.
2. Restore version-control baseline and capture visual regression fixtures.
3. Preserve and port the landing page into the production routing shell.
4. Add schema migrations, RLS/storage policies, role helpers, and policy tests.
5. Add admin authentication and a minimal protected review shell.
6. Implement secure anonymous upload to `pending` with no client-trusted amount.
7. Implement transactional manual approval/rejection and audit logging.
8. Connect approved-only campaign stats and leaderboard.
9. Add school pages and school management.
10. Add news/content workflows only where editors need them.
11. Add OCR and duplicate-risk assistance behind the manual-review path.
12. Complete performance, accessibility, security, privacy, device, and production-readiness QA.

The non-negotiable invariant throughout implementation is: **only `status = 'approved'` rows, using administrator-confirmed `approved_amount` and `approved_bottle_count`, may affect public totals, school pages, campaign progress, achievements, or leaderboard rankings.**
