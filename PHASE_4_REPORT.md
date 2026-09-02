# Ádiért Phase 4 report

Date: 2026-09-02

## PHASE 4 INCOMPLETE

The Phase 4 implementation and every automated quality/security gate are complete. One required exit
check remains: screenshot-based visual regression at 320, 375, 390, 430, tablet, and desktop widths.
The repository ran locally, but the workspace exposed no controllable browser instance, so this
check could not be performed or honestly marked as passed.

No Phase 5, OCR, automatic fraud scoring, or frontend redesign was added.

## 1. State found

- Phase 3 was approved and complete at `f03dd8d` / the current `main` history.
- Phase 2/3 migrations, private receipt Storage, protected administrator routes, public pending
  submission, review transaction, and approved-only foundation functions were present.
- At the start of the resumed continuation, the workbook audit had been completed, the workbook had
  been moved from `public/school_data/` to `data/import/schools/`, and the lightweight `fflate`
  development dependency had been installed.
- No Phase 4 importer, generated dataset, indexed school search, reusable selector, real public data
  repository, real leaderboard, public school page, public news page, Phase 4 tests, or report was
  otherwise present.
- Campaign, leaderboard, podium, hero count, milestones, achievements, and news still used public
  prototype values.

## 2. Work already complete when this continuation resumed

- All 21 workbook sheets had been inspected read-only.
- Private/internal columns had been identified.
- The source file had been removed from the web-served `public/` tree without altering the workbook.
- Exact and ambiguous duplicate characteristics had been measured.
- A zero-vulnerability XLSX ZIP/XML parsing dependency had been selected for build-time tooling only.

## 3. Work completed in this continuation

- Added deterministic workbook parsing, normalization, validation, reporting, safe JSON generation,
  and generated SQL migration tooling.
- Added a reproducible 2,773-school data migration and explicit rerun/idempotency verification.
- Added PostgreSQL `unaccent`/`pg_trgm` search infrastructure, search columns, triggers, prefix and
  trigram indexes, bounded safe RPCs, and typed server repository boundaries.
- Added the reusable accessible remote school combobox and replaced the receipt form's complete
  school `<select>`.
- Replaced public mock totals, participant count, leaderboard, podium, milestone completion, and
  news with database data and truthful empty/unavailable states.
- Added server-paginated leaderboard filters, real `/iskolak/[slug]`, and published-only
  `/hirek/[slug]` pages.
- Added 60-second tagged caches and approval-triggered invalidation.
- Added Phase 4 application, import, API, database, search, aggregate, leaderboard, profile,
  privacy, and regression tests.

## 4. Workbook handling and location

- Private source: `data/import/schools/school_DATA.xlsx`.
- Safe generated audit: `data/import/schools/import-report.json`.
- Safe normalized artifact: `data/import/schools/normalized-schools.json`.
- Generated PostgreSQL dataset: `supabase/migrations/20260902000400_real_school_dataset.sql`.
- There is no workbook or other file under `public/`; the source is not publicly downloadable.
- Production code never imports or parses Excel. Only `npm run schools:validate` and
  `npm run schools:generate` access the workbook.
- The parser reads only county, city, and school name. Contact people, phone numbers, email
  addresses, and outreach fields never enter generated artifacts or PostgreSQL.

## 5. School source statistics

The workbook has 21 inspected sheets: 20 county/Budapest data sheets plus the `Munka1` summary.
There are 2,790 source rows.

| Sheet                  | Rows | Sheet                | Rows |
| ---------------------- | ---: | -------------------- | ---: |
| Bács-Kiskun            |  156 | Baranya              |  128 |
| Békés                  |   88 | Borsod-Abaúj-Zemplén |  251 |
| Csongrád-Csanád        |   92 | Fejér                |  123 |
| Győr-Moson-Sopron      |  127 | Hajdú-Bihar          |  132 |
| Heves                  |   99 | Komárom-Esztergom    |   94 |
| Nógrád                 |   66 | Pest                 |  301 |
| Szabolcs-Szatmár-Bereg |  214 | Somogy               |  106 |
| Jász-Nagykun-Szolnok   |  107 | Tolna                |   69 |
| Vas                    |   74 | Veszprém             |  114 |
| Zala                   |   88 | Budapest             |  361 |

Private-field coverage is reported only as counts: 2,788 contact-name cells, 2,787 phone cells,
2,788 email cells, and no populated contacted/replied cells. No private cell value is copied to a
report.

## 6. Normalization and import behavior

- Display text is NFC-normalized; Hungarian accents remain intact.
- Non-breaking and repeated whitespace is collapsed and fields are trimmed. This changed whitespace
  in 128 source rows.
- Stable identity is Hungarian-locale lowercase `name + city + county`.
- IDs are deterministic namespace UUID v5 values.
- Slugs are accent-folded, bounded, readable name/city prefixes plus a deterministic SHA-256 suffix,
  making them stable and unique.
- The workbook does not contain a trustworthy school-type field, so the importer records `other`
  rather than inferring types from names.
- `postal_code` and `address` are nullable for this source because the workbook does not provide
  them; no address is invented.
- Generated inserts use `on conflict do nothing`, so reruns insert zero rows and do not overwrite
  curated production corrections.
- `npm run schools:validate` verifies source counts, sheet counts, expected duplicate/invalid counts,
  source checksum-derived artifacts, and the checked-in generated migration.

## 7. Duplicate handling and final count

- 16 exact `name + city + county` duplicate groups were collapsed deterministically (16 extra rows).
- 20 same-name/different-location groups are recorded as ambiguous and are not merged.
- 297 branch/tag-institution/telephely-like records are preserved as separate schools.
- One row (`Süttői II. Rákóczi Ferenc Általános Iskola`) has no city and is explicitly reported as
  invalid rather than assigned invented data.
- Final imported school count: **2,773**.

## 8. Search architecture

- Stored normalized search fields are maintained on every school insert/name/city/county update.
- Hungarian accents are folded with PostgreSQL `unaccent`; whitespace and punctuation are normalized.
- Active-school prefix indexes cover strong two-character name/city searches.
- Partial GIN trigram indexes cover name and combined name/city/county fuzzy searches.
- The search RPC is fixed-search-path `security definer`, accepts at most 120 query characters,
  clamps results to 1–20, requires at least two characters unless resolving a known ID, and can
  require active participation in an active campaign.
- Ordering is exact name, name prefix, all school-name tokens, all combined tokens, exact city, then
  trigram score, followed by deterministic name/city/ID ties.
- The internal normalization/trigger helpers are not executable by anonymous users.

## 9. Selector UX

- The receipt flow no longer downloads every participating school and has no large native `<select>`.
- Placeholder: “Keresd az iskola nevét vagy települést…” under “Iskola kiválasztása”.
- Requests debounce for 200 ms, cancel stale requests, require two characters, and return at most 15
  campaign-scoped results.
- Results show school name and `City · County` and submit only the selected immutable UUID.
- The selected school is clearly displayed and can be changed in one action.
- Arrow Up/Down, Enter, Escape, Tab, focus rings, combobox/listbox/option semantics, loading/error/no
  result states, and a campaign-validated recent-school ID are implemented.
- Phase 3 still validates campaign, date, school activity, and campaign participation on the server
  immediately before upload.

## 10. Public campaign data architecture

- `public_campaign_summary` selects the active campaign and returns approved amount, approved bottle
  count, active participating-school count, target, and dates.
- Totals use only rows with `status = 'approved'`, non-null `approved_amount`, and non-null
  `approved_bottle_count`.
- Active campaign participation and active school state are required.
- Hero social proof, live stats, progress, and milestones use this response. Missing data renders
  zero/empty/unavailable states; prototype numbers are never used as fallback.
- Money is never derived from bottle count. The separate UI calculator is explicitly labelled an
  estimate and “not verified campaign data.”

## 11. Leaderboard architecture and ranking semantics

- Ranking is computed server-side from the approved-only aggregate.
- Eligible rows require active campaign participation and an active school.
- National rank uses `row_number` ordered by approved amount descending, approved bottle count
  descending, C-collated school name, then immutable school ID.
- The full endpoint is paginated (20 rows, server clamp 50) and supports normalized school search,
  exact normalized county, exact normalized city, and school type where a reliable type exists.
- Filtering happens after national rank calculation, so filters do not relabel national positions.
- No historical rank snapshot exists; all previous-rank arrows and movement claims were removed.
- Zero approved submissions render an encouraging empty state and no fabricated podium.

## 12. School profiles and news

- `/iskolak/[slug]` returns only an active participating school's safe fields, active campaign,
  national rank when available, approved amount, and approved bottle count.
- Zero-total participating schools render `0 Ft`, `0 db`, and no fabricated rank.
- No receipt path/image/identifier, OCR/detected field, reviewer/audit record, submitter identity,
  address, spreadsheet contact, email, or phone is queried or rendered.
- The profile CTA passes the immutable school ID into the same receipt selector.
- The landing news section and `/hirek/[slug]` read only published records whose publication time has
  passed. Draft/future news is not exposed. No CMS was added.

## 13. Public mock removal

- Removed `CAMPAIGN_STATS`, `INITIAL_SCHOOLS`, `ACHIEVEMENTS`, `NEWS_ITEMS`, previous rank, and all
  hardcoded public total/rank/news fallbacks.
- Static reviewed “How it works” and FAQ copy remains version-controlled content, which the approved
  plan explicitly permits.
- The receipt verification illustration remains visibly labelled as a sample manual-review flow and
  does not claim live OCR.

## 14. Typed boundaries, caching, and revalidation

- Zod validates every Supabase summary, search, leaderboard, profile, and news response before it
  reaches UI components.
- Public application code imports service-role client creation only from `server-only` modules.
- Home/profile/news data uses tagged 60-second `unstable_cache` entries (the supported previous
  caching model because Cache Components are not enabled in this Next.js configuration).
- A successful approval revalidates `public-campaign`, `/`, and all `/iskolak/[slug]` pages.
- Pending submissions do not invalidate or change public totals.
- Interactive search is deliberately private/no-store; leaderboard API responses use a short
  15-second public freshness window with stale-while-revalidate.

## 15. Security verification

| Invariant                                                                          | Result                                   |
| ---------------------------------------------------------------------------------- | ---------------------------------------- |
| Anonymous raw submissions/reviews/admin data denied                                | Pass — existing RLS suites               |
| Anonymous receipt paths/images denied                                              | Pass — private bucket and Storage suites |
| Non-admin cannot escalate privileges                                               | Pass — existing role/RLS suites          |
| Reviewer/admin/super-admin and inactive-admin behavior preserved                   | Pass                                     |
| Public search/profile functions expose only allowlisted school/campaign aggregates | Pass                                     |
| Pending/rejected/needs-review excluded                                             | Pass — exact mixed-state SQL assertions  |
| Public values use approved fields, not detected/OCR/client values                  | Pass                                     |
| Inactive school/participation excluded                                             | Pass                                     |
| Service-role value absent from client bundle                                       | Pass — production sentinel scan          |
| Workbook private contact fields absent from safe artifacts/database                | Pass                                     |
| Receipt Storage remains private                                                    | Pass                                     |
| Fictional seed fails closed                                                        | Pass                                     |

## 16. Phase 3 regression status

- Public upload still accepts only campaign ID, school ID, and a validated image.
- The selector submits the immutable school UUID.
- Active campaign dates, school activity, and participation are revalidated server-side.
- Upload normalization, HMAC idempotency, abuse limits, pending-only creation, private object storage,
  compensating cleanup, reviewer-only signed receipt access, transactional review, and append-only
  audit behavior all remain covered and passed.
- Approval changes aggregate data; every non-approved state remains excluded.
- The client still cannot submit approved or detected values.

## 17. Quality gate results

| Check                                              | Result                                             |
| -------------------------------------------------- | -------------------------------------------------- |
| Formatting                                         | Pass — `npm run format:check`                      |
| TypeScript                                         | Pass — strict `npm run typecheck`                  |
| ESLint                                             | Pass — zero warnings                               |
| School import validation                           | Pass — 2,790 → 2,773 deterministic records         |
| Application/integration tests                      | Pass — 17 files, 79 tests                          |
| Database migrations                                | Pass — clean disposable PostgreSQL 17 database     |
| Hosted Supabase migration deployment               | Pass — all four migrations, no seed/fixtures       |
| Hosted schema/import verification                  | Pass — 2,773 schools and Phase 4 RPCs available    |
| Import migration rerun                             | Pass — first run inserted 2,773, second inserted 0 |
| RLS/role policy tests                              | Pass                                               |
| Storage security tests                             | Pass                                               |
| Phase 3 regression tests                           | Pass                                               |
| Phase 4 search/aggregate/leaderboard/profile tests | Pass                                               |
| Production build                                   | Pass — all expected dynamic routes compiled        |
| Client-secret scan                                 | Pass                                               |
| Production dependency audit                        | Pass — 0 vulnerabilities                           |
| `git diff --check`                                 | Pass                                               |

The complete automated command was `npm run check`, followed by `npm audit --omit=dev`. After the
hosted-Storage compatibility fix, `npm run check` passed again in full.

## 18. Known limitations

- The source workbook has no trustworthy school type, postal code, or street address. Types remain
  `other` unless curated later; no value is inferred.
- One source row without a city is reported and not imported.
- Ambiguous same-name/different-location candidates are reported for human review and deliberately
  remain separate.
- The repository is now linked to the intended hosted Supabase project (`adiert-db`), and all four
  tested migrations were applied there without seed/fixture data. A hosted-Supabase compatibility
  fix removed attempts to alter the RLS setting of Supabase-owned Storage tables; the platform
  already enables RLS on those tables, while the migration still creates the private bucket and
  its policies. The isolated test bootstrap explicitly enables Storage RLS.
- Remote verification found 2,773 imported schools, callable bounded school search, matching local
  and remote migration histories, no anonymously visible raw submission/administrator rows, and no
  anonymously listable Storage buckets or receipt objects.
- No real active campaign or campaign participation has been configured. This is intentionally not
  populated by the guarded fictional seed. Until production campaign details and participating
  schools are supplied, campaign aggregates are truthfully empty and receipt submission options
  return the no-active-campaign state.
- Deployment still requires the server-only `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, and `SUBMISSION_RATE_LIMIT_SECRET` environment values. The supplied
  publishable key is suitable only for `SUPABASE_ANON_KEY`; it is not a service-role credential.

## 19. Not verified and exact remaining work

Final-verification attempt on 2026-09-02:

- The Next.js application started successfully at `http://localhost:3001` (port 3000 was occupied by
  an unrelated local Java process).
- Browser discovery was retried after following the browser runtime's connection troubleshooting
  procedure. The runtime returned an empty browser list (`[]`), so there was no browser tab,
  rendering surface, viewport controller, screenshot capability, or physical input target.
- Viewports tested: none. The requested 320 px, 375 px, 390 px, 430 px, tablet, and desktop checks
  remain unexecuted.
- Physical interactions tested in a browser: none. This includes selector opening/autofocus,
  loading/results, selection/change/recent-school behavior, Arrow Up/Down, Enter, Escape, Tab/focus,
  touch targets, and mobile keyboard behavior.
- Browser issues found: none can be assessed without a rendering surface.
- Visual/interaction fixes made: none. No application code was changed during this final-verification
  attempt.

Consequently, visual screenshot comparison and physical interaction checks could not be performed.
Source-level responsive layout, long-name/empty/0/1/2/3 podium states, and combobox keyboard behavior
are implemented and automated tests pass, but they are not a substitute for the explicitly required
visual browser gate.

Exactly one item remains before this report may say **PHASE 4 COMPLETE**:

1. Run and record visual regression/interaction QA against the approved baseline at the required
   mobile, tablet, and desktop widths, with special attention to the receipt school combobox and
   long/empty/large-value public-data states.

Stop after this check; do not begin Phase 5.
