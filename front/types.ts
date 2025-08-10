export type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string | null;
  audio_url: string;
};

export type Playlist = {
  id: number;
  name: string;
  tracks: Track[];
};