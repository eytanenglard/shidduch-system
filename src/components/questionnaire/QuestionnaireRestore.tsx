'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { QuestionnaireRestoreDict } from '@/types/dictionary'; // Import dictionary type
import StandardizedLoadingSpinner from './common/StandardizedLoadingSpinner';

// --- Props Interface ---
interface QuestionnaireRestoreProps {
  dict: QuestionnaireRestoreDict;
}

export default function QuestionnaireRestore({
  dict,
}: QuestionnaireRestoreProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restoreQuestionnaire = async () => {
      if (isProcessing) return;

      try {
        setIsProcessing(true);
        setError(null);

        const savedData = localStorage.getItem('tempQuestionnaire');

        if (!savedData || !session?.user?.id) {
          router.push('/dashboard');
          return;
        }

        const questionnaireData = JSON.parse(savedData);
        questionnaireData.userId = session.user.id;

        const response = await fetch('/api/questionnaire', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questionnaireData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // Developer-facing error can remain in English
          throw new Error(errorData.message || 'Failed to save questionnaire');
        }

        localStorage.removeItem('tempQuestionnaire');
        router.push(
          questionnaireData.completed ? '/dashboard' : '/questionnaire'
        );
      } catch (err) {
        console.error('Error restoring questionnaire:', err);
        // Set user-facing error from the dictionary
        setError(dict.error);
      } finally {
        setIsProcessing(false);
      }
    };

    if (session?.user && !isProcessing && status === 'authenticated') {
      restoreQuestionnaire();
    }
  }, [session, router, isProcessing, status, dict.error]);

  if (status === 'loading') {
    return (
      <StandardizedLoadingSpinner
        text={dict.loading}
        subtext="מאמתים את החיבור שלך..."
      />
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => router.push('/questionnaire')}>
            {dict.backButton}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StandardizedLoadingSpinner
      text={dict.restoringTitle}
      subtext={dict.restoringSubtitle}
    />
  );
}
