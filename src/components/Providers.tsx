// src/components/Providers.tsx (או הקובץ שלך)
"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode } from "react"; // ייבוא מפורש אם חסר

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    // ----> הוסף את המאפיין כאן <----
    <SessionProvider refetchOnWindowFocus={false}>
      <NotificationProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </NotificationProvider>
    </SessionProvider>
  );
};

export default Providers;
