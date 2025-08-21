// src/components/questionnaire/common/QuestionnaireCompletion.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Send, CheckCircle2, BookUser, Loader2 } from 'lucide-react';
import type { QuestionnaireCompletionDict } from '@/types/dictionary'; // ייבוא טיפוס המילון

interface QuestionnaireCompletionProps {
  onSendToMatching: () => void;
  isLoading?: boolean;
  isLoggedIn?: boolean;
  dict: QuestionnaireCompletionDict; // קבלת המילון כ-prop
}

const QuestionnaireCompletion: React.FC<QuestionnaireCompletionProps> = ({
  onSendToMatching,
  isLoading = false,
  isLoggedIn = false,
  dict, // שימוש במשתנה dict
}) => {
  return (
    <div className="max-w-xl mx-auto p-4">
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">{dict.title}</CardTitle>
          <CardDescription className="text-center">
            {isLoggedIn ? dict.loggedInDescription : dict.guestDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoggedIn ? (
            <>
              <div className="text-center text-gray-600">
                <p>{dict.loggedInContent.prompt}</p>
                <p className="text-sm mt-2">
                  {dict.loggedInContent.promptSubtitle}
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={onSendToMatching}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 ml-2" />
                  )}
                  {isLoading
                    ? dict.loggedInContent.sendingButton
                    : dict.loggedInContent.sendButton}
                </Button>
                <Link href="/profile?tab=questionnaire" className="block">
                  <Button
                    variant="outline"
                    className="w-full bg-white/70"
                    size="lg"
                    disabled={isLoading}
                  >
                    <BookUser className="w-5 h-5 ml-2 text-blue-600" />
                    {dict.loggedInContent.reviewButton}
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <Button className="w-full" size="lg" onClick={onSendToMatching}>
              {dict.guestContent.loginButton}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionnaireCompletion;
