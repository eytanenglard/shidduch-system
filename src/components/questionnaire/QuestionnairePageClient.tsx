// src/components/questionnaire/QuestionnairePageClient.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QuestionnaireLandingPage from './pages/QuestionnaireLandingPage';
import MatchmakingQuestionnaire from './MatchmakingQuestionnaire';
import StandardizedLoadingSpinner from './common/StandardizedLoadingSpinner'; // <-- שלב 1: הוספת הייבוא
import type { WorldId } from './types/types';
import type { QuestionnaireDictionary } from '@/types/dictionary';

// Enum to track questionnaire flow stages
enum QuestionnaireStage {
  LANDING = 'LANDING',
  QUESTIONNAIRE = 'QUESTIONNAIRE',
  COMPLETE = 'COMPLETE',
}

// הגדרת Props לרכיב
interface QuestionnairePageClientProps {
  dict: QuestionnaireDictionary;
  locale: 'he' | 'en';
}

export default function QuestionnairePageClient({
  dict,
  locale,
}: QuestionnairePageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();

  // State for tracking current stage in the flow
  const [currentStage, setCurrentStage] = useState<QuestionnaireStage>(
    QuestionnaireStage.LANDING
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [initialWorld, setInitialWorld] = useState<WorldId | undefined>(
    undefined
  );
  const [initialQuestionId, setInitialQuestionId] = useState<
    string | undefined
  >(undefined);

  // Check for existing progress when component mounts
  useEffect(() => {
    const checkExistingProgress = async () => {
      if (status === 'loading') return;
      setIsLoading(true);
      try {
        if (session?.user?.id) {
          const response = await fetch('/api/questionnaire');
          const data = await response.json();
          if (data.success && data.data) {
            setHasSavedProgress(true);
          }
        }
      } catch (err) {
        console.error('Error checking questionnaire progress:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkExistingProgress();
  }, [session, status]);

  // Check for world parameter in URL and normalize it
  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    const worldParam = searchParams?.get('world');
    const questionParam = searchParams?.get('question');

    if (worldParam) {
      const worldParamUpper = worldParam.toUpperCase() as WorldId;
      const validWorlds: WorldId[] = [
        'PERSONALITY',
        'VALUES',
        'RELATIONSHIP',
        'PARTNER',
        'RELIGION',
      ];
      if (validWorlds.includes(worldParamUpper)) {
        setInitialWorld(worldParamUpper);
        if (questionParam) {
          setInitialQuestionId(questionParam);
        }
        setCurrentStage(QuestionnaireStage.QUESTIONNAIRE);
      } else {
        console.warn(
          `[QuestionnairePage] Invalid world param received in URL: ${worldParam}`
        );
      }
    }
  }, [searchParams, status]);

  const handleStartQuestionnaire = () => {
    setCurrentStage(QuestionnaireStage.QUESTIONNAIRE);
  };

  const handleQuestionnaireComplete = async () => {
    try {
      await router.push('/questionnaire/complete');
      setCurrentStage(QuestionnaireStage.COMPLETE);
    } catch (err) {
      console.error('Error completing questionnaire:', err);
      setError(dict.page.completionError); // שימוש במילון
    }
  };

  // --- שלב 2: החלפת רכיב הטעינה ---
  if (isLoading) {
    return (
      <StandardizedLoadingSpinner
        text={dict.page.loading}
        subtext={
          dict.matchmaking.loadingSubtext || 'רק רגע, מכינים לך את המסע...'
        }
      />
    );
  }

  const renderCurrentStage = () => {
    switch (currentStage) {
      case QuestionnaireStage.LANDING:
        return (
          <QuestionnaireLandingPage
            onStartQuestionnaire={handleStartQuestionnaire}
            hasSavedProgress={hasSavedProgress}
            dict={dict.landingPage}
            locale={locale}
          />
        );
      case QuestionnaireStage.QUESTIONNAIRE:
        return (
          <MatchmakingQuestionnaire
            userId={session?.user?.id}
            onComplete={handleQuestionnaireComplete}
            initialWorld={initialWorld}
            initialQuestionId={initialQuestionId}
            dict={dict}
            locale={locale}
          />
        );
      case QuestionnaireStage.COMPLETE:
        return null;
      default:
        return <div>{dict.page.stageLoadError}</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="container mx-auto p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {renderCurrentStage()}
    </div>
  );
}
