import { createClient } from '@supabase/supabase-js';
import { resolve } from 'node:path';

process.loadEnvFile(resolve(import.meta.dirname, '../.env.local'));
const url = new URL(process.env.SUPABASE_URL);
const local =
  url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
const requestedProject = process.argv
  .find((arg) => arg.startsWith('--project-ref='))
  ?.split('=')[1];
if (!local && (url.protocol !== 'https:' || url.hostname !== `${requestedProject}.supabase.co`)) {
  throw new Error('Hosted test data requires an explicit matching --project-ref=<project>.');
}
const client = createClient(url.toString(), process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
async function checked(request) {
  const { data, error } = await request;
  if (error) throw error;
  return data;
}
async function account(email, password) {
  const { users } = await checked(client.auth.admin.listUsers({ perPage: 1000 }));
  const existing = users.find((user) => user.email === email);
  if (existing) {
    await checked(client.auth.admin.updateUserById(existing.id, { password, email_confirm: true }));
    return existing.id;
  }
  const { user } = await checked(
    client.auth.admin.createUser({ email, password, email_confirm: true }),
  );
  return user.id;
}
const adminId = await account('admin@adiert.test', 'AdiAdmin2026!');
const teacherId = await account('tanar@adiert.test', 'AdiTanar2026!');
await checked(
  client.from('administrators').upsert({
    user_id: adminId,
    role: 'super_admin',
    active: true,
    display_name: 'Teszt Főadmin',
  }),
);
const school = await checked(
  client
    .from('schools')
    .upsert(
      {
        slug: 'helyi-tesztiskola',
        name: 'Ádiért Tesztiskola (helyi minta)',
        type: 'primary_school',
        city: 'Mintaváros',
        county: 'Teszt vármegye',
        postal_code: '0000',
        address: 'Minta utca 1.',
        active: true,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single(),
);
let campaign = await checked(
  client.from('campaigns').select('id').eq('active', true).maybeSingle(),
);
if (!campaign) {
  const year = new Date().getUTCFullYear();
  campaign = await checked(
    client
      .from('campaigns')
      .upsert(
        {
          slug: 'helyi-tesztkampany',
          name: 'Helyi tesztgyűjtés',
          description: 'Kizárólag helyi tesztadatok.',
          target_amount: 1000000,
          start_date: `${year}-01-01`,
          end_date: `${year + 1}-12-31`,
          active: true,
        },
        { onConflict: 'slug' },
      )
      .select('id')
      .single(),
  );
}
await checked(
  client
    .from('campaign_schools')
    .upsert({ campaign_id: campaign.id, school_id: school.id, active: true }),
);
await checked(
  client.from('school_memberships').upsert({
    user_id: teacherId,
    school_id: school.id,
    role: 'owner',
    display_name: 'Teszt Tanár',
    email: 'tanar@adiert.test',
    active: true,
  }),
);
for (const [email, password, table] of [
  ['admin@adiert.test', 'AdiAdmin2026!', 'administrators'],
  ['tanar@adiert.test', 'AdiTanar2026!', 'school_memberships'],
]) {
  const authenticated = createClient(url.toString(), process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await checked(authenticated.auth.signInWithPassword({ email, password }));
  const ownRows = await checked(authenticated.from(table).select('*'));
  if (!ownRows.length) throw new Error(`Missing permissions for ${email}`);
  await authenticated.auth.signOut();
  console.log(`Verified password login and permissions: ${email}`);
}
console.log('Test school and accounts are ready.');
