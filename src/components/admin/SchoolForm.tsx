import { schoolTypeLabels } from '@/features/public-data/types';
import { schoolTypes, type AdminSchool } from '@/features/admin/control-center';

interface SchoolFormProps {
  action: (formData: FormData) => void | Promise<void>;
  school?: Pick<
    AdminSchool,
    'id' | 'name' | 'slug' | 'type' | 'city' | 'county' | 'postal_code' | 'address' | 'active'
  >;
}

export function SchoolForm({ action, school }: SchoolFormProps) {
  return (
    <form action={action} className="grid gap-4 lg:grid-cols-2">
      {school ? <input type="hidden" name="school_id" value={school.id} /> : null}
      {school ? <input type="hidden" name="active" value={String(school.active)} /> : null}
      <Field label="Hivatalos név" name="name" defaultValue={school?.name} maxLength={240} />
      <Field label="Slug" name="slug" defaultValue={school?.slug} maxLength={180} />
      <div>
        <label htmlFor="school-type" className="mb-1.5 block text-sm font-bold">
          Intézménytípus
        </label>
        <select
          id="school-type"
          name="type"
          defaultValue={school?.type ?? 'other'}
          className="field"
        >
          {schoolTypes.map((type) => (
            <option key={type} value={type}>
              {schoolTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>
      <Field label="Település" name="city" defaultValue={school?.city} maxLength={120} />
      <Field label="Vármegye" name="county" defaultValue={school?.county} maxLength={120} />
      <Field
        label="Irányítószám (ha ismert)"
        name="postal_code"
        defaultValue={school?.postal_code ?? ''}
        inputMode="numeric"
        pattern="[0-9]{4}"
        required={false}
      />
      <div className="lg:col-span-2">
        <Field
          label="Cím (ha ismert)"
          name="address"
          defaultValue={school?.address ?? ''}
          maxLength={240}
          required={false}
        />
      </div>
      <div className="lg:col-span-2">
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white hover:bg-blue-700"
        >
          {school ? 'Változtatások mentése' : 'Iskola létrehozása'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue = '',
  required = true,
  ...inputProps
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
  inputMode?: 'numeric';
  pattern?: string;
}) {
  const id = `school-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold">
        {label}
      </label>
      <input
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="field"
        {...inputProps}
      />
    </div>
  );
}
