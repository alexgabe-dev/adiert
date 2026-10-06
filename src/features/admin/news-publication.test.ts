import { describe, expect, it } from 'vitest';
import {
  formatPublicationTime,
  newsPublicationLabel,
  parsePublicationTime,
} from './news-publication';

describe('news publication time', () => {
  it.each([
    ['2026-07-06T12:30', '2026-07-06T10:30:00.000Z'],
    ['2026-01-06T12:30', '2026-01-06T11:30:00.000Z'],
  ])('round trips Budapest time %s independently of the server timezone', (local, utc) => {
    expect(parsePublicationTime(local)?.toISOString()).toBe(utc);
    expect(formatPublicationTime(utc)).toBe(local);
  });

  it('rejects a nonexistent time during the spring clock change', () => {
    expect(parsePublicationTime('2026-03-29T02:30')).toBeNull();
  });

  it('distinguishes scheduled news from visible articles and drafts', () => {
    expect(newsPublicationLabel({ published: true, published_at: '2099-01-01T00:00:00Z' })).toBe(
      'Időzített',
    );
    expect(newsPublicationLabel({ published: true, published_at: '2020-01-01T00:00:00Z' })).toBe(
      'Publikált',
    );
    expect(newsPublicationLabel({ published: false, published_at: null })).toBe('Piszkozat');
  });
});
