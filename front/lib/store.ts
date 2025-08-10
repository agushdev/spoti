export type Playlist = {
  id: string
  title: string
  trackIds: string[]
}

const LIKES_KEY = "mm_likes"
const HISTORY_KEY = "mm_history"
const PLAYLISTS_KEY = "mm_playlists"

export function loadLikes(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(LIKES_KEY) || "[]"))
  } catch {
    return new Set()
  }
}

export function toggleLike(id: string): Set<string> {
  const likes = loadLikes()
  if (likes.has(id)) likes.delete(id)
  else likes.add(id)
  localStorage.setItem(LIKES_KEY, JSON.stringify(Array.from(likes)))
  return likes
}

export function pushHistory(id: string) {
  if (typeof window === "undefined") return
  const arr = loadHistory()
  const next = [id, ...arr.filter((x) => x !== id)].slice(0, 24)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

export function loadHistory(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
  } catch {
    return []
  }
}

export function loadPlaylists(): Playlist[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || "[]")
  } catch {
    return []
  }
}

export function savePlaylist(p: { title: string; trackIds: string[] }): Playlist[] {
  const prev = loadPlaylists()
  const next: Playlist = {
    id: crypto.randomUUID(),
    title: p.title,
    trackIds: p.trackIds,
  }
  const all = [next, ...prev]
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(all))
  return all
}
