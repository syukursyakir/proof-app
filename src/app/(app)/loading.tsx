// Shown instantly on navigation between app pages (dashboard/roles/candidates/
// settings) while the server renders. Enables partial prefetch + instant
// client transitions for these dynamic routes — kills the perceived nav lag.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-10">
      <div className="animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-card" />
        <div className="mt-3 h-4 w-72 rounded bg-card" />

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border border-border bg-card/60" />
          ))}
        </div>

        <div className="mt-10 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-border bg-card/50" />
          ))}
        </div>
      </div>
    </main>
  );
}
