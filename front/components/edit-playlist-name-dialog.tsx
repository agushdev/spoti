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
  onPlaylistUpdated: () => void; 
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
 const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

  const handleSaveName = async () => {
    if (!newPlaylistName.trim()) {
      alert("El nombre de la playlist no puede estar vacío.");
      return;
    }
    if (newPlaylistName.trim() === currentName) {
      onOpenChange(false); 
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`http://${API_BASE_URL}:8000/api/playlists/${playlistId}`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.detail || 'Error al actualizar el nombre de la playlist.');
      }
      onPlaylistUpdated(); 
      onOpenChange(false); 
    } catch (error: any) {
      console.error("Failed to update playlist name:", error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

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