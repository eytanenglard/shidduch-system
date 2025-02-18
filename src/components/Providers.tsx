"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip"; // הוסף את זה

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <NotificationProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </NotificationProvider>
    </SessionProvider>
  );
};

export default Providers;
