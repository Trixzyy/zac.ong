import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { TopAlbum } from '@/lib/music-types';

const MotionDiv = motion.div;

const imageHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

interface AlbumCardProps {
  album: TopAlbum;
  isLarge?: boolean;
}

export default function AlbumCard({ album, isLarge = false }: AlbumCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!album) return null;

  const size = isLarge ? 600 : 300;
  const src =
    album.imageUrl ||
    `/placeholder.svg?height=${size}&width=${size}`;

  return (
    <Link
      href={album.url}
      className="relative overflow-hidden block h-full"
    >
      <MotionDiv
        className="w-full h-full"
        variants={imageHoverVariants}
        initial="rest"
        whileHover="hover"
      >
        <div className="relative w-full h-full">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-white/5 dark:bg-grey-900/20 animate-pulse" />
          )}
          <img
            src={src}
            alt={`${album.name} by ${album.artistName}`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />
        </div>
      </MotionDiv>
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white pointer-events-none">
        <h3 className="text-sm font-semibold truncate">{album.name}</h3>
        <p className="text-xs truncate">{album.artistName}</p>
        <p className="text-xs">{album.playcount} plays</p>
      </div>
    </Link>
  );
}