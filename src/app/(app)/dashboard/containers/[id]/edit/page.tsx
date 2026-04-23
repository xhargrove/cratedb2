import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { EditContainerForm } from '@/components/containers/edit-container-form';
import { prisma } from '@/db/client';
import { requireUser } from '@/server/auth/require-user';

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: 'Edit container · Cratedb',
};

export default async function EditContainerPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser();

  const container = await prisma.storageContainer.findFirst({
    where: { id, ownerId: user.id },
    select: {
      id: true,
      name: true,
      kind: true,
      locationNote: true,
      imageKey: true,
      imageUpdatedAt: true,
    },
  });

  if (!container) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/dashboard/containers/${container.id}`}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Back to container
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        Edit container
      </h1>
      <EditContainerForm container={container} />
    </div>
  );
}
