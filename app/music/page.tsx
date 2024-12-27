'use client';

import React, { useState } from 'react'
import { useLastFmData } from '@/lib/hooks/use-music-data'
import { motion } from 'framer-motion';
import Link from 'next/link'
import CustomSelect from '@/components/music/CustomSelect'
import ImageGrid from '@/components/music/ImageGrid'
import { getRelativeTime } from '@/components/music/getRelativeTime'

const MotionDiv = motion.div;
const MotionLi = motion.li;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const childVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const trackVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const albumHoverVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.3 } },
}

interface Track {
  name: string;
  url: string;
  artist: {
    '#text': string;
  };
  image: Array<{
    size: string;
    '#text': string;
  }>;
  date?: {
    uts: string;
  };
  '@attr'?: {
    nowplaying: string;
  };
}

export default function MusicPage() {
  const [period, setPeriod] = useState<'7day' | '1month' | '3month' | '6month' | '12month' | 'overall'>('1month')
  const { data, loading, error } = useLastFmData(period)

  if (error) return <div className="text-center mt-10 text-red-500">Error: {error.message} 😔</div>

  return (
    <MotionDiv initial="hidden" animate="visible" variants={containerVariants} className="max-w-4xl mx-auto">
      <MotionDiv variants={childVariants} className="flex justify-between items-center mb-6">
        <h1 className="font-medium text-3xl tracking-tight">Top Albums</h1>
        <CustomSelect
          value={period}
          onChange={(value) => setPeriod(value as any)}
          options={[
            { value: '7day', label: 'Last 7 days' },
            { value: '1month', label: 'Last 30 days' },
            { value: '3month', label: 'Last 3 months' },
            { value: '6month', label: 'Last 6 months' },
            { value: '12month', label: 'Last year' },
            { value: 'overall', label: 'All time' },
          ]}
        />
      </MotionDiv>

      <MotionDiv variants={childVariants} className="mb-10">
        <ImageGrid albums={data?.topAlbums || []} isLoading={loading} />
      </MotionDiv>

      <MotionDiv variants={childVariants}>
        <h2 className="font-medium text-2xl tracking-tight mb-4">Recent Tracks</h2>
        <motion.ul 
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {loading ? (
            Array(6).fill(0).map((_, index) => (
              <MotionLi 
                key={index} 
                variants={trackVariants}
                className="flex items-center space-x-4 border-b border-gray-700 pb-4"
              >
                <div className="w-16 h-16 bg-gray-100/20 dark:bg-grey-900/40 border border-grey-300/20 dark:border-grey-800/20 rounded"></div>
                <div className="flex-grow">
                  <div className="h-6 w-3/4 bg-gray-100/20 dark:bg-grey-900/40 border border-grey-300/20 dark:border-grey-800/20 mb-2"></div>
                  <div className="h-4 w-1/2 bg-gray-100/20 dark:bg-grey-900/40 border border-grey-300/20 dark:border-grey-800/20"></div>
                </div>
                <div className="h-4 w-20 bg-gray-100/20 dark:bg-grey-900/40 border border-grey-300/20 dark:border-grey-800/20"></div>
              </MotionLi>
            ))
          ) : (
            data?.recentTracks.map((track: Track, index: number) => (
              <MotionLi 
                key={index} 
                variants={trackVariants}
                className="flex items-center space-x-4 border-b border-gray-700 pb-4"
              >
                <Link href={track.url} className="relative flex-shrink-0 w-16 h-16 overflow-hidden rounded">
                  <MotionDiv
                    variants={albumHoverVariants}
                    initial="rest"
                    whileHover="hover"
                  >
                    <img 
                      src={track.image.find(img => img.size === 'large')?.['#text'] || '/placeholder.svg?height=128&width=128'} 
                      alt={`${track.name} by ${track.artist['#text']}`}
                      className="w-full h-full object-cover"
                    />
                  </MotionDiv>
                </Link>
                <div className="flex-grow min-w-0">
                  <Link href={track.url} className="hover:underline block">
                    <h3 className="text-lg font-semibold truncate">{track.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-400 truncate">{track.artist['#text']}</p>
                </div>
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {track['@attr']?.nowplaying === 'true' ? 'Scrobbling now' : track.date ? getRelativeTime(track.date.uts) : 'Unknown time'}
                </div>
              </MotionLi>
            ))
          )}
        </motion.ul>
      </MotionDiv>
    </MotionDiv>
  )
}