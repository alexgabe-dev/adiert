import postalCodes from '@/data/postal-codes.json';

export function postalCities(code: string): string[] {
  return (postalCodes as Record<string, string[]>)[code] ?? [];
}

export function normalizeCity(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return /^budapest(?:\s|$)/.test(normalized) ? 'budapest' : normalized;
}

export function matchesPostalCity(postal: string, city: string) {
  return postalCities(postal).some((candidate) => normalizeCity(candidate) === normalizeCity(city));
}
