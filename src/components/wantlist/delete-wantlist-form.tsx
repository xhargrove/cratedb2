import { deleteWantlistItemAction } from '@/server/actions/wantlist';

export function DeleteWantlistForm({ itemId }: { itemId: string }) {
  return (
    <form action={deleteWantlistItemAction} className="inline">
      <input type="hidden" name="id" value={itemId} />
      <button
        type="submit"
        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950"
      >
        Remove
      </button>
    </form>
  );
}
