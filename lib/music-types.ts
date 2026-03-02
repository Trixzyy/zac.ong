export type Period = '7day' | '1month' | '3month' | '6month' | '12month' | 'overall';

export interface TopAlbum {
  name: string;
  artistName: string;
  artistUrl: string;
  url: string;
  playcount: number;
  imageUrl: string | null;
}

export interface TopArtist {
  name: string;
  url: string;
  playcount: number;
}

export interface RecentTrack {
  name: string;
  artistName: string;
  albumName: string;
  url: string;
  imageUrl: string | null;
  playedAt?: string;
  nowPlaying: boolean;
}

export interface MusicSnapshot {
  topAlbums: TopAlbum[];
  topArtists: TopArtist[];
  recentTracks: RecentTrack[];
  lastUpdated: number;
}

