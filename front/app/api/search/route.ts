import { NextResponse } from "next/server"
import { getAllTracks } from "@/data/tracks"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").toLowerCase()
  const tag = searchParams.get("tag")
  let data = getAllTracks()
  if (tag) {
    data = data.filter((t) => t.tags?.includes(tag))
  }
  if (q) {
    data = data.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    )
  }
  return NextResponse.json({ data })
}
