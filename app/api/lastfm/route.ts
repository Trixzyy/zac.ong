import { NextRequest, NextResponse } from 'next/server';
import { lastfmCache } from '@/lib/cache';

const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;
const LAST_FM_USERNAME = process.env.LAST_FM_USERNAME;

export const revalidate = 30; // Revalidate every 30 seconds for recent tracks

export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period');

    if (!period || typeof period !== 'string') {
        return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    const cacheKey = `lastfm:${LAST_FM_USERNAME}:${period}`;
    const recentTracksKey = `lastfm:${LAST_FM_USERNAME}:recent`;

    try {
        // Always check recent tracks first (they're independent of period)
        let recentTracksData: any = await lastfmCache.get(recentTracksKey);
        let shouldFetchRecentTracks = !recentTracksData;

        // Check if we need to refresh recent tracks (they have shorter TTL)
        if (!shouldFetchRecentTracks) {
            const entryInfo = lastfmCache.getEntryInfo(recentTracksKey);
            if (entryInfo.exists && entryInfo.expiresAt) {
                // Check if cache is about to expire (within 10 seconds)
                const timeUntilExpiry = entryInfo.expiresAt - Date.now();
                shouldFetchRecentTracks = timeUntilExpiry < 10000;
            }
        }

        // Try to get period-specific data from cache
        let periodData: any = await lastfmCache.get(cacheKey);

        if (!periodData) {
            // If not in cache, fetch from Last.fm API
            const topAlbumsResponse = await fetch(
                `http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${LAST_FM_USERNAME}&api_key=${LAST_FM_API_KEY}&format=json&period=${period}`
            );
            const topAlbumsData = await topAlbumsResponse.json();

            periodData = {
                topAlbums: topAlbumsData.topalbums.album.slice(0, 10),
                lastUpdated: Date.now()
            };

            // Cache albums with 5 minutes TTL
            await lastfmCache.set(cacheKey, periodData, 300, 'albums');
        }

        // Handle recent tracks separately (always fetch if needed)
        if (shouldFetchRecentTracks) {
            const recentTracksResponse = await fetch(
                `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LAST_FM_USERNAME}&api_key=${LAST_FM_API_KEY}&format=json&limit=10`
            );
            const recentTracksApiData = await recentTracksResponse.json();
            
            // Check if there's new scrobbling activity
            let hasNewActivity = false;
            if (recentTracksData) {
                const currentFirstTrack = recentTracksData.recentTracks[0];
                const newFirstTrack = recentTracksApiData.recenttracks.track[0];
                
                hasNewActivity = 
                    currentFirstTrack.name !== newFirstTrack.name ||
                    currentFirstTrack.artist['#text'] !== newFirstTrack.artist['#text'] ||
                    (newFirstTrack['@attr']?.nowplaying === 'true' && currentFirstTrack['@attr']?.nowplaying !== 'true');
            } else {
                hasNewActivity = true; // First time loading
            }
            
            if (hasNewActivity) {
                console.log('New scrobbling activity detected, updating recent tracks cache');
            }
            
            // Always update the recent tracks cache
            recentTracksData = {
                recentTracks: recentTracksApiData.recenttracks.track,
                lastUpdated: Date.now()
            };
            
            // Cache recent tracks with 30 seconds TTL
            await lastfmCache.set(recentTracksKey, recentTracksData, 30, 'recent');
        }

        // Combine period data with recent tracks
        const combinedData = {
            ...periodData,
            recentTracks: recentTracksData.recentTracks,
            lastUpdated: Math.max(periodData.lastUpdated, recentTracksData.lastUpdated)
        };

        return NextResponse.json(combinedData, { status: 200 });
    } catch (error) {
        console.error('Error fetching Last.fm data:', error);
        return NextResponse.json({ error: 'Failed to fetch Last.fm data' }, { status: 500 });
    }
};