"use client";

import React, { useCallback, useState, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone'; 
import { Image as ImageIcon, XCircle, UploadCloud } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface ImageUploadDropzoneProps {
  currentImageUrl?: string | null;
  onImageSelected: (file: File | null) => void;
  isLoading?: boolean;
}

export function ImageUploadDropzone({ currentImageUrl, onImageSelected, isLoading }: ImageUploadDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [file, setFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
      setFile(null); 
    } else if (!file) { 
      setPreview(null);
    }
  }, [currentImageUrl]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      onImageSelected(selectedFile);
    }
  }, [onImageSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/gif': [],
    },
    multiple: false,
    disabled: isLoading,
  });

  const handleClearImage = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    e.preventDefault();
    setFile(null);
    setPreview(null);
    onImageSelected(null); 
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      onImageSelected(selectedFile);
    }
  };

  const displayImage = preview || currentImageUrl;

  const defaultPlaceholderUrl = "https://placehold.co/200x200/cccccc/444444?text=Portada";

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative w-48 h-48 rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors",
          isLoading ? "bg-neutral-100 border-neutral-300 cursor-not-allowed" : "border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50",
          isDragActive && "border-blue-500 bg-blue-50"
        )}
      >
        <input {...getInputProps()} onChange={handleFileChange} /> {/* Permite la selección directa */}

        {displayImage ? (
          <>
            <Image
              src={displayImage}
              alt="Vista previa de la carátula"
              fill
              className="object-cover"
              onError={(e) => {
                console.error("ImageUploadDropzone preview image failed to load:", displayImage);
                (e.target as HTMLImageElement).src = defaultPlaceholderUrl; 
                setPreview(defaultPlaceholderUrl); 
              }}
            />
            {!isLoading && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 rounded-full bg-white/70 hover:bg-white text-red-500"
                onClick={handleClearImage}
                aria-label="Quitar imagen"
              >
                <XCircle className="size-5" />
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center text-neutral-500">
            <UploadCloud className="size-8 mb-2" />
            <p className="text-sm text-center">Arrastra y suelta una imagen aquí</p>
            <p className="text-xs text-center mt-1">o haz clic para seleccionar</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="sr-only">Cargando...</span> {/* Para accesibilidad */}
          </div>
        )}
      </div>

      {!displayImage && (
        <Button 
          variant="outline" 
          onClick={() => { /* Esto solo simula el clic en el input hidden */ }}
          disabled={isLoading}
          className="w-48"
        >
          <ImageIcon className="size-4 mr-2" />
          Seleccionar archivo
        </Button>
      )}

      {file && (
        <p className="text-sm text-neutral-600 truncate max-w-full">
          Archivo: {file.name}
        </p>
      )}
    </div>
  );
}