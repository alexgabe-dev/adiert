export function AdminFlash({ success, error }: { success?: string; error?: string }) {
  const message = error ?? success;
  if (!message) return null;
  return (
    <p
      role={error ? 'alert' : 'status'}
      className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}
    >
      {message}
    </p>
  );
}
