// src/app/AppContent.tsx (קובץ חדש)
'use client';

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function AppContent({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  // כל הנתיבים שבהם *לא* נרצה להציג את ה-Navbar
  const hideNavbarOnRoutes = ['/'];

  const shouldShowNavbar = !hideNavbarOnRoutes.includes(pathname);
  const isRTL = true; // אפשר להעביר את זה מ-context אם יש צורך

  return (
    <div
      className={`min-h-screen flex flex-col ${isRTL ? "dir-rtl" : "dir-ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {shouldShowNavbar && <Navbar />}
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}