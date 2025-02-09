"use client";

import { SessionProvider } from "next-auth/react";


interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
=
    </SessionProvider>
  );
};

export default Providers;
