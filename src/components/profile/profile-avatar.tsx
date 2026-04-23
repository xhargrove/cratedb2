'use client';

import { useState } from 'react';

/**
 * Square avatar: shows image when `src` loads; falls back to initials on error or missing src.
 */
export function ProfileAvatar({
  src,
  initials,
  size = 80,
  className = '',
}: {
  src: string | null;
  initials: string;
  size?: number;
  className?: string;
}) {
  const [showImage, setShowImage] = useState(Boolean(src));

  if (!src || !showImage) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-semibold tracking-tight text-white shadow-inner dark:bg-zinc-100 dark:text-zinc-900 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic same-origin API URL
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-2xl object-cover shadow-inner ring-1 ring-black/5 dark:ring-white/10 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setShowImage(false)}
    />
  );
}
