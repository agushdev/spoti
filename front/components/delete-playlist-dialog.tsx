"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; // Usamos AlertDialog para la confirmación
import { Button } from "@/components/ui/button";

type DeletePlaylistDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  playlistId: number;
  playlistName: string;
  onPlaylistDeleted: () => void; // Callback para manejar la eliminación y la redirección
};

export function DeletePlaylistDialog({
  open,
  onOpenChange,
  playlistId,
  playlistName,
  onPlaylistDeleted,
}: DeletePlaylistDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onPlaylistDeleted(); // Llama al callback de la página para la lógica de eliminación
      onOpenChange(false); // Cierra el diálogo después de la eliminación
    } catch (error) {
      console.error("Failed to confirm playlist deletion:", error);
      // El alert ya lo maneja el callback onPlaylistDeleted en page.tsx
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará permanentemente la playlist "<strong>{playlistName}</strong>" y todas sus canciones. No podrás deshacer esta acción.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-500 hover:bg-red-600">
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
