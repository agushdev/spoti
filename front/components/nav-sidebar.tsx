"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Library, User, Search } from 'lucide-react'

export function NavSidebar() {
  const pathname = usePathname()
  const items = [
    { href: "/library", label: "Biblioteca", icon: Library },
    { href: "/profile", label: "Perfil", icon: User },
  ]
  return (
    <nav className="px-2 py-2">
      <Link
        href="/"
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:bg-neutral-100 transition-colors",
          pathname === "/" && "bg-neutral-100"
        )}
      >
        <Home className="size-4" />
        <span>Inicio</span>
      </Link>
      <div className="mt-2 grid gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm hover:bg-neutral-100 transition-colors",
              pathname === item.href && "bg-neutral-100"
            )}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
