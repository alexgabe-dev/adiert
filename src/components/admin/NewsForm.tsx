'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Globe2,
  LoaderCircle,
  PencilLine,
  Save,
} from 'lucide-react';
import type { AdminNewsItem } from '@/features/admin/control-center';
import { formatPublicationTime } from '@/features/admin/news-publication';
import {
  articleDocument,
  articleText,
  MAX_NEWS_CONTENT_LENGTH,
  slugFromTitle,
  validArticleContent,
} from '@/features/news/content';
import { ArticleContent } from '@/components/news/ArticleContent';
import { NewsEditor } from '@/components/admin/NewsEditor';

interface NewsFormProps {
  action: (formData: FormData) => void | Promise<void>;
  item?: AdminNewsItem;
}

export function NewsForm({ action, item }: NewsFormProps) {
  const [title, setTitle] = useState(item?.title ?? '');
  const [slug, setSlug] = useState(item?.slug ?? '');
  const [customSlug, setCustomSlug] = useState(Boolean(item));
  const [excerpt, setExcerpt] = useState(item?.excerpt ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [published, setPublished] = useState(item?.published ?? false);
  const [date, setDate] = useState(
    item?.published_at ? formatPublicationTime(item.published_at) : '',
  );
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const text = articleText(articleDocument(content)).trim();
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const contentValid = content.length <= MAX_NEWS_CONTENT_LENGTH && validArticleContent(content);
  const ready =
    title.trim().length >= 2 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
    slug.length >= 2 &&
    Boolean(excerpt.trim()) &&
    contentValid;
  const checklist = [
    { label: 'Beszédes cím', complete: title.trim().length >= 2 },
    { label: 'Rövid bevezető', complete: Boolean(excerpt.trim()) },
    { label: 'Cikk szövege', complete: contentValid },
  ];

  useEffect(() => {
    if (!dirty) return;
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [dirty]);

  return (
    <form
      action={action}
      onInvalid={() => setPreview(false)}
      onChange={() => {
        setDirty(true);
        setError('');
      }}
      onSubmit={(event) => {
        if (!ready) {
          event.preventDefault();
          setError(
            content.length > MAX_NEWS_CONTENT_LENGTH
              ? 'A cikk túl hosszú. Rövidíts a szövegen vagy csökkentsd a formázások számát.'
              : 'A mentéshez töltsd ki a címet, a kivonatot, a webcímet és a cikk szövegét.',
          );
        }
      }}
      className="space-y-5"
    >
      <input type="hidden" name="news_id" value={item?.id ?? ''} />
      <input type="hidden" name="content" value={content} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className={`size-2 rounded-full ${dirty ? 'bg-amber-400' : 'bg-emerald-500'}`} />
          <span>
            {dirty
              ? 'Nem mentett módosítások'
              : item
                ? 'Minden módosítás mentve'
                : 'Új cikk · még nincs mentve'}
          </span>
        </div>
        <div
          className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs"
          role="group"
          aria-label="Szerkesztő nézete"
        >
          <button
            type="button"
            aria-pressed={!preview}
            onClick={() => setPreview(false)}
            className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-bold ${!preview ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <PencilLine className="size-4" />
            Szerkesztés
          </button>
          <button
            type="button"
            aria-pressed={preview}
            onClick={() => setPreview(true)}
            className={`flex min-h-10 items-center gap-2 rounded-lg px-4 text-xs font-bold ${preview ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Eye className="size-4" />
            Előnézet
          </button>
        </div>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div
            hidden={preview}
            className="overflow-clip rounded-2xl border border-slate-200 bg-white shadow-xs"
          >
            <div className="px-5 pt-7 pb-6 sm:px-10 sm:pt-9">
              <div className="mb-6 flex items-center gap-2 text-[10px] font-extrabold tracking-[0.18em] text-blue-600 uppercase">
                <FileText className="size-4" />
                Egy történet, ami számít
              </div>
              <label htmlFor="news-title" className="sr-only">
                Cikk címe
              </label>
              <textarea
                id="news-title"
                name="title"
                required
                minLength={2}
                maxLength={200}
                rows={2}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (!customSlug) setSlug(slugFromTitle(event.target.value));
                }}
                placeholder="Adj címet a történetnek…"
                className="w-full resize-none border-0 bg-transparent text-3xl font-extrabold leading-tight tracking-tight text-slate-900 outline-none placeholder:text-slate-300 sm:text-4xl"
              />
              <div className="mt-2 flex justify-end text-[10px] tabular-nums text-slate-400">
                {title.length} / 200
              </div>
              <label htmlFor="news-excerpt" className="mt-5 block text-xs font-bold text-slate-700">
                Bevezető / kivonat
              </label>
              <textarea
                id="news-excerpt"
                name="excerpt"
                required
                maxLength={800}
                rows={3}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                placeholder="Foglalj össze néhány mondatban, miről szól a cikk. Ez jelenik meg a főoldali hírkártyán is."
                className="mt-2 w-full resize-y rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm leading-6 text-slate-600 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-50"
              />
              <div className="mt-1 text-right text-[10px] tabular-nums text-slate-400">
                {excerpt.length} / 800
              </div>
            </div>
            <NewsEditor
              initialContent={item?.content ?? ''}
              onChange={(value) => {
                setContent(value);
                setDirty(true);
                setError('');
              }}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-[11px] text-slate-500 sm:px-10">
              <span>
                {words.toLocaleString('hu-HU')} szó <span className="mx-2 text-slate-300">/</span>{' '}
                {text.length.toLocaleString('hu-HU')} karakter
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-3.5" />
                {minutes} perc olvasás
              </span>
            </div>
          </div>
          {preview && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-5 py-3 text-xs font-medium text-blue-700">
                <Eye className="size-4" />
                Cikkelőnézet · a még nem mentett módosításokkal
              </div>
              <article className="px-5 py-8 sm:px-10 sm:py-12">
                <div className="mb-4 flex items-center gap-3 text-xs font-semibold text-blue-600">
                  <span>HÍREK</span>
                  <span className="text-slate-300">•</span>
                  <span>{minutes} perc olvasás</span>
                </div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
                  {title || 'A cikk címe'}
                </h1>
                <p className="mt-5 text-base leading-7 text-slate-500">
                  {excerpt || 'Itt jelenik meg a bevezető.'}
                </p>
                <div className="mt-8 border-t border-slate-100 pt-8">
                  {text ? (
                    <ArticleContent content={content} />
                  ) : (
                    <p className="text-sm text-slate-400">A cikk szövege még üres.</p>
                  )}
                </div>
              </article>
            </div>
          )}
          {content.length > MAX_NEWS_CONTENT_LENGTH && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              A cikk túllépte a menthető méretet. Rövidíts a szövegen vagy csökkentsd a formázások
              számát.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <aside className="space-y-4 xl:sticky xl:top-24" aria-label="Cikk beállításai">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <Globe2 className="size-4 text-blue-600" />
              Megjelenés
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Te döntöd el, mikor osztod meg a történetet.
            </p>
            <label
              className={`mt-5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 ${published ? 'border-blue-200 bg-blue-50/60' : 'border-slate-200 bg-slate-50'}`}
            >
              <span>
                <span className="block text-xs font-bold">Nyilvános cikk</span>
                <span className="mt-1 block text-[11px] text-slate-500">
                  {published ? 'Megjelenhet a honlapon' : 'Csak az adminok látják'}
                </span>
              </span>
              <input
                type="checkbox"
                name="published"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
                className="size-5 shrink-0 accent-blue-600"
              />
            </label>
            <label htmlFor="news-date" className="mt-5 block text-xs font-bold">
              Publikálás időpontja
            </label>
            <input
              id="news-date"
              name="published_at"
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="field mt-2 text-xs"
            />
            <div className="mt-2 flex items-start justify-between gap-2">
              <p className="text-[11px] leading-5 text-slate-500">
                Budapesti idő. Üresen hagyva azonnal megjelenik, ha nyilvános.
              </p>
              {date && (
                <button
                  type="button"
                  onClick={() => {
                    setDate('');
                    setDirty(true);
                  }}
                  className="min-h-8 shrink-0 text-[11px] font-bold text-blue-600"
                >
                  Törlés
                </button>
              )}
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <SaveButton published={published} date={date} />
              <p className="mt-2 text-center text-[10px] text-slate-400">
                A változtatások mentés után érvényesek.
              </p>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-extrabold">Webcím és megosztás</h2>
            <label htmlFor="news-slug" className="mt-4 block text-xs font-bold text-slate-600">
              URL-ben szereplő név
            </label>
            <div className="mt-2 flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-blue-400">
              <span className="text-xs text-slate-400">/hirek/</span>
              <input
                id="news-slug"
                name="slug"
                required
                minLength={2}
                maxLength={180}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Kisbetűk, számok és a szavak között kötőjelek."
                value={slug}
                onChange={(event) => {
                  setCustomSlug(true);
                  setSlug(event.target.value);
                }}
                className="min-h-11 w-full min-w-0 bg-transparent pl-1 text-xs outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSlug(slugFromTitle(title));
                setCustomSlug(false);
                setDirty(true);
              }}
              className="mt-2 min-h-8 text-[11px] font-bold text-blue-600 hover:underline"
            >
              Újragenerálás a címből
            </button>
            {item && (
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                A webcím módosításával a korábban megosztott link megváltozik.
              </p>
            )}
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-3">
              <p className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Keresési előnézet
              </p>
              <p className="truncate text-[10px] text-emerald-700">
                /hirek/{slug || 'a-cikk-webcime'}
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-blue-700">
                {title || 'A cikk címe'}
              </p>
              <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-slate-500">
                {excerpt || 'A rövid bevezető segít az olvasóknak eldönteni, miről szól a cikk.'}
              </p>
            </div>
            {item?.published && (
              <a
                href={`/hirek/${item.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex min-h-9 items-center justify-center gap-2 text-xs font-bold text-blue-600"
              >
                Mentett cikk megnyitása
                <ArrowUpRight className="size-3.5" />
              </a>
            )}
          </section>
          <section className="rounded-2xl border border-slate-200/70 bg-slate-50 p-5">
            <h2 className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
              <CheckCircle2 className="size-4" />
              Készen áll a megjelenésre?
            </h2>
            <ul className="mt-4 space-y-3">
              {checklist.map((entry) => (
                <li key={entry.label} className="flex items-center gap-2.5 text-xs">
                  <span
                    className={`flex size-4 items-center justify-center rounded-full ${entry.complete ? 'bg-emerald-100 text-emerald-700' : 'border border-slate-300'}`}
                  >
                    {entry.complete && <Check className="size-3" />}
                  </span>
                  <span className={entry.complete ? 'text-slate-600' : 'text-slate-400'}>
                    {entry.label}
                  </span>
                  <span className="sr-only">{entry.complete ? 'Kész' : 'Hiányzik'}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </form>
  );
}

function SaveButton({ published, date }: { published: boolean; date: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-sm shadow-blue-600/15 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
      {pending
        ? 'Mentés folyamatban…'
        : !published
          ? 'Piszkozat mentése'
          : date
            ? 'Cikk mentése'
            : 'Mentés és közzététel'}
    </button>
  );
}
