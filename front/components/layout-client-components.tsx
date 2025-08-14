"use client";

import dynamic from 'next/dynamic';
import { FullScreenPlayer } from "@/components/player/full-screen-player"; // Asegúrate de que esta ruta sea correcta
import { ToastProvider } from "@/components/toast-provider"; // Importa directamente ToastProvider

// Cargamos ToastProvider dinámicamente aquí, dentro del componente de cliente
// Esto permite usar ssr: false de forma segura.
const DynamicToastProvider = dynamic(() => Promise.resolve(ToastProvider), {
  ssr: false, // Deshabilita el Server-Side Rendering para ToastProvider
});

export function LayoutClientComponents() {
  return (
    <>
      {/* El reproductor de pantalla completa */}
      <FullScreenPlayer />
      {/* El proveedor de toasts, cargado solo en el cliente */}
      <DynamicToastProvider />
    </>
  );
}