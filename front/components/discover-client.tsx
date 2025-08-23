"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { TrackCard } from "@/components/track-card"
import { SearchInput } from "@/components/search-input"
import { cn } from "@/lib/utils"

type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string;
  tags?: string[];
};

const FILTERS = ["Todo", "Rock"]

export function DiscoverClient() {
  const [q, setQ] = useState("")
  const [active, setActive] = useState("Todo")
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  useEffect(() => {
    async function fetchTracks() {
      try {
        const response = await fetch(`http://${API_BASE_URL}:8000/api/tracks`);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data: Track[] = await response.json();
        setTracks(data);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTracks();
  }, []);

  const filtered = useMemo(() => {
    const base = active === "Todo" ? tracks : tracks.filter((t) => t.tags?.includes(active))
    if (!q) return base
    const qq = q.toLowerCase()
    return base.filter(
      (t) =>
        t.title.toLowerCase().includes(qq) ||
        t.artist.toLowerCase().includes(qq) ||
        t.album.toLowerCase().includes(qq)
    )
  }, [q, tracks, active])

  if (isLoading) {
    return <div className="p-10 text-center text-neutral-500">Cargando canciones...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
        <SearchInput value={q} onChange={setQ} />
        <div className="hidden md:flex gap-2 justify-end">
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant="ghost"
              className={cn(
                "rounded-full border border-transparent",
                active === f ? "bg-black text-white hover:bg-black" : "hover:bg-neutral-100"
              )}
              onClick={() => setActive(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>
      <div className="md:hidden flex gap-2 overflow-auto no-scrollbar">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant="ghost"
            className={cn(
              "rounded-full border border-transparent",
              active === f ? "bg-black text-white hover:bg-black" : "hover:bg-neutral-100"
            )}
            onClick={() => setActive(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Recomendado para ti</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.slice(0, 12).map((t) => (
            <TrackCard key={t.id} track={t} queue={filtered} />
          ))}
        </div>
      </section>
    </div>
  )
}