import type { Metadata } from 'next';
import Link from 'next/link';

import { CreateRecordForm } from '@/components/records/create-record-form';

export const metadata: Metadata = {
  title: 'New record · Cratedb',
};

export default function NewRecordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/records"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          ← Records
        </Link>
      </div>
      <CreateRecordForm />
    </div>
  );
}
