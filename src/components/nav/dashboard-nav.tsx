'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/profile', label: 'Profile' },
  { href: '/dashboard/records', label: 'Records' },
  { href: '/dashboard/singles', label: 'Singles (45s)' },
  { href: '/dashboard/wantlist', label: 'Wantlist' },
  { href: '/dashboard/stats', label: 'Insights' },
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Collection sections"
      className="flex flex-wrap gap-1 rounded-2xl bg-surface-2/90 p-1.5 text-sm shadow-inner ring-1 ring-border/60 dark:bg-zinc-900/80 dark:ring-zinc-700/80"
    >
      {LINKS.map(({ href, label }) => {
        const active =
          href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? 'rounded-xl bg-surface px-3 py-2 font-semibold text-foreground shadow-sm ring-1 ring-border dark:bg-zinc-800 dark:ring-zinc-600'
                : 'rounded-xl px-3 py-2 font-medium text-muted transition hover:bg-surface hover:text-foreground dark:hover:bg-zinc-800/80'
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
