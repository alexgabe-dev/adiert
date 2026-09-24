'use client';
import { useEffect, useState } from 'react';
import { Check, Mail, Send } from 'lucide-react';
import { ActionForm } from '@/components/teacher/ActionForm';
import { sendTeacherMessage } from '@/features/admin/portal-actions';
type Recipient = { id: string; name: string; email: string; school: string };
export function TeacherMessageComposer({
  recipients: initialRecipients,
  messageId,
  truncated: initiallyTruncated,
}: {
  recipients: Recipient[];
  messageId: string;
  truncated: boolean;
}) {
  const [draftId, setDraftId] = useState(messageId);
  const [chosen, setChosen] = useState<Recipient[]>([]);
  const [recipients, setRecipients] = useState(initialRecipients);
  const [truncated, setTruncated] = useState(initiallyTruncated);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(`/api/admin/teachers?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then(async (r) => {
          if (!r.ok) throw new Error('search');
          return r.json();
        })
        .then((data: { recipients: Recipient[]; truncated: boolean }) => {
          if (!controller.signal.aborted) {
            setRecipients(data.recipients);
            setTruncated(data.truncated);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSearchError(true);
            setLoading(false);
          }
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [review, setReview] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <>
      <ActionForm
        key={draftId}
        action={async (state, form) => {
          const result = await sendTeacherMessage(state, form);
          if (result.status === 'success') setSent(true);
          return result;
        }}
        label="Üzenet elküldése"
        disabled={
          sent || !review || !chosen.length || subject.trim().length < 3 || body.trim().length < 10
        }
        className="space-y-5"
      >
        <input type="hidden" name="message_id" value={draftId} />
        {chosen.map((r) => (
          <input key={r.id} type="hidden" name="users" value={r.id} />
        ))}
        <fieldset
          disabled={sent}
          className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6"
        >
          <legend className="sr-only">Címzettek és üzenet</legend>
          <h2 className="flex items-center gap-2 font-bold">
            <Mail className="size-5 text-blue-600" aria-hidden="true" /> Címzettek{' '}
            <span className="ml-auto rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
              {chosen.length} kiválasztva
            </span>
          </h2>
          <label className="mt-4 block text-sm font-semibold">
            Tanár keresése
            <input
              className="field mt-2"
              value={query}
              placeholder="Név vagy e-mail-cím"
              maxLength={100}
              onChange={(e) => {
                setQuery(e.target.value);
                setLoading(true);
                setSearchError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
          </label>
          <p role="status" className="mt-2 text-xs text-slate-500">
            {loading
              ? 'Keresés…'
              : searchError
                ? 'A keresés nem sikerült. Próbáld meg újra beírni a nevet.'
                : 'Legfeljebb 50 tanárt választhatsz. A kijelölések keresés közben megmaradnak.'}
          </p>
          {chosen.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {chosen.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`${r.name} eltávolítása`}
                  className="min-h-11 max-w-full break-words rounded-xl bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-800"
                  onClick={() => {
                    setChosen(chosen.filter((c) => c.id !== r.id));
                    setReview(false);
                  }}
                >
                  {r.name} ×
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto overscroll-contain">
            {recipients.map((r) => (
              <label
                key={r.id}
                className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3 ${chosen.some((c) => c.id === r.id) ? 'border-blue-200 bg-blue-50' : 'border-slate-100 hover:bg-slate-50'}`}
              >
                <input
                  type="checkbox"
                  disabled={loading || (chosen.length >= 50 && !chosen.some((c) => c.id === r.id))}
                  className="mt-1 size-5 shrink-0 accent-blue-600"
                  checked={chosen.some((c) => c.id === r.id)}
                  onChange={(e) => {
                    setChosen(
                      e.target.checked ? [...chosen, r] : chosen.filter((c) => c.id !== r.id),
                    );
                    setReview(false);
                  }}
                />
                <span className="min-w-0 text-sm">
                  <strong className="block break-words">{r.name}</strong>
                  <span className="block break-all text-slate-600">{r.email}</span>
                  <span className="mt-1 block break-words text-xs text-slate-500">{r.school}</span>
                </span>
              </label>
            ))}
            {!recipients.length && (
              <p className="py-4 text-sm text-slate-500">
                Nincs ilyen nevű vagy e-mail-című aktív tanár.
              </p>
            )}
          </div>
          {truncated && (
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Az első 50 találat látható. Pontosíts a keresésen, ha nem találod a címzettet.
            </p>
          )}
          <label className="mt-6 block text-sm font-semibold">
            Tárgy
            <input
              name="subject"
              className="field mt-2"
              minLength={3}
              maxLength={160}
              required
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setReview(false);
              }}
              placeholder="Például: A következő gyűjtési nap"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Üzenet
            <textarea
              name="body"
              className="field mt-2 min-h-48 resize-y"
              minLength={10}
              maxLength={5000}
              required
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setReview(false);
              }}
              placeholder="Írd meg a tanároknak, amit szeretnél megosztani…"
            />
          </label>
          <p className="mt-2 text-right text-xs text-slate-500">{body.length} / 5000</p>
        </fieldset>
        <button
          type="button"
          disabled={sent || !chosen.length || subject.trim().length < 3 || body.trim().length < 10}
          onClick={() => setReview(true)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold disabled:opacity-50"
        >
          <Send className="size-4" aria-hidden="true" /> Küldés előtti ellenőrzés
        </button>
        {review && (
          <section
            aria-label="Üzenet előnézete"
            className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6"
          >
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Check className="size-4" aria-hidden="true" /> Előnézet · {chosen.length} címzett
            </p>
            <p className="mt-3 break-words text-sm text-slate-600">
              {chosen.map((r) => r.name).join(', ')}
            </p>
            <h2 className="mt-5 break-words text-xl font-bold">{subject}</h2>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7">{body}</p>
            <p className="mt-6 border-t border-blue-200 pt-4 text-xs leading-5 text-slate-500">
              Feladó: Ádiért · info@palackverseny.hu. A levél a tanári felület hivatkozását is
              tartalmazza.
            </p>
          </section>
        )}
      </ActionForm>
      {sent && (
        <button
          type="button"
          className="mt-4 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-semibold"
          onClick={() => {
            setDraftId(crypto.randomUUID());
            setSubject('');
            setBody('');
            setChosen([]);
            setReview(false);
            setSent(false);
          }}
        >
          Új üzenet írása
        </button>
      )}
    </>
  );
}
