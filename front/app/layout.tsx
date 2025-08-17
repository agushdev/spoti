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
import { LayoutClientComponents } from "@/components/layout-client-components"; 

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
            {/* Contenedor principal de la aplicación. Usa flex vertical para asegurar que el footer esté siempre abajo. */}
            <div className="flex flex-col min-h-screen">
              {/* Contenedor del contenido superior: Sidebar + Main Content (incluyendo LyricsPanel) */}
              {/* Esto tomará todo el espacio restante por encima del footer fijo */}
              <div className="flex flex-1 md:grid md:grid-cols-[280px_1fr] overflow-hidden">
                {/* 'flex-1' es crucial aquí para que este contenedor ocupe la altura restante */}
                {/* Esto permite que el 'aside' dentro de 'LayoutClientComponents' también se estire */}

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

                {/* LayoutClientComponents maneja el main content y el LyricsPanel.
                    Este componente ya se encarga de la altura y el overflow dentro de sí. */}
                <LayoutClientComponents>
                  {children}
                </LayoutClientComponents>

              </div> {/* Fin del div flex-1 para contenido superior */}

              {/* Contenedor Fijo para Barras Inferiores (Móvil y Escritorio) */}
              {/* Esto siempre estará anclado en la parte inferior de la ventana */}
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

              </div> {/* Fin del div fixed bottom */}

            </div> {/* Fin del div flex-col min-h-screen */}
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}