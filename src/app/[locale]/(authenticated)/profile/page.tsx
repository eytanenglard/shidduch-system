import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "../../../../../i18n-config";
import ProfilePageClient from "./ProfilePageClient";

// רכיב השרת
export default async function ProfilePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  // 1. טעינת המילון בצד השרת
  const dictionary = await getDictionary(locale);

  // 2. רינדור רכיב הלקוח עם המילון, עטוף ב-Suspense
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50">
          <div className="flex items-center gap-2 text-lg text-cyan-600">
            <Loader2 className="animate-spin h-6 w-6" />
            {/* שימוש במילון ב-fallback */}
            <span>{dictionary.profilePage.pageLoader}</span>
          </div>
        </div>
      }
    >
      <ProfilePageClient dict={dictionary.profilePage} />
    </Suspense>
  );
}