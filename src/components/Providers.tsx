// src/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/app/[locale]/contexts/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <NotificationProvider>
        <TooltipProvider delayDuration={0}>
          {children}
        </TooltipProvider>
      </NotificationProvider>
    </SessionProvider>
  );
};

export default Providers;