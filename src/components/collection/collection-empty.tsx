import Link from 'next/link';

type Props =
  | { variant: 'no-records' }
  | {
      variant: 'no-results';
      clearHref: string;
    };

export function CollectionEmpty(props: Props) {
  if (props.variant === 'no-records') {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Your collection is empty
        </p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add your first record to see it here.
        </p>
        <Link
          href="/dashboard/records/new"
          className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add record
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        No records match
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Try adjusting search or filters.
      </p>
      <Link
        href={props.clearHref}
        className="mt-4 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Clear filters
      </Link>
    </div>
  );
}
