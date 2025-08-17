"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useMedia } from "react-use";

export interface Track {
  id: string | number;
  title: string;
  artist: string;
  album: string;
  artwork_url?: string;
  audio_url: string;
  duration: number;
  lyrics_lrc?: string;
}

export interface LyricLine {
  time: number;
  text: string;
}

interface PlayerContextType {
  current: Track | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  liked: Set<string>;
  shuffleMode: boolean;
  loopMode: "none" | "all" | "one";
  showPlayerExpansion: boolean; 
  showLyricsPanel: boolean;
  lyrics: LyricLine[];
  activeLyricIndex: number;
  isUserScrolling: boolean;
  toggle: () => void;
  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleLike: (trackId: string) => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  setPlayerExpansion: (expanded: boolean) => void; 
  togglePlayerExpansion: () => void;
  toggleLyricsPanel: () => void;
  setLyrics: (lyrics: LyricLine[]) => void;
  setActiveLyricIndex: (index: number) => void;
  setIsUserScrolling: (scrolling: boolean) => void;
  setPlaylist: (playlist: Track[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

function parseLRC(lrcContent: string): LyricLine[] {
  let content = lrcContent.replace(/\\n/g, '\n');
  const lines = content.split('\n');
  const parsedLyrics: LyricLine[] = [];

  lines.forEach(line => {
    const timeMatch = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = parseInt(timeMatch[2], 10);
      const milliseconds = parseInt(timeMatch[3].padEnd(3, '0'), 10);
      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;

      let text = timeMatch[4].trim();
      text = text.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
      text = text.replace(/\s+/g, ' ').trim();

      if (text) {
        parsedLyrics.push({ time: timeInSeconds, text });
      }
    } else {
      const cleanedTextNoTimestamp = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
      if (cleanedTextNoTimestamp.length > 0) {
        if (!parsedLyrics.some(lyric => lyric.text === cleanedTextNoTimestamp && lyric.time === 0)) {
          parsedLyrics.push({ time: 0, text: cleanedTextNoTimestamp });
        }
      }
    }
  });

  parsedLyrics.sort((a, b) => a.time - b.time);

  const uniqueLyrics = parsedLyrics.filter((lyric, index) => {
    if (index === 0) return true;
    const prev = parsedLyrics[index - 1];
    return !(lyric.time === prev.time && lyric.text === prev.text);
  });

  return uniqueLyrics;
}

const LS_CURRENT_TRACK = 'currentTrack';
const LS_PLAYLIST = 'playlist';
const LS_PLAYER_STATE = 'playerState';
const LS_LIKED_TRACKS = 'likedTracks';

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [current, setCurrent] = useState<Track | null>(null);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [shuffleMode, setShuffleMode] = useState(false);
  const [loopMode, setLoopMode] = useState<"none" | "all" | "one">("none");
  const [showPlayerExpansion, setShowPlayerExpansion] = useState(false); 
  const [showLyricsPanel, setShowLyricsPanel] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);

  const restoredProgressRef = useRef<number>(0);

  const isMobile = useMedia('(max-width: 767px)', false);

  const playlistRef = useRef(playlist);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);
  const shuffleModeRef = useRef(shuffleMode);
  useEffect(() => { shuffleModeRef.current = shuffleMode; }, [shuffleMode]);
  const loopModeRef = useRef(loopMode);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  const activeLyricIndexRef = useRef(activeLyricIndex);
  useEffect(() => { activeLyricIndexRef.current = activeLyricIndex; }, [activeLyricIndex]);
  const isUserScrollingRef = useRef(isUserScrolling);
  useEffect(() => {
    isUserScrollingRef.current = isUserScrolling;
  }, [isUserScrolling]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTrack = localStorage.getItem(LS_CURRENT_TRACK);
        if (savedTrack) {
          const parsedTrack: Track = JSON.parse(savedTrack);
          setCurrent(parsedTrack);
          if (parsedTrack.lyrics_lrc) {
            setLyrics(parseLRC(parsedTrack.lyrics_lrc));
          }
        }

        const savedPlaylist = localStorage.getItem(LS_PLAYLIST);
        if (savedPlaylist) {
          setPlaylist(JSON.parse(savedPlaylist));
        }

        const savedState = localStorage.getItem(LS_PLAYER_STATE);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          restoredProgressRef.current = parsedState.progress || 0;
          setVolumeState(parsedState.volume ?? 1);
          setShuffleMode(parsedState.shuffleMode ?? false);
          setLoopMode(parsedState.loopMode ?? "none");
          setShowPlayerExpansion(parsedState.showPlayerExpansion ?? false);
          setShowLyricsPanel(parsedState.showLyricsPanel ?? false);
        }

        const savedLiked = localStorage.getItem(LS_LIKED_TRACKS);
        if (savedLiked) {
          setLiked(new Set(JSON.parse(savedLiked)));
        }
      } catch (e) {
        localStorage.removeItem(LS_CURRENT_TRACK);
        localStorage.removeItem(LS_PLAYLIST);
        localStorage.removeItem(LS_PLAYER_STATE);
        localStorage.removeItem(LS_LIKED_TRACKS);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && current) {
      localStorage.setItem(LS_CURRENT_TRACK, JSON.stringify(current));
    } else if (typeof window !== 'undefined' && current === null) {
      localStorage.removeItem(LS_CURRENT_TRACK);
    }
  }, [current]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_PLAYLIST, JSON.stringify(playlist));
    }
  }, [playlist]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateToSave = {
        progress,
        volume,
        shuffleMode,
        loopMode,
        showPlayerExpansion,
        showLyricsPanel,
      };
      localStorage.setItem(LS_PLAYER_STATE, JSON.stringify(stateToSave));
    }
  }, [progress, volume, shuffleMode, loopMode, showPlayerExpansion, showLyricsPanel]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_LIKED_TRACKS, JSON.stringify(Array.from(liked)));
    }
  }, [liked]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);


  const play = useCallback((track: Track, queueOverride?: Track[]) => {
    if (audioRef.current) {
      const newQueue = queueOverride || playlistRef.current;
      if (newQueue !== playlistRef.current) {
        setPlaylist(newQueue);
      }

      if (currentRef.current?.id !== track.id) {
        audioRef.current.pause();
        setCurrent(track);
        setProgress(0);
        setDuration(0);
        setLyrics([]);
        setActiveLyricIndex(-1);
        setIsUserScrolling(false);

        if (track.lyrics_lrc) {
          const parsedLyrics = parseLRC(track.lyrics_lrc);
          setLyrics(parsedLyrics);
          if (parsedLyrics.length > 0 && parsedLyrics[0].time <= 0.1) {
            setActiveLyricIndex(0);
          }
        }
        restoredProgressRef.current = 0;
      }
      setIsPlaying(true);
    }
  }, []);


  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      if (currentRef.current) {
        play(currentRef.current);
      } else if (playlistRef.current.length > 0) {
        play(playlistRef.current[0]);
      }
    }
  }, [play, pause]);

  const next = useCallback(() => {
    const currentPlaylist = playlistRef.current;
    const currentTrack = currentRef.current;
    const currentShuffleMode = shuffleModeRef.current;
    const currentLoopMode = loopModeRef.current;

    if (currentPlaylist.length === 0) return;

    if (currentLoopMode === 'one' && currentTrack) {
      audioRef.current!.currentTime = 0;
      audioRef.current!.play();
      setIsPlaying(true);
      return;
    }

    const currentIndex = currentTrack ? currentPlaylist.findIndex(t => t.id === currentTrack.id) : -1;
    let nextIndex;

    if (currentShuffleMode) {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * currentPlaylist.length);
      } while (newIndex === currentIndex && currentPlaylist.length > 1);
      nextIndex = newIndex;
    } else {
      nextIndex = (currentIndex + 1) % currentPlaylist.length;
    }

    if (currentPlaylist[nextIndex]) {
      play(currentPlaylist[nextIndex]);
    } else if (currentLoopMode === 'all' && currentPlaylist.length > 0) {
      play(currentPlaylist[0]);
    } else {
      setCurrent(null);
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      setLyrics([]);
      setActiveLyricIndex(-1);
      setIsUserScrolling(false);
    }
  }, [play]);

  const prev = useCallback(() => {
    const currentPlaylist = playlistRef.current;
    const currentTrack = currentRef.current;

    if (currentPlaylist.length === 0) return;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }

    const currentIndex = currentTrack ? currentPlaylist.findIndex(t => t.id === currentTrack.id) : -1;
    const prevIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    play(currentPlaylist[prevIndex]);
  }, [play]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);

      if (lyrics.length > 0) {
        const newIndex = lyrics.findIndex((line, i) => {
          const nextLineTime = lyrics[i + 1]?.time || duration + 1;
          return time >= line.time && time < nextLineTime;
        });
        if (newIndex !== -1 && newIndex !== activeLyricIndexRef.current) {
          setActiveLyricIndex(newIndex);
        }
      }

      setIsUserScrolling(true);
      setTimeout(() => setIsUserScrolling(false), 2000);
    }
  }, [lyrics, duration]);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
  }, []);

  const toggleLike = useCallback((trackId: string) => {
    setLiked(prevLiked => {
      const newLiked = new Set(prevLiked);
      if (newLiked.has(trackId)) {
        newLiked.delete(trackId);
      } else {
        newLiked.add(trackId);
      }
      return newLiked;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleMode(prev => !prev);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoopMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

  const setPlayerExpansion = useCallback((expanded: boolean) => {
    setShowPlayerExpansion(expanded);
    if (!expanded && !isMobile) {
      setShowLyricsPanel(false);
    }
  }, [isMobile]);

  const togglePlayerExpansion = useCallback(() => {
    setShowPlayerExpansion(prev => !prev);
  }, []);


  const toggleLyricsPanel = useCallback(() => {
    if (!isMobile) {
      setShowLyricsPanel(prev => !prev);
      if (!showLyricsPanel) {
        setPlayerExpansion(false);
      }
    }
  }, [isMobile, showLyricsPanel, setPlayerExpansion]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;

    const currentTime = audioRef.current.currentTime;
    setProgress(currentTime);

    if (lyrics.length > 0) {
      const newActiveIndex = lyrics.findIndex((line, i) => {
        if (i === lyrics.length - 1) {
          return currentTime >= line.time;
        }
        return currentTime >= line.time && currentTime < lyrics[i + 1].time;
      });

      if (newActiveIndex !== -1 && newActiveIndex !== activeLyricIndexRef.current) {
        setActiveLyricIndex(newActiveIndex);
      }
    }
  }, [lyrics]);


  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);

    if (restoredProgressRef.current > 0) {
      audioRef.current.currentTime = restoredProgressRef.current;
      setProgress(restoredProgressRef.current);
      restoredProgressRef.current = 0;
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    next();
  }, [next]);

  const handleCanPlay = useCallback(() => {
    setIsAudioReady(true);

    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.play();
    }
  }, []);

  const handleError = useCallback((event: Event) => {
    const audioEl = event.target as HTMLAudioElement;
    if (audioEl.error) {
      // General error handling
    }
    setIsPlaying(false);
    setIsAudioReady(false);
  }, []);


  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);

      audio.pause();
      audio.src = '';
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded, handleCanPlay, handleError]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) {
      if (audio) {
          audio.pause();
          audio.src = '';
          setIsPlaying(false);
          setIsAudioReady(false);
      }
      return;
    }

    let audioSource = current.audio_url;

    if (!(audioSource.startsWith('http://') || audioSource.startsWith('https://') || audioSource.startsWith('/'))) {
      audioSource = `/audio/${audioSource}`;
    }

    if (audio.src !== audioSource) {
      audio.src = audioSource;
      audio.load();
      setIsAudioReady(false);
    }
  }, [current]);


  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isPlaying) {
      if (isAudioReady) {
        audio.play();
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, isAudioReady]);


  const value = useMemo(() => ({
    current,
    isPlaying,
    progress,
    duration,
    volume,
    liked,
    shuffleMode,
    loopMode,
    showPlayerExpansion,
    showLyricsPanel,
    lyrics,
    activeLyricIndex,
    isUserScrolling,
    toggle,
    play,
    pause,
    next,
    prev,
    seek,
    setVolume,
    toggleLike,
    toggleShuffle,
    toggleLoop,
    togglePlayerExpansion,
    setPlayerExpansion, 
    toggleLyricsPanel,
    setLyrics,
    setActiveLyricIndex,
    setIsUserScrolling,
    setPlaylist,
  }), [
    current,
    isPlaying,
    progress,
    duration,
    volume,
    liked,
    shuffleMode,
    loopMode,
    showPlayerExpansion,
    showLyricsPanel,
    lyrics,
    activeLyricIndex,
    isUserScrolling,
    toggle,
    play,
    pause,
    next,
    prev,
    seek,
    setVolume,
    toggleLike,
    toggleShuffle,
    toggleLoop,
    togglePlayerExpansion,
    setPlayerExpansion, 
    toggleLyricsPanel,
    setIsUserScrolling,
    setPlaylist,
  ]);

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};