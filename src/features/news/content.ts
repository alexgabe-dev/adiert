import { z } from 'zod';

export const RICH_TEXT_PREFIX = 'adiert-richtext-v1:';
export const MAX_NEWS_CONTENT_LENGTH = 40000;

export function safeArticleUrl(value: string, image = false): boolean {
  try {
    const url = new URL(value);
    return image
      ? url.protocol === 'https:' && !url.username && !url.password
      : ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol);
  } catch {
    return false;
  }
}

const markSchema = z
  .object({
    type: z.enum(['bold', 'italic', 'underline', 'strike', 'code', 'link']),
    attrs: z.object({ href: z.string().refine((value) => safeArticleUrl(value)) }).optional(),
  })
  .refine((mark) => mark.type !== 'link' || Boolean(mark.attrs?.href));

export interface ArticleNode {
  type:
    | 'doc'
    | 'paragraph'
    | 'heading'
    | 'text'
    | 'hardBreak'
    | 'bulletList'
    | 'orderedList'
    | 'listItem'
    | 'blockquote'
    | 'horizontalRule'
    | 'image';
  text?: string;
  attrs?: {
    level?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify' | null;
    start?: number;
    src?: string;
    alt?: string | null;
    title?: string | null;
    width?: number | null;
    height?: number | null;
  };
  marks?: z.infer<typeof markSchema>[];
  content?: ArticleNode[];
}

const nodeSchema: z.ZodType<ArticleNode> = z.lazy(() =>
  z
    .object({
      type: z.enum([
        'doc',
        'paragraph',
        'heading',
        'text',
        'hardBreak',
        'bulletList',
        'orderedList',
        'listItem',
        'blockquote',
        'horizontalRule',
        'image',
      ]),
      text: z.string().optional(),
      attrs: z
        .object({
          level: z.number().int().min(2).max(3).optional(),
          textAlign: z.enum(['left', 'center', 'right', 'justify']).nullable().optional(),
          start: z.number().int().min(1).max(100000).optional(),
          src: z
            .string()
            .refine((value) => safeArticleUrl(value, true))
            .optional(),
          alt: z.string().max(500).nullable().optional(),
          title: z.string().max(500).nullable().optional(),
          width: z.number().int().positive().max(40000).nullable().optional(),
          height: z.number().int().positive().max(40000).nullable().optional(),
        })
        .optional(),
      marks: z.array(markSchema).max(6).optional(),
      content: z.array(nodeSchema).optional(),
    })
    .superRefine((node, context) => {
      const invalid = () =>
        context.addIssue({ code: 'custom', message: 'Invalid article structure' });
      if (node.type === 'text') {
        if (!node.text || node.content?.length) invalid();
      } else if (node.text !== undefined || (node.type !== 'hardBreak' && node.marks?.length))
        invalid();
      if (node.type === 'heading' && !node.attrs?.level) invalid();
      if (node.type === 'image' && !node.attrs?.src) invalid();
      const children = node.content ?? [];
      const blocks = [
        'paragraph',
        'heading',
        'bulletList',
        'orderedList',
        'blockquote',
        'horizontalRule',
        'image',
      ];
      if (['text', 'image', 'hardBreak', 'horizontalRule'].includes(node.type) && children.length)
        invalid();
      if (
        ['paragraph', 'heading'].includes(node.type) &&
        children.some((child) => !['text', 'hardBreak'].includes(child.type))
      )
        invalid();
      if (
        ['bulletList', 'orderedList'].includes(node.type) &&
        (!children.length || children.some((child) => child.type !== 'listItem'))
      )
        invalid();
      if (
        ['doc', 'blockquote', 'listItem'].includes(node.type) &&
        children.some((child) => !blocks.includes(child.type))
      )
        invalid();
      if (node.type === 'listItem' && children[0]?.type !== 'paragraph') invalid();
    }),
);

function hasSafeDepth(value: unknown, depth = 0): boolean {
  if (depth > 20 || !value || typeof value !== 'object') return false;
  const content = (value as { content?: unknown }).content;
  return (
    content === undefined ||
    (Array.isArray(content) && content.every((child) => hasSafeDepth(child, depth + 1)))
  );
}

export function parseRichContent(value: string): ArticleNode | null {
  if (!value.startsWith(RICH_TEXT_PREFIX) || value.length > MAX_NEWS_CONTENT_LENGTH) return null;
  try {
    const json: unknown = JSON.parse(value.slice(RICH_TEXT_PREFIX.length));
    if (!hasSafeDepth(json)) return null;
    const parsed = nodeSchema.safeParse(json);
    return parsed.success && parsed.data.type === 'doc' ? parsed.data : null;
  } catch {
    return null;
  }
}

export function articleDocument(value: string): ArticleNode {
  if (value.startsWith(RICH_TEXT_PREFIX))
    return parseRichContent(value) ?? { type: 'doc', content: [] };
  return {
    type: 'doc',
    content: value.split(/\r?\n\r?\n/).map((paragraph) => ({
      type: 'paragraph',
      content: paragraph
        .split(/\r?\n/)
        .flatMap((text, index): ArticleNode[] => [
          ...(index ? [{ type: 'hardBreak' as const }] : []),
          ...(text ? [{ type: 'text' as const, text }] : []),
        ]),
    })),
  };
}

export function articleText(node: ArticleNode): string {
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  return (node.content ?? [])
    .map(articleText)
    .join(['paragraph', 'heading'].includes(node.type) ? '' : ' ');
}

export function validArticleContent(value: string): boolean {
  if (!value.startsWith(RICH_TEXT_PREFIX)) return value.trim().length > 0;
  const doc = parseRichContent(value);
  return Boolean(doc && (articleText(doc).trim() || firstArticleImage(doc)));
}

export function firstArticleImage(node: ArticleNode): ArticleNode['attrs'] | undefined {
  if (node.type === 'image') return node.attrs;
  for (const child of node.content ?? []) {
    const image = firstArticleImage(child);
    if (image) return image;
  }
  return undefined;
}

export function slugFromTitle(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 180)
    .replace(/-$/, '');
}
