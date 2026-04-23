import type { Metadata } from 'next';
import Link from 'next/link';

import { CreateContainerForm } from '@/components/containers/create-container-form';

export const metadata: Metadata = {
  title: 'New container · Cratedb',
};

export default function NewContainerPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/containers"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← My containers
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        New container
      </h1>
      <CreateContainerForm />
    </div>
  );
}
