"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Save } from 'lucide-react'

type Profile = {
  displayName: string
  bio: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ displayName: "", bio: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("mm_profile")
    if (stored) {
      setProfile(JSON.parse(stored))
    } else {
      setProfile({ displayName: "Invitado", bio: "Amante de la musica minimalista" })
    }
  }, [])

  const onSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    localStorage.setItem("mm_profile", JSON.stringify(profile))
    setSaving(false)
  }

  const initials = profile.displayName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Tu Perfil</h1>
        <p className="text-neutral-600">Gestiona tu identidad y preferencias.</p>
      </header>

      <Card className="p-6 border-black/10">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 border border-black/10">
            <AvatarFallback>{initials || "MM"}</AvatarFallback>
          </Avatar>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="space-y-2">
              <label className="text-sm text-neutral-600">Nombre visible</label>
              <Input
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="Tu nombre"
                className="bg-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-neutral-600">Bio</label>
              <Input
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Cu&eacute;ntanos algo de ti"
                className="bg-white"
              />
            </div>
          </div>
          <Button onClick={onSave} disabled={saving} className="ml-auto bg-black text-white hover:bg-black/90">
            <Save className="size-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </Card>
    </div>
  )
}
