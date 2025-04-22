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
  WorldComponentProps, // Ensure this is imported if not implicitly available
} from "./types/types";

const worldLabels = {
  PERSONALITY: "אישיות",
  VALUES: "ערכים ואמונות",
  RELATIONSHIP: "זוגיות",
  PARTNER: "פרטנר",
  RELIGION: "דת ומסורת",
} as const; // Using 'as const' for better type safety
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

  // Basic State
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.WELCOME
  );
  const [currentWorld, setCurrentWorld] = useState<WorldId>(
    initialWorld || "VALUES" // Default to VALUES if no initial world
  );
  const [userTrack, setUserTrack] = useState<UserTrack>("SECULAR");
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [completedWorlds, setCompletedWorlds] = useState<WorldId[]>([]);
  const [startTime] = useState(() => new Date().toISOString());
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // --- New State for Managing Question Indices per World ---
  const [currentQuestionIndices, setCurrentQuestionIndices] = useState<
    Record<WorldId, number>
  >({
    PERSONALITY: 0,
    VALUES: 0,
    RELATIONSHIP: 0,
    PARTNER: 0,
    RELIGION: 0,
  });
  // ----------------------------------------------------------

  // Submission state
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Changed initial state to true for loading
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

  // Effect to handle initialWorld prop changes
  useEffect(() => {
    if (initialWorld) {
      setCurrentWorld(initialWorld);
      // Optionally, you might want to ensure the user is in the WORLDS step
      // if (currentStep !== OnboardingStep.COMPLETED) {
      //   setCurrentStep(OnboardingStep.WORLDS);
      // }
    }
  }, [initialWorld]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToastState({ message, type, isVisible: true });
      setTimeout(() => {
        setToastState((prev) => ({ ...prev, isVisible: false }));
      }, 3000);
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
      // Note: We are not saving currentQuestionIndices here, as it's UI state.
      // If you need to save the current position, you'd add it here.
    };
  }, [answers, completedWorlds, sessionId, startTime, userId, userTrack]);

  const handleQuestionnaireComplete = useCallback(
    async (isAutoSave = false) => {
      if (isSaving && !isAutoSave) return; // Allow auto-save even if manual save is in progress

      setIsSaving(true);
      setError(null);

      try {
        const submissionData = prepareSubmissionData();

        const validateSubmission = (data: QuestionnaireSubmission): boolean => {
          if (!data.userId) return false;
          // Allow saving even with no answers (e.g., just track selection)
          // if (!Array.isArray(data.answers) || data.answers.length === 0) return false;
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
          // Save to localStorage for anonymous users
          localStorage.setItem(
            "tempQuestionnaire",
            JSON.stringify(submissionData)
          );
          if (!isAutoSave) {
            // Only redirect on explicit save/complete for anonymous users
            router.push("/auth/signin?callbackUrl=/questionnaire/restore"); // Redirect to signin, then restore
          }
          return; // Stop here for anonymous users
        }

        // Save to server for logged-in users
        const response = await fetch("/api/questionnaire", {
          method: "PUT", // Use PUT to update existing or create new
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
          onComplete(); // Call the external completion handler
        }

        if (!isAutoSave) {
          showToast("השאלון נשמר בהצלחה", "success");
          if (submissionData.completed) {
            setCurrentStep(OnboardingStep.COMPLETED); // Move to completed view if finished
          }
        }
      } catch (err) {
        console.error("Failed to save questionnaire:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "אירעה שגיאה בשמירת השאלון. אנא נסה שוב.";
        setError(errorMessage);

        if (!isAutoSave) {
          showToast(errorMessage, "error");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving, prepareSubmissionData, userId, router, onComplete, showToast]
  );

  // Auto-save effect
  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout;

    if (currentStep === OnboardingStep.WORLDS && userId) {
      autoSaveInterval = setInterval(() => {
        if (answers.length > 0 || completedWorlds.length > 0) {
          handleQuestionnaireComplete(true);
        }
        // ----> שונה ל-5 דקות <----
      }, 300000);
    }

    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [
    currentStep,
    answers.length,
    completedWorlds.length,
    userId,
    handleQuestionnaireComplete,
  ]);

  // Load existing answers effect
  useEffect(() => {
    const loadExistingAnswers = async () => {
      if (!userId) {
        setIsLoading(false);
        // Check for temp data for anonymous users returning after login attempt
        const tempData = localStorage.getItem("tempQuestionnaire");
        if (tempData) {
          // This case should ideally be handled by a dedicated restore page/logic
          console.warn(
            "Found temp data but user ID is missing. Redirect or clear."
          );
          // localStorage.removeItem("tempQuestionnaire"); // Example cleanup
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/questionnaire"); // Assuming GET retrieves current user's data
        if (!response.ok) {
          // Handle non-OK responses (e.g., 404 if no data exists yet)
          if (response.status === 404) {
            console.log("No existing questionnaire data found for user.");
            // Set initial state or defaults if needed
            setCurrentStep(OnboardingStep.WELCOME); // Start from beginning
          } else {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Failed to load existing answers"
            );
          }
        } else {
          const data = await response.json();
          if (data.success && data.data) {
            // Combine answers from different possible structures (adjust as needed)
            const allAnswers = [
              ...(data.data.answers || []), // Prefer a single 'answers' array if possible
              // Fallbacks if structure is different
              ...(data.data.valuesAnswers || []),
              ...(data.data.personalityAnswers || []),
              ...(data.data.relationshipAnswers || []),
              ...(data.data.partnerAnswers || []),
              ...(data.data.religionAnswers || []),
            ].filter(
              (
                answer,
                index,
                self // Deduplicate if necessary
              ) =>
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
              setCurrentStep(OnboardingStep.COMPLETED);
            } else if (
              loadedCompletedWorlds.length > 0 ||
              allAnswers.length > 0 ||
              initialWorld
            ) {
              // If progress exists or initial world is set, go to worlds/map
              const nextWorld = WORLD_ORDER.find(
                (world) => !loadedCompletedWorlds.includes(world)
              );
              // Set current world to initialWorld if provided and valid, otherwise find next incomplete
              const worldToSet =
                initialWorld && WORLD_ORDER.includes(initialWorld)
                  ? initialWorld
                  : nextWorld || WORLD_ORDER[0]; // Default to first if all else fails

              setCurrentWorld(worldToSet);

              // Decide whether to show MAP or go directly into the WORLD
              if (initialWorld && WORLD_ORDER.includes(initialWorld)) {
                setCurrentStep(OnboardingStep.WORLDS); // Go directly into the specified world
              } else {
                setCurrentStep(OnboardingStep.MAP); // Show map by default if resuming
              }
            } else {
              // No significant progress, start from Welcome or Track Selection
              setCurrentStep(OnboardingStep.WELCOME);
            }

            // Load saved question indices if available (add this to your API response/data model)
            if (data.data.currentQuestionIndices) {
              setCurrentQuestionIndices(data.data.currentQuestionIndices);
            }
          } else {
            // Handle case where API call succeeded but data is missing/invalid
            console.log("Questionnaire data structure invalid or missing.");
            setCurrentStep(OnboardingStep.WELCOME);
          }
        }
      } catch (err) {
        console.error("Failed to load existing answers:", err);
        setError("אירעה שגיאה בטעינת התשובות הקיימות");
        // Decide how to proceed on error, e.g., start fresh or show error message
        setCurrentStep(OnboardingStep.WELCOME);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingAnswers();
  }, [userId, initialWorld]); // Rerun if userId or initialWorld changes

  const handleAnswer = useCallback(
    (questionId: string, value: AnswerValue) => {
      setError(null); // Clear error on new answer
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

      // // Optionally trigger auto-save more frequently after an answer
      // handleQuestionnaireComplete(true); // Be cautious with performance if saving too often
    },
    [currentWorld]
  );

  const handleWorldChange = useCallback((newWorld: WorldId) => {
    setCurrentWorld(newWorld);
    setCurrentStep(OnboardingStep.WORLDS); // Ensure we are in the worlds step
    setError(null);
    // No need to reset index, the state `currentQuestionIndices` holds the last index for `newWorld`
  }, []);

  const handleWorldComplete = useCallback(
    async (worldId: WorldId) => {
      try {
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

        const nextWorld = getNextWorld(worldId);
        if (
          !nextWorld ||
          updatedCompletedWorlds.length === WORLD_ORDER.length
        ) {
          // Prepare data and mark as complete before potentially navigating away
          const finalSubmissionData = {
            ...prepareSubmissionData(),
            worldsCompleted: updatedCompletedWorlds, // Use updated list
            completed: true, // Mark as completed
            completedAt: new Date().toISOString(),
          };

          // Attempt final save
          if (userId) {
            await handleQuestionnaireComplete(false); // Trigger final manual save
            // Check for errors after save before changing step
            if (!error) {
              setCurrentStep(OnboardingStep.COMPLETED);
            }
          } else {
            // Anonymous user flow
            localStorage.setItem(
              "tempQuestionnaire",
              JSON.stringify(finalSubmissionData)
            );
            router.push("/auth/signin?callbackUrl=/questionnaire/restore");
          }
        } else {
          setCurrentWorld(nextWorld); // Move to the next world
          setCurrentStep(OnboardingStep.MAP); // Show map between worlds

          // Auto-save progress after completing a world (but not the last one)
          if (userId) {
            await handleQuestionnaireComplete(true); // Auto-save
          }
        }
      } catch (err) {
        setError("אירעה שגיאה בשמירת ההתקדמות. אנא נסה שוב.");
        console.error("Error completing world:", err);
      }
    },
    [
      completedWorlds,
      showToast,
      userId,
      handleQuestionnaireComplete,
      prepareSubmissionData,
      router,
      error,
    ]
  );

  const handleExit = useCallback(() => {
    // Save progress before showing the map? Optional.
    // handleQuestionnaireComplete(true);
    setCurrentStep(OnboardingStep.MAP);
  }, []);

  // --- Updated renderCurrentWorld to pass index state ---
  function renderCurrentWorld() {
    // Explicitly define the props structure expected by WorldComponentProps
    const worldProps: WorldComponentProps = {
      onAnswer: handleAnswer,
      onComplete: () => handleWorldComplete(currentWorld),
      onBack: handleExit, // Use handleExit to go back to the map
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
        // Attempt to find the first world if currentWorld is somehow invalid
        setCurrentWorld(WORLD_ORDER[0]);
        return <div>טוען עולם...</div>;
    }
  }
  // -----------------------------------------------------

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
            onWorldChange={handleWorldChange} // Updated handler
          />
        );
      case OnboardingStep.WELCOME:
        return (
          <Welcome
            onStart={() => setCurrentStep(OnboardingStep.TRACK_SELECTION)}
            onLearnMore={() => router.push("/profile")} // Example learn more destination
            isLoggedIn={!!userId}
          />
        );

      case OnboardingStep.TRACK_SELECTION:
        return (
          <TrackSelection
            onSelect={(track: UserTrack) => {
              setUserTrack(track);
              // Move to map or first world after track selection
              setCurrentWorld(WORLD_ORDER[0]); // Start with the first world
              setCurrentStep(OnboardingStep.MAP); // Show map first
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
            onWorldChange={handleWorldChange} // Pass map handler
            onExit={handleExit} // Pass exit handler
            onSaveProgress={() => handleQuestionnaireComplete(false)} // Manual save
            language={language}
          >
            {renderCurrentWorld()}
          </QuestionnaireLayout>
        );

      case OnboardingStep.COMPLETED:
        return (
          <QuestionnaireCompletion
            onSendToMatching={() => {
              // Resubmit data or navigate away
              handleQuestionnaireComplete(false); // Resubmit potentially
              // Or redirect:
              if (onComplete) onComplete(); // Call external handler if provided
              else router.push("/dashboard"); // Default redirect after completion
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
      {/* Display last saved time only when actively in a world */}
      {lastSavedTime && currentStep === OnboardingStep.WORLDS && userId && (
        <div className="fixed bottom-4 left-4 z-40 bg-white p-2 rounded-lg shadow-md text-xs text-gray-600 border">
          <div className="flex items-center">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" />
            <span>נשמר לאחרונה: {lastSavedTime.toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Display global error messages */}
      {error && (
        <Alert variant="destructive" className="m-4 max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Render the current step's content */}
      {renderCurrentStep()}

      {/* Toast notifications */}
      <Toast
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
      />
    </div>
  );
}
