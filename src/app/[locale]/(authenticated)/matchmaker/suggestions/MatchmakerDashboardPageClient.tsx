// src/app/[locale]/matchmaker/dashboard/MatchmakerDashboardPageClient.tsx

"use client";

import { Suspense } from "react";
import MatchmakerDashboard from "@/components/matchmaker/suggestions/container/MatchmakerDashboard";
import StandardizedLoadingSpinner from "@/components/questionnaire/common/StandardizedLoadingSpinner";
import type {
  SuggestionsDictionary,
  MatchmakerPageDictionary,
  ProfilePageDictionary,
} from "@/types/dictionary";

// ✅ 1. הגדר את ה-props כפרמטרים נפרדים
interface MatchmakerDashboardPageClientProps {
  suggestionsDict: SuggestionsDictionary;
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
}

// ✅ 2. עדכן את הרכיב כך שיקבל את המילונים הנפרדים
export default function MatchmakerDashboardPageClient({
  suggestionsDict,
  matchmakerDict,
  profileDict,
}: MatchmakerDashboardPageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <StandardizedLoadingSpinner 
            text="טוען לוח בקרה לשדכנים..." 
            subtext="מכינים את המועמדים וההצעות"
          />
        }
      >
        {/* ✅ 3. העבר את המילונים הנפרדים הלאה לרכיב MatchmakerDashboard */}
        <MatchmakerDashboard
          suggestionsDict={suggestionsDict}
          matchmakerDict={matchmakerDict}
          profileDict={profileDict}
        />
      </Suspense>
    </div>
  );
}