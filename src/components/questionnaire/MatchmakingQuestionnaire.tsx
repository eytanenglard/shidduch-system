// src/components/questionnaire/MatchmakingQuestionnaire.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuestionnaireLayout from "./layout/QuestionnaireLayout";
import Welcome from "./onboarding/Welcome";
import TrackSelection from "./onboarding/TrackSelection";
import ValuesWorld from "./worlds/ValuesWorld";
import RelationshipWorld from "./worlds/RelationshipWorld";
import PersonalityWorld from "./worlds/PersonalityWorld";
import PartnerWorld from "./worlds/PartnerWorld";
import ReligionWorld from "./worlds/ReligionWorld";
import QuestionnaireCompletion from "./common/QuestionnaireCompletion";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { storageService } from "@/services/storageService";
import type {
  WorldId,
  UserTrack,
  QuestionnaireSubmission,
  MatchmakingQuestionnaireProps,
  QuestionnaireAnswer,
} from "./types/types";

const ONBOARDING_STEPS = {
  WELCOME: "WELCOME",
  TRACK_SELECTION: "TRACK_SELECTION",
  WORLDS: "WORLDS",
  COMPLETED: "COMPLETED",
} as const;

type OnboardingStep = keyof typeof ONBOARDING_STEPS;

const WORLD_ORDER: WorldId[] = [
  "PERSONALITY",
  "RELATIONSHIP",
  "VALUES",
  "RELIGION",
  "PARTNER",
];

export default function MatchmakingQuestionnaire({
  userId,
  onComplete,
}: MatchmakingQuestionnaireProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const sessionId = useMemo(() => `session_${Date.now()}`, []);

  // Basic State
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("WELCOME");
  const [currentWorld, setCurrentWorld] = useState<WorldId>("VALUES");
  const [userTrack, setUserTrack] = useState<UserTrack>("SECULAR");
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [completedWorlds, setCompletedWorlds] = useState<WorldId[]>([]);
  const [startTime] = useState(() => new Date().toISOString());

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaveAttempt, setLastSaveAttempt] = useState(Date.now());
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };
  // Load existing answers when component mounts
  useEffect(() => {
    const loadExistingAnswers = async () => {
      try {
        const response = await fetch("/api/questionnaire");
        const data = await response.json();

        if (data.success && data.data) {
          // Combine all answers from different worlds
          const allAnswers = [
            ...(data.data.valuesAnswers || []),
            ...(data.data.personalityAnswers || []),
            ...(data.data.relationshipAnswers || []),
            ...(data.data.partnerAnswers || []),
            ...(data.data.religionAnswers || []),
          ];

          // Update states
          setAnswers(allAnswers);
          setCompletedWorlds(data.data.worldsCompleted || []);
          setCurrentStep(data.data.completed ? "COMPLETED" : "WORLDS");
        }
      } catch (err) {
        console.error("Failed to load existing answers:", err);
        setError("אירעה שגיאה בטעינת התשובות הקיימות");
      }
    };

    if (userId) {
      loadExistingAnswers();
    }
  }, [userId]);

  const handleAnswer = (questionId: string, value: any) => {
    setError(null);
    const newAnswer: QuestionnaireAnswer = {
      questionId,
      worldId: currentWorld,
      value,
      answeredAt: new Date().toISOString(),
    };

    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, newAnswer];
    });
  };

  const prepareSubmissionData = (): QuestionnaireSubmission => {
    const isCompleted = completedWorlds.length === WORLD_ORDER.length;
    return {
      userId: userId || sessionId,
      answers: answers,
      worldsCompleted: completedWorlds,
      completed: isCompleted,
      startedAt: startTime,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    };
  };

  const validateSubmission = (data: QuestionnaireSubmission): boolean => {
    if (!data.userId) return false;
    if (!Array.isArray(data.answers) || data.answers.length === 0) return false;
    if (!Array.isArray(data.worldsCompleted)) return false;
    if (typeof data.completed !== "boolean") return false;
    if (!data.startedAt) return false;
    if (data.completed && !data.completedAt) return false;
    return true;
  };

  const getNextWorld = (currentWorldId: WorldId): WorldId | null => {
    const currentIndex = WORLD_ORDER.indexOf(currentWorldId);
    if (currentIndex < WORLD_ORDER.length - 1) {
      return WORLD_ORDER[currentIndex + 1];
    }
    return null;
  };

  const handleWorldChange = (newWorld: WorldId) => {
    setCurrentWorld(newWorld);
    setError(null);
  };

  const handleWorldComplete = async (worldId: WorldId) => {
    try {
      if (!completedWorlds.includes(worldId)) {
        setCompletedWorlds((prev) => [...prev, worldId]);
      }

      const nextWorld = getNextWorld(worldId);
      if (!nextWorld) {
        setCurrentStep("COMPLETED");
      } else {
        setCurrentWorld(nextWorld);
      }
    } catch (err) {
      setError("אירעה שגיאה בשמירת ההתקדמות. אנא נסה שוב.");
      console.error("Error completing world:", err);
    }
  };

  const handleQuestionnaireComplete = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const submissionData = prepareSubmissionData();

      if (!validateSubmission(submissionData)) {
        throw new Error("Invalid submission data");
      }

      // אם המשתמש לא מחובר, שומרים בlocal ומעבירים לדף התחברות
      if (!userId) {
        localStorage.setItem(
          "tempQuestionnaire",
          JSON.stringify(submissionData)
        );
        router.push("/auth/signin");
        return;
      }

      // שמירה בשרת
      const response = await fetch("/api/questionnaire", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save questionnaire");
      }

      if (onComplete) {
        onComplete();
      }

      showToast("השאלון נשמר בהצלחה", "success");
    } catch (err) {
      console.error("Failed to save questionnaire:", err);
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשמירת השאלון. אנא נסה שוב."
      );
      showToast("אירעה שגיאה בשמירת השאלון", "error");
    } finally {
      setIsSaving(false);
    }
  };

  function renderCurrentWorld() {
    const worldProps = {
      onAnswer: handleAnswer,
      onComplete: () => handleWorldComplete(currentWorld),
      onBack: () => router.push("/questionnaire/map"),
      answers: answers.filter((a) => a.worldId === currentWorld),
      isCompleted: completedWorlds.includes(currentWorld),
      language,
    };

    switch (currentWorld) {
      case "VALUES":
        return <ValuesWorld {...worldProps} />;
      case "RELATIONSHIP":
        return <RelationshipWorld {...worldProps} />;
      case "PERSONALITY":
        return <PersonalityWorld {...worldProps} />;
      case "PARTNER":
        return <PartnerWorld {...worldProps} />;
      case "RELIGION":
        return <ReligionWorld {...worldProps} />;
      default:
        return <div>עולם לא נמצא</div>;
    }
  }

  function renderCurrentStep() {
    switch (currentStep) {
      case "WELCOME":
        return (
          <Welcome
            onStart={() => setCurrentStep("TRACK_SELECTION")}
            onLearnMore={() => router.push("/about")}
            isLoggedIn={!!userId}
          />
        );

      case "TRACK_SELECTION":
        return (
          <TrackSelection
            onSelect={(track: UserTrack) => {
              setUserTrack(track);
              setCurrentStep("WORLDS");
            }}
            onBack={() => setCurrentStep("WELCOME")}
            selectedTrack={userTrack}
          />
        );

      case "WORLDS":
        return (
          <QuestionnaireLayout
            currentWorld={currentWorld}
            userTrack={userTrack}
            completedWorlds={completedWorlds}
            onWorldChange={handleWorldChange}
            onExit={() => router.push("/dashboard")}
            onSaveProgress={handleQuestionnaireComplete}
          >
            {renderCurrentWorld()}
          </QuestionnaireLayout>
        );

      case "COMPLETED":
        return (
          <QuestionnaireCompletion
            onSendToMatching={handleQuestionnaireComplete}
            isLoading={isSaving}
            isLoggedIn={!!userId}
          />
        );

      default:
        return <div>שגיאה בטעינת השלב</div>;
    }
  }

  return (
    <div
      className={cn("min-h-screen", language === "he" ? "dir-rtl" : "dir-ltr")}
    >
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {renderCurrentStep()}
    </div>
  );
}
