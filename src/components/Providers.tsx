// src/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode } from "react";
// --- START: ייבואים חדשים (עם הוספת Launcher) ---
const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {/* --- START: עטיפה ב-Provider של הסיור --- */}
        <NotificationProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </NotificationProvider>
      {/* --- END: עטיפה ב-Provider של הסיור --- */}
    </SessionProvider>
  );
};

export default Providers;