"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditPlaylistNameDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  playlistId: number;
  currentName: string;
  onPlaylistUpdated: () => void; // Callback para que la página de la playlist se recargue
};

export function EditPlaylistNameDialog({
  open,
  onOpenChange,
  playlistId,
  currentName,
  onPlaylistUpdated,
}: EditPlaylistNameDialogProps) {
  const [newPlaylistName, setNewPlaylistName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const host = typeof window !== 'undefined' ? window.location.hostname : '192.168.0.107';

  const handleSaveName = async () => {
    if (!newPlaylistName.trim()) {
      alert("El nombre de la playlist no puede estar vacío.");
      return;
    }
    if (newPlaylistName.trim() === currentName) {
      onOpenChange(false); // Si no hay cambios, solo cierra el diálogo
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`http://${host}:8000/api/playlists/${playlistId}`, {
        method: 'PATCH', // Usar PATCH para actualizar parcialmente
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.detail || 'Error al actualizar el nombre de la playlist.');
      }
      onPlaylistUpdated(); // Notifica a la página de la playlist para que se actualice
      onOpenChange(false); // Cierra el diálogo
    } catch (error: any) {
      console.error("Failed to update playlist name:", error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Restablecer el nombre cuando se abre el diálogo con un nuevo currentName
  React.useEffect(() => {
    setNewPlaylistName(currentName);
  }, [currentName, open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar nombre de playlist</DialogTitle>
          <DialogDescription>
            Cambia el nombre de tu playlist.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="col-span-3"
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveName} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}