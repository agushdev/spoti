export type Track = {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  image: string
  audioUrl: string
  tags?: string[]
}

const tracks: Track[] = [
  {
    id: "t1",
    title: "Monochrome Dawn",
    artist: "NOVA",
    album: "Lines",
    duration: 215,
    image: "/minimal-bw-album-grid.png",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    tags: ["Minimal", "Instrumental"],
  },
  {
    id: "t2",
    title: "Soft Edges",
    artist: "Lumen",
    album: "Soft Edges",
    duration: 198,
    image: "/abstract-monochrome-circles.png",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    tags: ["Lo-fi", "Minimal"],
  },
  {
    id: "t3",
    title: "Pixel Noir",
    artist: "Aster",
    album: "Contrast",
    duration: 242,
    image: "/placeholder-zoiuk.png",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    tags: ["Electrónica"],
  },
  {
    id: "t4",
    title: "White Space",
    artist: "Mono",
    album: "Whitespace",
    duration: 164,
    image: "/placeholder-napmv.png",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    tags: ["Instrumental"],
  },
  {
    id: "t5",
    title: "Grayscale Hearts",
    artist: "Linea",
    album: "Grayscale",
    duration: 205,
    image: "/grayscale-abstract-waves.png",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    tags: ["Indie"],
  },
  {
    id: "t6",
    title: "Vectors",
    artist: "Shift",
    album: "Vectors",
    duration: 186,
    image: "/geometric-black-white-triangles.png",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    tags: ["Electrónica", "Minimal"],
  },
  {
    id: "t7",
    title: "Night Grid",
    artist: "Orbit",
    album: "Night",
    duration: 222,
    image: "/placeholder-u4pgm.png",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    tags: ["Indie"],
  },
  {
    id: "t8",
    title: "Silk",
    artist: "Noir",
    album: "Silk",
    duration: 176,
    image: "/soft-monochrome-gradient.png",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    tags: ["Lo-fi"],
  },
  {
    id: "t9",
    title: "Zenith",
    artist: "Axis",
    album: "Zenith",
    duration: 234,
    image: "/placeholder.svg?height=600&width=600",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    tags: ["Instrumental", "Minimal"],
  },
  {
    id: "t10",
    title: "Echo Rooms",
    artist: "Hollow",
    album: "Echo",
    duration: 189,
    image: "/placeholder.svg?height=600&width=600",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    tags: ["Electrónica"],
  },
]

export function getAllTracks() {
  return tracks
}

export function findTrack(id: string) {
  return tracks.find((t) => t.id === id) || null
}
