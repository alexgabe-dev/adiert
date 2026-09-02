# Ádiért

Production application and Supabase foundation for the Ádiért Hungarian school bottle-return
charity campaign.

## Requirements

- Node.js 20.9 or newer (`.nvmrc` currently pins 20.19.0)
- npm 11

## Local development

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The application is available at `http://localhost:3000` by default.

## Quality checks

```powershell
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:db
npm run build
```

`npm run check` runs formatting, type checking, linting, application tests, isolated database/RLS/
Storage tests, and the production build in sequence.

## Environment

Copy `.env.example` to `.env.local` and replace every placeholder. Each local, staging, and
production deployment must use a separate Supabase project.

```dotenv
SITE_URL="http://localhost:3000"
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-server-only-service-role-key"
SUBMISSION_RATE_LIMIT_SECRET="your-server-only-random-secret"
```

All environment bindings are consumed only by server modules. The production build scans browser
assets and fails if Supabase configuration or credential material appears there. See
`docs/SUPABASE_ENVIRONMENTS.md` for migration, invite-only administrator, fixture, and environment
setup.

Phase 2 deliberately does not implement public receipt persistence, OCR, fraud processing, or the
admin review workflow. Those belong to later phases in `IMPLEMENTATION_PLAN.md`.
