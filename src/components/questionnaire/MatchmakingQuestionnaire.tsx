"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import type {
  WorldId,
  UserTrack,
  QuestionnaireSubmission,
  MatchmakingQuestionnaireProps,
  QuestionnaireAnswer,
  AnswerValue,
} from "./types/types";
import { Button } from "@/components/ui/button";

enum OnboardingStep {
  WELCOME = "WELCOME",
  TRACK_SELECTION = "TRACK_SELECTION",
  WORLDS = "WORLDS",
  COMPLETED = "COMPLETED",
}

const WORLD_ORDER: WorldId[] = [
  "PERSONALITY",
  "VALUES",
  "RELATIONSHIP",
  "PARTNER",
  "RELIGION",
];

export default function MatchmakingQuestionnaire({
  userId,
  onComplete,
}: MatchmakingQuestionnaireProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const sessionId = useMemo(() => `session_${Date.now()}`, []);

  // Basic State
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.WELCOME
  );
  const [currentWorld, setCurrentWorld] = useState<WorldId>("VALUES");
  const [userTrack, setUserTrack] = useState<UserTrack>("SECULAR");
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [completedWorlds, setCompletedWorlds] = useState<WorldId[]>([]);
  const [startTime] = useState(() => new Date().toISOString());
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastState, setToastState] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });

  // אוטוסייב
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout;

    if (currentStep === OnboardingStep.WORLDS && userId) {
      autoSaveInterval = setInterval(() => {
        if (answers.length > 0) {
          handleQuestionnaireComplete(true);
        }
      }, 120000); // auto-save every 2 minutes
    }

    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [currentStep, answers.length, userId]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToastState({ message, type, isVisible: true });
      setTimeout(() => {
        setToastState((prev) => ({ ...prev, isVisible: false }));
      }, 3000);
    },
    []
  );

  // Load existing answers when component mounts
  useEffect(() => {
    const loadExistingAnswers = async () => {
      setIsLoading(true);
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
          setUserTrack(data.data.userTrack || "SECULAR");
          setCurrentStep(
            data.data.completed
              ? OnboardingStep.COMPLETED
              : OnboardingStep.WORLDS
          );

          // אם יש עולמות שהושלמו, בחר את העולם הבא בתור
          if (data.data.worldsCompleted?.length > 0) {
            const nextWorld = WORLD_ORDER.find(
              (world) => !data.data.worldsCompleted.includes(world)
            );
            if (nextWorld) {
              setCurrentWorld(nextWorld);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load existing answers:", err);
        setError("אירעה שגיאה בטעינת התשובות הקיימות");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadExistingAnswers();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const handleAnswer = useCallback(
    (questionId: string, value: AnswerValue) => {
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
    },
    [currentWorld]
  );

  const prepareSubmissionData = useCallback((): QuestionnaireSubmission => {
    const isCompleted = completedWorlds.length === WORLD_ORDER.length;
    return {
      userId: userId || sessionId,
      answers: answers,
      worldsCompleted: completedWorlds,
      completed: isCompleted,
      startedAt: startTime,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      userTrack,
    };
  }, [answers, completedWorlds, sessionId, startTime, userId, userTrack]);

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

  const handleWorldChange = useCallback((newWorld: WorldId) => {
    setCurrentWorld(newWorld);
    setError(null);
  }, []);

  const handleWorldComplete = useCallback(
    async (worldId: WorldId) => {
      try {
        if (!completedWorlds.includes(worldId)) {
          setCompletedWorlds((prev) => [...prev, worldId]);
        }

        showToast(
          `כל הכבוד! סיימת את עולם ה${
            worldId === "PERSONALITY"
              ? "אישיות"
              : worldId === "VALUES"
              ? "ערכים"
              : worldId === "RELATIONSHIP"
              ? "זוגיות"
              : worldId === "PARTNER"
              ? "פרטנר"
              : "דת ומסורת"
          }`,
          "success"
        );

        const nextWorld = getNextWorld(worldId);
        if (!nextWorld) {
          setCurrentStep(OnboardingStep.COMPLETED);
        } else {
          setCurrentWorld(nextWorld);
        }

        // שמירה אוטומטית לאחר השלמת עולם
        if (userId) {
          await handleQuestionnaireComplete(true);
        }
      } catch (err) {
        setError("אירעה שגיאה בשמירת ההתקדמות. אנא נסה שוב.");
        console.error("Error completing world:", err);
      }
    },
    [completedWorlds, showToast, userId]
  );

  const handleQuestionnaireComplete = async (isAutoSave = false) => {
    if (isSaving) return;

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

      setLastSavedTime(new Date());

      if (!isAutoSave && onComplete) {
        onComplete();
      }

      if (!isAutoSave) {
        showToast("השאלון נשמר בהצלחה", "success");
      }
    } catch (err) {
      console.error("Failed to save questionnaire:", err);
      setError(
        err instanceof Error
          ? err.message
          : "אירעה שגיאה בשמירת השאלון. אנא נסה שוב."
      );

      if (!isAutoSave) {
        showToast("אירעה שגיאה בשמירת השאלון", "error");
      }
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
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <h2 className="text-xl font-medium">טוען את השאלון...</h2>
          <p className="text-gray-500 mt-2">אנא המתן, מאחזר את ההתקדמות שלך</p>
        </div>
      );
    }

    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return (
          <Welcome
            onStart={() => setCurrentStep(OnboardingStep.TRACK_SELECTION)}
            onLearnMore={() => router.push("/profile")}
            isLoggedIn={!!userId}
          />
        );

      case OnboardingStep.TRACK_SELECTION:
        return (
          <TrackSelection
            onSelect={(track: UserTrack) => {
              setUserTrack(track);
              setCurrentStep(OnboardingStep.WORLDS);
            }}
            onBack={() => setCurrentStep(OnboardingStep.WELCOME)}
            selectedTrack={userTrack}
          />
        );

      case OnboardingStep.WORLDS:
        return (
          <QuestionnaireLayout
            currentWorld={currentWorld}
            userTrack={userTrack}
            completedWorlds={completedWorlds}
            onWorldChange={handleWorldChange}
            onExit={() => router.push("/profile")}
            onSaveProgress={() => handleQuestionnaireComplete(true)}
            language={language}
          >
            {renderCurrentWorld()}
          </QuestionnaireLayout>
        );

      case OnboardingStep.COMPLETED:
        return (
          <QuestionnaireCompletion
            onSendToMatching={() => handleQuestionnaireComplete()}
            isLoading={isSaving}
            isLoggedIn={!!userId}
          />
        );

      default:
        return <div>שגיאה בטעינת השלב</div>;
    }
  }

  const Toast = ({ message, type, isVisible }) => {
    if (!isVisible) return null;

    return (
      <div
        className={cn(
          "fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md transition-all duration-300",
          type === "success"
            ? "bg-green-500"
            : type === "error"
            ? "bg-red-500"
            : "bg-blue-500",
          "text-white"
        )}
      >
        <div className="flex items-center">
          {type === "success" ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : type === "error" ? (
            <XCircle className="h-5 w-5 mr-2" />
          ) : (
            <Info className="h-5 w-5 mr-2" />
          )}
          <p>{message}</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "min-h-screen bg-gray-50",
        language === "he" ? "dir-rtl" : "dir-ltr"
      )}
    >
      {/* נתוני שמירה אחרונה והתקדמות */}
      {lastSavedTime && currentStep === OnboardingStep.WORLDS && (
        <div className="fixed bottom-4 left-4 z-40 bg-white p-2 rounded-lg shadow-md text-xs text-gray-600 border">
          <div className="flex items-center">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" />
            <span>נשמר לאחרונה: {lastSavedTime.toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="m-4 max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* תצוגת השלב הנוכחי */}
      {renderCurrentStep()}

      {/* התראות (Toast) */}
      <Toast
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
      />
    </div>
  );
}
