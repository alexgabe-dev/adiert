import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const staticDirectory = resolve(import.meta.dirname, '..', '.next', 'static');
const forbiddenValues = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (process.env[name]) forbiddenValues.push(process.env[name]);
}

function filesBelow(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

for (const file of filesBelow(staticDirectory)) {
  const content = readFileSync(file);
  for (const forbiddenValue of forbiddenValues) {
    if (content.includes(Buffer.from(forbiddenValue))) {
      throw new Error(`Server-only Supabase configuration was found in ${file}`);
    }
  }
}

process.stdout.write('Client bundle contains no server-only Supabase configuration.\n');
