import { NextResponse } from "next/server"
import { getAllTracks } from "@/data/tracks"

export async function GET() {
  const all = getAllTracks()
  // naive mock: return first N as "recommended"
  return NextResponse.json({ data: all.slice(0, 12) })
}
