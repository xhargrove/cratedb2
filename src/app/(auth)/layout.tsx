export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      >
        <div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-amber-500/12 blur-3xl dark:bg-amber-500/8" />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-xl shadow-zinc-900/5 ring-1 ring-accent/10 dark:bg-surface dark:shadow-black/40 dark:ring-accent/15">
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Cratedb
        </p>
        {children}
      </div>
    </div>
  );
}
