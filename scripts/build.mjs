import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const serviceRoleSentinel =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'phase2_test_service_role_key_must_never_appear_in_browser_assets';

const environment = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://phase2-build-check.invalid',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'phase2_public_anon_key_for_build_validation_only',
  SUPABASE_SERVICE_ROLE_KEY: serviceRoleSentinel,
};

const nextExecutable = resolve(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const build = spawnSync(process.execPath, [nextExecutable, 'build'], {
  cwd: root,
  env: environment,
  stdio: 'inherit',
});

if (build.error) throw build.error;
if (build.status !== 0) process.exit(build.status ?? 1);

const verifyBundle = spawnSync(
  process.execPath,
  [resolve(root, 'scripts', 'verify-client-bundle.mjs')],
  {
    cwd: root,
    env: environment,
    stdio: 'inherit',
  },
);

if (verifyBundle.error) throw verifyBundle.error;
process.exit(verifyBundle.status ?? 1);
