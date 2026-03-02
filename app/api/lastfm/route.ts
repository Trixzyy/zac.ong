import { NextRequest, NextResponse } from 'next/server';
import { getMusicSnapshot } from '@/lib/server/lastfm';
import type { Period } from '@/lib/music-types';

export const dynamic = 'force-dynamic';

export const GET = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') as Period | null;

  if (!period) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
  }

  try {
    const snapshot = await getMusicSnapshot(period);
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    console.error('Error fetching Last.fm data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Last.fm data' },
      { status: 500 }
    );
  }
};
