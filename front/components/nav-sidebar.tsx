"use client";

import { Home, User, Library, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/button";
import { AddPlaylistDialog } from "./add-playlist-dialog";
import { toast } from 'sonner';
import Image from "next/image"; 

// Define el tipo Playlist para lo que esperamos del backend
type Playlist = {
  id: number;
  name: string;
  tracks: any[]; 
  artwork_url?: string | null; 
};

export function NavSidebar() {
  const pathname = usePathname();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [isAddPlaylistDialogOpen, setIsAddPlaylistDialogOpen] = useState(false);

  const fetchPlaylists = useCallback(async () => {
    setIsLoadingPlaylists(true);
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const response = await fetch(`http://${host}:8000/api/playlists`);
      if (!response.ok) {
        throw new Error("Error al cargar las playlists.");
      }
      const data: Playlist[] = await response.json();
      setPlaylists(data);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error("Error", { description: "No se pudieron cargar tus playlists." });
    } finally {
      setIsLoadingPlaylists(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handlePlaylistCreated = () => {
    fetchPlaylists(); 
  };

  // ✅ Placeholder ahora es 48x48 para coincidir con el nuevo tamaño de imagen
  const defaultPlaceholderUrl = "https://placehold.co/48x48/cccccc/444444?text=PL"; 

  return (
    <nav className="flex flex-col gap-2 p-4 pt-0 text-sm font-medium">
      {/* Sección de Navegación Principal */}
      <Link
        href="/"
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-100 transition-colors",
          pathname === "/" ? "bg-neutral-100 text-black" : "text-neutral-600"
        )}
      >
        <Home className="size-5" />
        Inicio
      </Link>

      <Link
        href="/profile"
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-100 transition-colors",
          pathname === "/profile" ? "bg-neutral-100 text-black" : "text-neutral-600"
        )}
      >
        <User className="size-5" />
        Perfil
      </Link>

      <Link
        href="/library"
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-neutral-100 transition-colors",
          pathname === "/library" ? "bg-neutral-100 text-black" : "text-neutral-600"
        )}
      >
        <Library className="size-5" />
        Biblioteca
      </Link>

      {/* Separador */}
      <div className="my-4 border-b border-neutral-200" />

      {/* Sección de Playlists Rápidas */}
      <div className="flex justify-between items-center px-4">
        <h3 className="font-semibold text-neutral-800">Tu biblioteca</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-neutral-100 text-neutral-500"
          onClick={() => setIsAddPlaylistDialogOpen(true)}
          aria-label="Crear nueva playlist"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1 mt-2 max-h-48 overflow-y-auto custom-scrollbar">
        {isLoadingPlaylists ? (
          <p className="text-neutral-500 px-4 py-2">Cargando playlists...</p>
        ) : playlists.length === 0 ? (
          <p className="text-neutral-500 px-4 py-2">No tienes playlists.</p>
        ) : (
          playlists.map((playlist) => {
            let playlistImageUrl = playlist.artwork_url;
            if (playlistImageUrl && !playlistImageUrl.startsWith('http') && !playlistImageUrl.startsWith('/')) {
              playlistImageUrl = `/cover_art/${playlistImageUrl}`;
            } else if (!playlistImageUrl) {
              playlistImageUrl = defaultPlaceholderUrl;
            }

            return (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors truncate",
                  pathname === `/playlists/${playlist.id}` ? "bg-neutral-100 text-black" : "text-neutral-600"
                )}
                title={playlist.name} 
              >
                {/* ✅ Imagen de la carátula - Aumentado el tamaño a size-12 (48px) */}
                <div className="relative size-12 flex-shrink-0 rounded-md overflow-hidden bg-neutral-200">
                  <Image
                    src={playlistImageUrl}
                    alt={`Carátula de ${playlist.name}`}
                    fill
                    sizes="48px" // ✅ Actualizado el prop sizes para que coincida con size-12
                    className="object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultPlaceholderUrl;
                    }}
                  />
                </div>
                <span className="truncate">{playlist.name}</span> 
              </Link>
            );
          })
        )}
      </div>

      {/* Diálogo para crear nueva playlist (asegúrate de que este componente exista) */}
      <AddPlaylistDialog 
        open={isAddPlaylistDialogOpen} 
        onOpenChange={setIsAddPlaylistDialogOpen}
        onPlaylistCreated={handlePlaylistCreated}
      />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #e0e0e0;
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #bdbdbd;
        }
      `}</style>
    </nav>
  );
}