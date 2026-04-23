import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireUser } from '@/server/auth/require-user';
import { getWantlistItemByIdForOwner } from '@/server/wantlist/get-by-id-for-owner';

import { EditWantlistForm } from '@/components/wantlist/edit-wantlist-form';

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: 'Edit wantlist · Cratedb',
};

export default async function EditWantlistPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const item = await getWantlistItemByIdForOwner(id, user.id);
  if (!item) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/wantlist"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Wantlist
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Edit wantlist entry
      </h1>
      <EditWantlistForm item={item} />
    </div>
  );
}
