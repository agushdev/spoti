"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreatePlaylistButton() {
  const [playlistName, setPlaylistName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      alert("El nombre de la playlist no puede estar vacío.");
      return;
    }

    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : '192.168.0.107';
      const response = await fetch(`http://${host}:8000/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: playlistName }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la playlist.');
      }

      setPlaylistName("");
      setIsDialogOpen(false);
      window.location.reload(); 
    } catch (error) {
      console.error("Error creating playlist:", error);
      alert("Hubo un error al crear la playlist.");
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Nueva playlist</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear nueva playlist</DialogTitle>
          <DialogDescription>
            Ingresa un nombre para tu nueva playlist.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreatePlaylist}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}