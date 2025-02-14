"use client";

import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/app/contexts/NotificationContext";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </SessionProvider>
  );
};

export default Providers;