import { requireUser } from '@/server/auth/require-user';
import { logoutAction } from '@/server/actions/auth';

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {user.profile?.displayName?.trim() || user.email}
          </span>
          <span className="ml-2 text-zinc-500 dark:text-zinc-400">
            ({user.email})
          </span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Log out
          </button>
        </form>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
    </div>
  );
}
