'use client';

import React, { Suspense } from 'react';
import UnifiedProfileDashboard from '@/components/profile/sections/UnifiedProfileDashboard';
import { useSearchParams } from 'next/navigation';
import { ProfilePageDictionary } from '@/types/dictionary';

// ממשק ה-props של ProfilePageContent מעודכן לכלול את locale
interface ProfilePageContentProps {
  dict: ProfilePageDictionary;
  locale: string; // <-- הוספה
}

// A small wrapper to handle Suspense for useSearchParams
// הקומפוננטה מקבלת עכשיו locale
const ProfilePageContent = ({ dict, locale }: ProfilePageContentProps) => {
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get('viewOnly') === 'true';
  const userId = searchParams.get('userId') || undefined;
  const initialTab = searchParams.get('tab') || 'overview';

  // הערה: אין צורך ב-dir="rtl" כאן, כי הקומפוננטה הפנימית תטפל בזה
  return (
    <div className="min-h-screen bg-background">
      <UnifiedProfileDashboard
        viewOnly={viewOnly}
        userId={userId}
        initialTab={initialTab}
        dict={dict}
        locale={locale} // <-- העברת ה-locale לקומפוננטה
      />
    </div>
  );
};

// ממשק ה-props של ProfilePageClient מעודכן לכלול את locale
interface ProfilePageClientProps {
  dict: ProfilePageDictionary;
  locale: string; // <-- הוספה
}

// רכיב הלקוח הראשי מקבל עכשיו גם את המילון וגם את ה-locale
const ProfilePageClient = ({ dict, locale }: ProfilePageClientProps) => {
  return (
    <Suspense>
      {/* Suspense פנימי עבור useSearchParams */}
      {/* מעבירים את ה-locale הלאה ל-ProfilePageContent */}
      <ProfilePageContent dict={dict} locale={locale} />
    </Suspense>
  );
};

export default ProfilePageClient;