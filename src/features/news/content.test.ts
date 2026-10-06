import { describe, expect, it } from 'vitest';
import {
  articleDocument,
  articleText,
  parseRichContent,
  RICH_TEXT_PREFIX,
  slugFromTitle,
  validArticleContent,
} from './content';

const encode = (value: unknown) => RICH_TEXT_PREFIX + JSON.stringify(value);
const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'Ádi története' }] };

describe('article content storage', () => {
  it('preserves legacy paragraphs, line breaks and literal HTML', () => {
    const doc = articleDocument('Első sor\nMásodik sor\n\n<script>literal</script>');
    expect(doc.content).toHaveLength(2);
    expect(doc.content?.[0]?.content?.[1]?.type).toBe('hardBreak');
    expect(articleText(doc)).toContain('<script>literal</script>');
  });

  it('round trips formatted documents with captions and safe links', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, textAlign: 'center' },
          content: [{ type: 'text', text: 'Címsor' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Link',
              marks: [
                { type: 'bold' },
                { type: 'link', attrs: { href: 'https://example.com', target: '_blank' } },
              ],
            },
          ],
        },
        {
          type: 'image',
          attrs: { src: 'https://example.com/photo.jpg', alt: 'Gyűjtés', title: 'Az első nap' },
        },
      ],
    };
    expect(validArticleContent(encode(doc))).toBe(true);
    expect(parseRichContent(encode(doc))?.content?.[2]?.attrs?.title).toBe('Az első nap');
    expect(articleText(articleDocument(encode(doc)))).toBe('Címsor Link ');
  });

  it.each(['javascript:alert(1)', 'data:text/html,hello', '//example.com'])(
    'rejects unsafe link %s',
    (href) => {
      expect(
        validArticleContent(
          encode({
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'Link', marks: [{ type: 'link', attrs: { href } }] },
                ],
              },
            ],
          }),
        ),
      ).toBe(false);
    },
  );

  it('rejects unknown nodes, malformed structures, empty content and excessive nesting', () => {
    expect(
      parseRichContent(encode({ type: 'doc', content: [{ type: 'script', text: 'alert(1)' }] })),
    ).toBeNull();
    expect(
      parseRichContent(
        encode({ type: 'doc', content: [{ type: 'paragraph', content: [paragraph] }] }),
      ),
    ).toBeNull();
    expect(validArticleContent(encode({ type: 'doc', content: [{ type: 'paragraph' }] }))).toBe(
      false,
    );
    expect(parseRichContent(RICH_TEXT_PREFIX + '{broken')).toBeNull();
    let nested: unknown = paragraph;
    for (let index = 0; index < 25; index++) nested = { type: 'blockquote', content: [nested] };
    expect(parseRichContent(encode({ type: 'doc', content: [nested] }))).toBeNull();
  });

  it('generates readable Hungarian slugs', () => {
    expect(slugFromTitle('Ádiért: Összefogás az iskolákban!')).toBe(
      'adiert-osszefogas-az-iskolakban',
    );
  });
});
