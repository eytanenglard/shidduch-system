// src/components/Providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/app/contexts/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode } from "react";
// --- START: ייבואים חדשים ---
import { OnboardingProvider } from "@/app/contexts/OnboardingContext";
import OnboardingTrigger from "@/app/components/OnboardingTrigger";
import OnboardingTour from "@/app/components/OnboardingTour";
// --- END: ייבואים חדשים ---

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {/* --- START: עטיפה ב-Provider של הסיור --- */}
      <OnboardingProvider>
        <NotificationProvider>
          <TooltipProvider>
            {children}
            {/* --- הרכיבים של הסיור ירוצו כאן, בתוך כל הקונטקסטים --- */}
            <OnboardingTrigger />
            <OnboardingTour />
          </TooltipProvider>
        </NotificationProvider>
      </OnboardingProvider>
      {/* --- END: עטיפה ב-Provider של הסיור --- */}
    </SessionProvider>
  );
};

export default Providers;