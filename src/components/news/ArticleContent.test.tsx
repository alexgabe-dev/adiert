import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ArticleContent } from './ArticleContent';
import { RICH_TEXT_PREFIX } from '@/features/news/content';

it('renders formatted articles as semantic elements without evaluating legacy HTML', () => {
  const { container, rerender } = render(
    <ArticleContent
      content={
        RICH_TEXT_PREFIX +
        JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Közösen sikerül' }],
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Első lépés', marks: [{ type: 'bold' }] }],
                    },
                  ],
                },
              ],
            },
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'További információ',
                  marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
                },
              ],
            },
          ],
        })
      }
    />,
  );
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Közösen sikerül');
  expect(screen.getByRole('listitem').querySelector('strong')).toHaveTextContent('Első lépés');
  expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  rerender(<ArticleContent content={'<script>alert(1)</script>\n\nRégi cikk'} />);
  expect(container.querySelector('script')).toBeNull();
  expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  expect(screen.getByText('Régi cikk')).toBeInTheDocument();
});
