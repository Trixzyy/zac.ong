'use client';

import React from 'react';

const AVATAR_SIZE = 40;

interface ArtistAvatarProps {
  alt: string;
}

export default function ArtistAvatar({ alt }: ArtistAvatarProps) {
  const initials = (() => {
    const trimmed = alt?.trim();
    if (!trimmed) return '';
    const parts = trimmed.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : '';
    return (first + second).toUpperCase();
  })();

  return (
    <div
      className="relative flex-shrink-0 rounded-full overflow-hidden bg-grey-200/80 dark:bg-grey-800/80"
      style={{
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        minWidth: AVATAR_SIZE,
        minHeight: AVATAR_SIZE,
      }}
    >
      <div className="w-full h-full rounded-full bg-grey-200/80 dark:bg-grey-800/80 flex items-center justify-center">
        {initials && (
          <span className="text-xs font-medium text-grey-700 dark:text-grey-200 select-none">
            {initials}
          </span>
        )}
      </div>
    </div>
  );
}

