import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const subjects = JSON.parse(
  await readFile(resolve(root, 'supabase/templates/subjects.json'), 'utf8'),
);
const escape = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const cards = [];
for (const [name, subject] of Object.entries(subjects)) {
  let html = await readFile(resolve(root, `supabase/templates/${name}.html`), 'utf8');
  for (const [variable, value] of Object.entries({
    ConfirmationURL: 'https://www.palackverseny.hu/auth/callback?code=ELONEZET',
    Email: 'tanar@example.com',
    NewEmail: 'uj-cim@example.com',
    OldEmail: 'regi-cim@example.com',
    Token: '12345678',
  }))
    html = html.replaceAll(`{{ .${variable} }}`, value);
  // Preview buttons do not consume tokens or navigate to the live app.
  html = html.replace(/href="[^"]*"/g, 'href="#"');
  cards.push(
    `<details ${name === 'confirmation' ? 'open' : ''}><summary>${escape(subject)}</summary><iframe title="${escape(subject)}" sandbox srcdoc="${escape(html)}"></iframe></details>`,
  );
}
const preview = `<!doctype html><html lang="hu"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ádiért – e-mail előnézetek</title><style>body{margin:0;padding:24px 12px;background:#edf1f7;color:#0b1535;font:16px/1.5 Arial,sans-serif}main{max-width:880px;margin:auto}h1{font-size:28px}label{display:inline-block;padding:12px;cursor:pointer}details{margin:16px 0;border:1px solid #d7ddea;border-radius:12px;background:white;overflow:hidden}summary{padding:20px;cursor:pointer;font-weight:bold}iframe{display:block;width:100%;max-width:600px;height:1050px;margin:auto;border:0}#mobile:checked~.previews iframe{max-width:360px}p{color:#475569}</style><main><h1>Ádiért e-mail-sablonok</h1><p>Mintaadatokkal megjelenített előnézet. A gombok itt nem küldenek levelet és nem hitelesítenek fiókot. A levelezőprogramok megjelenítése eltérhet.</p><input type="radio" name="size" id="mobile" checked><label for="mobile">Mobil (360 px)</label><input type="radio" name="size" id="desktop"><label for="desktop">Asztali (600 px)</label><div class="previews">${cards.join('')}</div></main></html>`;
await mkdir(resolve(root, 'supabase/.temp'), { recursive: true });
await writeFile(resolve(root, 'supabase/.temp/email-preview.html'), preview);
console.log('Preview: supabase/.temp/email-preview.html');
