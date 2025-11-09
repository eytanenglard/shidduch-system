'use client';

import React, { Suspense } from 'react';
import UnifiedProfileDashboard from '@/components/profile/sections/UnifiedProfileDashboard';
import { useSearchParams } from 'next/navigation';
import { ProfilePageDictionary } from '@/types/dictionary';

// ממשק ה-props של ProfilePageContent נשאר כפי שהוא
interface ProfilePageContentProps {
  dict: ProfilePageDictionary;
  locale: 'he' | 'en';
}

// קומפוננטת התוכן
const ProfilePageContent = ({ dict, locale }: ProfilePageContentProps) => {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  console.log(
    '---[ CLIENT LOG 1 | ProfilePageClient.tsx ]--- קורא את פרמטר ה-URL. הערך של "tab" הוא:',
    tabFromUrl
  );
  const viewOnly = searchParams.get('viewOnly') === 'true';
  const userId = searchParams.get('userId') || undefined;
  const initialTab = searchParams.get('tab') || 'overview';
  console.log(
    `---[ CLIENT LOG 2 | ProfilePageClient.tsx ]--- מגדיר את initialTab לערך "${initialTab}". הערך הזה מועבר ל-UnifiedProfileDashboard.`
  );
  
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

// ממשק ה-props של ProfilePageClient עודכן
interface ProfilePageClientProps {
  dict: ProfilePageDictionary;
  locale: 'he' | 'en'; // <--- ✨ התיקון כאן
}

// רכיב הלקוח הראשי
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
