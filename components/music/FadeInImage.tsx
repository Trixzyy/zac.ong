'use client';

import React, { useState } from 'react';

interface FadeInImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  /** Reserve space: 'square' | 'circle' (fixed aspect) or leave default for natural size */
  aspect?: 'square' | 'circle';
  size?: number;
}

export default function FadeInImage({
  src,
  alt,
  className = '',
  wrapperClassName = '',
  aspect,
  size,
}: FadeInImageProps) {
  const [loaded, setLoaded] = useState(false);

  const wrapperStyle =
    size != null
      ? { width: size, height: size, minWidth: size, minHeight: size }
      : undefined;

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden bg-white/5 dark:bg-grey-900/20 ${aspect === 'circle' ? 'rounded-full' : ''} ${wrapperClassName}`}
      style={wrapperStyle}
    >
      {!loaded && (
        <div
          className="absolute inset-0 bg-white/5 dark:bg-grey-900/20"
          aria-hidden
        />
      )}
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out ${loaded ? 'opacity-100' : 'opacity-0'} ${aspect === 'circle' ? 'rounded-full' : ''} ${className}`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
