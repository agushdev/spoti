"use client";

import { usePlayer } from "@/components/player/player-provider"; 
import { FullScreenPlayer } from "@/components/player/full-screen-player";
import { Toaster } from "@/components/ui/toaster";
import { LyricsPanel } from "@/components/player/lyrics-panel";
import { useMedia } from "react-use";
import { cn } from "@/lib/utils";

export function LayoutClientComponents({ children }: { children: React.ReactNode }) {
  const { showPlayerExpansion, showLyricsPanel, current } = usePlayer();
  const isMobile = useMedia('(max-width: 767px)', false);

  const desktopLyricsPanelWidth = "400px";
  const desktopPlayerControlsHeight = "72px";

  return (
    <>
      <div className="flex flex-1 overflow-hidden relative">
        {/* Contenido principal */}
        <main
          className={cn(
            "relative flex-1 overflow-y-auto bg-neutral-50 px-4 md:px-8 py-6 md:py-10 transition-all duration-300",
            {
              "hidden md:block": showPlayerExpansion && !isMobile,
              // Reduce el ancho del contenido cuando el panel de letras está abierto
              "mr-[400px]": showLyricsPanel && !isMobile && current?.lyrics_lrc,
            }
          )}
        >
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>

        {/* PANEL DE LETRAS FIJO A LA DERECHA */}
        {showLyricsPanel && !isMobile && current?.lyrics_lrc && (
          <aside
            style={{
              width: desktopLyricsPanelWidth,
              // ALTURA FIJA - Esta es la clave
              height: `calc(100vh - ${desktopPlayerControlsHeight})`,
            }}
            className={cn(
              "fixed right-0 top-0 z-40", // FIJO en la pantalla
              "bg-neutral-900 border-l border-neutral-700",
              "flex flex-col",
              {
                "hidden": showPlayerExpansion && !isMobile,
              }
            )}
          >
            <LyricsPanel />
          </aside>
        )}
      </div>

      {/* FullScreenPlayer */}
      {showPlayerExpansion && (
        <FullScreenPlayer />
      )}

      <Toaster />
    </>
  );
}