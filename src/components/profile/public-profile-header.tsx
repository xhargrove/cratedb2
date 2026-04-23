import { initialsFromDisplayLabel } from '@/lib/profile-initials';

export function PublicProfileHeader({
  displayLabel,
  vibeLabel,
  bio,
}: {
  displayLabel: string;
  vibeLabel: string;
  bio: string | null;
}) {
  const initials = initialsFromDisplayLabel(displayLabel);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-500/[0.07] via-white to-zinc-50 shadow-sm dark:border-zinc-800 dark:from-amber-500/[0.08] dark:via-zinc-950 dark:to-zinc-900">
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-semibold tracking-tight text-white shadow-inner dark:bg-zinc-100 dark:text-zinc-900"
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {displayLabel}
            </h1>
            <p className="mt-2">
              <span className="inline-flex items-center rounded-full border border-amber-700/25 bg-amber-500/15 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-100">
                {vibeLabel}
              </span>
            </p>
          </div>
          {bio ? (
            <p className="max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {bio}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
