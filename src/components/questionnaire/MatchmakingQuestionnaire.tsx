// src/components/questionnaire/MatchmakingQuestionnaire.tsx
'use client';

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import QuestionnaireLayout from './layout/QuestionnaireLayout';
import WorldComponent from './worlds/WorldComponent';
import QuestionnaireCompletion from './common/QuestionnaireCompletion';
import QuestionnaireLandingPage from './pages/QuestionnaireLandingPage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import WorldsMap from './layout/WorldsMap';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { signOut } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuestionnaireState } from '@/app/[locale]/contexts/QuestionnaireStateContext';

import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  LogOut,
  Sparkles,
  Save,
  AlertCircle,
  TrendingUp,
  Zap,
  Target,
} from 'lucide-react';
import type {
  WorldId,
  QuestionnaireSubmission,
  QuestionnaireAnswer,
  AnswerValue,
  Question,
} from './types/types';
import type { QuestionnaireDictionary } from '@/types/dictionary';

import { personalityQuestions } from './questions/personality/personalityQuestions';
import { valuesQuestions } from './questions/values/valuesQuestions';
import { relationshipQuestions } from './questions/relationship/relationshipQuestions';
import { partnerQuestions } from './questions/partner/partnerQuestions';
import { religionQuestions } from './questions/religion/religionQuestions';

const worldConfig: Record<WorldId, { questions: Question[] }> = {
  PERSONALITY: { questions: personalityQuestions },
  VALUES: { questions: valuesQuestions },
  RELATIONSHIP: { questions: relationshipQuestions },
  PARTNER: { questions: partnerQuestions },
  RELIGION: { questions: religionQuestions },
};

enum OnboardingStep {
  LANDING = 'LANDING',
  MAP = 'MAP',
  WORLDS = 'WORLDS',
  COMPLETED = 'COMPLETED',
}

const WORLD_ORDER: WorldId[] = [
  'PERSONALITY',
  'VALUES',
  'RELATIONSHIP',
  'PARTNER',
  'RELIGION',
];

export interface MatchmakingQuestionnaireProps {
  userId?: string;
  onComplete?: () => void;
  initialWorld?: WorldId;
  initialQuestionId?: string;
  dict: QuestionnaireDictionary;
  locale: 'he' | 'en';
}

export default function MatchmakingQuestionnaire({
  userId,
  onComplete,
  initialWorld,
  initialQuestionId,
  dict,
  locale,
}: MatchmakingQuestionnaireProps) {
  console.log(
    `%c[MatchmakingQuestionnaire] 🚀 Initializing | User: ${userId ? 'Authenticated' : 'Guest'} | World: ${initialWorld || 'None'} | Question: ${initialQuestionId || 'None'}`,
    'color: #14b8a6; font-weight: bold; font-size: 14px;'
  );

  const router = useRouter();
  const sessionId = useMemo(() => `session_${Date.now()}`, []);

  // Check for saved progress
  const hasSavedProgress = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('tempQuestionnaire');
    return !!saved;
  }, []);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    initialWorld ? OnboardingStep.WORLDS : OnboardingStep.LANDING
  );
  const [currentWorld, setCurrentWorld] = useState<WorldId>(
    initialWorld || 'PERSONALITY'
  );
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [completedWorlds, setCompletedWorlds] = useState<WorldId[]>([]);
  const [startTime] = useState(() => new Date().toISOString());
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isDirectNavigation, setIsDirectNavigation] = useState(false);
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
  const [isDirty, setIsDirty] = useState(false);
  const { setIsDirty: setGlobalDirty, setSaveHandler } =
    useQuestionnaireState();

  const [toastState, setToastState] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
    action?: { label: string; onClick: () => void };
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const [showIdleModal, setShowIdleModal] = useState(false);
  const logoutTimer = useRef<NodeJS.Timeout | null>(null);

  // Idle timeout handler
  const handleIdle = useCallback(() => {
    if (userId) {
      console.log(
        '%c[MatchmakingQuestionnaire] ⏰ User idle detected',
        'color: #f59e0b; font-weight: bold;'
      );
      setShowIdleModal(true);
      logoutTimer.current = setTimeout(() => {
        signOut({ callbackUrl: '/' });
      }, 60000);
    }
  }, [userId]);

  const { resetTimer: resetIdleTimer } = useIdleTimeout({
    onIdle: handleIdle,
    idleTimeSeconds: 7200,
  });

  const handleStayActive = useCallback(() => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
    }
    setShowIdleModal(false);
    resetIdleTimer();
    console.log(
      '%c[MatchmakingQuestionnaire] ✅ User stayed active',
      'color: #10b981; font-weight: bold;'
    );
  }, [resetIdleTimer]);

  // Sync isDirty state globally
  useEffect(() => {
    setGlobalDirty(isDirty);
  }, [isDirty, setGlobalDirty]);

  // Handle initial world
  useEffect(() => {
    if (initialWorld) {
      setCurrentWorld(initialWorld);
    }
  }, [initialWorld]);

  // Enhanced toast notification system
  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      duration: number = 3000,
      action?: { label: string; onClick: () => void }
    ) => {
      console.log(
        `%c[Toast] ${type.toUpperCase()}: ${message}`,
        'color: #6366f1; font-weight: bold;'
      );
      setToastState({ message, type, isVisible: true, action });
      if (!action) {
        setTimeout(() => {
          setToastState((prev) => ({ ...prev, isVisible: false }));
        }, duration);
      }
    },
    []
  );

  // Get next world in sequence
  const getNextWorld = (currentWorldId: WorldId): WorldId | null => {
    const currentIndex = WORLD_ORDER.indexOf(currentWorldId);
    if (currentIndex < WORLD_ORDER.length - 1) {
      return WORLD_ORDER[currentIndex + 1];
    }
    return null;
  };

  // Prepare submission data
  const prepareSubmissionData = useCallback((): QuestionnaireSubmission => {
    const isCompleted = completedWorlds.length === WORLD_ORDER.length;
    return {
      userId: userId || sessionId,
      answers: answers,
      worldsCompleted: completedWorlds,
      completed: isCompleted,
      startedAt: startTime,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      currentQuestionIndices: currentQuestionIndices,
    };
  }, [
    answers,
    completedWorlds,
    sessionId,
    startTime,
    userId,
    currentQuestionIndices,
  ]);

  // Enhanced save handler with better feedback
  const handleQuestionnaireSave = useCallback(
    async (isAutoSave = false) => {
      if (isSaving && !isAutoSave) return;

      console.log(
        `%c[Save] ${isAutoSave ? '💾 Auto-saving' : '🖱️ Manual save'} | Answers: ${answers.length} | Completed: ${completedWorlds.length}/${WORLD_ORDER.length}`,
        'color: #8b5cf6; font-weight: bold;'
      );

      setIsSaving(true);
      setError(null);

      try {
        const submissionData = prepareSubmissionData();

        // Validation
        const validateSubmission = (data: QuestionnaireSubmission): boolean => {
          if (!data.userId) return false;
          if (!Array.isArray(data.worldsCompleted)) return false;
          if (typeof data.completed !== 'boolean') return false;
          if (!data.startedAt) return false;
          if (data.completed && !data.completedAt) return false;
          return true;
        };

        if (!validateSubmission(submissionData)) {
          throw new Error(dict.matchmaking.errors.invalidSubmission);
        }

        // Save logic
        if (!userId) {
          // Guest user - save to localStorage
          localStorage.setItem(
            'tempQuestionnaire',
            JSON.stringify(submissionData)
          );
          console.log(
            '%c[Save] ✅ Saved to localStorage (guest user)',
            'color: #10b981; font-weight: bold;'
          );

          if (currentStep === OnboardingStep.COMPLETED) {
            router.push('/auth/signin?callbackUrl=/questionnaire/restore');
          }
        } else {
          // Authenticated user - save to backend
          const response = await fetch('/api/questionnaire', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || dict.matchmaking.errors.saveFailed
            );
          }

          console.log(
            '%c[Save] ✅ Saved to backend (authenticated user)',
            'color: #10b981; font-weight: bold;'
          );
        }

        setLastSavedTime(new Date());
        setIsDirty(false);
        setToastState((prev) => ({ ...prev, isVisible: false }));

        if (!isAutoSave) {
          showToast('השינויים נשמרו בהצלחה! 💾', 'success', 2000);
        }
      } catch (err) {
        console.error(
          '%c[Save] ❌ Save failed:',
          'color: #ef4444; font-weight: bold;',
          err
        );
        const errorMessage =
          err instanceof Error
            ? err.message
            : dict.matchmaking.errors.saveFailed;
        setError(errorMessage);
        showToast(errorMessage, 'error', 5000);
      } finally {
        setIsSaving(false);
      }
    },
    [
      isSaving,
      prepareSubmissionData,
      userId,
      currentStep,
      router,
      dict.matchmaking.errors,
      showToast,
      answers.length,
      completedWorlds.length,
    ]
  );

  // קוד חדש ומתוקן
  useEffect(() => {
    setSaveHandler(() => handleQuestionnaireSave(false));
  }, [handleQuestionnaireSave, setSaveHandler]);

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      console.log(
        '%c[Load] 📂 Loading progress...',
        'color: #3b82f6; font-weight: bold;'
      );
      setIsLoading(true);
      setError(null);

      try {
        if (!userId) {
          // Guest user - load from localStorage
          const saved = localStorage.getItem('tempQuestionnaire');
       if (saved) {
    const loadedData = JSON.parse(saved);
    console.log(
      '%c[Load] ✅ Loaded from localStorage',
      'color: #10b981; font-weight: bold;',
      loadedData
    );
    setAnswers(loadedData.answers || []);
    setCompletedWorlds(loadedData.worldsCompleted || []);

    // --- התיקון ---
    // ודא שכל העולמות קיימים, גם אם לא נשמרו
    setCurrentQuestionIndices(prevIndices => ({
        ...prevIndices, // התחל עם האינדקסים הקיימים (ברירת המחדל)
        ...(loadedData.currentQuestionIndices || {}) // דרוס אותם עם המידע השמור, אם קיים
    }));

    // If there's progress, go to the map to allow continuation
    if ((loadedData.answers || []).length > 0) {
      setCurrentStep(OnboardingStep.MAP);
    }
} else {
            console.log(
              '%c[Load] ℹ️ No saved progress found for guest',
              'color: #6b7280; font-weight: bold;'
            );
            setCurrentStep(OnboardingStep.LANDING);
          }
          setIsLoading(false);
          return;
        }

        // Authenticated user - load from server
        const response = await fetch('/api/questionnaire');

        if (!response.ok) {
          if (response.status === 404) {
            console.log(
              '%c[Load] ℹ️ No existing questionnaire data found for user. Starting fresh.',
              'color: #6b7280;'
            );
            setCurrentStep(OnboardingStep.LANDING);
          } else {
            const errorData = await response.json();
            throw new Error(
              errorData.error || dict.matchmaking.errors.loadFailed
            );
          }
        } else {
          const apiResponse = await response.json();
          console.log(
            '%c[Load] ✅ Loaded from backend',
            'color: #10b981; font-weight: bold;',
            apiResponse
          );

          if (apiResponse.success && apiResponse.data) {
            const loadedData = apiResponse.data;

            // 1. Consolidate all answers from different sources
            const allAnswers = [
              ...(loadedData.answers || []),
              ...(loadedData.valuesAnswers || []),
              ...(loadedData.personalityAnswers || []),
              ...(loadedData.relationshipAnswers || []),
              ...(loadedData.partnerAnswers || []),
              ...(loadedData.religionAnswers || []),
            ].filter(
              (answer, index, self) =>
                index ===
                self.findIndex((a) => a.questionId === answer.questionId)
            );

            setAnswers(allAnswers);
            const loadedCompletedWorlds = loadedData.worldsCompleted || [];
            setCompletedWorlds(loadedCompletedWorlds);

            if (
              loadedData.currentQuestionIndices &&
              typeof loadedData.currentQuestionIndices === 'object'
            ) {
              setCurrentQuestionIndices((prev) => ({
                ...prev,
                ...loadedData.currentQuestionIndices,
              }));
            }

            const isQuestionnaireComplete =
              loadedData.completed ||
              loadedCompletedWorlds.length === WORLD_ORDER.length;

            // 2. Restore the full navigation logic
            if (initialWorld && initialQuestionId) {
              // Handle direct navigation from URL
              const worldQuestions = worldConfig[initialWorld].questions;
              const questionIndex = worldQuestions.findIndex(
                (q) => q.id === initialQuestionId
              );
              if (questionIndex !== -1) {
                setCurrentQuestionIndices((prev) => ({
                  ...prev,
                  [initialWorld]: questionIndex,
                }));
                setCurrentWorld(initialWorld);
                setCurrentStep(OnboardingStep.WORLDS);
                setIsDirectNavigation(true);
              } else {
                setCurrentStep(OnboardingStep.MAP);
              }
            } else if (isQuestionnaireComplete) {
              // If questionnaire is complete, send to the world map
              setCurrentStep(OnboardingStep.MAP);
            } else if (allAnswers.length > 0) {
              // If there's saved progress, resume from the last point
              const worldToResume =
                WORLD_ORDER.find(
                  (world) => !loadedCompletedWorlds.includes(world)
                ) || WORLD_ORDER[0];
              setCurrentWorld(worldToResume);
              setCurrentStep(OnboardingStep.WORLDS); // <-- This re-enters the questionnaire
              console.log(
                `%c[Load]  resuming questionnaire at world: ${worldToResume}.`,
                'color: #28a745; font-weight: bold;'
              );
            } else {
              // If no progress at all, start from the landing page/map
              setCurrentStep(OnboardingStep.LANDING);
            }
          } else {
            console.log(
              '%c[Load] API response indicates no existing data. Starting from LANDING.',
              'color: #f44336;'
            );
            setCurrentStep(OnboardingStep.LANDING);
          }
        }
      } catch (err) {
        console.error(
          '%c[Load] ❌ Load failed:',
          'color: #ef4444; font-weight: bold;',
          err
        );
        const errorMessage =
          err instanceof Error
            ? err.message
            : dict.matchmaking.errors.loadFailed;
        setError(errorMessage);
        showToast(errorMessage, 'error', 5000);
        setCurrentStep(OnboardingStep.LANDING); // On error, return to start
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [
    userId,
    initialWorld,
    initialQuestionId,
    dict.matchmaking.errors,
    showToast,
  ]);

  // Answer handler
  const handleAnswer = useCallback(
    (worldId: WorldId, questionId: string, value: AnswerValue) => {
      console.log(
        `%c[Answer] 📝 ${worldId} | ${questionId}`,
        'color: #06b6d4; font-weight: bold;'
      );

      setAnswers((prev) => {
        const existingIndex = prev.findIndex(
          (a) => a.worldId === worldId && a.questionId === questionId
        );
        const newAnswer: QuestionnaireAnswer = {
          worldId,
          questionId,
          value,
          answeredAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newAnswer;
          return updated;
        }
        return [...prev, newAnswer];
      });

      setIsDirty(true);
    },
    []
  );

  // Visibility change handler
  const handleVisibilityChange = useCallback(
    (worldId: WorldId, questionId: string, isVisible: boolean) => {
      console.log(
        `%c[Visibility] ${isVisible ? '👁️' : '👁️‍🗨️'} ${worldId} | ${questionId}`,
        'color: #f59e0b;'
      );
    },
    []
  );

  // World change handler
  const handleWorldChange = useCallback((worldId: WorldId) => {
    console.log(
      `%c[Navigation] 🗺️ Changing to world: ${worldId}`,
      'color: #ec4899; font-weight: bold;'
    );
    setCurrentWorld(worldId);
    setCurrentStep(OnboardingStep.WORLDS);
    setIsDirectNavigation(true);
  }, []);

  // World completion handler
  const handleWorldComplete = useCallback(
    async (worldId: WorldId) => {
      console.log(
        `%c[Complete] ✨ World completed: ${worldId}`,
        'color: #10b981; font-weight: bold;'
      );

      if (!completedWorlds.includes(worldId)) {
        const updatedCompleted = [...completedWorlds, worldId];
        setCompletedWorlds(updatedCompleted);

        await handleQuestionnaireSave(true);

        const nextWorld = getNextWorld(worldId);
        if (nextWorld) {
          showToast(
            `כל הכבוד! השלמת את עולם ${dict.matchmaking.worldLabels[worldId]}! 🎉`,
            'success',
            4000,
            {
              label: `המשך ל${dict.matchmaking.worldLabels[nextWorld]}`,
              onClick: () => {
                setCurrentWorld(nextWorld);
                setIsDirectNavigation(false);
              },
            }
          );
        } else {
          // All worlds completed!
          console.log(
            '%c[Complete] 🏆 ALL WORLDS COMPLETED!',
            'color: #fbbf24; font-weight: bold; font-size: 16px;'
          );
          showToast('🎊 מדהים! השלמת את כל העולמות! 🎊', 'success', 3000);
          setCurrentStep(OnboardingStep.COMPLETED);
        }
      }
    },
    [
      completedWorlds,
      handleQuestionnaireSave,
      showToast,
      dict.matchmaking.worldLabels,
    ]
  );

  // Exit handler
  const handleExit = useCallback(() => {
    console.log(
      '%c[Navigation] 🔙 Exiting to map',
      'color: #6b7280; font-weight: bold;'
    );
    setCurrentStep(OnboardingStep.MAP);
  }, []);

  // Start questionnaire handler
  const handleStartQuestionnaire = useCallback(() => {
    console.log(
      '%c[Start] 🚀 Starting questionnaire',
      'color: #14b8a6; font-weight: bold;'
    );

    // If has saved progress, go to map to choose where to continue
    if (hasSavedProgress && completedWorlds.length > 0) {
      setCurrentStep(OnboardingStep.MAP);
    } else {
      // Start fresh from first world
      setCurrentWorld('PERSONALITY');
      setCurrentStep(OnboardingStep.WORLDS);
    }
  }, [hasSavedProgress, completedWorlds.length]);

  // Render current world
  const renderCurrentWorld = useCallback(() => {
    const worldProps = {
      onAnswer: handleAnswer,
      onVisibilityChange: handleVisibilityChange,
      onComplete: () => handleWorldComplete(currentWorld),
      onBack: handleExit,
      answers: answers.filter((a) => a.worldId === currentWorld),
      isCompleted: completedWorlds.includes(currentWorld),
      currentQuestionIndex: currentQuestionIndices[currentWorld],
      setCurrentQuestionIndex: (index: number) => {
        setCurrentQuestionIndices((prev) => ({
          ...prev,
          [currentWorld]: index,
        }));
      },
      onSave: () => handleQuestionnaireSave(false),
      isSaving: isSaving,
      isDirectNavigation: isDirectNavigation,
      dict: {
        world: dict.world,
        questionCard: dict.questionCard,
        worldLabels: dict.matchmaking.worldLabels,
        answerInput: dict.answerInput,
        interactiveScale: dict.interactiveScale,
        questionsList: dict.questionsList,
        questions: dict.questions,
      },
    };

    return (
      <WorldComponent {...worldProps} worldId={currentWorld} locale={locale} />
    );
  }, [
    currentWorld,
    handleAnswer,
    handleVisibilityChange,
    handleWorldComplete,
    handleExit,
    answers,
    completedWorlds,
    currentQuestionIndices,
    handleQuestionnaireSave,
    isSaving,
    isDirectNavigation,
    dict,
    locale,
  ]);

  // World statistics and total questions
  const worldStats = useMemo(
    () => ({
      PERSONALITY: { questionCount: personalityQuestions.length },
      VALUES: { questionCount: valuesQuestions.length },
      RELATIONSHIP: { questionCount: relationshipQuestions.length },
      PARTNER: { questionCount: partnerQuestions.length },
      RELIGION: { questionCount: religionQuestions.length },
    }),
    []
  );

  // Calculate total questions across all worlds
  const totalQuestions = useMemo(
    () =>
      personalityQuestions.length +
      valuesQuestions.length +
      relationshipQuestions.length +
      partnerQuestions.length +
      religionQuestions.length,
    []
  );

  // Calculate answered questions (unique answers)
  const totalAnswered = useMemo(() => {
    const uniqueAnswers = new Set(
      answers.map((a) => `${a.worldId}-${a.questionId}`)
    );
    return uniqueAnswers.size;
  }, [answers]);

  // Calculate overall completion percentage based on answers
  const overallCompletionPercent = useMemo(
    () => Math.round((totalAnswered / totalQuestions) * 100),
    [totalAnswered, totalQuestions]
  );

  // Render current step
  const renderCurrentStep = () => {
    if (isLoading) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/30 to-slate-50"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
            <Loader2 className="relative h-16 w-16 animate-spin text-teal-600" />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl font-semibold text-gray-700"
          >
            {dict.matchmaking.loading}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex items-center gap-2 text-sm text-gray-500"
          >
            <Sparkles className="w-4 h-4" />
            <span>מכין את המסע שלך...</span>
          </motion.div>
        </motion.div>
      );
    }

    switch (currentStep) {
      case OnboardingStep.LANDING:
        return (
          <QuestionnaireLandingPage
            onStartQuestionnaire={handleStartQuestionnaire}
            hasSavedProgress={hasSavedProgress}
            isLoading={isSaving}
            dict={dict.landingPage}
            locale={locale}
          />
        );

      case OnboardingStep.MAP:
        return (
          <WorldsMap
            currentWorld={currentWorld}
            completedWorlds={completedWorlds}
            onWorldChange={handleWorldChange}
            dict={dict.worldsMap}
            locale={locale}
            answers={answers}
            worldStats={worldStats}
          />
        );

      case OnboardingStep.WORLDS:
        return (
          <QuestionnaireLayout
            currentWorld={currentWorld}
            completedWorlds={completedWorlds}
            onWorldChange={handleWorldChange}
            onExit={handleExit}
            onSaveProgress={() => handleQuestionnaireSave(false)}
            locale={locale}
            dict={{
              layout: dict.layout,
              worldLabels: dict.matchmaking.worldLabels,
              faq: dict.faq,
              accessibilityFeatures: dict.accessibilityFeatures,
            }}
          >
            {renderCurrentWorld()}
          </QuestionnaireLayout>
        );

      case OnboardingStep.COMPLETED:
        return (
          <QuestionnaireCompletion
            onSendToMatching={async () => {
              console.log(
                '%c[Complete] 🎯 Sending to matching...',
                'color: #10b981; font-weight: bold;'
              );
              if (onComplete) onComplete();
              else router.push('/dashboard');
            }}
            isLoading={isSaving}
            isLoggedIn={!!userId}
            dict={dict.completion}
          />
        );

      default:
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Alert variant="destructive" className="max-w-md">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {dict.matchmaking.errors.stageLoadError}
              </AlertDescription>
            </Alert>
          </div>
        );
    }
  };

  // Enhanced Toast Component
  const Toast = ({
    message,
    type,
    isVisible,
    action,
  }: {
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
    action?: { label: string; onClick: () => void };
  }) => {
    if (!isVisible) return null;

    const typeConfig = {
      success: {
        bg: 'from-green-500 to-emerald-600',
        icon: CheckCircle,
        border: 'border-green-400',
      },
      error: {
        bg: 'from-red-500 to-rose-600',
        icon: XCircle,
        border: 'border-red-400',
      },
      info: {
        bg: 'from-blue-500 to-cyan-600',
        icon: Info,
        border: 'border-blue-400',
      },
      warning: {
        bg: 'from-amber-500 to-orange-600',
        icon: AlertCircle,
        border: 'border-amber-400',
      },
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className={cn(
            'fixed bottom-6 right-6 z-[100] max-w-md backdrop-blur-xl',
            'rounded-2xl shadow-2xl border-2',
            config.border
          )}
        >
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl bg-gradient-to-r p-5',
              config.bg
            )}
          >
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-white font-semibold leading-relaxed">
                  {message}
                </p>
              </div>
              {action && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    action.onClick();
                    setToastState((prev) => ({ ...prev, isVisible: false }));
                  }}
                  className="text-white hover:bg-white/20 font-bold border-2 border-white/40 rounded-xl flex-shrink-0"
                >
                  {action.label}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Enhanced Idle Modal Component
  const IdleModal = () => {
    if (!showIdleModal) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Card className="max-w-md w-full shadow-2xl border-2 border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-800">
                    {dict.matchmaking.idleModal.title}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    {dict.matchmaking.idleModal.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full sm:w-auto border-2 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {dict.matchmaking.idleModal.logoutButton}
                  </Button>
                  <Button
                    onClick={handleStayActive}
                    className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600 text-white font-bold"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {dict.matchmaking.idleModal.stayActiveButton}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Last Saved Indicator
  const LastSavedIndicator = () => {
    if (!lastSavedTime || currentStep !== OnboardingStep.WORLDS || !userId)
      return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 left-6 z-40 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border-2 border-green-200"
      >
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-gray-700">
            {dict.matchmaking.lastSaved.replace(
              '{{time}}',
              lastSavedTime.toLocaleTimeString('he-IL', {
                hour: '2-digit',
                minute: '2-digit',
              })
            )}
          </span>
        </div>
      </motion.div>
    );
  };

  // Error Alert
  const ErrorAlert = () => {
    if (!error || currentStep === OnboardingStep.WORLDS) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto m-6"
      >
        <Alert
          variant="destructive"
          className="border-2 border-red-300 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <AlertDescription className="text-base leading-relaxed">
              {error}
            </AlertDescription>
          </div>
        </Alert>
      </motion.div>
    );
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50',
        locale === 'he' ? 'dir-rtl' : 'dir-ltr'
      )}
    >
      {/* Modals and Overlays */}
      <IdleModal />

      {/* Indicators */}
      <LastSavedIndicator />

      {/* Error Display */}
      <ErrorAlert />

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentStep()}
        </motion.div>
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toast
        message={toastState.message}
        type={toastState.type}
        isVisible={toastState.isVisible}
        action={toastState.action}
      />
    </div>
  );
}