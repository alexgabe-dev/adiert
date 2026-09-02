import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const migrationsDirectory = join(root, 'supabase', 'migrations');
const migrations = readdirSync(migrationsDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .map((name) => join(migrationsDirectory, name));
const databaseTestsDirectory = join(root, 'supabase', 'tests');
const databaseTests = readdirSync(databaseTestsDirectory)
  .filter((name) => name.endsWith('.sql') && name !== '000_bootstrap.sql')
  .sort()
  .map((name) => join(databaseTestsDirectory, name));
const tests = [join(databaseTestsDirectory, '000_bootstrap.sql'), ...migrations, ...databaseTests];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}`);
  }

  return result;
}

function runExpectedFailure(command, args, expectedText) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.error) throw result.error;
  if (result.status === 0) {
    throw new Error(`${command} unexpectedly succeeded`);
  }

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (!output.includes(expectedText)) {
    process.stderr.write(output);
    throw new Error(`${command} failed for an unexpected reason`);
  }
}

function reservePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a local PostgreSQL port'));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

function withDatabaseName(connectionString, databaseName) {
  const url = new URL(connectionString);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

let clusterDirectory;
let clusterStarted = false;
let adminUrl = process.env.DATABASE_TEST_URL;
let pgCtl = 'pg_ctl';

try {
  if (adminUrl) {
    const parsedUrl = new URL(adminUrl);
    if (!['127.0.0.1', 'localhost', '::1'].includes(parsedUrl.hostname)) {
      throw new Error('DATABASE_TEST_URL must point to an isolated local PostgreSQL server');
    }
  } else {
    clusterDirectory = mkdtempSync(join(tmpdir(), 'adiert-postgres-'));
    const port = await reservePort();
    run('initdb', [
      '-D',
      clusterDirectory,
      '-U',
      'postgres',
      '-A',
      'trust',
      '--encoding=UTF8',
      '--no-locale',
    ]);
    run(
      pgCtl,
      [
        '-D',
        clusterDirectory,
        '-l',
        join(clusterDirectory, 'postgres.log'),
        '-o',
        `-h 127.0.0.1 -p ${port}`,
        '-w',
        'start',
      ],
      { stdio: 'inherit' },
    );
    clusterStarted = true;
    adminUrl = `postgresql://postgres@127.0.0.1:${port}/postgres`;
  }

  const databaseName = `adiert_phase2_test_${process.pid}`;
  run('psql', [adminUrl, '-X', '-v', 'ON_ERROR_STOP=1', '-c', `create database ${databaseName}`]);
  const testUrl = withDatabaseName(adminUrl, databaseName);

  try {
    for (const file of tests) {
      readFileSync(file);
      process.stdout.write(`\nRunning ${file.slice(root.length + 1)}\n`);
      run('psql', [testUrl, '-X', '-v', 'ON_ERROR_STOP=1', '-f', file]);
    }
    process.stdout.write('\nVerifying that development fixtures fail closed\n');
    runExpectedFailure(
      'psql',
      [testUrl, '-X', '-v', 'ON_ERROR_STOP=1', '-f', join(root, 'supabase', 'seed.sql')],
      'Refusing to load fictional fixtures',
    );
    process.stdout.write('\nDatabase, RLS, Storage, and aggregate policy tests passed.\n');
  } finally {
    run('psql', [
      adminUrl,
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-c',
      `drop database if exists ${databaseName} with (force)`,
    ]);
  }
} finally {
  if (clusterStarted && clusterDirectory) {
    run(pgCtl, ['-D', clusterDirectory, '-m', 'fast', '-w', 'stop'], { stdio: 'inherit' });
  }
  if (clusterDirectory) {
    rmSync(clusterDirectory, { recursive: true, force: true });
  }
}
