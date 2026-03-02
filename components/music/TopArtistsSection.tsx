'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { TopArtist } from '@/lib/music-types';
import ArtistAvatar from '@/components/music/ArtistAvatar';
import { musicMotion } from './motion-config';

const periodLabels: Record<string, string> = {
  '7day': 'Last 7 days',
  '1month': 'Last 30 days',
  '3month': 'Last 3 months',
  '6month': 'Last 6 months',
  '12month': 'Last year',
  overall: 'All time',
};

const { containerVariants, rowVariants } = musicMotion;

const TOP_ARTISTS_LIMIT = 5;

interface TopArtistsSectionProps {
  artists: TopArtist[];
  period: string;
  isLoading: boolean;
}

export default function TopArtistsSection({
  artists,
  period,
  isLoading,
}: TopArtistsSectionProps) {
  const lastMetricRef = useRef<HTMLDivElement | null>(null);

  const displayed = artists.slice(0, TOP_ARTISTS_LIMIT);
  const maxScrobbles = Math.max(
    ...displayed.map((a) => parseInt(String(a.playcount || '0'), 10)),
    1
  );

  useEffect(() => {
    if (!lastMetricRef.current) return;

    const footer = document.querySelector('footer');
    const metricRect = lastMetricRef.current.getBoundingClientRect();
    const footerRect = footer
      ? (footer as HTMLElement).getBoundingClientRect()
      : null;

    // #region agent log
    fetch(
      'http://127.0.0.1:7264/ingest/2d448f8a-8ef5-4e9a-be0a-ca2fc2a59af6',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '006d64',
        },
        body: JSON.stringify({
          sessionId: '006d64',
          runId: 'top-artists-footer-overlap',
          hypothesisId: 'H2',
          location: 'components/music/TopArtistsSection.tsx:60',
          message: 'Top artists metric vs footer layout',
          data: {
            period,
            metricRect,
            footerRect,
            viewportHeight: window.innerHeight,
          },
          timestamp: Date.now(),
        }),
      }
    ).catch(() => {});
    // #endregion
  }, [artists, period]);

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-10 pb-4"
    >
      <div className="mb-4">
        <h2 className="font-medium text-2xl tracking-tight">Top Artists</h2>
        {period && periodLabels[period] && (
          <p className="text-sm text-grey-500 dark:text-grey-400 mt-0.5">
            {periodLabels[period]}
          </p>
        )}
      </div>

      {isLoading ? (
        <ul className="space-y-0 list-none p-0 m-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <li
              key={i}
              className="flex items-center gap-4 py-3 border-b border-grey-200 dark:border-grey-800 last:border-b-0"
            >
              <span className="w-6 flex-shrink-0 text-sm text-grey-500 dark:text-grey-400 tabular-nums">
                {i}
              </span>
              <div className="w-10 h-10 rounded-full bg-white/5 dark:bg-grey-900/40 flex-shrink-0" />
              <div className="flex-1 h-5 bg-white/5 dark:bg-grey-900/40 rounded w-32 max-w-[180px]" />
              <div className="w-14 h-4 bg-white/5 dark:bg-grey-900/40 rounded flex-shrink-0" />
            </li>
          ))}
        </ul>
      ) : (
        <motion.ul
          className="space-y-0 list-none p-0 m-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {displayed.map((artist, index) => {
            const playcount = artist.playcount;
            const pct = Math.min(
              100,
              maxScrobbles ? (playcount / maxScrobbles) * 100 : 0
            );
            const playcountLabel = playcount.toLocaleString();

            // #region agent log
            fetch('http://127.0.0.1:7264/ingest/2d448f8a-8ef5-4e9a-be0a-ca2fc2a59af6', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '006d64',
              },
              body: JSON.stringify({
                sessionId: '006d64',
                runId: 'top-artists-metric-pre-fix',
                hypothesisId: 'H1',
                location: 'components/music/TopArtistsSection.tsx:79',
                message: 'Top artist metric layout values',
                data: {
                  index,
                  name: artist.name,
                  playcount,
                  playcountLabel,
                  pct,
                  period,
                },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion

            return (
              <motion.li
                key={`${artist.name}-${index}`}
                variants={rowVariants}
                className="flex items-center gap-4 py-3 border-b border-grey-200 dark:border-grey-800 last:border-b-0"
              >
                {/* Rank */}
                <span className="w-6 flex-shrink-0 text-sm text-grey-500 dark:text-grey-400 tabular-nums">
                  {index + 1}
                </span>

                {/* Avatar */}
                <Link
                  href={artist.url}
                  className="flex items-center gap-3 flex-1 min-w-0 group"
                >
                  <ArtistAvatar
                    alt={artist.name}
                  />
                  <span className="font-medium text-grey-900 dark:text-grey-100 truncate group-hover:underline">
                    {artist.name}
                  </span>
                </Link>

                {/* Metric area: bar originates right, extends left; proportional to max in dataset */}
                <div
                  className="relative flex-shrink-0 w-[7rem] flex items-center justify-end py-1 overflow-hidden"
                  ref={index === displayed.length - 1 ? lastMetricRef : null}
                >
                  <div
                    className="absolute inset-y-0 right-0 min-w-0 rounded-l-sm bg-pink-200/55 dark:bg-pink-900/30 transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                  <span className="relative z-10 text-sm text-grey-600 dark:text-grey-400 tabular-nums px-2 text-right truncate">
                    {playcountLabel}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </motion.section>
  );
}
