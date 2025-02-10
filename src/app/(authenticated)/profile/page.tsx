// src/app/(authenticated)/profile/page.tsx
"use client";

import React from "react";
import UnifiedProfileDashboard from "./components/dashboard/UnifiedProfileDashboard";

interface ProfilePageProps {
  viewOnly?: boolean;
  userId?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  viewOnly = false,
  userId,
}) => {
  return (
    // הוספת direction="rtl" לאלמנט השורש של הדף
    <div className="min-h-screen bg-background" dir="rtl">
      <UnifiedProfileDashboard viewOnly={viewOnly} userId={userId} />
    </div>
  );
};

export default ProfilePage;
