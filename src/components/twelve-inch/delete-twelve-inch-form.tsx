import { deleteTwelveInchAction } from '@/server/actions/twelve-inch-singles';

export function DeleteTwelveInchForm({
  twelveInchId,
}: {
  twelveInchId: string;
}) {
  return (
    <form action={deleteTwelveInchAction} className="inline">
      <input type="hidden" name="id" value={twelveInchId} />
      <button
        type="submit"
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </form>
  );
}
