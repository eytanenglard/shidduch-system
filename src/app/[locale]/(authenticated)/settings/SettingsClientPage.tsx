// src/app/[locale]/settings/SettingsClientPage.tsx

"use client";

import { useSession } from "next-auth/react";
import AccountSettings from "@/components/profile/account-settings";
import { Skeleton } from "@/components/ui/skeleton"; // הוספת ייבוא לשלד טעינה
import type { AccountSettingsDict } from "@/types/dictionary"; // ייבוא טיפוס המילון

// ✨ 1. עדכון הממשק לקבלת המילון כ-prop
interface SettingsClientPageProps {
  dict: AccountSettingsDict;
}

export default function SettingsClientPage({ dict }: SettingsClientPageProps) {
  const { data: session, status } = useSession();

  // ✨ 2. טיפול במצב טעינה עם שלד (Skeleton)
  if (status === "loading") {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  // ✨ 3. טיפול במצב לא מאומת עם הודעה ברורה
  if (status === "unauthenticated") {
    return (
      <div className="container mx-auto p-6 text-center text-red-600">
        Access Denied. Please sign in to view your account settings.
      </div>
    );
  }
  
  // בדיקה מקיפה יותר לוודאות שיש סשן ומשתמש
  if (!session?.user) {
    return (
      <div className="container mx-auto p-6 text-center text-red-600">
        Error: Could not load user data. The session might be invalid.
      </div>
    );
  }

  // בניית אובייקט המשתמש נשארת כפי שהייתה
  const userData = {
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    role: session.user.role,
    status: session.user.status,
    isVerified: session.user.isVerified,
    lastLogin: session.user.lastLogin ?? null,
    createdAt: session.user.createdAt,
    marketingConsent: session.user.marketingConsent,
  };

  // ✨ 4. העברת המילון שקיבלנו ב-props לקומפוננטה AccountSettings
  return <AccountSettings user={userData} dict={dict} />;
}