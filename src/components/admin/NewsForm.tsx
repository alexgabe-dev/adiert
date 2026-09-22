import type { AdminNewsItem } from '@/features/admin/control-center';

interface NewsFormProps {
  action: (formData: FormData) => void | Promise<void>;
  item?: AdminNewsItem;
}

export function NewsForm({ action, item }: NewsFormProps) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="news_id" value={item?.id ?? ''} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Cím" name="title" defaultValue={item?.title} maxLength={200} />
        <Field label="URL-ben szereplő név" name="slug" defaultValue={item?.slug} maxLength={180} />
      </div>
      <div>
        <label htmlFor="news-excerpt" className="mb-1.5 block text-sm font-bold">
          Kivonat
        </label>
        <textarea
          id="news-excerpt"
          name="excerpt"
          required
          rows={3}
          maxLength={800}
          defaultValue={item?.excerpt}
          className="field"
        />
      </div>
      <div>
        <label htmlFor="news-content" className="mb-1.5 block text-sm font-bold">
          Tartalom
        </label>
        <textarea
          id="news-content"
          name="content"
          required
          rows={14}
          maxLength={40000}
          defaultValue={item?.content}
          className="field"
        />
        <p className="mt-1.5 text-xs text-[#667085]">
          Egyszerű szöveg. A publikus oldal nem értelmez HTML-t vagy beágyazott kódot.
        </p>
      </div>
      <div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-[auto_1fr] sm:items-end">
        <label className="flex min-h-11 items-center gap-3 text-sm font-bold">
          <input
            name="published"
            type="checkbox"
            defaultChecked={item?.published ?? false}
            className="h-5 w-5 rounded border-slate-300"
          />
          Közzétéve
        </label>
        <Field
          label="Publikálás időpontja"
          name="published_at"
          type="datetime-local"
          defaultValue={item?.published_at ? item.published_at.slice(0, 16) : ''}
          required={false}
        />
      </div>
      <button
        type="submit"
        className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white hover:bg-blue-700"
      >
        {item ? 'Hír mentése' : 'Hír létrehozása'}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue = '',
  required = true,
  type = 'text',
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
}) {
  const id = `news-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        defaultValue={defaultValue}
        className="field"
      />
    </div>
  );
}
