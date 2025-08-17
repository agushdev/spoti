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
      <head>
        {/* ✅ Metadatos PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-512x512.png" />
        <link rel="icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={cn(inter.className, "bg-white text-black antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PlayerProvider>
            <div className="flex flex-col min-h-screen">
              <div className="flex flex-1 md:grid md:grid-cols-[280px_1fr] overflow-hidden">
                <aside className="hidden md:flex md:flex-col border-r border-neutral-200">
                  <Link href="/" className="flex items-center gap-2 px-6 py-5">
                    <div className="size-8 rounded-full bg-black text-white grid place-items-center">
                      <Music2 className="size-4" />
                    </div>
                    <span className="font-semibold tracking-tight">Spoti</span>
                  </Link>
                  <NavSidebar />
                </aside>

                <LayoutClientComponents>
                  {children}
                </LayoutClientComponents>
              </div>

              <div className="fixed inset-x-0 bottom-0 z-50 flex flex-col pb-[env(safe-area-inset-bottom)]">
                <div className="md:hidden border-t border-neutral-200 bg-white">
                  <div className="mx-auto"> 
                    <PlayerBar /> 
                  </div>
                </div>

                <div className="hidden md:block border-t border-neutral-200 bg-white">
                  <div className="mx-auto px-2 md:px-8">
                    <DesktopPlayerControls /> 
                  </div>
                </div>

                <div className="md:hidden border-t border-neutral-200 bg-white">
                  <NavBottom />
                </div>
              </div>
            </div>
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}