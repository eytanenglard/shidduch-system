// src/components/questionnaire/pages/QuestionnaireLandingPage.tsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// הגדרה מפורשת של ה-props שהקומפוננטה מקבלת
interface QuestionnaireLandingPageProps {
  onStartQuestionnaire: () => void;
  hasSavedProgress: boolean;
}

export default function QuestionnaireLandingPage({
  onStartQuestionnaire,
  hasSavedProgress,
}: QuestionnaireLandingPageProps) {
  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">שאלון התאמה</h1>
        <p className="mb-6 text-center">
          ברוכים הבאים לשאלון ההתאמה שלנו. תשובותיך יעזרו לנו להתאים לך את החוויה הטובה ביותר.
        </p>

        {hasSavedProgress && (
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <p className="text-blue-800 text-sm">
              יש לך התקדמות שמורה. המשך מהמקום שבו הפסקת.
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <Button 
            onClick={onStartQuestionnaire} 
            className="px-8 py-2"
          >
            {hasSavedProgress ? "המשך שאלון" : "התחל שאלון"}
          </Button>
        </div>
      </Card>
    </div>
  );
}