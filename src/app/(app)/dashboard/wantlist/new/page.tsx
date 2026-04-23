import type { Metadata } from 'next';
import Link from 'next/link';

import { parseWantlistNewPrefill } from '@/lib/wantlist-new-prefill';

import { CreateWantlistForm } from '@/components/wantlist/create-wantlist-form';

export const metadata: Metadata = {
  title: 'New wantlist entry · Cratedb',
};

export default async function NewWantlistPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const prefill = parseWantlistNewPrefill(raw);

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
      <CreateWantlistForm defaults={prefill} />
    </div>
  );
}
