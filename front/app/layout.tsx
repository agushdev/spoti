import type { Metadata } from "next/types";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider"; 
import Link from "next/link"; 
import { Music2 } from 'lucide-react'; 
import { NavSidebar } from "@/components/nav-sidebar"; 
import { NavBottom } from "@/components/nav-bottom"; 
import { PlayerProvider } from "@/components/player/player-provider";
import { PlayerBar } from "@/components/player/player-bar";
import { FullScreenPlayer } from "@/components/player/full-screen-player";
import { DesktopPlayerControls } from "@/components/player/desktop-player-controls"; 
import { Toaster } from "sonner"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Minimal Music", 
  description: "A lovable minimalist music streaming experience", 
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning> 
      {/* Body como flex-col para que el contenido principal ocupe el espacio y el footer sea fijo */}
      <body className={cn(inter.className, "bg-white text-black antialiased flex flex-col min-h-screen")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}> 
          <PlayerProvider>
            {/* Contenedor principal del sidebar y el contenido, flex-1 para crecer */}
            <div className="flex-1 grid md:grid-cols-[280px_1fr]"> 

              {/* Sidebar (desktop) */}
              <aside className="hidden md:flex md:flex-col border-r border-neutral-200 sticky top-0 h-screen overflow-y-auto">
                <Link href="/" className="flex items-center gap-2 px-6 py-5">
                  <div className="size-8 rounded-full bg-black text-white grid place-items-center">
                    <Music2 className="size-4" />
                  </div>
                  <span className="font-semibold tracking-tight">Spoti</span>
                </Link>
                <NavSidebar />
              </aside>

              {/* Main content */}
              {/* ✅ AJUSTADO: padding-bottom para dejar espacio a las barras fijas */}
              {/* pb-[calc(AlturaPlayerBarMovil + AlturaNavBottom + safe-area)] para móvil */}
              {/* md:pb-[calc(AlturaDesktopPlayerControls + safe-area)] para desktop */}
              {/* Asumiendo PlayerBar/DesktopPlayerControls ~3rem, NavBottom ~4rem */}
              <main className="relative flex-1 overflow-y-auto pb-[calc(3rem+4rem+env(safe-area-inset-bottom))] md:pb-[calc(3rem+env(safe-area-inset-bottom))]"> 
                <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-10">
                  {children}
                </div>
              </main>
            </div>

            {/* ✅ CAMBIO CLAVE: Contenedor siempre fijo en la parte inferior */}
            {/* Elimina `md:relative md:col-span-2` para que siempre sea `fixed` */}
            <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col pb-[env(safe-area-inset-bottom)]">
                
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
            <FullScreenPlayer /> 
          </PlayerProvider>
          <Toaster theme="light" position="top-right" /> 
        </ThemeProvider>
      </body>
    </html>
  );
}