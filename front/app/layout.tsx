import type { Metadata } from "next/types";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlayerBar } from "@/components/player/player-bar";
import { DesktopPlayerControls } from "@/components/player/desktop-player-controls";
import { PlayerProvider } from "@/components/player/player-provider";
import { NavBottom } from "@/components/nav-bottom";
import { NavSidebar } from "@/components/nav-sidebar";
import Link from "next/link";
import { Music2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { LayoutClientComponents } from "../components/layout-client-components"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Spoti",
  description: "Una plataforma de streaming musical.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-white text-black antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PlayerProvider>
            {/* Main Grid Container para layout desktop */}
            {/* Si el reproductor es fijo en desktop, este grid no es tan relevante para él */}
            <div className="min-h-screen grid md:grid-cols-[280px_1fr]"> {/* Eliminado md:grid-rows */}

              {/* Sidebar (desktop) */}
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
              {/* Ajustado el padding-bottom para dejar espacio a las barras fijas en mobile y desktop */}
              <main className="relative pb-[calc(3rem+4rem+env(safe-area-inset-bottom))] md:pb-24"> {/* ✅ CAMBIO: md:pb-24 para espacio del reproductor fijo en desktop */}
                <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-10">
                  {children}
                </div>
              </main>

              {/* Contenedor Fijo para Barras Inferiores (Móvil y Escritorio) */}
              {/* ✅ CAMBIO: Eliminado md:relative md:col-span-2 para que sea fijo siempre */}
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

            </div>
            {/* Renderiza el nuevo componente de cliente que contiene FullScreenPlayer y Toaster */}
            <LayoutClientComponents />
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}