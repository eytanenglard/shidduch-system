// src/app/[locale]/matchmaker/dashboard/MatchmakerDashboardPageClient.tsx

"use client"; // הקובץ הזה נשאר רכיב לקוח

import { Suspense } from "react";
import MatchmakerDashboard from "@/components/matchmaker/suggestions/container/MatchmakerDashboard";
import { Card, CardContent } from "@/components/ui/card";
import type { SuggestionsDictionary } from "@/types/dictionary"; // ✅ 1. ייבא את הטיפוס

// ✅ 2. הגדר את ה-props שהרכיב יקבל
interface MatchmakerDashboardPageClientProps {
  dict: SuggestionsDictionary;
}

// ✅ 3. עדכן את הרכיב כך שיקבל את dict כ-prop
export default function MatchmakerDashboardPageClient({ dict }: MatchmakerDashboardPageClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <Card className="m-4">
            <CardContent className="p-6">
              <div className="flex justify-center items-center">
                {/* אפשר להשתמש כאן בתרגום אם רוצים, אבל זה זניח */}
                <div className="text-xl">טוען...</div>
              </div>
            </CardContent>
          </Card>
        }
      >
        {/* ✅ 4. העבר את ה-dict שהתקבל הלאה לרכיב MatchmakerDashboard */}
        <MatchmakerDashboard dict={dict} />
      </Suspense>
    </div>
  );
}