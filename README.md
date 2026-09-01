# Ádiért frontend

Production application foundation for the Ádiért Hungarian school bottle-return charity campaign.

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
npm run build
```

`npm run check` runs type checking, linting, tests, and the production build in sequence.

## Environment

Environment variables are validated in `src/lib/env.ts`. Phase 1 only defines the canonical public site URL:

```dotenv
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

No Supabase, authentication, backend, or OCR configuration is part of Phase 1.
