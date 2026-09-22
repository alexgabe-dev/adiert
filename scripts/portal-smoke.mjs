// HTTP user journeys against the local app. Test writes require an explicit flag.
import { JSDOM } from 'jsdom';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

process.loadEnvFile('.env.local');
const base = process.env.SITE_URL;
assert(
  ['localhost', '127.0.0.1'].includes(new URL(base).hostname),
  'Only a local app may be tested.',
);
const privileged = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
async function db(request) {
  const { data, error } = await request;
  if (error) throw Error(error.message);
  return data;
}
const passed = [];
function pass(name) {
  passed.push(name);
  console.log('PASS', name);
}
class Session {
  cookies = new Map();
  async request(path, options = {}) {
    const response = await fetch(base + path, {
      ...options,
      redirect: 'manual',
      headers: {
        Origin: base,
        Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '),
        ...options.headers,
      },
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0];
      const at = pair.indexOf('=');
      this.cookies.set(pair.slice(0, at), pair.slice(at + 1));
    }
    return response;
  }
  async page(path) {
    const response = await this.request(path);
    const html = await response.text();
    assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
    const doc = new JSDOM(html).window.document;
    assert(!doc.querySelector('meta[http-equiv="refresh"]'), `${path}: unexpected redirect`);
    assert(!html.includes('data-next-error'), `${path}: render error`);
    return doc;
  }
  async postForm(path, predicate, values = {}) {
    const doc = await this.page(path);
    const form = [...doc.querySelectorAll('form')].find(predicate);
    assert(form, `Form not found on ${path}`);
    const data = new FormData();
    for (const input of form.querySelectorAll('input[name],textarea[name],select[name]')) {
      if (['checkbox', 'radio'].includes(input.type) && !input.checked) continue;
      data.append(input.name, input.value);
    }
    for (const [key, value] of Object.entries(values)) data.set(key, String(value));
    const response = await this.request(path, { method: 'POST', body: data });
    const text = await response.text();
    assert(response.status < 400, `Form ${path}: HTTP ${response.status}`);
    return { response, text };
  }
  async login(path, email, password) {
    const { response } = await this.postForm(path, (f) => !!f.querySelector('[name=password]'), {
      email,
      password,
    });
    assert.equal(response.status, 303, `Login: ${email}`);
    return this;
  }
}
const anonymous = new Session();
const home = await anonymous.page('/');
for (const link of home.querySelectorAll('a[href^="#"]')) {
  assert(link.getAttribute('href') !== '#', 'Dead homepage link');
  assert(home.getElementById(link.getAttribute('href').slice(1)), 'Missing anchor target');
}
pass('Public page anchors point to real sections');
for (const path of [
  '/tanar/belepes',
  '/tanar/regisztracio',
  '/tanar/belepes?mode=reset',
  '/tanar/belepes?mode=resend',
  '/admin/login',
])
  await anonymous.page(path);
pass('Login, signup, password reset and confirmation screens render');
const badLogin = await anonymous.postForm(
  '/tanar/belepes',
  (f) => !!f.querySelector('[name=password]'),
  { email: 'tanar@adiert.test', password: 'WrongPassword123!' },
);
assert(badLogin.text.includes('Nem sikerült belépni'));
pass('Wrong password receives a useful error');
const teacher = await new Session().login('/tanar/belepes', 'tanar@adiert.test', 'AdiTanar2026!');
const admin = await new Session().login('/admin/login', 'admin@adiert.test', 'AdiAdmin2026!');
pass('Both real login forms redirect successfully');
for (const path of ['/tanar', '/tanar/feltoltes', '/tanar/bekuldesek', '/tanar/iskolam'])
  await teacher.page(path);
for (const path of [
  '/admin',
  '/admin/bekuldesek',
  '/admin/iskolak',
  '/admin/jelentkezesek',
  '/admin/kampanyok',
  '/admin/hirek',
  '/admin/adminisztratorok',
  '/admin/ertesitesek',
  '/admin/naplo',
])
  await admin.page(path);
pass('All teacher and admin navigation destinations render');
const empty = await teacher.page('/tanar/bekuldesek?status=approved');
if (!empty.querySelector('a[href^="/tanar/bekuldesek/"]'))
  assert(empty.body.textContent.includes('Összes beküldés'));
pass('Empty filtered results offer a way to clear the filter');
const forbidden = await teacher.request('/admin');
assert(forbidden.status === 307 || (await forbidden.text()).includes('/admin/login'));
assert.equal((await anonymous.request('/api/submissions', { method: 'POST' })).status, 401);
pass('Teacher cannot access admin; anonymous uploads are blocked');

const school = await db(
  privileged.from('schools').select('id,name').eq('slug', 'helyi-tesztiskola').single(),
);
for (const tab of ['overview', 'review', 'contacts', 'data', 'history'])
  await admin.page(`/admin/iskolak/${school.id}?tab=${tab}`);
const csv = await admin.request(`/api/admin/schools/${school.id}/export`);
assert.equal(csv.status, 200);
assert(csv.headers.get('content-type')?.includes('text/csv'));
assert.equal((await teacher.request(`/api/admin/schools/${school.id}/export`)).status, 404);
pass('School tabs and authorized CSV export work');

if (process.argv.includes('--with-test-writes') && !process.argv.includes('--onboarding-only')) {
  assert(school.name.includes('Tesztiskola'), 'Writes require the explicit fixture school.');
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' });
  let submission;
  const record = async () =>
    db(privileged.from('submissions').select('*').eq('id', submission.id).single());
  async function upload(count, key, revision) {
    const image = await sharp(
      Buffer.from(
        `<svg width="640" height="480"><rect width="640" height="480" fill="white"/><text x="40" y="120" font-size="36">UX TESZT - NEM ADOMANY</text><text x="40" y="240" font-size="64">${count} palack</text><text x="40" y="330" font-size="22">${today}</text></svg>`,
      ),
    )
      .png()
      .toBuffer();
    const data = new FormData();
    data.set('receipt', new File([image], 'ux-test.png', { type: 'image/png' }));
    data.set('count', String(count));
    data.set('date', today);
    data.set('note', 'UX TESZT – nem valódi visszaváltás. A teszt végén elutasítva.');
    if (revision) {
      data.set('revision', revision.id);
      data.set('version', String(revision.version));
    }
    const r = await teacher.request('/api/submissions', {
      method: 'POST',
      body: data,
      headers: { 'Idempotency-Key': key },
    });
    const body = await r.json();
    assert(r.ok, JSON.stringify(body));
    return body;
  }
  async function review(status, count, reason) {
    await admin.postForm(
      `/admin/bekuldesek/${submission.id}`,
      (f) => !!f.querySelector('[name=submission_id]'),
      { intent: status, approved_bottle_count: count, approved_amount: count * 50, reason },
    );
    submission = await record();
    assert.equal(submission.status, status);
  }
  try {
    const key = randomUUID();
    const first = await upload(70, key);
    submission = await db(
      privileged
        .from('submissions')
        .select('*')
        .eq('public_reference', first.publicReference)
        .single(),
    );
    assert.equal(submission.school_id, school.id);
    assert.equal((await upload(70, key)).publicReference, first.publicReference);
    pass('Photo upload saves under own school; retry creates no duplicate');
    await teacher.page(`/tanar/bekuldesek/${submission.id}`);
    for (const [session, path] of [
      [teacher, `/api/teacher/submissions/${submission.id}/image`],
      [admin, `/api/admin/submissions/${submission.id}/receipt`],
    ]) {
      const r = await session.request(path);
      assert([200, 302, 307].includes(r.status));
    }
    assert.equal(
      (await anonymous.request(`/api/teacher/submissions/${submission.id}/image`)).status,
      404,
    );
    pass('Own photo is accessible; anonymous photo access is blocked');
    await review('needs_review', 70, 'UX TESZT: a darabszámot javítsd 80-ra.');
    const detail = await teacher.page(`/tanar/bekuldesek/${submission.id}`);
    assert(detail.body.textContent.includes('Beküldés javítása'));
    assert(detail.body.textContent.includes('A korábbi fotót használom'));
    pass('Review feedback and correction controls appear to the teacher');
    await upload(80, randomUUID(), submission);
    submission = await record();
    assert.equal(submission.status, 'pending');
    const revisions = await db(
      privileged.from('submission_revisions').select('id').eq('submission_id', submission.id),
    );
    assert.equal(revisions.length, 1);
    pass('Resubmission returns to review and preserves photo history');
    await review('approved', 80, 'UX TESZT: ideiglenes jóváhagyás a folyamat ellenőrzéséhez.');
    assert.equal(submission.approved_bottle_count, 80);
    assert(
      (await teacher.page(`/tanar/bekuldesek/${submission.id}`)).body.textContent.includes(
        'Jóváhagyva',
      ),
    );
    pass('Approval updates the teacher-visible result');
    await review('rejected', 80, 'UX TESZT LEZÁRVA – nem valódi adomány, az eredményből kizárva.');
    assert.equal(submission.approved_bottle_count, null);
    pass('Admin correction removes synthetic bottles from the result');
  } finally {
    if (submission) {
      const current = await record();
      if (current.status !== 'rejected')
        await review('rejected', 80, 'UX TESZT LEZÁRVA – nem valódi adomány.');
    }
  }
}
if (process.argv.includes('--with-test-writes')) {
  const suffix = randomUUID().slice(0, 8);
  const testUsers = [];
  let newSchool;
  async function fixtureUser(kind) {
    const email = `ux-${kind}-${suffix}@adiert.test`;
    const password = randomUUID() + '!Aa1';
    const { user } = await db(
      privileged.auth.admin.createUser({ email, password, email_confirm: true }),
    );
    testUsers.push(user.id);
    const session = await new Session().login('/tanar/belepes', email, password);
    return { id: user.id, email, password, session };
  }
  try {
    const colleague = await fixtureUser('kollega');
    await teacher.postForm(
      '/tanar/iskolam',
      (f) => f.querySelector('[name=intent]')?.value === 'invite',
      { email: colleague.email },
    );
    const start = await colleague.session.request('/tanar');
    assert(
      (start.headers.get('location') ?? '').includes('/tanar/meghivasok') ||
        (await start.text()).includes('/tanar/meghivasok'),
    );
    const invitation = await db(
      privileged.from('school_invitations').select('id').eq('email', colleague.email).single(),
    );
    const accepted = await colleague.session.postForm(
      '/tanar/meghivasok',
      (f) => f.querySelector('[name=id]')?.value === invitation.id,
      { name: 'UX Teszt Kolléga' },
    );
    assert.equal(accepted.response.status, 303);
    const team = await colleague.session.page('/tanar/iskolam');
    assert(
      ![...team.querySelectorAll('form')].some(
        (f) => f.querySelector('[name=intent]')?.value === 'invite',
      ),
    );
    pass('Invited teacher lands on invitations, joins own school and cannot invite others');
    await teacher.postForm(
      '/tanar/iskolam',
      (f) =>
        f.querySelector('[name=target]')?.value === colleague.id &&
        f.querySelector('[name=intent]')?.value === 'remove',
    );
    const removed = await db(
      privileged.from('school_memberships').select('active').eq('user_id', colleague.id).single(),
    );
    assert.equal(removed.active, false);
    const removedPage = await colleague.session.request('/tanar/feltoltes');
    assert(
      (removedPage.headers.get('location') ?? '').includes('/tanar/jelentkezes') ||
        (await removedPage.text()).includes('/tanar/jelentkezes'),
    );
    pass('Revoked teacher immediately loses school and upload access');

    const applicant = await fixtureUser('jelentkezo');
    const applicationValues = {
      school_id: '',
      school_name: `UX Tesztiskola ${suffix}`,
      city: 'Tesztváros',
      postal_code: '0000',
      contact_name: 'UX Teszt Kapcsolattartó',
    };
    await applicant.session.postForm(
      '/tanar/jelentkezes',
      (f) =>
        [...f.querySelectorAll('button')].some((b) =>
          b.textContent.includes('Jelentkezés beküldése'),
        ),
      applicationValues,
    );
    let application = await db(
      privileged.from('school_applications').select('*').eq('user_id', applicant.id).single(),
    );
    assert.equal(application.status, 'pending');
    await admin.postForm(
      '/admin/jelentkezesek',
      (f) => f.querySelector('[name=id]')?.value === application.id,
      { status: 'needs_changes', reason: 'UX TESZT: pontosítsd a kapcsolattartó nevét.' },
    );
    const correction = await applicant.session.page('/tanar/jelentkezes');
    assert(correction.body.textContent.includes('pontosítsd a kapcsolattartó nevét'));
    await applicant.session.postForm(
      '/tanar/jelentkezes',
      (f) => !!f.querySelector('[name=school_name]'),
      { ...applicationValues, contact_name: 'UX Teszt Javított Kapcsolattartó' },
    );
    application = await db(
      privileged.from('school_applications').select('*').eq('user_id', applicant.id).single(),
    );
    assert.equal(application.status, 'pending');
    await admin.postForm(
      '/admin/jelentkezesek',
      (f) => f.querySelector('[name=id]')?.value === application.id,
      { status: 'approved', reason: 'UX TESZT jóváhagyás.' },
    );
    const owner = await db(
      privileged.from('school_memberships').select('*').eq('user_id', applicant.id).single(),
    );
    newSchool = owner.school_id;
    assert.equal(owner.role, 'owner');
    assert(
      (await applicant.session.page('/tanar')).body.textContent.includes(
        applicationValues.school_name,
      ),
    );
    const outbox = await db(
      privileged.from('email_outbox').select('id').eq('recipient', applicant.email),
    );
    assert(outbox.length >= 2);
    pass(
      'Application → correction request → resubmission → approval grants school ownership and queues notices',
    );

    const reviewer = await fixtureUser('ellenor');
    await db(
      privileged.from('administrators').insert({
        user_id: reviewer.id,
        role: 'reviewer',
        display_name: 'UX Teszt Ellenőrző',
        active: true,
      }),
    );
    const reviewerSession = await new Session().login(
      '/admin/login',
      reviewer.email,
      reviewer.password,
    );
    const reviewerPage = await reviewerSession.page('/admin/bekuldesek');
    assert(!reviewerPage.querySelector('a[href="/admin/adminisztratorok"]'));
    const forbiddenSchool = await reviewerSession.request('/admin/iskolak');
    assert(
      forbiddenSchool.status === 404 ||
        (await forbiddenSchool.text()).includes('NEXT_HTTP_ERROR_FALLBACK;404'),
    );
    pass('Reviewer sees the review queue but cannot manage schools or admin accounts');
  } finally {
    for (const id of testUsers) {
      await db(privileged.from('school_memberships').update({ active: false }).eq('user_id', id));
      await db(privileged.from('administrators').update({ active: false }).eq('user_id', id));
      await db(privileged.auth.admin.updateUserById(id, { ban_duration: '87600h' }));
    }
    if (newSchool) {
      await db(
        privileged.from('campaign_schools').update({ active: false }).eq('school_id', newSchool),
      );
      await db(privileged.from('schools').update({ active: false }).eq('id', newSchool));
    }
  }
}
await teacher.postForm('/tanar', (f) => !!f.querySelector('button[aria-label="Kilépés"]'));
const signedOut = await teacher.request('/tanar');
assert(signedOut.status === 307 || (await signedOut.text()).includes('/tanar/belepes'));
pass('Logout revokes access to the protected portal');
console.log(`${passed.length} HTTP user-journey checks passed.`);
