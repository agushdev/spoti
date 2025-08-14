"use client";

import { Toaster } from "sonner";
import { useEffect, useState } from "react"; // ✅ Importar useEffect y useState

export function ToastProvider() {
  // ✅ Nuevo estado para controlar si el componente está montado
  const [mounted, setMounted] = useState(false);

  // ✅ useEffect para marcar el componente como montado después de la primera renderización
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Renderizar Toaster solo si el componente ya está montado
  if (!mounted) {
    return null;
  }

  return <Toaster theme="light" position="top-right" />;
}
