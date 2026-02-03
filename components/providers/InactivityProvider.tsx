"use client";

import { useInactivityLogout } from "@/hooks/useInactivityLogout";

export function InactivityProvider({ children }: { children: React.ReactNode }) {
  // 30 minutos de inactividad = cerrar sesión automáticamente
  useInactivityLogout(30 * 60 * 1000);
  
  return <>{children}</>;
}
