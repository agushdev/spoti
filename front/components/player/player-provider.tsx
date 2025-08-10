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

// Definir el tipo para la respuesta paginada del backend
type PagedTracksResponse = {
  total: number;
  items: Track[];
};

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
  isPlayerExpanded: boolean;
  togglePlayerExpansion: () => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [queue, setQueue] = useState<Track[]>([])
  const [current, setCurrent] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  // ✅ MODIFICACIÓN: Cargar volumen desde localStorage o usar 0.8 por defecto
  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('lastVolume');
      return savedVolume ? parseFloat(savedVolume) : 0.8;
    }
    return 0.8;
  });
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [liked, setLiked] = useState<Set<string>>(loadLikes())
  const [shuffleMode, setShuffleMode] = useState(false); 
  const [loopMode, setLoopMode] = useState<LoopMode>('all'); 
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);

  // Referencia para el ID de la pista cargada previamente
  const loadedTrackIdRef = useRef<number | null>(null);

  // Estados para el historial de reproducción
  const [playedHistory, setPlayedHistory] = useState<Track[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Estado para el tiempo de búsqueda inicial al cargar la página
  const [initialSeekTime, setInitialSeekTime] = useState<number | null>(null);


  // Estados y refs para los callbacks (se mantienen igual, solo se mueve la declaración)
  const queueRef = useRef(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const currentRef = useRef(current);
  useEffect(() => { currentRef.current = current; }, [current]);

  const shuffleModeRef = useRef(shuffleMode);
  useEffect(() => { shuffleModeRef.current = shuffleMode; }, [shuffleMode]);

  const loopModeRef = useRef(loopMode);
  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);

  const historyIndexRef = useRef(historyIndex);
  useEffect(() => { historyIndexRef.current = historyIndex; }, [historyIndex]);

  const playedHistoryRef = useRef(playedHistory);
  useEffect(() => { playedHistoryRef.current = playedHistory; }, [playedHistory]);


  const handleNext = useCallback(() => {
    const currentQueue = queueRef.current;
    const currentTrack = currentRef.current;
    const currentShuffleMode = shuffleModeRef.current;
    const currentLoopMode = loopModeRef.current;
    const currentPlayedHistory = playedHistoryRef.current;
    const currentHistoryIndex = historyIndexRef.current;

    if (!currentTrack || currentQueue.length === 0) return;

    if (currentLoopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }

    let nextTrack: Track | null = null;

    if (currentHistoryIndex < currentPlayedHistory.length - 1) {
        nextTrack = currentPlayedHistory[currentHistoryIndex + 1];
        setHistoryIndex(prev => prev + 1);
    } else {
        let nextIdx;
        let potentialNextIdx; 
        if (currentShuffleMode) {
            do {
                potentialNextIdx = Math.floor(Math.random() * currentQueue.length);
            } while (currentQueue.length > 1 && currentQueue[potentialNextIdx].id === currentTrack.id); 
            nextIdx = potentialNextIdx;
        } else {
            const idx = currentQueue.findIndex((t) => t.id === currentTrack.id);
            nextIdx = (idx + 1) % currentQueue.length;
        }

        nextTrack = currentQueue[nextIdx];

        if (currentLoopMode === 'none' && nextIdx === 0 && !currentShuffleMode) {
            setIsPlaying(false); 
            setCurrent(currentQueue[0]); 
            return; 
        }

        setPlayedHistory(prev => [...prev.slice(0, currentHistoryIndex + 1), nextTrack!]);
        setHistoryIndex(prev => prev + 1);
    }
    
    setCurrent(nextTrack);
    setIsPlaying(true);

  }, []);

  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);


  const handlePrev = useCallback(() => {
    const currentTrack = currentRef.current;
    const currentPlayedHistory = playedHistoryRef.current;
    const currentHistoryIndex = historyIndexRef.current;

    if (!currentTrack || currentPlayedHistory.length === 0) return;

    if (audioRef.current && audioRef.current.currentTime > 3 || currentHistoryIndex === 0) {
      audioRef.current.currentTime = 0;
      if (!isPlaying) { 
        setIsPlaying(true);
      }
      return;
    }

    if (currentHistoryIndex > 0) {
      const prevTrack = currentPlayedHistory[currentHistoryIndex - 1];
      setHistoryIndex(prev => prev - 1);
      setCurrent(prevTrack);
      setIsPlaying(true);
    }
  }, [isPlaying]);


  useEffect(() => {
    async function fetchTracks() {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${host}:8000/api/tracks`); 
        
        if (!res.ok) {
          throw new Error('Error cargando canciones desde la API.');
        }
        const pagedData: PagedTracksResponse = await res.json();
        setQueue(pagedData.items); 
        
        // Cargar última canción y progreso desde localStorage
        const savedTrackId = localStorage.getItem('lastPlayedTrackId');
        const savedProgress = localStorage.getItem('lastPlayedProgress');

        let initialTrack: Track | null = null;
        let initialTime: number | null = null;

        if (savedTrackId && savedProgress) {
            const parsedSavedTrackId = parseInt(savedTrackId, 10);
            const parsedSavedProgress = parseFloat(savedProgress);
            const foundTrack = pagedData.items.find(track => track.id === parsedSavedTrackId);

            if (foundTrack) {
                initialTrack = foundTrack;
                initialTime = parsedSavedProgress;
            }
        }

        if (initialTrack) {
            setCurrent(initialTrack);
            setPlayedHistory([initialTrack]);
            setHistoryIndex(0);
            setInitialSeekTime(initialTime); // Guardar el tiempo para aplicarlo después
        } else if (pagedData.items.length > 0 && !currentRef.current) {
            const firstTrack = pagedData.items[0];
            setCurrent(firstTrack);
            setPlayedHistory([firstTrack]);
            setHistoryIndex(0);
        }
      } catch (err) {
        console.error("Error cargando canciones:", err);
      }
    }
    fetchTracks();
  }, []); 


  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = "anonymous"
    audioRef.current = audio
    // ✅ MODIFICACIÓN: Asignar el volumen inicial cargado o el por defecto
    audio.volume = volume 

    const onTime = () => setProgress(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration || 0)
    
    const onEnded = () => handleNextRef.current(); 

    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("ended", onEnded) 

    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("ended", onEnded)
    }
  }, []) 


  // Cargar nueva canción cuando cambia `current`
  // Solo reinicia el progreso si la canción es diferente a la última cargada
  // Y aplica initialSeekTime si está disponible
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;

    // Comprobar si la canción actual es diferente a la última que se cargó
    const isNewTrack = loadedTrackIdRef.current !== current.id;

    if (isNewTrack) {
        if (current.audio_url.startsWith('/') || current.audio_url.startsWith('http://') || current.audio_url.startsWith('https://')) {
            audio.src = current.audio_url; 
        } else {
            audio.src = `/audio/${current.audio_url}`;
        }
        audio.load(); // Cargar el audio para que `duration` esté disponible

        // Aplicar el tiempo de búsqueda inicial si existe para una nueva pista
        if (initialSeekTime !== null) {
            audio.currentTime = initialSeekTime;
            setProgress(initialSeekTime); // También actualiza el progreso en el estado
            setInitialSeekTime(null); // Consumir el initialSeekTime
        } else {
            setProgress(0); // Reiniciar progreso solo para nueva canción si no hay initialSeekTime
            setDuration(0); // Reiniciar duración solo para nueva canción
        }
        loadedTrackIdRef.current = current.id; // Actualizar el ID de la pista cargada
    }
    
    // Reproducir/pausar según el estado isPlaying, sin reiniciar si es la misma canción
    if (isPlaying) { 
      audio.play().catch((e) => {
        console.error("Error al reproducir audio:", e);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [current, isPlaying, initialSeekTime]);


  // Guardar en localStorage cuando se pausa o se descarga la página
  useEffect(() => {
    const savePlayerState = () => {
      if (current) {
        localStorage.setItem('lastPlayedTrackId', String(current.id));
        localStorage.setItem('lastPlayedProgress', String(audioRef.current?.currentTime || 0));
      }
    };

    // Guarda el estado cuando se pausa
    if (!isPlaying && current) {
      savePlayerState();
    }

    // Guarda el estado cuando se cierra la página o se navega fuera
    window.addEventListener('beforeunload', savePlayerState);

    return () => {
      window.removeEventListener('beforeunload', savePlayerState);
    };
  }, [current, isPlaying, progress]); // Dependencias para re-ejecutar el effect

  // ✅ NUEVO: Guardar volumen en localStorage cada vez que cambia
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastVolume', String(volume));
    }
  }, [volume]); // Depende del estado 'volume'


  const handlePlay = useCallback((track: Track, q?: Track[]) => {
    setPlayedHistory([track]);
    setHistoryIndex(0);

    if (q && q.length) setQueue(q);
    setCurrent(track);
    setIsPlaying(true);
  }, []);

  const handleToggle = useCallback(() => {
    if (!current && queue.length > 0) {
      const firstTrack = queue[0];
      setCurrent(firstTrack);
      setIsPlaying(true);
      setPlayedHistory([firstTrack]);
      setHistoryIndex(0);
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
    setVolumeState(v); // ✅ Llama a setVolumeState para actualizar el estado
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
      isPlayerExpanded, 
      togglePlayerExpansion, 
    }),
    [
      current,
      isPlaying,
      volume, // ✅ Incluir volumen en las dependencias para que useMemo lo actualice
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
      isPlayerExpanded, 
      togglePlayerExpansion 
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