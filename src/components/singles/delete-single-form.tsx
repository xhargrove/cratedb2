import { deleteSingleAction } from '@/server/actions/singles';

export function DeleteSingleForm({ singleId }: { singleId: string }) {
  return (
    <form action={deleteSingleAction} className="inline">
      <input type="hidden" name="id" value={singleId} />
      <button
        type="submit"
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </form>
  );
}
