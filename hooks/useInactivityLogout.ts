"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook para cerrar sesión automáticamente por inactividad
 * @param timeout Tiempo de inactividad en milisegundos (default: 30 minutos)
 */
export function useInactivityLogout(timeout: number = 30 * 60 * 1000) {
  const router = useRouter();
  const supabase = createClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // Usar replace en lugar de push para evitar que puedan volver atrás
    router.replace("/login?reason=inactivity");
  }, [router, supabase]);

  const resetTimer = useCallback(() => {
    // Limpiar timer anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Crear nuevo timer
    timeoutRef.current = setTimeout(() => {
      logout();
    }, timeout);
  }, [timeout, logout]);

  useEffect(() => {
    // Eventos que indican actividad del usuario
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Resetear timer en cada evento
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);
}
