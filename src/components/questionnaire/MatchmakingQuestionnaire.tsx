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
import QuestionnaireLayout from './layout/QuestionnaireLayout';
import Welcome from './onboarding/Welcome';
import WorldComponent from './worlds/WorldComponent';
import QuestionnaireCompletion from './common/QuestionnaireCompletion';
import { useLanguage } from '@/app/contexts/LanguageContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import WorldsMap from './layout/WorldsMap';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { signOut } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  LogOut,
} from 'lucide-react';
import type {
  WorldId,
  QuestionnaireSubmission,
  QuestionnaireAnswer,
  AnswerValue,
  Question,
} from './types/types';

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

const worldLabels = {
  PERSONALITY: 'אישיות',
  VALUES: 'ערכים ואמונות',
  RELATIONSHIP: 'זוגיות',
  PARTNER: 'פרטנר',
  RELIGION: 'דת ומסורת',
} as const;

enum OnboardingStep {
  WELCOME = 'WELCOME',
  WORLDS = 'WORLDS',
  COMPLETED = 'COMPLETED',
  MAP = 'MAP',
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
}

export default function MatchmakingQuestionnaire({
  userId,
  onComplete,
  initialWorld,
  initialQuestionId,
}: MatchmakingQuestionnaireProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const sessionId = useMemo(() => `session_${Date.now()}`, []);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.WELCOME
  );
  const [currentWorld, setCurrentWorld] = useState<WorldId>(
    initialWorld || 'VALUES'
  );
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [completedWorlds, setCompletedWorlds] = useState<WorldId[]>([]);
  const [startTime] = useState(() => new Date().toISOString());
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // דגל שיורה לקומפוננטת הבת לדלג על מסך הפתיחה
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

  const [toastState, setToastState] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
    action?: { label: string; onClick: () => void };
  }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const [showIdleModal, setShowIdleModal] = useState(false);
  const logoutTimer = useRef<NodeJS.Timeout>();

  const handleIdle = useCallback(() => {
    if (userId) {
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
  }, [resetIdleTimer]);

  useEffect(() => {
    if (initialWorld) {
      setCurrentWorld(initialWorld);
    }
  }, [initialWorld]);

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      duration: number = 3000,
      action?: { label: string; onClick: () => void }
    ) => {
      setToastState({ message, type, isVisible: true, action });
      if (!action) {
        setTimeout(() => {
          setToastState((prev) => ({ ...prev, isVisible: false }));
        }, duration);
      }
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
    };
  }, [answers, completedWorlds, sessionId, startTime, userId]);

  const handleQuestionnaireSave = useCallback(
    async (isAutoSave = false) => {
      if (isSaving && !isAutoSave) return;

      setIsSaving(true);
      setError(null);

      try {
        const submissionData = prepareSubmissionData();
        const validateSubmission = (data: QuestionnaireSubmission): boolean => {
          if (!data.userId) return false;
          if (!Array.isArray(data.worldsCompleted)) return false;
          if (typeof data.completed !== 'boolean') return false;
          if (!data.startedAt) return false;
          if (data.completed && !data.completedAt) return false;
          return true;
        };

        if (!validateSubmission(submissionData)) {
          throw new Error('Invalid submission data');
        }

        if (!userId) {
          localStorage.setItem(
            'tempQuestionnaire',
            JSON.stringify(submissionData)
          );
          if (currentStep === OnboardingStep.COMPLETED) {
            router.push('/auth/signin?callbackUrl=/questionnaire/restore');
          }
        } else {
          const response = await fetch('/api/questionnaire', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save questionnaire');
          }
        }

        setLastSavedTime(new Date());
        setIsDirty(false);
        setToastState((prev) => ({ ...prev, isVisible: false }));

        if (!isAutoSave) {
          showToast('השאלון נשמר בהצלחה', 'success');
        }

        if (
          submissionData.completed &&
          currentStep === OnboardingStep.COMPLETED
        ) {
          if (onComplete) onComplete();
        }
      } catch (err) {
        console.error('Failed to save questionnaire:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'אירעה שגיאה בשמירת השאלון.';
        setError(errorMessage);
        if (!isAutoSave) {
          showToast(errorMessage, 'error');
        } else {
          showToast('שגיאה בשמירה אוטומטית', 'error');
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
      currentStep,
    ]
  );

  useEffect(() => {
    let autoSaveInterval: NodeJS.Timeout;
    if (currentStep === OnboardingStep.WORLDS && userId) {
      autoSaveInterval = setInterval(() => {
        if (isDirty) {
          showToast('יש לך שינויים שלא נשמרו.', 'info', 10000, {
            label: 'שמור עכשיו',
            onClick: () => handleQuestionnaireSave(false),
          });
        }
      }, 180000);
    }
    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [currentStep, userId, isDirty, handleQuestionnaireSave, showToast]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    const loadExistingAnswers = async () => {
      if (!userId) {
        setIsLoading(false);
        const tempData = localStorage.getItem('tempQuestionnaire');
        if (tempData) {
          console.warn(
            'Found temp data but user ID is missing. This should be handled by /questionnaire/restore.'
          );
        }
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/questionnaire');
        if (!response.ok) {
          if (response.status === 404) {
            console.log('No existing questionnaire data found for user.');
            setCurrentStep(OnboardingStep.WELCOME);
          } else {
            const errorData = await response.json();
            throw new Error(
              errorData.error || 'Failed to load existing answers'
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

            const isQuestionnaireComplete =
              data.data.completed ||
              loadedCompletedWorlds.length === WORLD_ORDER.length;

            if (data.data.currentQuestionIndices) {
              setCurrentQuestionIndices(data.data.currentQuestionIndices);
            }

            if (initialWorld && initialQuestionId) {
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
                setIsDirectNavigation(true); // הפעלת הדגל
              } else {
                setCurrentWorld(initialWorld);
                setCurrentStep(OnboardingStep.MAP);
              }
            } else if (isQuestionnaireComplete) {
              if (initialWorld && WORLD_ORDER.includes(initialWorld)) {
                setCurrentWorld(initialWorld);
                setCurrentStep(OnboardingStep.WORLDS);
              } else {
                setCurrentWorld(WORLD_ORDER[0]);
                setCurrentStep(OnboardingStep.MAP);
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
          } else {
            console.log('Questionnaire data structure invalid or missing.');
            setCurrentStep(OnboardingStep.WELCOME);
          }
        }
      } catch (err) {
        console.error('Failed to load existing answers:', err);
        setError('אירעה שגיאה בטעינת התשובות הקיימות');
        setCurrentStep(OnboardingStep.WELCOME);
      } finally {
        setIsLoading(false);
      }
    };
    loadExistingAnswers();
  }, [userId, initialWorld, initialQuestionId]);

  const handleAnswer = useCallback(
    (questionId: string, value: AnswerValue) => {
      setError(null);
      setIsDirty(true);
      setAnswers((prevAnswers) => {
        const answerIndex = prevAnswers.findIndex(
          (a) => a.questionId === questionId
        );

        if (answerIndex > -1) {
          return prevAnswers.map((answer) => {
            if (answer.questionId === questionId) {
              return {
                ...answer,
                value,
                answeredAt: new Date().toISOString(),
              };
            }
            return answer;
          });
        } else {
          const newAnswer: QuestionnaireAnswer = {
            questionId,
            worldId: currentWorld,
            value,
            answeredAt: new Date().toISOString(),
            isVisible: true,
          };
          return [...prevAnswers, newAnswer];
        }
      });
    },
    [currentWorld]
  );

  const handleVisibilityChange = useCallback(
    (questionId: string, isVisible: boolean) => {
      setIsDirty(true);
      setAnswers((prevAnswers) => {
        const answerIndex = prevAnswers.findIndex(
          (a) => a.questionId === questionId
        );
        if (answerIndex > -1) {
          return prevAnswers.map((answer) => {
            if (answer.questionId === questionId) {
              return { ...answer, isVisible };
            }
            return answer;
          });
        } else {
          const newPlaceholderAnswer: QuestionnaireAnswer = {
            questionId,
            worldId: currentWorld,
            value: undefined,
            answeredAt: new Date().toISOString(),
            isVisible: isVisible,
          };
          return [...prevAnswers, newPlaceholderAnswer];
        }
      });

      showToast(
        isVisible ? 'התשובה תוצג בפרופיל' : 'התשובה תוסתר מהפרופיל',
        'info',
        2000
      );
    },
    [showToast, currentWorld]
  );

  const handleWorldChange = useCallback((newWorld: WorldId) => {
    setCurrentWorld(newWorld);
    setCurrentStep(OnboardingStep.WORLDS);
    setError(null);
    setIsDirectNavigation(false); // איפוס הדגל במעבר ידני
  }, []);

  const handleWorldComplete = useCallback(
    async (worldId: WorldId) => {
      let updatedCompletedWorlds = completedWorlds;
      if (!completedWorlds.includes(worldId)) {
        updatedCompletedWorlds = [...completedWorlds, worldId];
        setCompletedWorlds(updatedCompletedWorlds);
      }

      showToast(
        `כל הכבוד! סיימת את עולם ה${worldLabels[worldId] ?? worldId.toLowerCase()}`,
        'success'
      );

      const isQuestionnaireNowFullyCompleted =
        updatedCompletedWorlds.length === WORLD_ORDER.length;
      const submissionDataForWorldComplete = {
        ...prepareSubmissionData(),
        worldsCompleted: updatedCompletedWorlds,
        completed: isQuestionnaireNowFullyCompleted,
        completedAt: isQuestionnaireNowFullyCompleted
          ? new Date().toISOString()
          : undefined,
      };

      if (userId) {
        try {
          setIsSaving(true);
          const response = await fetch('/api/questionnaire', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionDataForWorldComplete),
          });
          if (!response.ok)
            throw new Error('Failed to save after world completion');
          setLastSavedTime(new Date());
          setIsDirty(false);
          showToast('התקדמות העולם נשמרה', 'success');
        } catch (e) {
          console.error('Error saving after world complete:', e);
          showToast('שגיאה בשמירת התקדמות העולם', 'error');
          setError('שגיאה בשמירת התקדמות העולם.');
          setIsSaving(false);
          return;
        } finally {
          setIsSaving(false);
        }
      } else {
        localStorage.setItem(
          'tempQuestionnaire',
          JSON.stringify(submissionDataForWorldComplete)
        );
        setLastSavedTime(new Date());
        showToast('התקדמות העולם נשמרה בדפדפן', 'info');
      }

      if (isQuestionnaireNowFullyCompleted) {
        if (!userId) {
          router.push('/auth/signin?callbackUrl=/questionnaire/restore');
        } else {
          setCurrentStep(OnboardingStep.COMPLETED);
          if (onComplete) onComplete();
        }
      } else {
        const nextWorld = getNextWorld(worldId);
        if (nextWorld) {
          setCurrentWorld(nextWorld);
          setCurrentStep(OnboardingStep.MAP);
        } else {
          setCurrentStep(OnboardingStep.MAP);
        }
      }
    },
    [
      completedWorlds,
      showToast,
      userId,
      prepareSubmissionData,
      router,
      onComplete,
    ]
  );

  const handleExit = useCallback(() => {
    setCurrentStep(OnboardingStep.MAP);
  }, []);

  function renderCurrentWorld() {
    const worldProps = {
      onAnswer: handleAnswer,
      onVisibilityChange: handleVisibilityChange,
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
      onSave: () => handleQuestionnaireSave(false),
      isSaving: isSaving,
      isDirectNavigation: isDirectNavigation, // העברת הדגל
    };

    return <WorldComponent {...worldProps} worldId={currentWorld} />;
  }

  interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
    action?: { label: string; onClick: () => void };
  }

  function renderCurrentStep() {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
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
            onStart={() => setCurrentStep(OnboardingStep.MAP)}
            onLearnMore={() => router.push('/profile')}
            isLoggedIn={!!userId}
            hasSavedProgress={answers.length > 0 || completedWorlds.length > 0}
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
            language={language}
            isLoggedIn={!!userId}
          >
            {renderCurrentWorld()}
          </QuestionnaireLayout>
        );
      case OnboardingStep.COMPLETED:
        return (
          <QuestionnaireCompletion
            onSendToMatching={async () => {
              if (onComplete) onComplete();
              else router.push('/dashboard');
            }}
            isLoading={isSaving}
            isLoggedIn={!!userId}
          />
        );
      default:
        return <div>שגיאה בטעינת השלב</div>;
    }
  }

  const Toast = ({ message, type, isVisible, action }: ToastProps) => {
    if (!isVisible) return null;
    return (
      <div
        className={cn(
          'fixed bottom-4 right-4 z-[100] p-4 rounded-lg shadow-lg max-w-md transition-all duration-300',
          type === 'success' && 'bg-green-500',
          type === 'error' && 'bg-red-500',
          type === 'info' && 'bg-blue-500',
          'text-white'
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : type === 'error' ? (
              <XCircle className="h-5 w-5 mr-2" />
            ) : (
              <Info className="h-5 w-5 mr-2" />
            )}
            <p>{message}</p>
          </div>
          {action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                action.onClick();
                setToastState((prev) => ({ ...prev, isVisible: false }));
              }}
              className="mr-4 text-white hover:bg-white/20 font-bold"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const IdleModal = () => {
    if (!showIdleModal) return null;
    return (
      <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-6 h-6 mr-3 text-blue-500" />
              האם אתה עדיין כאן?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              לא זיהינו פעילות בחשבונך. למען אבטחת המידע, תתבצע יציאה אוטומטית
              מהמערכת בעוד כדקה.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                צא מהמערכת
              </Button>
              <Button onClick={handleStayActive}>אני עדיין כאן</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-gray-50',
        language === 'he' ? 'dir-rtl' : 'dir-ltr'
      )}
    >
      <IdleModal />
      {lastSavedTime && currentStep === OnboardingStep.WORLDS && userId && (
        <div className="fixed bottom-4 left-4 z-40 bg-white p-2 rounded-lg shadow-md text-xs text-gray-600 border">
          <div className="flex items-center">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 mr-1" />
            <span>נשמר לאחרונה: {lastSavedTime.toLocaleTimeString()}</span>
          </div>
        </div>
      )}
      {error && currentStep !== OnboardingStep.WORLDS && (
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
        action={toastState.action}
      />
    </div>
  );
}
