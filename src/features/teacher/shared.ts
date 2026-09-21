import { z } from 'zod';

export const applicationSchema = z.object({
  school_id: z.preprocess((v) => (v === '' ? null : v), z.uuid().nullable()),
  school_name: z.string().trim().min(2).max(240),
  city: z.string().trim().min(2).max(120),
  postal_code: z.string().regex(/^\d{4}$/),
  contact_name: z.string().trim().min(2).max(120),
});
export const uploadDetailsSchema = z
  .object({
    count: z.coerce.number().int().min(1).max(100000),
    date: z.iso
      .date()
      .refine(
        (v) =>
          v >= '2024-01-01' &&
          v <= new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' }),
      ),
    note: z.string().trim().max(500).default(''),
    revision: z.preprocess((v) => (v === '' || v === null ? undefined : v), z.uuid().optional()),
    version: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.coerce.number().int().positive().optional(),
    ),
  })
  .refine((v) => v.count >= 50 || v.note.length >= 5, {
    message: '50 palack alatt rövid indoklás szükséges.',
  })
  .refine((v) => !v.revision || !!v.version);
export interface ActionState {
  status: 'idle' | 'error' | 'success';
  message: string;
}
export const initialActionState: ActionState = { status: 'idle', message: '' };
export const statusLabels: Record<string, string> = {
  pending: 'Ellenőrzésre vár',
  needs_review: 'Javítást kérünk',
  approved: 'Jóváhagyva',
  rejected: 'Elutasítva',
  needs_changes: 'Pontosítást kérünk',
};
export function friendlyError(message: string) {
  if (message.includes('teacher_limit'))
    return 'Az iskolához legfeljebb 10 további tanár tartozhat, a függő meghívókkal együtt.';
  if (message.includes('school_has_owner'))
    return 'Ennek az iskolának már van adminja. A kapcsolattartók között kezelheted a hozzáférést.';
  if (message.includes('school_exists_select_it'))
    return 'Ez az iskola már szerepel az adatbázisban. Válaszd ki a meglévő intézményt.';
  if (message.includes('already_member'))
    return 'Ehhez a felhasználóhoz már tartozik aktív iskolai tagság.';
  if (message.includes('stale'))
    return 'Az adatokat közben módosították. Frissítsd az oldalt, majd próbáld újra.';
  if (message.includes('invitation_expired'))
    return 'A meghívó már nem érvényes. Kérj új meghívást az iskolai admintól.';
  if (message.includes('duplicate')) return 'Ez a meghívás vagy jelentkezés már létezik.';
  return 'A műveletet nem sikerült menteni. Ellenőrizd az adatokat és a jogosultságodat.';
}
export function csvCell(value: unknown) {
  const text = String(value ?? '');
  return '"' + (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') + '"';
}
