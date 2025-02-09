// src/app/(authenticated)/matchmaker/suggestions/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import SuggestionManagement from "@/app/components/matchmaker/suggestions/SuggestionManagement";
import { Card, CardContent } from "@/components/ui/card";

export default function SuggestionDetailsPage() {
  const params = useParams();
  const suggestionId = params.id as string;

  if (!suggestionId) {
    return (
      <Card className="m-4">
        <CardContent className="p-6">
          <div className="text-red-500">מזהה הצעה חסר</div>
        </CardContent>
      </Card>
    );
  }

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
        <SuggestionManagement suggestionId={suggestionId} />
      </Suspense>
    </div>
  );
}
