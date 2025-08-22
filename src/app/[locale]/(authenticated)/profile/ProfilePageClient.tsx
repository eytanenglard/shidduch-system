'use client';

import React, { Suspense } from 'react';
import UnifiedProfileDashboard from './components/dashboard/UnifiedProfileDashboard';
import { useSearchParams } from 'next/navigation';
import { ProfilePageDictionary } from '@/types/dictionary'; // ייבוא הטיפוס

// A small wrapper to handle Suspense for useSearchParams
const ProfilePageContent = ({ dict }: { dict: ProfilePageDictionary }) => {
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get('viewOnly') === 'true';
  const userId = searchParams.get('userId') || undefined;
  const initialTab = searchParams.get('tab') || 'overview'; // Get initial tab

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* 
        ▼▼▼ התיקון נמצא כאן ▼▼▼
        העברנו את כל האובייקט 'dict' במקום רק 'dict.dashboard'
      */}
      <UnifiedProfileDashboard
        viewOnly={viewOnly}
        userId={userId}
        initialTab={initialTab}
        dict={dict}
      />
    </div>
  );
};

// רכיב הלקוח הראשי מקבל את המילון
const ProfilePageClient = ({ dict }: { dict: ProfilePageDictionary }) => {
  return (
    <Suspense>
      {/* Suspense פנימי עבור useSearchParams */}
      <ProfilePageContent dict={dict} />
    </Suspense>
  );
};

export default ProfilePageClient;
