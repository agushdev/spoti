import { NextResponse } from "next/server"
import { getAllTracks } from "@/data/tracks"

export async function GET() {
  return NextResponse.json({ data: getAllTracks() })
}
