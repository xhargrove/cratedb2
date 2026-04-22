import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        Page not found
      </h2>
      <Link
        href="/"
        className="text-sm text-neutral-600 underline underline-offset-4 dark:text-neutral-400"
      >
        Back to home
      </Link>
    </div>
  );
}
