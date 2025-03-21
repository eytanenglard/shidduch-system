// src/components/questionnaire/QuestionnairePage.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QuestionnaireLandingPage from "./pages/QuestionnaireLandingPage";
import MatchmakingQuestionnaire from "./MatchmakingQuestionnaire";

// Enum to track questionnaire flow stages
enum QuestionnaireStage {
  LANDING = "LANDING",
  QUESTIONNAIRE = "QUESTIONNAIRE",
  COMPLETE = "COMPLETE",
}

export default function QuestionnairePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for tracking current stage in the flow
  const [currentStage, setCurrentStage] = useState<QuestionnaireStage>(
    QuestionnaireStage.LANDING
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  // Check for existing progress when component mounts
  useEffect(() => {
    const checkExistingProgress = async () => {
      if (status === "loading") return;

      setIsLoading(true);

      try {
        // If user is logged in, check for saved progress
        if (session?.user?.id) {
          const response = await fetch("/api/questionnaire");
          const data = await response.json();

          if (data.success && data.data) {
            setHasSavedProgress(true);
          }
        }
      } catch (err) {
        console.error("Error checking questionnaire progress:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingProgress();
  }, [session, status]);

  // Handler when the landing page "start" button is clicked
  const handleStartQuestionnaire = () => {
    setCurrentStage(QuestionnaireStage.QUESTIONNAIRE);
  };

  // Handler when questionnaire is completed
  const handleQuestionnaireComplete = async () => {
    try {
      await router.push("/questionnaire/complete");
      setCurrentStage(QuestionnaireStage.COMPLETE);
    } catch (err) {
      console.error("Error completing questionnaire:", err);
      setError("אירעה שגיאה בסיום השאלון. אנא נסה שוב.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">טוען...</p>
          <p className="text-sm text-gray-500 mt-2">מאחזר את נתוני השאלון</p>
        </Card>
      </div>
    );
  }

  // Render different components based on current stage
  const renderCurrentStage = () => {
    switch (currentStage) {
      case QuestionnaireStage.LANDING:
        return (
          <QuestionnaireLandingPage
            onStartQuestionnaire={handleStartQuestionnaire}
            hasSavedProgress={hasSavedProgress}
          />
        );

      case QuestionnaireStage.QUESTIONNAIRE:
        return (
          <MatchmakingQuestionnaire
            userId={session?.user?.id}
            onComplete={handleQuestionnaireComplete}
          />
        );

      case QuestionnaireStage.COMPLETE:
        // This should redirect to /questionnaire/complete
        return null;

      default:
        return <div>שגיאה בטעינת השלב</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back navigation for non-landing stages */}
      {currentStage !== QuestionnaireStage.LANDING && (
        <div className="container mx-auto p-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => setCurrentStage(QuestionnaireStage.LANDING)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            חזרה לעמוד הראשי
          </Button>
        </div>
      )}

      {/* Error messages */}
      {error && (
        <div className="container mx-auto p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Current stage content */}
      {renderCurrentStage()}
    </div>
  );
}