"use client";

import { Toaster } from "sonner";
import { useEffect, useState } from "react";

export function ToastProvider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <Toaster theme="light" position="top-right" />;
}
