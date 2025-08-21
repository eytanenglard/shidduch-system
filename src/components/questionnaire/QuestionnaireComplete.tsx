'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import type { QuestionnaireCompletePageDict } from '@/types/dictionary'; // Import dictionary type

// --- Props Interface ---
interface QuestionnaireCompleteProps {
  dict: QuestionnaireCompletePageDict;
}

export default function QuestionnaireComplete({
  dict,
}: QuestionnaireCompleteProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center">{dict.loading}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-xl mx-auto bg-green-50 border-green-200">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">{dict.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="text-center text-gray-600 space-y-2">
            <p>{dict.successMessage1}</p>
            <p>{dict.successMessage2}</p>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription>{dict.profilePrompt}</AlertDescription>
          </Alert>

          <div className="flex justify-center pt-4">
            <Button
              onClick={() => router.push('/profile')}
              className="flex items-center"
            >
              {dict.continueButton}
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
