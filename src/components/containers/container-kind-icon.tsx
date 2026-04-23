import type { StorageContainerKind } from '@/generated/prisma/client';

const iconClass = 'h-10 w-10 text-amber-700 dark:text-amber-400';

export function ContainerKindIcon({
  kind,
  label,
}: {
  kind: StorageContainerKind;
  label: string;
}) {
  switch (kind) {
    case 'SHELF':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-label={label}
          role="img"
        >
          <rect x="3" y="4" width="18" height="3" rx="0.5" />
          <rect x="3" y="10" width="18" height="3" rx="0.5" />
          <rect x="3" y="16" width="18" height="3" rx="0.5" />
        </svg>
      );
    case 'BOX':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-label={label}
          role="img"
        >
          <path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" />
          <path d="M4 8l8 4 8-4M12 12v8" />
        </svg>
      );
    case 'CRATE':
      return (
        <svg
          className={iconClass}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-label={label}
          role="img"
        >
          <path d="M5 9h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9z" />
          <path d="M5 9V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2" />
          <path d="M9 12h6M9 15h6" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export function containerKindLabel(kind: StorageContainerKind): string {
  switch (kind) {
    case 'SHELF':
      return 'Shelf';
    case 'BOX':
      return 'Box';
    case 'CRATE':
      return 'Crate';
    default:
      return 'Container';
  }
}
