const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
export function renderPortalEmail(
  subject: string,
  body: string,
  link?: string,
  label = 'Tanári felület megnyitása',
) {
  const text = `${body}${link ? `\n\n${label}: ${link}` : ''}\n\nÁdiért · Palackverseny\ninfo@palackverseny.hu`;
  const html = `<!doctype html><html lang="hu"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f3f6fb;color:#12233f;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e2e8f0;border-radius:20px"><tr><td style="padding:28px 24px"><p style="margin:0 0 24px;font-weight:bold;color:#175cff;font-size:18px">Ádiért. <span style="color:#64748b;font-size:13px">PALACKVERSENY</span></p><h1 style="font-size:25px;line-height:1.3;margin:0 0 20px">${escape(subject)}</h1><div style="font-size:16px;line-height:1.7;overflow-wrap:anywhere">${escape(body).replace(/\n/g, '<br>')}</div>${link ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px"><tr><td align="center" bgcolor="#175cff" style="border-radius:12px"><a href="${escape(link)}" style="display:block;padding:16px;color:#fff;text-decoration:none;font-size:16px;font-weight:bold">${escape(label)}</a></td></tr></table><p style="margin-top:20px;font-size:12px;line-height:1.6;color:#64748b;word-break:break-all">Ha a gomb nem működik, nyisd meg ezt a hivatkozást:<br><a href="${escape(link)}" style="color:#175cff">${escape(link)}</a></p>` : ''}<p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.7;color:#64748b">Kérdésed van? Írj az <a href="mailto:info@palackverseny.hu" style="color:#175cff">info@palackverseny.hu</a> címre.<br>Köszönjük, hogy velünk gyűjtesz Ádiért.</p></td></tr></table></td></tr></table></body></html>`;
  return { text, html };
}
