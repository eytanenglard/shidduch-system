"use client";

import React, { Suspense } from "react";
import UnifiedProfileDashboard from "./components/dashboard/UnifiedProfileDashboard";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// A small wrapper to handle Suspense for useSearchParams
const ProfilePageContent = () => {
  const searchParams = useSearchParams();
  const viewOnly = searchParams.get("viewOnly") === "true";
  const userId = searchParams.get("userId") || undefined;
  const initialTab = searchParams.get("tab") || "overview"; // Get initial tab

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <UnifiedProfileDashboard 
        viewOnly={viewOnly} 
        userId={userId} 
        initialTab={initialTab} 
      />
    </div>
  );
};

const ProfilePage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50">
        <div className="flex items-center gap-2 text-lg text-cyan-600">
          <Loader2 className="animate-spin h-6 w-6" />
          <span>טוען פרופיל...</span>
        </div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
};

export default ProfilePage;