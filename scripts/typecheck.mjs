import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const generatedDevelopmentTypes = resolve(root, '.next', 'dev', 'types');

// Next development mode can retain validators for routes that were moved into route groups.
// Remove only that generated directory before regenerating canonical route types.
rmSync(generatedDevelopmentTypes, { recursive: true, force: true });

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const nextExecutable = resolve(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const typeScriptExecutable = resolve(root, 'node_modules', 'typescript', 'bin', 'tsc');

run([nextExecutable, 'typegen']);
run([typeScriptExecutable, '--noEmit']);
