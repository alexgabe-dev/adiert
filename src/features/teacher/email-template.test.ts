import { describe, expect, it } from 'vitest';
import { renderPortalEmail } from './email-template';
describe('portal emails', () => {
  it('escapes admin text and preserves paragraphs', () => {
    const { html, text } = renderPortalEmail(
      '<script>bad</script>',
      'Hello\n<img src=x onerror=bad>',
      'https://www.palackverseny.hu/tanar',
    );
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
    expect(html).toContain('<br>');
    expect(text).toContain('Hello\n<img');
  });
  it('does not include an activation button in the receipt', () => {
    const { html } = renderPortalEmail('Megkaptuk', 'A jelentkezés ellenőrzésre vár.');
    expect(html).not.toContain('Tanári felület megnyitása');
    expect(html).not.toContain('/tanar');
  });
});
