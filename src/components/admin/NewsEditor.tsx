'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extensions';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
  X,
  Upload,
  LoaderCircle,
} from 'lucide-react';
import { articleDocument, RICH_TEXT_PREFIX, safeArticleUrl } from '@/features/news/content';
import { MAX_NEWS_IMAGE_BYTES, NEWS_IMAGE_TYPES } from '@/features/news/image-shared';

interface NewsEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onUploadChange?: (uploading: boolean) => void;
}

export function NewsEditor({ initialContent, onChange, onUploadChange }: NewsEditorProps) {
  const [panel, setPanel] = useState<'link' | 'image' | null>(null);
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const uploadController = useRef<AbortController | null>(null);
  useEffect(() => () => uploadController.current?.abort(), []);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        link: {
          openOnClick: false,
          defaultProtocol: 'https',
          protocols: ['http', 'https', 'mailto', 'tel'],
        },
      }),
      ImageExtension.configure({ allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Cikk szövege…' }),
    ],
    content: articleDocument(initialContent),
    editorProps: {
      attributes: {
        class: 'article-content min-h-[420px] px-5 py-7 outline-none sm:px-10 sm:py-9',
        role: 'textbox',
        'aria-label': 'Cikk szövege',
        'aria-multiline': 'true',
      },
    },
    onUpdate: ({ editor: current }) =>
      onChange(RICH_TEXT_PREFIX + JSON.stringify(current.getJSON())),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      current
        ? {
            bold: current.isActive('bold'),
            italic: current.isActive('italic'),
            underline: current.isActive('underline'),
            strike: current.isActive('strike'),
            bulletList: current.isActive('bulletList'),
            orderedList: current.isActive('orderedList'),
            blockquote: current.isActive('blockquote'),
            link: current.isActive('link'),
            heading: current.isActive('heading', { level: 2 })
              ? '2'
              : current.isActive('heading', { level: 3 })
                ? '3'
                : 'p',
            align: current.isActive({ textAlign: 'center' })
              ? 'center'
              : current.isActive({ textAlign: 'right' })
                ? 'right'
                : 'left',
            undo: current.can().undo(),
            redo: current.can().redo(),
          }
        : null,
  });

  function openPanel(next: 'link' | 'image') {
    if (uploading) return;
    setPanel(panel === next ? null : next);
    setError('');
    setUrl(next === 'link' ? String(editor?.getAttributes('link').href ?? '') : '');
    setAlt('');
    setCaption('');
    setImageSize(null);
  }

  async function uploadImage(file: File | undefined) {
    if (!file || uploading) return;
    setError('');
    if (file.size > MAX_NEWS_IMAGE_BYTES) {
      setError('A kép legfeljebb 4 MB lehet.');
      return;
    }
    if (!(NEWS_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setError('JPG, PNG vagy WebP képet válassz.');
      return;
    }
    const controller = new AbortController();
    uploadController.current = controller;
    setUploading(true);
    onUploadChange?.(true);
    try {
      const body = new FormData();
      body.set('image', file);
      const response = await fetch('/api/admin/news/images', {
        method: 'POST',
        body,
        signal: controller.signal,
      });
      const result = (await response.json().catch(() => null)) as {
        url?: string;
        width?: number;
        height?: number;
        error?: string;
      } | null;
      if (!response.ok || !result?.url || !safeArticleUrl(result.url, true)) {
        setError(
          result?.error ||
            (response.status === 413
              ? 'A kép legfeljebb 4 MB lehet.'
              : 'A képfeltöltés nem sikerült. Próbáld újra.'),
        );
        return;
      }
      setUrl(result.url);
      setImageSize(
        result.width && result.height ? { width: result.width, height: result.height } : null,
      );
    } catch {
      if (!controller.signal.aborted) setError('A képfeltöltés nem sikerült. Próbáld újra.');
    } finally {
      if (!controller.signal.aborted) {
        setUploading(false);
        onUploadChange?.(false);
      }
    }
  }

  function insert() {
    if (!editor || !panel || uploading) return;
    const href = url.trim();
    if (!safeArticleUrl(href, panel === 'image')) {
      setError(
        panel === 'image'
          ? 'Adj meg egy teljes, https:// kezdetű képcímet.'
          : 'Adj meg egy teljes webcímet (https://…), e-mail- vagy telefonhivatkozást.',
      );
      return;
    }
    if (panel === 'image') {
      if (!alt.trim()) {
        setError('Írd le röviden, mi látható a képen.');
        return;
      }
      editor
        .chain()
        .focus()
        .setImage({ src: href, alt: alt.trim(), title: caption.trim() || undefined, ...imageSize })
        .run();
    } else if (editor.state.selection.empty && !editor.isActive('link')) {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setPanel(null);
  }

  return (
    <div>
      <div
        role="group"
        aria-label="Szövegformázás"
        className="sticky top-16 z-10 flex flex-wrap items-center gap-1 border-y border-slate-200 bg-slate-50/95 px-3 py-2 backdrop-blur"
      >
        <select
          aria-label="Bekezdés stílusa"
          disabled={!editor}
          value={state?.heading ?? 'p'}
          onChange={(event) => {
            if (event.target.value === 'p') editor?.chain().focus().setParagraph().run();
            else
              editor
                ?.chain()
                .focus()
                .setHeading({ level: Number(event.target.value) as 2 | 3 })
                .run();
          }}
          className="mr-1 min-h-10 max-w-36 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold"
        >
          <option value="p">Normál szöveg</option>
          <option value="2">Címsor</option>
          <option value="3">Alcím</option>
        </select>
        <Tool
          label="Félkövér (Ctrl+B)"
          active={state?.bold}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold />
        </Tool>
        <Tool
          label="Dőlt (Ctrl+I)"
          active={state?.italic}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </Tool>
        <Tool
          label="Aláhúzott (Ctrl+U)"
          active={state?.underline}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <Underline />
        </Tool>
        <Tool
          label="Áthúzott"
          active={state?.strike}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </Tool>
        <Divider />
        <Tool
          label="Felsorolás"
          active={state?.bulletList}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List />
        </Tool>
        <Tool
          label="Számozott lista"
          active={state?.orderedList}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </Tool>
        <Tool
          label="Idézet"
          active={state?.blockquote}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote />
        </Tool>
        <Divider />
        <Tool
          label="Balra igazítás"
          active={state?.align === 'left'}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft />
        </Tool>
        <Tool
          label="Középre igazítás"
          active={state?.align === 'center'}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter />
        </Tool>
        <Tool
          label="Jobbra igazítás"
          active={state?.align === 'right'}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight />
        </Tool>
        <Divider />
        <Tool
          label="Hivatkozás"
          active={state?.link || panel === 'link'}
          disabled={!editor}
          onClick={() => openPanel('link')}
        >
          <Link2 />
        </Tool>
        {state?.link && (
          <Tool
            label="Hivatkozás eltávolítása"
            onClick={() => editor?.chain().focus().unsetLink().run()}
          >
            <Unlink />
          </Tool>
        )}
        <Tool
          label="Kép beszúrása"
          active={panel === 'image'}
          disabled={!editor || uploading}
          onClick={() => openPanel('image')}
        >
          <ImagePlus />
          <span className="ml-1 text-xs font-semibold">Kép</span>
        </Tool>
        <Tool
          label="Elválasztó vonal"
          disabled={!editor}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus />
        </Tool>
        <div className="ml-auto flex">
          <Tool
            label="Visszavonás (Ctrl+Z)"
            disabled={!state?.undo}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 />
          </Tool>
          <Tool
            label="Újra (Ctrl+Shift+Z)"
            disabled={!state?.redo}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 />
          </Tool>
        </div>
      </div>
      {panel && (
        <div
          className="border-b border-blue-100 bg-blue-50/60 p-4 sm:px-6"
          role="group"
          aria-label={panel === 'image' ? 'Kép beállításai' : 'Hivatkozás beállításai'}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !uploading) {
              setPanel(null);
              editor?.commands.focus();
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              insert();
            }
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-sm">
              {panel === 'image' ? 'Kép hozzáadása' : 'Hivatkozás hozzáadása'}
            </strong>
            <Tool label="Beszúrás bezárása" disabled={uploading} onClick={() => setPanel(null)}>
              <X />
            </Tool>
          </div>
          {panel === 'image' && (
            <div className="mb-4 min-w-0">
              <label
                className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-white p-4 text-center text-sm font-semibold text-blue-700 ${uploading ? 'opacity-60' : 'cursor-pointer hover:bg-blue-50'} focus-within:outline-2 focus-within:outline-blue-500`}
              >
                {uploading ? (
                  <LoaderCircle className="size-5 animate-spin" />
                ) : (
                  <Upload className="size-5" />
                )}
                <span>{uploading ? 'Feltöltés…' : 'Kép feltöltése'}</span>
                <input
                  type="file"
                  accept={NEWS_IMAGE_TYPES.join(',')}
                  disabled={uploading}
                  className="sr-only"
                  aria-label="Kép feltöltése"
                  onChange={(event) => {
                    void uploadImage(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
                <span className="text-xs font-normal text-slate-500">
                  JPG, PNG, WebP · legfeljebb 4 MB
                </span>
              </label>
              {url && safeArticleUrl(url, true) && (
                <div className="mt-3 overflow-hidden rounded-lg bg-slate-100">
                  <Image
                    src={url}
                    alt={alt || 'Kép előnézete'}
                    width={imageSize?.width ?? 800}
                    height={imageSize?.height ?? 500}
                    unoptimized
                    className="mx-auto max-h-52 w-auto max-w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
          <label className="block text-xs font-semibold">
            {panel === 'image' ? 'Vagy kép webcíme' : 'Hivatkozás címe'}
            <input
              autoFocus={panel === 'link'}
              disabled={uploading}
              type="url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setImageSize(null);
              }}
              placeholder="https://…"
              className="field mt-1"
            />
          </label>
          {panel === 'image' && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">
                Kép leírása
                <input
                  className="field mt-1"
                  value={alt}
                  maxLength={500}
                  onChange={(event) => setAlt(event.target.value)}
                  placeholder="Mi látható a képen?"
                />
              </label>
              <label className="text-xs font-semibold">
                Képaláírás (opcionális)
                <input
                  className="field mt-1"
                  value={caption}
                  maxLength={500}
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="A kép alatt jelenik meg"
                />
              </label>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={insert}
              disabled={uploading}
              className="ml-auto min-h-10 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Beszúrás
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
      {!editor && (
        <p role="status" className="px-10 pt-8 text-sm text-slate-400">
          A szerkesztő betöltése…
        </p>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />;
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg px-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-30 [&_svg]:size-4 ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-white hover:text-slate-950'}`}
    >
      {children}
    </button>
  );
}
