"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { TrackCard } from "@/components/track-card"
import { getAllTracks, type Track } from "@/data/tracks"
import { Button } from "@/components/ui/button"
import { PlaylistCard } from "@/components/playlist-card"
import {
  loadHistory,
  loadLikes,
  savePlaylist,
  loadPlaylists,
  type Playlist,
} from "@/lib/store"

export function LibraryClient() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [likes, setLikes] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<string[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])

  useEffect(() => {
    setTracks(getAllTracks())
    setLikes(loadLikes())
    setHistory(loadHistory())
    setPlaylists(loadPlaylists())
  }, [])

  const likedTracks = useMemo(() => tracks.filter((t) => likes.has(t.id)), [tracks, likes])
  const recentTracks = useMemo(
    () => history.map((id) => tracks.find((t) => t?.id === id)).filter(Boolean) as Track[],
    [history, tracks]
  )

  const createPlaylist = () => {
    const title = `Mi Playlist ${playlists.length + 1}`
    const ids = likedTracks.slice(0, 8).map((t) => t.id)
    const next = savePlaylist({ title, trackIds: ids })
    setPlaylists(next)
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Playlists</h2>
          <Button onClick={createPlaylist} className="bg-black text-white hover:bg-black/90 rounded-full">
            Nueva playlist
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {playlists.map((p) => (
            <Link key={p.id} href={`/playlist/${p.id}`} className="block">
              <PlaylistCard title={p.title} count={p.trackIds.length} />
            </Link>
          ))}
          {playlists.length === 0 && (
            <div className="text-sm text-neutral-500">
              A&uacute;n no tienes playlists. Crea la primera.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Me gusta</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {likedTracks.map((t) => (
            <TrackCard key={t.id} track={t} queue={likedTracks} />
          ))}
          {likedTracks.length === 0 && (
            <div className="text-sm text-neutral-500">
              A&uacute;n no has marcado nada como me gusta.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Historial</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentTracks.map((t) => (
            <TrackCard key={t.id} track={t} queue={recentTracks} />
          ))}
          {recentTracks.length === 0 && (
            <div className="text-sm text-neutral-500">A&uacute;n no hay reproducciones recientes.</div>
          )}
        </div>
      </section>
    </div>
  )
}
