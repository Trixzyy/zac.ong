'use client';

import React, { useState, useCallback } from 'react';

const HOVER_MESSAGES = [
  'made with love',
  'using TS',
  'meow meow',
  'with spotify',
  'on the internet',
];

export function FooterSignature() {
  const [hoverMessage, setHoverMessage] = useState<string | null>(null);
  const [lastIndex, setLastIndex] = useState<number | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (HOVER_MESSAGES.length === 0) return;

    // Pick a random index that's different from the last one (if possible)
    let index = Math.floor(Math.random() * HOVER_MESSAGES.length);
    if (lastIndex !== null && HOVER_MESSAGES.length > 1) {
      while (index === lastIndex) {
        index = Math.floor(Math.random() * HOVER_MESSAGES.length);
      }
    }

    setLastIndex(index);
    setHoverMessage(HOVER_MESSAGES[index]);
  }, [lastIndex]);

  const handleMouseLeave = useCallback(() => {
    setHoverMessage(null);
  }, []);

  const year = new Date().getFullYear();

  return (
    <button
      type="button"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-flex items-center justify-center text-sm text-grey-500 dark:text-grey-400 hover:text-grey-800 dark:hover:text-grey-100 transition-colors duration-300 focus:outline-none"
    >
      {/* Base label */}
      <span
        className={`flex items-center gap-1 transition-all duration-300 ${
          hoverMessage
            ? 'opacity-0 -translate-y-1'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <span className="font-medium">zac.ong</span>
        <span suppressHydrationWarning>© {year}</span>
      </span>

      {/* Hover text */}
      <span
        className={`absolute inset-x-0 flex items-center justify-center text-xs tracking-wide uppercase transition-all duration-300 ${
          hoverMessage
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-1'
        }`}
      >
        {hoverMessage}
      </span>
    </button>
  );
}

