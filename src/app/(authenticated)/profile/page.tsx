"use client";

import React from "react";
import UnifiedProfileDashboard from "./components/dashboard/UnifiedProfileDashboard";
import { useSearchParams } from "next/navigation";

const ProfilePage = () => {
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get("viewOnly") === "true";
  const userId = searchParams.get("userId") || undefined; // ממיר null ל-undefined

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <UnifiedProfileDashboard viewOnly={viewOnly} userId={userId} />
    </div>
  );
};

export default ProfilePage;
