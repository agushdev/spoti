"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { loadPlaylists, savePlaylist, addToPlaylist, type Playlist } from "@/lib/store"

type Props = {
  open?: boolean
  onOpenChange?: (v: boolean) => void
  trackId: string
}

export function AddToPlaylistDialog({ open = false, onOpenChange = () => {}, trackId }: Props) {
  const [playlists, setPlaylists] = React.useState<Playlist[]>([])
  const [creating, setCreating] = React.useState(false)
  const [title, setTitle] = React.useState("")

  React.useEffect(() => {
    setPlaylists(loadPlaylists())
  }, [open])

  const createAndAdd = () => {
    if (!title.trim()) return
    const next = savePlaylist({ title: title.trim(), trackIds: [trackId] })
    setPlaylists(next)
    setTitle("")
    setCreating(false)
    onOpenChange(false)
  }

  const onAdd = (id: string) => {
    const next = addToPlaylist(id, trackId)
    setPlaylists(next)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar a playlist</DialogTitle>
          <DialogDescription>Elige una playlist o crea una nueva.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ScrollArea className="max-h-60 rounded-md border border-black/10">
            <div className="p-2 grid gap-1">
              {playlists.length === 0 && <div className="text-sm text-neutral-500 px-2 py-3">No hay playlists.</div>}
              {playlists.map((p) => (
                <Button key={p.id} variant="ghost" className="justify-start" onClick={() => onAdd(p.id)}>
                  {p.title} <span className="ml-auto text-xs text-neutral-500">{p.trackIds.length} pistas</span>
                </Button>
              ))}
            </div>
          </ScrollArea>

          {!creating ? (
            <Button className="w-full bg-black text-white hover:bg-black/90 rounded-full" onClick={() => setCreating(true)}>
              Nueva playlist
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de la playlist"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white"
              />
              <Button className="bg-black text-white hover:bg-black/90" onClick={createAndAdd}>
                Crear
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}