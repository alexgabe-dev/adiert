export default function Loading() {
  return (
    <div
      role="status"
      className="mx-auto max-w-3xl animate-pulse space-y-5 px-4 py-12 motion-reduce:animate-none"
    >
      <span className="sr-only">Az iskolai felület betöltése…</span>
      <div className="h-8 w-2/3 rounded-xl bg-slate-200" />
      <div className="h-32 rounded-3xl bg-blue-100" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 rounded-2xl bg-slate-100" />
        <div className="h-40 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
