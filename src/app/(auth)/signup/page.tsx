import type { Metadata } from 'next';
import Link from 'next/link';

import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Sign up · Cratedb',
};

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Create account
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Start your Cratedb collection
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-4">
          ← Home
        </Link>
      </p>
    </div>
  );
}
