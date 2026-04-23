'use client';

import { useState } from 'react';

type Props = {
  src: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
};

/**
 * Artwork image with stable placeholder when missing or after load error.
 */
export function RecordArtworkImage({
  src,
  alt,
  className,
  imgClassName,
}: Props) {
  const [broken, setBroken] = useState(false);

  const showPlaceholder = !src || broken;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-zinc-200 dark:bg-zinc-800 ${className ?? ''}`}
    >
      {showPlaceholder ? (
        <svg
          className="h-1/2 w-1/2 text-zinc-400 dark:text-zinc-600"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <title>Album placeholder</title>
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3 3.5-4.51 4.5 6H5l3.5-4.5z" />
        </svg>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- deliberate: dynamic owner-only URL + onError fallback
        <img
          src={src}
          alt={alt}
          className={imgClassName ?? 'h-full w-full object-cover'}
          onError={() => setBroken(true)}
        />
      )}
    </div>
  );
}
