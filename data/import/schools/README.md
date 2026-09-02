# School import source

`school_DATA.xlsx` is a private import source, not a web asset. It contains internal contact and
outreach columns and must never be moved under `public/`, exposed through an application route, or
parsed by the production application.

Only school name, city, and county are read by `scripts/schools/import-schools.mjs`. The script
normalizes those fields, reports invalid/exact/ambiguous duplicate candidates, assigns stable IDs
and unique slugs, and generates the checked-in PostgreSQL data migration. Contact people, telephone
numbers, email addresses, and outreach fields are deliberately excluded from every generated
artifact.

- Validate the workbook and checked-in artifacts: `npm run schools:validate`
- Regenerate safe artifacts and the idempotent data migration: `npm run schools:generate`

The generated migration inserts missing deterministic records with `on conflict do nothing`; it
does not overwrite production corrections.
