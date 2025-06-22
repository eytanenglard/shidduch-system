// src/components/questionnaire/MatchmakingQuestionnaire.tsx
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
import WorldsMap from "./layout/WorldsMap";
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
  QuestionnaireAnswer,
  AnswerValue,
  WorldComponentProps,
} from "./types/types";

const worldLabels = {
  PERSONALITY: "אישיות",
  VALUES: "ערכים ואמונות",
  RELATIONSHIP: "זוגיות",
  PARTNER: "פרטנר",
  RELIGION: "דת ומסורת",
} as const;
enum OnboardingStep {
  WELCOME = "WELCOME",
  TRACK_SELECTION = "TRACK_SELECTION",
  WORLDS = "WORLDS",
  COMPLETED = "COMPLETED",
  MAP = "MAP",
}

const WORLD_ORDER: WorldId[] = [
  "PERSONALITY",
  "VALUES",
  "RELATIONSHIP",
  "PARTNER",
  "RELIGION",
];

export interface MatchmakingQuestionnaireProps {
  userId?: string;
  onComplete?: () => void;
  initialWorld?: WorldId;
}

export default function MatchmakingQuestionnaire({
  userId,
  onComplete,
  initialWorld,
}: MatchmakingQuestionnaireProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const sessionId = useMemo(() => `session_${Date.now()}`, []);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.WELCOME
  );
  const [currentWorld, setCurrentWorld] = useState<WorldId>(
    initialWorld || "VALUES"
  );
const [userTrack, setUserTrack] = useState<UserTrack>("חילוני");  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [completedWorlds, setCompletedWorlds] = useState<WorldId[]>([]);
  const [startTime] = useState(() => new Date().toISOString());
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  const [currentQuestionIndices, setCurrentQuestionIndices] = useState<
    Record<WorldId, number>
  >({
    PERSONALITY: 0,
    VALUES: 0,
    RELATIONSHIP: 0,
    PARTNER: 0,
    RELIGION: 0,
  });

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

  useEffect(() => {
    if (initialWorld) {
      setCurrentWorld(initialWorld);
    }
  }, [initialWorld]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToastState({ message, type, isVisible: true });
      setTimeout(() => {
        setToastState((prev) => ({ ...prev, isVisible: false }));
      }, 3000); // Toast visible for 3 seconds
    },
    []
  );

  const getNextWorld = (currentWorldId: WorldId): WorldId | null => {
    const currentIndex = WORLD_ORDER.indexOf(currentWorldId);
    if (currentIndex < WORLD_ORDER.length - 1) {
      return WORLD_ORDER[currentIndex + 1];
    }
    return null;
  };

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

  const handleQuestionnaireSave = useCallback(
    async (isAutoSave = false) => {
      // Prevent multiple simultaneous saves unless it's an auto-save trying to override a stuck manual save
      if (isSaving && !isAutoSave) return;

      setIsSaving(true);
      setError(null);
      if (!isAutoSave) {
        // For manual save, show "Saving..." toast immediately.
        // The button in QuestionnaireLayout already shows a spinner.
        // This toast can be brief or integrated differently if a global spinner is preferred.
        // For now, let's rely on the button's spinner and the success/error toast.
      }

      try {
        const submissionData = prepareSubmissionData();

        const validateSubmission = (data: QuestionnaireSubmission): boolean => {
          if (!data.userId) return false;
          if (!Array.isArray(data.worldsCompleted)) return false;
          if (typeof data.completed !== "boolean") return false;
          if (!data.startedAt) return false;
          if (data.completed && !data.completedAt) return false;
          return true;
        };

        if (!validateSubmission(submissionData)) {
          throw new Error("Invalid submission data");
        }

        if (!userId) {
          // Anonymous user
          localStorage.setItem(
            "tempQuestionnaire",
            JSON.stringify(submissionData)
          );
          setLastSavedTime(new Date());
          if (!isAutoSave) {
            // Only redirect on explicit manual save for anonymous users if they try to fully complete
            // For a simple "Save Progress", we stay on the page.
            showToast("ההתקדמות נשמרה בדפדפן (משתמש אנונימי)", "info");
            // If they are on the *final* completion step (OnboardingStep.COMPLETED), then redirect.
            if (currentStep === OnboardingStep.COMPLETED) {
              router.push("/auth/signin?callbackUrl=/questionnaire/restore");
            }
          } else {
            showToast("ההתקדמות נשמרה אוטומטית בדפדפן", "info");
          }
          return;
        }

        // Logged-in user
        const response = await fetch("/api/questionnaire", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save questionnaire");
        }

        setLastSavedTime(new Date());

        if (!isAutoSave) {
          showToast("השאלון נשמר בהצלחה", "success");
          // If it's a manual save AND the questionnaire is fully completed,
          // AND the user is at the end (e.g. clicked "Send to Matching" from QuestionnaireCompletion component)
          // then we can call onComplete and change step.
          // Otherwise, for a simple "Save Progress" click, we just show the toast and stay.
          if (
            submissionData.completed &&
            currentStep === OnboardingStep.COMPLETED
          ) {
            if (onComplete) onComplete();
          } else if (
            submissionData.completed &&
            currentStep !== OnboardingStep.COMPLETED &&
            currentStep !== OnboardingStep.WORLDS
          ) {
            // If completed but not explicitly on the final step (e.g. auto-save made it complete)
            // and not in a world, maybe move to map or completed.
            // For now, let's assume manual "Save Progress" keeps them in place unless they *finish* a world.
          }
        } else {
          showToast("ההתקדמות נשמרה אוטומטית", "info");
        }
      } catch (err) {
        console.error("Failed to save questionnaire:", err);
        const errorMessage =
          err instanceof Error ? err.message : "אירעה שגיאה בשמירת השאלון.";
        setError(errorMessage); // Set global error state
        if (!isAutoSave) {
          showToast(errorMessage, "error");
        } else {
          showToast("שגיאה בשמירה אוטומטית", "error"); // More subtle for auto-save
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      isSaving,
      prepareSubmissionData,
      userId,
      router,
      onComplete,
      showToast,
      currentStep, // Added currentStep
    ]
  );

  // Auto-save effect
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout;

    if (currentStep === OnboardingStep.WORLDS && userId) {
      // Only auto-save for logged-in users in worlds
      autoSaveInterval = setInterval(() => {
        if (answers.length > 0 || completedWorlds.length > 0) {
          handleQuestionnaireSave(true); // Pass true for isAutoSave
        }
      }, 300000); // 5 minutes
    }

    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [
    currentStep,
    answers.length,
    completedWorlds.length,
    userId,
    handleQuestionnaireSave, // Use the renamed save function
  ]);

  // Load existing answers effect
  useEffect(() => {
    const loadExistingAnswers = async () => {
      if (!userId) {
        setIsLoading(false);
        const tempData = localStorage.getItem("tempQuestionnaire");
        if (tempData) {
          console.warn(
            "Found temp data but user ID is missing. This should be handled by /questionnaire/restore."
          );
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/questionnaire");
        if (!response.ok) {
          if (response.status === 404) {
            console.log("No existing questionnaire data found for user.");
            setCurrentStep(OnboardingStep.WELCOME);
          } else {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Failed to load existing answers"
            );
          }
        } else {
          const data = await response.json();
          if (data.success && data.data) {
            const allAnswers = [
              ...(data.data.answers || []),
              ...(data.data.valuesAnswers || []),
              ...(data.data.personalityAnswers || []),
              ...(data.data.relationshipAnswers || []),
              ...(data.data.partnerAnswers || []),
              ...(data.data.religionAnswers || []),
            ].filter(
              (answer, index, self) =>
                index ===
                self.findIndex((a) => a.questionId === answer.questionId)
            );

            setAnswers(allAnswers);
            const loadedCompletedWorlds = data.data.worldsCompleted || [];
            setCompletedWorlds(loadedCompletedWorlds);
            setUserTrack(data.data.userTrack || "SECULAR");

            const isQuestionnaireComplete =
              data.data.completed ||
              loadedCompletedWorlds.length === WORLD_ORDER.length;

            if (isQuestionnaireComplete) {
              // If it's complete, but the user is coming directly to questionnaire,
              // they might want to edit, so we send them to the map.
              // If `initialWorld` is set, we respect that.
              if (initialWorld && WORLD_ORDER.includes(initialWorld)) {
                setCurrentWorld(initialWorld);
                setCurrentStep(OnboardingStep.WORLDS);
              } else {
                setCurrentWorld(WORLD_ORDER[0]); // Default to first world on map
                setCurrentStep(OnboardingStep.MAP); // Go to map if complete and no specific initial world
              }
            } else if (
              loadedCompletedWorlds.length > 0 ||
              allAnswers.length > 0 ||
              initialWorld
            ) {
              const nextWorld = WORLD_ORDER.find(
                (world) => !loadedCompletedWorlds.includes(world)
              );
              const worldToSet =
                initialWorld && WORLD_ORDER.includes(initialWorld)
                  ? initialWorld
                  : nextWorld || WORLD_ORDER[0];

              setCurrentWorld(worldToSet);
              if (initialWorld && WORLD_ORDER.includes(initialWorld)) {
                setCurrentStep(OnboardingStep.WORLDS);
              } else {
                setCurrentStep(OnboardingStep.MAP);
              }
            } else {
              setCurrentStep(OnboardingStep.WELCOME);
            }

            if (data.data.currentQuestionIndices) {
              setCurrentQuestionIndices(data.data.currentQuestionIndices);
            }
          } else {
            console.log("Questionnaire data structure invalid or missing.");
            setCurrentStep(OnboardingStep.WELCOME);
          }
        }
      } catch (err) {
        console.error("Failed to load existing answers:", err);
        setError("אירעה שגיאה בטעינת התשובות הקיימות");
        setCurrentStep(OnboardingStep.WELCOME);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAnswers();
  }, [userId, initialWorld]);

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

  const handleWorldChange = useCallback((newWorld: WorldId) => {
    setCurrentWorld(newWorld);
    setCurrentStep(OnboardingStep.WORLDS);
    setError(null);
  }, []);

  const handleWorldComplete = useCallback(
    async (worldId: WorldId) => {
      let updatedCompletedWorlds = completedWorlds;
      if (!completedWorlds.includes(worldId)) {
        updatedCompletedWorlds = [...completedWorlds, worldId];
        setCompletedWorlds(updatedCompletedWorlds);
      }

      showToast(
        `כל הכבוד! סיימת את עולם ה${
          worldLabels[worldId] ?? worldId.toLowerCase()
        }`,
        "success"
      );

      const isQuestionnaireNowFullyCompleted =
        updatedCompletedWorlds.length === WORLD_ORDER.length;

      // Prepare data for saving
      const submissionDataForWorldComplete = {
        ...prepareSubmissionData(), // Gets current answers, track etc.
        worldsCompleted: updatedCompletedWorlds, // Crucially, use the updated list
        completed: isQuestionnaireNowFullyCompleted, // Mark true if all worlds done
        completedAt: isQuestionnaireNowFullyCompleted
          ? new Date().toISOString()
          : undefined,
      };

      // Save progress (this will use handleQuestionnaireSave)
      if (userId) {
        // For logged-in users, trigger a save.
        // This save is treated like a "manual" save in terms of its effect if it's the *final* world.
        // Otherwise, it's like an auto-save (stays on page).
        try {
          setIsSaving(true); // Show saving indicator
          const response = await fetch("/api/questionnaire", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(submissionDataForWorldComplete),
          });
          if (!response.ok)
            throw new Error("Failed to save after world completion");
          setLastSavedTime(new Date());
          showToast("התקדמות העולם נשמרה", "success");
        } catch (e) {
          console.error("Error saving after world complete:", e);
          showToast("שגיאה בשמירת התקדמות העולם", "error");
          setError("שגיאה בשמירת התקדמות העולם.");
          setIsSaving(false); // Ensure saving is reset on error
          return; // Don't proceed if save failed
        } finally {
          setIsSaving(false);
        }
      } else {
        // Anonymous user: update localStorage
        localStorage.setItem(
          "tempQuestionnaire",
          JSON.stringify(submissionDataForWorldComplete)
        );
        setLastSavedTime(new Date()); // Show local save time
        showToast("התקדמות העולם נשמרה בדפדפן", "info");
      }

      // Navigate based on completion status
      if (isQuestionnaireNowFullyCompleted) {
        if (!userId) {
          router.push("/auth/signin?callbackUrl=/questionnaire/restore"); // Anon users go to sign in to finalize
        } else {
          // Logged-in users who completed the *last* world
          setCurrentStep(OnboardingStep.COMPLETED); // Go to the "QuestionnaireCompletion" component view
          if (onComplete) onComplete(); // This might navigate them further (e.g., to /dashboard or /questionnaire/complete)
        }
      } else {
        // Not the last world, move to the next or map
        const nextWorld = getNextWorld(worldId);
        if (nextWorld) {
          setCurrentWorld(nextWorld);
          setCurrentStep(OnboardingStep.MAP); // Show map between worlds
        } else {
          // Should not happen if not fully completed, but as a fallback:
          setCurrentStep(OnboardingStep.MAP);
        }
      }
    },
    [
      completedWorlds,
      showToast,
      userId,
      prepareSubmissionData, // Use the main save function with autoSave=true for intermediate saves
      router,
      onComplete, // Propagate onComplete for final completion
      // error, // Removed error from dependencies here as it might cause loops
    ]
  );

  const handleExit = useCallback(
    () => {
      // Potentially auto-save before exiting to map
      // handleQuestionnaireSave(true); // true for auto-save behavior (no navigation)
      setCurrentStep(OnboardingStep.MAP);
    },
    [
      /*handleQuestionnaireSave*/
    ]
  );

  function renderCurrentWorld() {
    const worldProps: WorldComponentProps = {
      onAnswer: handleAnswer,
      onComplete: () => handleWorldComplete(currentWorld),
      onBack: handleExit,
      answers: answers.filter((a) => a.worldId === currentWorld),
      isCompleted: completedWorlds.includes(currentWorld),
      language,
      currentQuestionIndex: currentQuestionIndices[currentWorld],
      setCurrentQuestionIndex: (index: number) => {
        setCurrentQuestionIndices((prev) => ({
          ...prev,
          [currentWorld]: index,
        }));
      },
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
        setCurrentWorld(WORLD_ORDER[0]);
        return <div>טוען עולם...</div>;
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
      case OnboardingStep.MAP:
        return (
          <WorldsMap
            currentWorld={currentWorld}
            completedWorlds={completedWorlds}
            onWorldChange={handleWorldChange}
          />
        );
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
              setCurrentWorld(WORLD_ORDER[0]);
              setCurrentStep(OnboardingStep.MAP);
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
            onExit={handleExit}
            onSaveProgress={() => handleQuestionnaireSave(false)} // false for manual save
            language={language}
                        isLoggedIn={!!userId} // --- הוספנו שורה זו ---

          >
            {renderCurrentWorld()}
          </QuestionnaireLayout>
        );

      case OnboardingStep.COMPLETED:
        // This view is shown AFTER all worlds are done and user is logged in.
        return (
          <QuestionnaireCompletion
            onSendToMatching={async () => {
              // This is the final "send"
              // It might re-trigger a save if we want to ensure latest data,
              // or just proceed with navigation if confident data is saved.
              // For now, let's assume data is saved by handleWorldComplete.
              if (onComplete) onComplete(); // This usually navigates away
              else router.push("/dashboard");
            }}
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
          "fixed bottom-4 right-4 z-[100] p-4 rounded-lg shadow-lg max-w-md transition-all duration-300", // Increased z-index
          type === "success" && "bg-green-500",
          type === "error" && "bg-red-500",
          type === "info" && "bg-blue-500",
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
      {lastSavedTime && currentStep === OnboardingStep.WORLDS && userId && (
        <div className="fixed bottom-4 left-4 z-40 bg-white p-2 rounded-lg shadow-md text-xs text-gray-600 border">
          <div className="flex items-center">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" />
            <span>נשמר לאחרונה: {lastSavedTime.toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {error &&
        currentStep !== OnboardingStep.WORLDS && ( // Show global error if not in a world (world layout might have its own)
          <Alert variant="destructive" className="m-4 max-w-lg mx-auto">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

      {renderCurrentStep()}

      <Toast
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
      />
    </div>
  );
}
