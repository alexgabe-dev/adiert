export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-4 pt-32" aria-busy="true" aria-label="Betöltés">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-5 h-7 w-48 rounded-full bg-slate-100" />
        <div className="mb-4 h-14 max-w-2xl rounded-2xl bg-slate-100" />
        <div className="mb-10 h-7 max-w-xl rounded-xl bg-slate-100" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-28 rounded-2xl border border-slate-100 bg-slate-50" />
          ))}
        </div>
      </div>
    </main>
  );
}
