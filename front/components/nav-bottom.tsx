"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Library, User } from 'lucide-react'
import { cn } from "@/lib/utils"

export function NavBottom() {
  const pathname = usePathname()
  const items = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/library", label: "Biblioteca", icon: Library },
    { href: "/profile", label: "Perfil", icon: User },
  ]
  return (
    <nav className="grid grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center justify-center gap-1 py-3 text-xs",
            pathname === item.href ? "text-black" : "text-neutral-500"
          )}
        >
          <item.icon className="size-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
