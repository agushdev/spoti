"use client"

import { Input } from "@/components/ui/input"
import { Search } from 'lucide-react'

type Props = {
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
}

export function SearchInput({
  value = "",
  onChange = () => {},
  placeholder = "Buscar por titulo, artista o album",
}: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 bg-white"
      />
    </div>
  )
}
