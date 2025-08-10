import "@/app/globals.css"
import { Inter } from 'next/font/google'
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import Link from "next/link"
import { Music2 } from 'lucide-react'
import { NavSidebar } from "@/components/nav-sidebar"
import { NavBottom } from "@/components/nav-bottom"
import { PlayerProvider } from "@/components/player/player-provider"
import { PlayerBar } from "@/components/player/player-bar"
import { FullScreenPlayer } from "@/components/player/full-screen-player"; // Asegúrate de que estén importados
import { DesktopPlayerControls } from "@/components/player/desktop-player-controls"; // Asegúrate de que estén importados
import type { Metadata } from "next/types"; // Importa el tipo Metadata

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = { // Asegúrate de que Metadata esté tipado
  title: "Minimal Music",
  description: "A lovable minimalist music streaming experience",
  // ✅ CRÍTICO: Configuración del viewport para evitar zoom inesperado en móviles
  viewport: {
    width: 'device-width',      // El ancho del viewport es el ancho del dispositivo
    initialScale: 1,            // La escala inicial es 1 (sin zoom)
    maximumScale: 1,            // Evita que el usuario pueda hacer zoom más allá de 1
    userScalable: false,        // Deshabilita el zoom manual por parte del usuario
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-white text-black antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PlayerProvider>
            {/* Main Grid Container */}
            <div className="min-h-screen grid md:grid-rows-[1fr_auto] md:grid-cols-[280px_1fr]">

              {/* Sidebar (desktop) - permanece igual */}
              <aside className="hidden md:flex md:flex-col border-r border-neutral-200">
                <Link href="/" className="flex items-center gap-2 px-6 py-5">
                  <div className="size-8 rounded-full bg-black text-white grid place-items-center">
                    <Music2 className="size-4" />
                  </div>
                  <span className="font-semibold tracking-tight">Spoti</span>
                </Link>
                <NavSidebar />
              </aside>

              {/* Main content */}
              {/* ✅ Ajustado padding-bottom para móviles para dar espacio a las barras fijas */}
              <main className="relative pb-44 md:pt-0 md:pb-0">
                <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-10">
                  {children}
                </div>
              </main>

              {/* Contenedor Fijo para Barras Inferiores (Móvil) / Contenedor de PlayerBar (Desktop) */}
              {/* ✅ Agregado padding-bottom para respetar el área segura del móvil */}
              <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col md:relative md:col-span-2 pb-[env(safe-area-inset-bottom)]">
                
                {/* Mini-Reproductor (visible solo en móvil) */}
                <div className="md:hidden border-t border-neutral-200 bg-white">
                  <div className="mx-auto"> 
                    <PlayerBar /> 
                  </div>
                </div>

                {/* Reproductor de Escritorio (visible solo en desktop) */}
                <div className="hidden md:block border-t border-neutral-200 bg-white">
                  <div className="mx-auto px-2 md:px-8">
                    <DesktopPlayerControls /> 
                  </div>
                </div>

                {/* NavBottom (solo en móvil, debajo de PlayerBar) */}
                <div className="md:hidden border-t border-neutral-200 bg-white">
                  <NavBottom />
                </div>

              </div>

            </div>
            <FullScreenPlayer /> 
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}