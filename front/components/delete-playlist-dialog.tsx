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
} from "@/components/ui/alert-dialog"; 
import { Button } from "@/components/ui/button";

type DeletePlaylistDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  playlistId: number;
  playlistName: string;
  onPlaylistDeleted: () => void; 
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
      await onPlaylistDeleted(); 
      onOpenChange(false); 
    } catch (error) {
      console.error("Failed to confirm playlist deletion:", error);
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
