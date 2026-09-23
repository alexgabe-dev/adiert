'use client';

import { useEffect, useState } from 'react';
import { Check, LoaderCircle, MapPin, Search } from 'lucide-react';
import { ActionForm, Field } from './ActionForm';
import { teacherAuthAction } from '@/features/teacher/actions';

type School = { id: string; name: string; city: string };
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function RegistrationForm() {
  const [postal, setPostal] = useState('');
  const [city, setCity] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selected, setSelected] = useState<School | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (postal.length !== 4) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ postal_code: postal, city });
      void fetch(`/api/schools/registration?${params}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error('lookup');
          const data = (await response.json()) as { cities: string[]; schools: School[] };
          if (controller.signal.aborted) return;
          setCities(data.cities);
          setSchools(data.schools);
          setLoaded(true);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setError(true);
          setLoading(false);
        });
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [postal, city, retry]);
  const activeCity = city || (cities.length === 1 ? cities[0] : '');
  const filtered = schools.filter((s) => normalize(s.name).includes(normalize(search.trim())));
  function clearSchool() {
    setSelected(null);
    setSchools([]);
    setSearch('');
    setLoaded(false);
    setError(false);
  }
  return (
    <ActionForm
      action={teacherAuthAction}
      label="Regisztráció beküldése"
      disabled={!selected || loading}
    >
      <input type="hidden" name="mode" value="signup" />
      <input type="hidden" name="school_id" value={selected?.id ?? ''} />
      <input type="hidden" name="city" value={activeCity} />
      <fieldset className="min-w-0 space-y-4">
        <legend className="mb-3 text-base font-bold">1. Az iskolád</legend>
        <label className="block text-sm font-semibold" htmlFor="registration-postal">
          Irányítószám
        </label>
        <input
          id="registration-postal"
          name="postal_code"
          className="field"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="[0-9]{4}"
          maxLength={4}
          required
          value={postal}
          placeholder="Például: 4400"
          aria-describedby="postal-help"
          onChange={(e) => {
            const next = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
            setPostal(next);
            setCity('');
            setCities([]);
            clearSchool();
            setLoading(next.length === 4);
          }}
        />
        <p id="postal-help" className="text-xs leading-5 text-slate-500">
          Az iskola irányítószámát add meg.
        </p>
        <div aria-live="polite" role="status" className="text-sm text-slate-600">
          {loading && (
            <span className="flex items-center gap-2">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Iskolák keresése…
            </span>
          )}
          {loaded &&
            !cities.length &&
            'Ehhez az irányítószámhoz nem találtunk települést. Ellenőrizd a számot.'}
        </div>
        {error && (
          <div role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            A keresés most nem sikerült.
            <button
              type="button"
              className="ml-2 min-h-11 underline"
              onClick={() => {
                setError(false);
                setLoading(true);
                setRetry((r) => r + 1);
              }}
            >
              Újrapróbálom
            </button>
          </div>
        )}
        {cities.length > 1 ? (
          <div>
            <label htmlFor="registration-city" className="mb-2 block text-sm font-semibold">
              Település
            </label>
            <select
              id="registration-city"
              className="field"
              value={city}
              required
              onChange={(e) => {
                setCity(e.target.value);
                clearSchool();
                setLoading(true);
              }}
            >
              <option value="">Válassz települést</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ) : (
          activeCity && (
            <p className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {activeCity}
            </p>
          )
        )}
        {activeCity && !loading && !error && (
          <div className="space-y-3">
            <label htmlFor="registration-school-search" className="block text-sm font-semibold">
              Iskola keresése · {activeCity}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-4 size-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="registration-school-search"
                type="search"
                className="field pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kezdd el írni az iskola nevét"
                autoComplete="off"
              />
            </div>
            {selected && (
              <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-900">
                <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  <strong>Kiválasztva:</strong> {selected.name}
                </span>
              </div>
            )}
            <fieldset className="max-h-64 space-y-2 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 p-2">
              <legend className="sr-only">Válaszd ki az iskoládat</legend>
              {filtered.slice(0, 30).map((s) => (
                <label
                  key={s.id}
                  className={`flex min-h-12 cursor-pointer items-start gap-3 rounded-lg p-3 text-sm leading-6 ${selected?.id === s.id ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50'}`}
                >
                  <input
                    className="mt-1.5 size-4 shrink-0 accent-blue-600"
                    type="radio"
                    name="school_choice"
                    checked={selected?.id === s.id}
                    onChange={() => setSelected(s)}
                  />
                  <span>{s.name}</span>
                </label>
              ))}
              {!filtered.length && (
                <p className="p-3 text-sm leading-6 text-slate-500">
                  {schools.length
                    ? 'Nincs ilyen nevű iskola. Próbálj rövidebb névrészletet.'
                    : 'Ehhez a településhez még nincs választható általános iskola. Ellenőrizd az irányítószámot, vagy jelezd a szervezőknek: info@adiert.hu.'}
                </p>
              )}
            </fieldset>
            <p className="text-xs text-slate-500" aria-live="polite">
              {filtered.length > 30
                ? `${filtered.length} találat. Az első 30 látható; pontosíts a néven.`
                : `${filtered.length} iskola a településen a keresésed alapján.`}
            </p>
          </div>
        )}
      </fieldset>
      <fieldset className="space-y-4 border-t border-slate-100 pt-5">
        <legend className="pt-5 text-base font-bold">2. A kapcsolattartó adatai</legend>
        <Field
          label="Teljes neved"
          name="contact_name"
          autoComplete="name"
          minLength={2}
          maxLength={120}
        />
        <Field label="E-mail-cím" name="email" type="email" autoComplete="email" />
        <Field
          label="Jelszó (legalább 10 karakter)"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={128}
        />
      </fieldset>
      <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        Erősítsd meg az e-mail-címedet, majd várd meg a szervezők jóváhagyását. A tanári felületre
        csak az elfogadás után léphetsz be; a döntésről e-mailt küldünk.
      </p>
    </ActionForm>
  );
}
