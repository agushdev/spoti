"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TrackCard } from "@/components/track-card";
import Link from "next/link";
import { ChevronLeft, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddTrackToPlaylistDialog } from '@/components/add-track-to-playlist-dialog';
import { EditPlaylistNameDialog } from '@/components/edit-playlist-name-dialog';
import { DeletePlaylistDialog } from '@/components/delete-playlist-dialog';
import { loadPlaylists } from '@/lib/store';
import type { BackendPlaylist, LocalPlaylist, Track } from '@/types';
import { use } from 'react';
import { Toaster, toast } from 'sonner';

export default function PlaylistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: playlistId } = use(params);
  const [backendPlaylist, setBackendPlaylist] = useState<BackendPlaylist | null>(null);
  const [localPlaylist, setLocalPlaylist] = useState<LocalPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTrackDialogOpen, setIsAddTrackDialogOpen] = useState(false);
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [allTracks, setAllTracks] = useState<Track[]>([]);

  const isBackendPlaylist = !isNaN(parseInt(playlistId, 10));

  const fetchPlaylistDetails = useCallback(async () => {
    if (isBackendPlaylist) {
      const id = parseInt(playlistId, 10);
      if (isNaN(id)) {
        console.error("Invalid Playlist ID:", playlistId);
        setIsLoading(false);
        setBackendPlaylist(null);
        return;
      }

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.107:8000';
        const url = `${apiBaseUrl}/api/playlists/${id}`;
        console.log("Fetching backend playlist:", url);
        const response = await fetch(url, {
          headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP Error: ${response.status} ${response.statusText}, Body: ${errorText}`);
          setBackendPlaylist(null);
          throw new Error(`Failed to fetch playlist: ${response.status}`);
        }
        const data: BackendPlaylist = await response.json();
        console.log("Backend playlist data:", data);
        setBackendPlaylist(data);
      } catch (error) {
        console.error("Fetch error:", error);
        setBackendPlaylist(null);
      }
    } else {
      const localPlaylists = loadPlaylists();
      const found = localPlaylists.find((p) => p.id === playlistId);
      setLocalPlaylist(found || null);
      console.log("Local playlist data:", found);
    }

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.107:8000';
      const response = await fetch(`${apiBaseUrl}/api/tracks`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error: ${response.status} ${response.statusText}, Body: ${errorText}`);
        throw new Error('Failed to fetch tracks');
      }
      const tracks: Track[] = await response.json();
      setAllTracks(tracks);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }

    setIsLoading(false);
  }, [playlistId, isBackendPlaylist]);

  useEffect(() => {
    fetchPlaylistDetails();
  }, [fetchPlaylistDetails]);

  const handleRemoveTrack = useCallback(async (trackToRemoveId: number) => {
    if (isBackendPlaylist && backendPlaylist && backendPlaylist.id) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.107:8000';
        const url = `${apiBaseUrl}/api/playlists/${backendPlaylist.id}/tracks/${trackToRemoveId}`;
        console.log("Attempting to delete track from playlist:", url);
        const response = await fetch(url, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error removing track: Status: ${response.status}, StatusText: ${response.statusText}, Body: ${errorText}`);
          toast.error(`Error al eliminar la canción: ${errorText || response.statusText}`);
          return;
        }
        toast.success("Canción eliminada de la playlist.", {
          description: "La pista ha sido removida exitosamente.",
          duration: 3000,
        });
        fetchPlaylistDetails();
      } catch (error: any) {
        console.error("Failed to remove track:", error.message, error.stack);
        toast.error(`Error al eliminar la canción: ${error.message}`);
      }
    } else if (localPlaylist) {
      const updatedTrackIds = localPlaylist.trackIds.filter((id) => id !== String(trackToRemoveId));
      const updatedPlaylists = loadPlaylists().map((p) =>
        p.id === localPlaylist.id ? { ...p, trackIds: updatedTrackIds } : p
      );
      localStorage.setItem('mm_playlists', JSON.stringify(updatedPlaylists));
      setLocalPlaylist({ ...localPlaylist, trackIds: updatedTrackIds });
      toast.success("Canción eliminada de la playlist local.", {
        description: "La pista ha sido removida exitosamente.",
        duration: 3000,
      });
    } else {
      console.error("Cannot remove track: No valid playlist found");
      toast.error("Error: No se encontró una playlist válida.");
    }
  }, [backendPlaylist, localPlaylist, isBackendPlaylist, fetchPlaylistDetails]);

  const handleDeletePlaylist = useCallback(async () => {
    if (isBackendPlaylist && backendPlaylist && backendPlaylist.id) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.107:8000';
        const url = `${apiBaseUrl}/api/playlists/${backendPlaylist.id}`;
        console.log("Deleting playlist:", url);
        const response = await fetch(url, {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error deleting playlist: Status: ${response.status}, StatusText: ${response.statusText}, Body: ${errorText}`);
          toast.error(`Error al eliminar la playlist: ${errorText || response.statusText}`);
        } else {
          toast.success("Playlist eliminada exitosamente.", {
            description: "La playlist ha sido removida.",
            duration: 3000,
          });
          router.push('/library');
        }
      } catch (error: any) {
        console.error("Failed to delete playlist:", error.message, error.stack);
        toast.error(`Error al eliminar la playlist: ${error.message}`);
      }
    } else if (localPlaylist) {
      const updatedPlaylists = loadPlaylists().filter((p) => p.id !== localPlaylist.id);
      localStorage.setItem('mm_playlists', JSON.stringify(updatedPlaylists));
      toast.success("Playlist local eliminada exitosamente.", {
        description: "La playlist ha sido removida.",
        duration: 3000,
      });
      router.push('/library');
    } else {
      console.error("Cannot delete playlist: No valid playlist found");
      toast.error("Error: No se encontró una playlist válida.");
    }
  }, [backendPlaylist, localPlaylist, isBackendPlaylist, router]);

  if (isLoading) {
    return <div className="p-10 text-center text-neutral-500">Cargando playlist...</div>;
  }

  if (!backendPlaylist && !localPlaylist) {
    return (
      <div className="p-10 text-center text-neutral-500 space-y-4">
        <p>Playlist no encontrada.</p>
        <Link href="/library" passHref>
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="size-4" /> Volver a Biblioteca
          </Button>
        </Link>
      </div>
    );
  }

  const playlist = backendPlaylist || localPlaylist;
  const playlistName = backendPlaylist ? backendPlaylist.name : localPlaylist!.title;
  const tracks = backendPlaylist
    ? backendPlaylist.tracks
    : allTracks.filter((track) => localPlaylist!.trackIds.includes(String(track.id)));

  return (
    <div className="space-y-6">
      <Link href="/library" passHref>
        <Button variant="ghost" className="flex items-center gap-2">
          <ChevronLeft className="size-4" /> Volver a Biblioteca
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{playlistName}</h1>
          <p className="text-neutral-600">{tracks.length} canciones</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddTrackDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="size-4" /> Añadir canciones
          </Button>
          <Button variant="outline" onClick={() => setIsEditNameDialogOpen(true)} className="flex items-center gap-2">
            <Edit className="size-4" /> Editar
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center gap-2">
            <Trash2 className="size-4" /> Eliminar Playlist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tracks.length === 0 ? (
          <p className="text-neutral-500 col-span-full">Aún no hay canciones en esta playlist.</p>
        ) : (
          tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              queue={tracks}
              onRemoveFromPlaylist={handleRemoveTrack}
            />
          ))
        )}
      </div>

      <AddTrackToPlaylistDialog
        open={isAddTrackDialogOpen}
        onOpenChange={setIsAddTrackDialogOpen}
        playlistId={playlistId}
        currentTracks={tracks}
        onPlaylistUpdated={fetchPlaylistDetails}
      />

      <EditPlaylistNameDialog
        open={isEditNameDialogOpen}
        onOpenChange={setIsEditNameDialogOpen}
        playlistId={playlistId}
        currentName={playlistName}
        onPlaylistUpdated={fetchPlaylistDetails}
      />

      <DeletePlaylistDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        playlistId={playlistId}
        playlistName={playlistName}
        onPlaylistDeleted={handleDeletePlaylist}
      />

      <Toaster theme="light" position="top-right" />
    </div>
  );
}