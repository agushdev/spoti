// src/components/player/player-provider.tsx
"use client"

import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback
} from "react"
import { loadLikes, toggleLike as toggleLikeStore } from "@/lib/store"

type Track = {
  id: number
  title: string
  artist: string
  album: string
  duration: string
  artwork_url: string | null
  audio_url: string
}

type LoopMode = 'none' | 'all' | 'one'; 

type PlayerContextValue = {
  current: Track | null
  isPlaying: boolean
  volume: number
  progress: number
  duration: number
  queue: Track[]
  play: (track: Track, queue?: Track[]) => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  liked: Set<string>
  toggleLike: (id: string) => void
  shuffleMode: boolean; 
  loopMode: LoopMode;    
  toggleShuffle: () => void; 
  toggleLoop: () => void;    
  // ✅ Nuevo estado y función para la expansión del reproductor
  isPlayerExpanded: boolean;
  togglePlayerExpansion: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [current, setCurrent] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.8)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liked, setLiked] = useState<Set<string>>(loadLikes())
  const [shuffleMode, setShuffleMode] = useState(false); 
  const [loopMode, setLoopMode] = useState<LoopMode>('all'); 
  // ✅ Nuevo estado para la expansión del reproductor
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  // Para asegurar que los callbacks usan los estados más recientes
  const queueRef = useRef(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);

  const shuffleModeRef = useRef(shuffleMode);
  useEffect(() => { shuffleModeRef.current = shuffleMode; }, [shuffleMode]);

  const loopModeRef = useRef(loopMode);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);


  const handleNext = useCallback(() => {
    const currentQueue = queueRef.current;
    const currentTrack = currentRef.current;
    const currentShuffleMode = shuffleModeRef.current;
    const currentLoopMode = loopModeRef.current;

    if (!currentTrack || currentQueue.length === 0) return;

    if (currentLoopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    let nextIdx;
    if (currentShuffleMode) {
      let potentialNextIdx;
      do {
        potentialNextIdx = Math.floor(Math.random() * currentQueue.length);
      } while (currentQueue.length > 1 && currentQueue[potentialNextIdx].id === currentTrack.id); 
      nextIdx = potentialNextIdx;
    } else {
      const idx = currentQueue.findIndex((t) => t.id === currentTrack.id);
      nextIdx = (idx + 1) % currentQueue.length;
    }

    if (currentLoopMode === 'none' && nextIdx === 0 && !currentShuffleMode) {
        setIsPlaying(false); 
        setCurrent(currentQueue[0]); 
    } else {
        setCurrent(currentQueue[nextIdx]);
        setIsPlaying(true);
    }
  }, []);

  const handlePrev = useCallback(() => {
    const currentQueue = queueRef.current;
    const currentTrack = currentRef.current;
    const currentShuffleMode = shuffleModeRef.current;

    if (!currentTrack || currentQueue.length === 0) return;

    let prevIdx;
    if (currentShuffleMode) {
      let potentialPrevIdx;
      do {
        potentialPrevIdx = Math.floor(Math.random() * currentQueue.length);
      } while (currentQueue.length > 1 && currentQueue[potentialPrevIdx].id === currentTrack.id);
      prevIdx = potentialPrevIdx;
    } else {
      const idx = currentQueue.findIndex((t) => t.id === currentTrack.id);
      prevIdx = (idx - 1 + currentQueue.length) % currentQueue.length;
    }
    setCurrent(currentQueue[prevIdx]);
    setIsPlaying(true);
  }, []);


  // Cargar lista de canciones desde tu API de FastAPI
  useEffect(() => {
    async function fetchTracks() {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : '192.168.0.107';
        const res = await fetch(`http://${host}:8000/api/tracks`);

        if (!res.ok) {
          throw new Error('Error cargando canciones desde la API.');
        }
        const data: Track[] = await res.json();
        setQueue(data);
        if (data.length > 0 && !current) {
          setCurrent(data[0]);
        }
      } catch (err) {
        console.error("Error cargando canciones:", err);
      }
    }
    fetchTracks();
  }, [current]);


  // Inicializar audio
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = "anonymous"
    audioRef.current = audio
    audio.volume = volume

    const onTime = () => setProgress(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration || 0)
    
    const onEnded = () => {
      handleNext(); 
    };

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("ended", onEnded) 

    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("ended", onEnded)
    }
  }, [handleNext]) 


  // Cargar nueva canción cuando cambia `current` - Usar ruta relativa para audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !current) return

    if (current.audio_url.startsWith('/') || current.audio_url.startsWith('http://') || current.audio_url.startsWith('https://')) {
        audio.src = current.audio_url; 
    } else {
        audio.src = `/audio/${current.audio_url}`;
    }
    
    setProgress(0) 
    setDuration(0) 

    if (isPlaying) { 
      audio.play().catch((e) => {
        console.error("Error al reproducir audio:", e);
        setIsPlaying(false);
      });
    }
  }, [current]); 

  // Sincronizar play/pause 
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch((e) => {
        console.error("Error al reproducir o reanudar audio:", e);
        setIsPlaying(false);
      });
    } else {
      audio.pause()
    }
  }, [isPlaying])

  const handlePlay = useCallback((track: Track, q?: Track[]) => {
    if (q && q.length) setQueue(q);
    setCurrent(track);
    setIsPlaying(true);
  }, []);

  const handleToggle = useCallback(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  }, [current, queue]);

  const handleSeek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress(seconds);
  }, []);

  const handleVolume = useCallback((v: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setVolumeState(v);
  }, []);

  const handleToggleLike = useCallback((id: string) => {
    const next = toggleLikeStore(id);
    setLiked(next);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleMode((prev) => !prev);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoopMode((prev) => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  }, []);

  // ✅ Nueva función para expandir/colapsar el reproductor
  const togglePlayerExpansion = useCallback(() => {
    setIsPlayerExpanded((prev) => !prev);
  }, []);


  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      isPlaying,
      volume,
      progress,
      duration,
      queue,
      play: handlePlay,
      toggle: handleToggle,
      next: handleNext, 
      prev: handlePrev,
      seek: handleSeek,
      setVolume: handleVolume,
      liked,
      toggleLike: handleToggleLike,
      shuffleMode, 
      loopMode,    
      toggleShuffle, 
      toggleLoop,
      isPlayerExpanded, // ✅ Exponer nuevo estado
      togglePlayerExpansion, // ✅ Exponer nueva función
    }),
    [
      current,
      isPlaying,
      volume,
      progress,
      duration,
      queue,
      handlePlay,
      handleToggle,
      handleNext,
      handlePrev,
      handleSeek,
      handleVolume,
      liked,
      handleToggleLike,
      shuffleMode,
      loopMode,
      toggleShuffle,
      toggleLoop,
      isPlayerExpanded, // ✅ Añadir a las dependencias
      togglePlayerExpansion // ✅ Añadir a las dependencias
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return ctx;
}
