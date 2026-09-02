import React from 'react';
import { ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { PublishedNewsItem } from '@/features/public-data/types';

interface NewsSectionProps {
  items: PublishedNewsItem[];
}

export const NewsSection: React.FC<NewsSectionProps> = ({ items }) => {
  return (
    <section id="hirek" className="py-16 md:py-24 bg-[#F7F9FC] border-t border-[#E8ECF2]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold tracking-wider uppercase mb-3">
              <span>HÍREK ÉS FRISSÍTÉSEK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1535] tracking-tight">
              Friss hírek
            </h2>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-[#667085]">
            Legfrissebb közösségi mérföldkövek
          </span>
        </div>

        {/* 3 Compact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-[#E8ECF2] shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                {/* Header Tag and Icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    Hír
                  </span>
                  <span className="text-2xl p-1 bg-slate-50 rounded-xl">📣</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-[#667085] mb-2 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <time dateTime={item.publishedAt}>
                    {new Intl.DateTimeFormat('hu-HU', { dateStyle: 'long' }).format(
                      new Date(item.publishedAt),
                    )}
                  </time>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[#0B1535] mb-2.5 leading-snug">
                  {item.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs sm:text-sm text-[#667085] leading-relaxed mb-4">
                  {item.excerpt}
                </p>
              </div>

              {/* Action Link */}
              <div className="pt-3 border-t border-slate-100">
                <Link
                  href={`/hirek/${item.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600"
                >
                  <span>Tovább a cikkhez</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#E8ECF2] bg-white px-6 py-10 text-center text-sm text-[#667085]">
            Jelenleg nincs közzétett hír.
          </div>
        ) : null}
      </div>
    </section>
  );
};
