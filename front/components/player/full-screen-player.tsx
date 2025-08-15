"use client";

import { Dialog as DialogRoot, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlayer } from "./player-provider";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Volume2, Heart, Music } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect, useState, useRef, useCallback } from "react";

type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string | null;
  audio_url: string;
  lyrics_lrc?: string | null;
};

type LyricLine = {
  time: number;
  text: string;
};

function parseLRC(lrcContent: string): LyricLine[] {
  const lines = lrcContent.trim().split('\n');
  const parsedLyrics: LyricLine[] = [];

  lines.forEach(line => {
    const timeMatch = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\]/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1], 10);
      const seconds = parseInt(timeMatch[2], 10);
      const milliseconds = parseInt(timeMatch[3].padEnd(3, '0'), 10);
      const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
      
      let text = line.substring(timeMatch[0].length).trim();
      text = text.replace(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/g, '').trim();
      text = text.replace(/\s+/g, ' ').trim();
      
      if (text && !parsedLyrics.some(lyric => lyric.text === text && lyric.time === timeInSeconds)) {
        parsedLyrics.push({ time: timeInSeconds, text });
      }
    }
  });

  parsedLyrics.sort((a, b) => a.time - b.time);
  return parsedLyrics;
}

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export function FullScreenPlayer() {
  const {
    current,
    isPlaying,
    toggle,
    next,
    prev,
    progress,
    duration,
    seek,
    volume,
    setVolume,
    liked,
    toggleLike,
    shuffleMode,
    loopMode,
    toggleShuffle,
    toggleLoop,
    isPlayerExpanded,
    togglePlayerExpansion,
  } = usePlayer();

  const vol = Math.round(volume * 100);

  const defaultCover = "https://placehold.co/500x500/E0E0E0/A0A0A0?text=No+Cover";
  let playerCoverSource: string;

  if (current && typeof current.artwork_url === 'string' && current.artwork_url.trim() !== '') {
    if (current.artwork_url.startsWith('http://') || current.artwork_url.startsWith('https://')) {
      playerCoverSource = current.artwork_url;
    } else if (current.artwork_url.startsWith('/')) {
      playerCoverSource = current.artwork_url;
    } else {
      playerCoverSource = `/cover_art/${current.artwork_url}`;
    }
  } else {
    playerCoverSource = defaultCover;
  }

  const dialogBackgroundStyle = {
    backgroundImage: `url('${playerCoverSource}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLParagraphElement>(null);
  const [showLyrics, setShowLyrics] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  useEffect(() => {
    if (current?.lyrics_lrc) {
      const unescapedLrc = current.lyrics_lrc.replace(/\\n/g, '\n');
      setLyrics(parseLRC(unescapedLrc));
      setActiveLyricIndex(-1);
    } else {
      setLyrics([]);
      setActiveLyricIndex(-1);
    }
  }, [current?.lyrics_lrc]);

  const handleScroll = useCallback(() => {
    setIsUserScrolling(true);
  }, []);

  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      container.addEventListener('touchmove', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
        container.removeEventListener('touchmove', handleScroll);
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    if (lyrics.length === 0 || !isPlaying || isUserScrolling) return;

    let newActiveIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (progress >= lyrics[i].time) {
        newActiveIndex = i;
      } else {
        break;
      }
    }
    setActiveLyricIndex(newActiveIndex);

    if (activeLyricRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const activeLine = activeLyricRef.current;
      const containerHeight = container.clientHeight;
      const lineHeight = activeLine.offsetHeight;
      const lineOffsetTop = activeLine.offsetTop;
      const scrollTop = container.scrollTop;
      const scrollBottom = scrollTop + containerHeight;

      const isActiveLyricVisible = lineOffsetTop >= scrollTop && lineOffsetTop + lineHeight <= scrollBottom;
      if (!isActiveLyricVisible) {
        const desiredScrollTop = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);
        container.scrollTo({
          top: desiredScrollTop,
          behavior: 'smooth'
        });
      }
    }
  }, [progress, lyrics, isPlaying, isUserScrolling]);

  const handleLyricClick = useCallback((time: number) => {
    seek(time);
    setIsUserScrolling(false); // Resume auto-scrolling after seeking
  }, [seek]);

  const handleToggleLyrics = useCallback(() => {
    setShowLyrics(prev => !prev);
    setIsUserScrolling(false); // Resume auto-scrolling when toggling lyrics
  }, []);

  if (!current) {
    return null;
  }

  return (
    <DialogRoot open={isPlayerExpanded} onOpenChange={togglePlayerExpansion}>
      <DialogContent 
        className={cn(
          "fixed inset-0 w-screen h-screen p-0 m-0",
          "flex flex-col items-center justify-start",
          "text-white", 
          "!translate-x-0 !translate-y-0 !top-0 !left-0 !max-w-none rounded-none border-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "full-screen-player-custom-dialog"
        )}
        style={dialogBackgroundStyle} 
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl z-0"></div> 
        
        <VisuallyHidden>
          <DialogTitle>Reproductor a Pantalla Completa</DialogTitle>
        </VisuallyHidden>

        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayerExpansion}
          className="absolute top-4 right-4 z-20 rounded-full text-white hover:bg-white/20"
          aria-label="Cerrar reproductor"
        >
          <X className="size-6" />
        </Button>

        {lyrics.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleLyrics}
            className="absolute top-4 left-4 z-20 rounded-full text-white hover:bg-white/20"
            aria-label={showLyrics ? "Ocultar letras" : "Mostrar letras"}
          >
            <Music className="size-6" />
          </Button>
        )}

        {!showLyrics ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-4 pt-16 pb-8 sm:pt-20 sm:pb-10">
            <div className="relative w-full max-w-[calc(100vw-4rem)] sm:max-w-lg aspect-square rounded-xl overflow-hidden shadow-2xl">
              <Image
                src={playerCoverSource}
                alt={`Carátula de ${current?.album || "Desconocido"}`}
                fill
                sizes="(max-width: 640px) 90vw, 500px"
                className="object-cover"
                onError={(e) => {
                  console.error("Full screen image failed to load:", playerCoverSource);
                  (e.target as HTMLImageElement).src = defaultCover;
                }}
              />
            </div>

            <div className="text-center w-full px-2 mt-8">
              <h2 className="text-3xl sm:text-4xl font-extrabold truncate text-white">{current?.title || "Nada reproduciéndose"}</h2>
              <p className="text-lg sm:text-2xl text-neutral-300 truncate mt-1">{current?.artist || "Selecciona una pista"}</p>
              <p className="text-sm sm:text-base text-neutral-400 truncate mt-1">{current?.album || "Álbum desconocido"}</p>
            </div>

            <div className="w-full max-w-sm sm:max-w-xl flex items-center gap-3 mt-10">
              <span className="text-sm tabular-nums text-neutral-300">{formatTime(progress)}</span>
              <Slider
                value={[Math.min(progress, duration || 0)]}
                max={Math.max(duration, 1)}
                step={1}
                onValueChange={(v) => seek(v[0] || 0)}
                className="flex-1 [&_span]:bg-white [&_div]:bg-neutral-700 [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0"
              />
              <span className="text-sm tabular-nums text-neutral-300">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-center w-full max-w-sm sm:max-w-md gap-4 mt-8">
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-10 p-0 text-neutral-400 hover:text-white", shuffleMode && "text-white")}
                onClick={toggleShuffle}
                aria-label="Modo aleatorio"
              >
                <Shuffle className="size-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-14 p-0 text-white hover:bg-white/20"
                onClick={prev}
                aria-label="Anterior"
              >
                <SkipBack className="size-8" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full bg-white text-black size-20 p-0 flex items-center justify-center hover:bg-white/90 shadow-lg"
                onClick={toggle}
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause className="size-10" /> : <Play className="size-10" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-14 p-0 text-white hover:bg-white/20"
                onClick={next}
                aria-label="Siguiente"
              >
                <SkipForward className="size-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-10 p-0 text-neutral-400 hover:text-white", loopMode !== 'none' && "text-white")}
                onClick={toggleLoop}
                aria-label={`Modo de repetición: ${loopMode === 'none' ? 'Ninguno' : loopMode === 'all' ? 'Toda la lista' : 'Una canción'}`}
              >
                {loopMode === 'one' ? (
                  <Repeat1 className="size-6" />
                ) : (
                  <Repeat className="size-6" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-center w-full max-w-sm sm:max-w-md gap-4 mt-8">
              <Button
                variant="ghost"
                size="icon"
                aria-label={liked.has(String(current?.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
                onClick={() => current && toggleLike(String(current.id))}
                className={cn(
                  "size-10 p-0 text-neutral-400 hover:text-white",
                  liked.has(String(current?.id)) && "text-red-500 fill-red-500 hover:text-red-500"
                )}
              >
                <Heart className={cn("size-6", liked.has(String(current?.id)) && "fill-current")} />
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <Volume2 className="size-5 text-neutral-300" />
                <Slider
                  value={[vol]}
                  max={100}
                  step={1}
                  onValueChange={(v) => setVolume((v[0] || 0) / 100)}
                  className="flex-1 [&_span]:bg-white [&_div]:bg-neutral-700 [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0"
                />
                <span className="text-sm text-neutral-300 tabular-nums w-8 text-right">{vol}</span>
              </div>
            </div>
          </div>
        ) : (
          <div 
            ref={lyricsContainerRef}
            className="w-full h-full relative z-10 p-4 flex flex-col items-center text-center overflow-y-auto custom-lrc-scrollbar"
          >
            <div className="w-full max-w-[calc(100vw-2rem)] flex flex-col items-center">
              {lyrics.map((line, index) => (
                <p
                  key={index}
                  ref={index === activeLyricIndex ? activeLyricRef : null}
                  className={cn(
                    "text-2xl sm:text-3xl font-semibold my-4 px-2 transition-all duration-300 ease-in-out",
                    "whitespace-normal break-words cursor-pointer",
                    index === activeLyricIndex ? "text-white scale-110" : "text-neutral-400 hover:text-neutral-200"
                  )}
                  onClick={() => handleLyricClick(line.time)}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        )}

        <style jsx global>{`
          [data-slot="dialog-close"] {
            display: none !important;
          }

          .custom-lrc-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-lrc-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 10px;
          }
          .custom-lrc-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(255,255,255,0.4);
            border-radius: 10px;
            border: 1px solid rgba(0,0,0,0.2);
          }
          .custom-lrc-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(255,255,255,0.6);
          }
        `}</style>
      </DialogContent>
    </DialogRoot>
  );
}