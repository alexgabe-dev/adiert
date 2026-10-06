'use client';

import { useState } from 'react';
import { Check, Copy, Facebook, Linkedin, MessageCircle } from 'lucide-react';

export function ArticleShare({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const links = [
    {
      label: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
  ];
  const buttonClass =
    'inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

  async function copyLink() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setManualCopy(false);
    } catch {
      setCopied(false);
      setManualCopy(true);
    }
  }

  return (
    <section aria-label="Cikk megosztása" className="mt-8 min-w-0 border-t border-slate-100 pt-6">
      <h2 className="mb-3 text-sm font-bold">Megosztás</h2>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {links.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass}
            aria-label={`Megosztás: ${label}`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </a>
        ))}
        <button type="button" onClick={copyLink} className={buttonClass}>
          {copied ? <Check className="size-4 shrink-0" /> : <Copy className="size-4 shrink-0" />}
          {copied ? 'Másolva' : 'Link másolása'}
        </button>
      </div>
      <p role="status" className={manualCopy ? 'mt-3 text-xs text-slate-500' : 'sr-only'}>
        {manualCopy ? 'Másold ki a linket:' : copied ? 'Link másolva.' : ''}
      </p>
      {manualCopy && (
        <input
          aria-label="Cikk linkje"
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="field mt-2 min-w-0 max-w-full text-sm"
        />
      )}
    </section>
  );
}
