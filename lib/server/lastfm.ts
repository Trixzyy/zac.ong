import {
  Period,
  TopAlbum,
  TopArtist,
  RecentTrack,
  MusicSnapshot,
} from '@/lib/music-types';

const LAST_FM_API_KEY = process.env.LAST_FM_API_KEY;
const LAST_FM_USERNAME = process.env.LAST_FM_USERNAME;

const LAST_FM_BASE = 'http://ws.audioscrobbler.com/2.0/';

type LastFmImage = { '#text'?: string; size?: 'small' | 'medium' | 'large' | 'extralarge' } | null | undefined;

type RawTopAlbumsResponse = {
  topalbums?: { album?: any[] };
};

type RawTopArtistsResponse = {
  topartists?: { artist?: any[] };
};

type RawRecentTracksResponse = {
  recenttracks?: { track?: any[] };
};

function ensureEnv() {
  if (!LAST_FM_API_KEY || !LAST_FM_USERNAME) {
    throw new Error('Missing LAST_FM_API_KEY or LAST_FM_USERNAME');
  }
}

async function fetchLastFm(
  method: string,
  extra: Record<string, string> = {}
): Promise<unknown> {
  ensureEnv();

  const url = new URL(LAST_FM_BASE);
  url.searchParams.set('method', method);
  url.searchParams.set('user', LAST_FM_USERNAME as string);
  url.searchParams.set('api_key', LAST_FM_API_KEY as string);
  url.searchParams.set('format', 'json');
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Last.fm error: ${res.status}`);
  return res.json();
}

function selectLastFmImage(
  rawImages: LastFmImage[] | LastFmImage | null | undefined
): string | null {
  if (!rawImages) return null;

  const images: LastFmImage[] = Array.isArray(rawImages) ? rawImages : [rawImages];
  if (!images.length) return null;

  const isValid = (url: string | undefined | null): boolean => {
    if (!url) return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  };

  const sizeOrder: Array<'extralarge' | 'large' | 'medium' | 'small'> = [
    'extralarge',
    'large',
    'medium',
    'small',
  ];

  for (const size of sizeOrder) {
    const candidate = images.find((img) => img?.size === size);
    if (candidate && isValid(candidate['#text'] as string)) {
      return (candidate['#text'] as string).trim();
    }
  }

  for (const img of images) {
    if (isValid(img?.['#text'] as string)) {
      return (img?.['#text'] as string).trim();
    }
  }

  return null;
}

function shapeTopAlbums(raw: unknown): TopAlbum[] {
  const data = raw as RawTopAlbumsResponse;
  const albums = Array.isArray(data?.topalbums?.album)
    ? data.topalbums!.album!
    : [];

  return albums.slice(0, 5).map((album) => {
    const name = String(album?.name ?? '');
    const artistName = String(album?.artist?.name ?? '');
    const artistUrl = String(album?.artist?.url ?? '');
    const url = String(album?.url ?? '');
    const playcount = Number.parseInt(String(album?.playcount ?? '0'), 10) || 0;
    const imageUrl = selectLastFmImage(album?.image);

    return {
      name,
      artistName,
      artistUrl,
      url,
      playcount,
      imageUrl,
    };
  });
}

function shapeTopArtists(raw: unknown): TopArtist[] {
  const data = raw as RawTopArtistsResponse;
  const artists = Array.isArray(data?.topartists?.artist)
    ? data.topartists!.artist!
    : [];

  return artists.slice(0, 5).map((artist) => {
    const name = String(artist?.name ?? '');
    const url = String(artist?.url ?? '');
    const playcount = Number.parseInt(String(artist?.playcount ?? '0'), 10) || 0;

    return {
      name,
      url,
      playcount,
    };
  });
}

function shapeRecentTracks(raw: unknown): RecentTrack[] {
  const data = raw as RawRecentTracksResponse;
  const tracks = Array.isArray(data?.recenttracks?.track)
    ? data.recenttracks!.track!
    : [];

  return tracks.slice(0, 10).map((track) => {
    const name = String(track?.name ?? '');
    const artistName = String(track?.artist?.['#text'] ?? '');
    const albumName = String(track?.album?.['#text'] ?? '');
    const url = String(track?.url ?? '');
    const imageUrl = selectLastFmImage(track?.image);

    const uts = track?.date?.uts ? String(track.date.uts) : undefined;
    const nowPlaying = track?.['@attr']?.nowplaying === 'true';

    return {
      name,
      artistName,
      albumName,
      url,
      imageUrl,
      playedAt: uts,
      nowPlaying,
    };
  });
}

export async function getMusicSnapshot(period: Period): Promise<MusicSnapshot> {
  const [topAlbumsRes, topArtistsRes, recentTracksRes] = await Promise.all([
    fetchLastFm('user.gettopalbums', { period, limit: '5' }),
    fetchLastFm('user.gettopartists', { period, limit: '5' }),
    fetchLastFm('user.getrecenttracks', { limit: '10' }),
  ]);

  const topAlbums = shapeTopAlbums(topAlbumsRes);
  const topArtists = shapeTopArtists(topArtistsRes);
  const recentTracks = shapeRecentTracks(recentTracksRes);

  return {
    topAlbums,
    topArtists,
    recentTracks,
    lastUpdated: Date.now(),
  };
}

