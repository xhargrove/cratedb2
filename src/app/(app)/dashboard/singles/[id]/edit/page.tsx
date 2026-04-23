import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EditSingleForm } from '@/components/singles/edit-single-form';
import { requireUser } from '@/server/auth/require-user';
import { getSingleByIdForOwner } from '@/server/singles/get-by-id-for-owner';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit single ${id.slice(0, 8)}… · Cratedb`,
  };
}

export default async function EditSinglePage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const single = await getSingleByIdForOwner(id, user.id);
  if (!single) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/dashboard/singles/${single.id}`}
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        ← Single
      </Link>
      <EditSingleForm single={single} />
    </div>
  );
}
