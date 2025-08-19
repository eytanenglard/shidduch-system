"use client";

import { Suspense } from "react";
import MatchmakerDashboard from "@/components/matchmaker/suggestions/container/MatchmakerDashboard";
import { Card, CardContent } from "@/components/ui/card";

export default function SuggestionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Suspense
        fallback={
          <Card className="m-4">
            <CardContent className="p-6">
              <div className="flex justify-center items-center">
                <div className="text-xl">טוען...</div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <MatchmakerDashboard />
      </Suspense>
    </div>
  );
}
