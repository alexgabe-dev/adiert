import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const root = resolve(import.meta.dirname, '..');
const subjects = JSON.parse(
  await readFile(resolve(root, 'supabase/templates/subjects.json'), 'utf8'),
);
const patch = {};
for (const [name, subject] of Object.entries(subjects)) {
  const html = await readFile(resolve(root, `supabase/templates/${name}.html`), 'utf8');
  const document = new JSDOM(html).window.document;
  assert.equal(document.documentElement.lang, 'hu');
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(document.querySelectorAll('script,form,iframe').length, 0);
  assert.ok(document.querySelector('meta[name="viewport"]'));
  assert.ok(Buffer.byteLength(html) < 90_000, 'Avoid clipped emails');
  const allowed = new Set([
    'Email',
    ...(name === 'email_change' ? ['NewEmail'] : []),
    ...(name === 'email_changed_notification' ? ['OldEmail'] : []),
    ...(name === 'reauthentication' ? ['Token'] : ['ConfirmationURL']),
  ]);
  for (const token of html.matchAll(/{{\s*\.(\w+)\s*}}/g))
    assert.ok(allowed.has(token[1]), `Unsupported variable in ${name}`);
  const links = [...document.querySelectorAll('a')];
  if (!name.endsWith('_notification') && name !== 'reauthentication') {
    assert.equal(links.length, 2, 'Action button plus fallback link');
    for (const link of links) assert.equal(link.getAttribute('href'), '{{ .ConfirmationURL }}');
  }
  if (name === 'reauthentication') assert.ok(html.includes('{{ .Token }}'));
  patch[`mailer_subjects_${name}`] = subject;
  patch[`mailer_templates_${name}_content`] = html;
}
console.log(
  `Validated ${Object.keys(subjects).length} Hungarian email templates and authentication links.`,
);
if (!process.argv.includes('--apply')) process.exit(0);
const token = process.env.SUPABASE_ACCESS_TOKEN;
assert.ok(token, 'Set SUPABASE_ACCESS_TOKEN to apply the templates');
const ref = (await readFile(resolve(root, 'supabase/.temp/project-ref'), 'utf8')).trim();
assert.match(ref, /^[a-z]{20}$/);
const endpoint = `https://api.supabase.com/v1/projects/${ref}/config/auth`;
async function request(method, body) {
  const response = await fetch(endpoint, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok)
    throw new Error(
      `Supabase Auth configuration ${method} failed (${response.status}): ${(await response.text()).replaceAll(token, '[redacted]').slice(0, 2000)}`,
    );
  return response.json();
}
const before = await request('GET');
const siteArg = process.argv.find((arg) => arg.startsWith('--site-url='));
if (siteArg) {
  const site = new URL(siteArg.slice('--site-url='.length));
  assert.equal(site.protocol, 'https:');
  patch.site_url = site.origin;
  const redirects = new Set((before.uri_allow_list || '').split(',').filter(Boolean));
  redirects.add(`${site.origin}/auth/callback**`);
  // Keep this project's supported local development callbacks available.
  for (const origin of [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3010',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ])
    redirects.add(`${origin}/auth/callback**`);
  patch.uri_allow_list = [...redirects].join(',');
}
// Back up only fields being changed, never SMTP credentials or other secrets.
await writeFile(
  resolve(root, `supabase/.temp/auth-email-backup-${Date.now()}.json`),
  JSON.stringify(Object.fromEntries(Object.keys(patch).map((key) => [key, before[key]])), null, 2),
);
await request('PATCH', patch);
const after = await request('GET');
for (const [key, value] of Object.entries(patch))
  assert.equal(after[key], value, `Remote verification failed for ${key}`);
console.log(`Applied and verified ${Object.keys(subjects).length} templates in project ${ref}.`);
console.log(`Custom SMTP configured: ${Boolean(after.smtp_host)}. No emails were sent.`);
