"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { usePlayer } from './player-provider';
import { X, Music } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LyricsPanel() {
  const {
    current,
    lyrics,
    activeLyricIndex,
    isUserScrolling,
    setIsUserScrolling,
    toggleLyricsPanel,
    seek,
  } = usePlayer();

  const lyricsContainerRef = useRef(null);
  const activeLyricRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Auto-scroll centrado y suave
  useEffect(() => {
    if (activeLyricRef.current && lyricsContainerRef.current && !isUserScrolling) {
      const activeLine = activeLyricRef.current;
      const container = lyricsContainerRef.current;

      const containerHeight = container.clientHeight;
      const lineOffsetTop = activeLine.offsetTop;
      const lineHeight = activeLine.clientHeight;

      const desiredScrollTop = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);

      if (Math.abs(container.scrollTop - desiredScrollTop) > 10) {
        container.scrollTo({
          top: Math.max(0, desiredScrollTop),
          behavior: 'smooth',
        });
      }
    }
  }, [activeLyricIndex, isUserScrolling, lyrics]);

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    setIsUserScrolling(true);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 3000);
  }, [setIsUserScrolling]);

  const handleLyricClick = useCallback((time) => {
    seek(time);
    setIsUserScrolling(false);
  }, [seek, setIsUserScrolling]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  if (!current || !lyrics || lyrics.length === 0) {
    return (
      <div className="h-full w-full bg-gradient-to-b from-neutral-900 to-black text-white flex flex-col">
        {/* Header fijo */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-900/95 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold">Letras</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLyricsPanel}
            className="rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Estado vacío */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-6">
            <Music className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hay letras</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Las letras aparecerán aquí cuando reproduzcas una canción que las tenga disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-b from-neutral-900 to-black text-white flex flex-col">
      {/* Header fijo con info de la canción */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-900/95 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Music className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold truncate">{current.title}</h2>
            <p className="text-xs text-neutral-400 truncate">{current.artist}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLyricsPanel}
          className="rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white h-8 w-8 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ÁREA DE LETRAS CON SCROLL PROPIO */}
      <div 
        ref={lyricsContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-custom"
      >
        {/* Espaciado superior para centrar */}
        <div className="h-24" />
        
        {/* Lista de letras */}
        <div className="px-4 space-y-4">
          {lyrics.map((line, index) => (
            <div
              key={index}
              ref={index === activeLyricIndex ? activeLyricRef : null}
              onClick={() => handleLyricClick(line.time)}
              className={cn(
                "cursor-pointer transition-all duration-300 ease-out select-none py-2 px-3 rounded-lg",
                "leading-relaxed",
                index === activeLyricIndex 
                  ? "text-white font-semibold text-xl bg-white/10 scale-105 shadow-lg" 
                  : "text-neutral-500 hover:text-white hover:scale-105 text-lg hover:bg-white/5"
              )}
              style={{
                transformOrigin: 'left center',
                lineHeight: '1.6',
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        {/* Espaciado inferior */}
        <div className="h-32" />
      </div>

      {/* Indicador de scroll manual */}
      {isUserScrolling && (
        <div className="absolute top-20 right-4 bg-black/70 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border border-neutral-700">
          Scroll manual
        </div>
      )}

      {/* Gradiente inferior para efecto */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />

      {/* Estilos de scrollbar */}
      <style jsx>{`
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: #525252 transparent;
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background-color: #525252;
          border-radius: 3px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background-color: #737373;
        }
      `}</style>
    </div>
  );
}