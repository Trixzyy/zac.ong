'use client';

import React, { useState } from 'react';
import { useLastFmData } from '@/lib/hooks/use-music-data';
import type { Period, RecentTrack } from '@/lib/music-types';
import { motion } from 'framer-motion';
import Link from 'next/link';
import CustomSelect from '@/components/music/CustomSelect';
import ImageGrid from '@/components/music/ImageGrid';
import TopArtistsSection from '@/components/music/TopArtistsSection';
import FadeInImage from '@/components/music/FadeInImage';
import { getRelativeTime } from '@/components/music/getRelativeTime';
import { musicMotion } from '@/components/music/motion-config';

export const dynamic = 'force-dynamic';

const MotionDiv = motion.div;
const MotionLi = motion.li;

const PERIOD_OPTIONS = [
  { value: '7day', label: 'Last 7 days' },
  { value: '1month', label: 'Last 30 days' },
  { value: '3month', label: 'Last 3 months' },
  { value: '6month', label: 'Last 6 months' },
  { value: '12month', label: 'Last year' },
  { value: 'overall', label: 'All time' },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: musicMotion.stagger },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: musicMotion.duration, ease: 'easeOut' },
  },
};

const albumHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
};

export default function MusicPage() {
  const [period, setPeriod] = useState<Period>('1month');
  const { data, loading, error } = useLastFmData(period);

  if (error) {
    return (
      <div className="text-center mt-10 text-red-500">
        Error: {error.message} 😔
      </div>
    );
  }

  return (
    <MotionDiv
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-4xl mx-auto"
    >
      {/* 1. Top Albums */}
      <MotionDiv variants={childVariants} className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-medium text-2xl tracking-tight">Top Albums</h2>
          <CustomSelect
            value={period}
            onChange={(value) => setPeriod(value as typeof period)}
            options={PERIOD_OPTIONS}
          />
        </div>
        <ImageGrid albums={data?.topAlbums ?? []} isLoading={loading} />
      </MotionDiv>

      {/* 2. Top Artists (same period) */}
      <MotionDiv variants={childVariants} className="mb-10">
        <TopArtistsSection
          artists={data?.topArtists ?? []}
          period={period}
          isLoading={loading}
        />
      </MotionDiv>

      {/* 3. Recent Tracks (scroll-triggered animation) */}
      <MotionDiv variants={childVariants}>
        <h2 className="font-medium text-2xl tracking-tight mb-4">
          Recent Tracks
        </h2>
        <ul className="space-y-4 list-none p-0 m-0">
          {loading ? (
            Array(6)
              .fill(0)
              .map((_, index) => (
                <MotionLi
                  key={index}
                  initial={musicMotion.rowVariants.hidden}
                  animate={musicMotion.rowVariants.visible}
                  className="flex items-center gap-4 border-b border-grey-200 dark:border-grey-800 pb-4"
                >
                  <div className="w-16 h-16 rounded flex-shrink-0 bg-white/5 dark:bg-grey-900/40" />
                  <div className="flex-grow min-w-0">
                    <div className="h-6 w-3/4 bg-white/5 dark:bg-grey-900/40 rounded mb-2" />
                    <div className="h-4 w-1/2 bg-white/5 dark:bg-grey-900/40 rounded" />
                  </div>
                  <div className="h-4 w-20 flex-shrink-0 bg-white/5 dark:bg-grey-900/40 rounded" />
                </MotionLi>
              ))
          ) : (
            data?.recentTracks.map((track: RecentTrack, index: number) => {
              const img = track.imageUrl;
              return (
                <MotionLi
                  key={`${track.name}-${track.artistName}-${index}`}
                  initial={musicMotion.rowVariants.hidden}
                  whileInView={musicMotion.rowVariants.visible}
                  viewport={musicMotion.viewport}
                  transition={{ duration: musicMotion.duration, ease: 'easeOut' }}
                  className="flex items-center gap-4 border-b border-grey-200 dark:border-grey-800 pb-4"
                >
                  <Link
                    href={track.url}
                    className="relative flex-shrink-0 w-16 h-16 overflow-hidden rounded block"
                  >
                    <motion.div
                      variants={albumHoverVariants}
                      initial="rest"
                      whileHover="hover"
                      className="w-full h-full"
                    >
                      <FadeInImage
                        src={img || '/placeholder.svg?height=128&width=128'}
                        alt={`${track.name} by ${track.artistName}`}
                        size={64}
                        wrapperClassName="w-16 h-16 rounded"
                        className="rounded"
                      />
                    </motion.div>
                  </Link>
                  <div className="flex-grow min-w-0">
                    <Link href={track.url} className="hover:underline block">
                      <h3 className="text-lg font-semibold truncate">
                        {track.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-grey-500 dark:text-grey-400 truncate">
                      {track.artistName}
                    </p>
                  </div>
                  <div className="text-sm text-grey-500 dark:text-grey-400 whitespace-nowrap flex-shrink-0">
                    {track.nowPlaying
                      ? 'Scrobbling now'
                      : track.playedAt
                        ? getRelativeTime(track.playedAt)
                        : 'Unknown time'}
                  </div>
                </MotionLi>
              );
            })
          )}
        </ul>
      </MotionDiv>
    </MotionDiv>
  );
}
