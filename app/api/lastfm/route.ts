import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;
const LAST_FM_USERNAME = process.env.LAST_FM_USERNAME;

export const revalidate = 60; // Revalidate every minute

export const GET = async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period');

    if (!period || typeof period !== 'string') {
        return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    const cacheKey = `lastfm:${LAST_FM_USERNAME}:${period}`;

    try {
        // Try to get data from cache
        let data = await kv.get(cacheKey);

        if (!data || typeof data !== 'string') {
            // If not in cache or invalid data, fetch from Last.fm API
            const [topAlbumsResponse, recentTracksResponse] = await Promise.all([
                fetch(`http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${LAST_FM_USERNAME}&api_key=${LAST_FM_API_KEY}&format=json&period=${period}`),
                fetch(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LAST_FM_USERNAME}&api_key=${LAST_FM_API_KEY}&format=json&limit=10`)
            ]);

            const [topAlbumsData, recentTracksData] = await Promise.all([
                topAlbumsResponse.json(),
                recentTracksResponse.json()
            ]);

            data = JSON.stringify({
                topAlbums: topAlbumsData.topalbums.album.slice(0, 10),
                recentTracks: recentTracksData.recenttracks.track,
                lastUpdated: Date.now()
            });

            // Cache the data for 5 minutes
            await kv.set(cacheKey, data, { ex: 300 });
        }

        // Parse the data (whether it's from cache or freshly fetched)
        const parsedData = JSON.parse(data as string);

        return NextResponse.json(parsedData, { status: 200 });
    } catch (error) {
        console.error('Error fetching Last.fm data:', error);
        return NextResponse.json({ error: 'Failed to fetch Last.fm data' }, { status: 500 });
    }
};