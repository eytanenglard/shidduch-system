// src/app/components/suggestions/dialogs/UserAiAnalysisDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Sparkles,
  AlertTriangle,
  Bot,
  Brain,
  Heart,
  Users,
  Target,
  ArrowLeft,
  Download,
  Share2,
  Bookmark,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import UserAiAnalysisDisplay from '../compatibility/UserAiAnalysisDisplay';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';

interface UserAiAnalysisDialogProps {
  suggestedUserId: string;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  currentUserName?: string;
  suggestedUserName?: string;
}

// 1. הגדרת אובייקט דמו חדש שתואם לטיפוס הנכון
const mockAnalysisResult: AiSuggestionAnalysisResult = {
  overallScore: 82,
  matchTitle: 'חיבור של יצירתיות ושאיפה',
  matchSummary:
    'ניתוח זה מציג התאמה טובה עם בסיס חזק בתחומי הערכים והשאיפות האישיות. יש פוטנציאל לקשר משמעותי, תוך תשומת לב להבדלים קלים בסגנון החיים שידרשו תקשורת פתוחה.',
  compatibilityPoints: [
    {
      area: 'ראיית עולם ערכית',
      explanation:
        'שניכם רואים בזוגיות שותפות מלאה ובבית מרכז של צמיחה, כבוד ואהבה. ישנה תפיסה דומה לגבי מהות הקשר והמטרות המשותפות.',
    },
    {
      area: 'פתיחות ורצון לצמוח',
      explanation: 'ישנה נכונות הדדית למסע משותף של גדילה.',
    },
    {
      area: 'אינטליגנציה רגשית',
      explanation:
        'הדגש על "שיחות עומק" והיכולת לשלב בין עולם אנליטי לרגשי מעידים על פוטנציאל גבוה להבנה הדדית.',
    },
  ],
  pointsToConsider: [
    {
      area: 'שמירת נגיעה',
      explanation:
        'ישנו הבדל בגישה לשמירת נגיעה. זוהי נקודה מהותית הדורשת שיחה פתוחה ומכבדת.',
    },
    {
      area: 'מיקוד בקריירה',
      explanation:
        'שניכם נמצאים בשלבים חשובים בקריירה שלהם. חשוב לוודא שהשאיפות המקצועיות תומכות זו בזו.',
    },
  ],
  suggestedConversationStarters: [
    'מהו הערך שהכי חשוב לך להנחיל בבית שתקים/י, ומדוע?',
    'ספרו על חוויה מעצבת שתרמה למי שאתם היום.',
    'איך הייתם מתארים את האיזון האידיאלי בין "אני", "את/ה" ו"אנחנו" בזוגיות?',
  ],
};

export const UserAiAnalysisDialog: React.FC<UserAiAnalysisDialogProps> = ({
  suggestedUserId,
  isDemo = false,
  demoAnalysisData = null,
  currentUserName = 'המועמד הנוכחי',
  suggestedUserName = 'המועמד המוצע',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<AiSuggestionAnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    { icon: Brain, label: 'מעבד פרופילים' },
    { icon: Heart, label: 'בוחן ערכים' },
    { icon: Users, label: 'מודד תאימות' },
    { icon: Target, label: 'מציע תובנות' },
    { icon: Sparkles, label: 'מסיים ניתוח' },
  ];

  useEffect(() => {
    if (isLoading && isDemo) {
      const timer = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = prev + 2;
          const newStep = Math.floor(newProgress / 20);
          if (newStep !== currentStep && newStep < loadingSteps.length) {
            setCurrentStep(newStep);
          }
          return Math.min(newProgress, 100);
        });
      }, 100);

      return () => clearInterval(timer);
    }
  }, [isLoading, isDemo, currentStep, loadingSteps.length]);

  const handleGetAnalysis = async () => {
    if (analysis && !isDemo) {
      setIsOpen(true);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    setCurrentStep(0);

    if (isDemo) {
      setTimeout(() => {
        // 2. שימוש באובייקט הדמו הנכון או בנתונים שהועברו
        setAnalysis(demoAnalysisData || mockAnalysisResult);
        setIsLoading(false);
      }, 5000);
      return;
    }

    try {
      const response = await fetch('/api/ai/analyze-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestedUserId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'שגיאה בקבלת ניתוח ההצעה.');
      }

      setAnalysis(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'אירעה שגיאה לא צפויה.';
      setError(errorMessage);
      toast.error('שגיאה בתהליך הניתוח', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setError(null);
      setLoadingProgress(0);
      setCurrentStep(0);
      if (isDemo) {
        setAnalysis(null);
      }
    }
  };

  const renderLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 sm:space-y-8 p-4 sm:p-8">
      <div className="relative">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 animate-pulse border-2 sm:border-4 border-white shadow-xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-20 animate-ping"></div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          מנתח התאמה עמוקה...
        </h3>
        <p className="text-gray-600 max-w-sm sm:max-w-md text-sm sm:text-lg px-2">
          אנו בוחנים עשרות פרמטרים כדי לספק לך תמונה מקיפה ומדויקת
        </p>
      </div>
      <div className="w-full max-w-sm sm:max-w-md space-y-3 sm:space-y-4">
        <Progress
          value={loadingProgress}
          className="h-2 sm:h-3 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-purple-500 [&>div]:to-pink-500 [&>div]:transition-all [&>div]:duration-500"
        />
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          {loadingProgress}% הושלם
        </p>
      </div>
      {currentStep < loadingSteps.length && (
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl shadow-lg border border-gray-100 max-w-sm sm:max-w-none"
        >
          <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg flex-shrink-0">
            {React.createElement(loadingSteps[currentStep].icon, {
              className: 'w-4 h-4 sm:w-5 sm:h-5',
            })}
          </div>
          <div className="text-right min-w-0 flex-1">
            <p className="font-semibold text-gray-800 text-sm sm:text-base">
              {loadingSteps[currentStep].label}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderErrorScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 sm:space-y-6 p-4 sm:p-8">
      <div className="p-4 sm:p-6 rounded-full bg-gradient-to-br from-red-50 to-pink-50 border-2 sm:border-4 border-white shadow-xl">
        <AlertTriangle className="h-10 w-10 sm:h-16 sm:w-16 text-red-500" />
      </div>
      <div className="space-y-3 sm:space-y-4 max-w-sm sm:max-w-none">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
          משהו השתבש בדרך...
        </h3>
        <Alert
          variant="destructive"
          className="border-red-200 bg-red-50/50 backdrop-blur-sm text-right"
        >
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          <AlertTitle className="text-red-800 font-semibold text-sm sm:text-base">
            לא הצלחנו להשלים את הניתוח
          </AlertTitle>
          <AlertDescription className="text-red-700 mt-2 text-xs sm:text-sm">
            <p>אנו מתנצלים על התקלה. אנא נסו שוב או פנו לתמיכה.</p>
            {error && (
              <p className="text-xs mt-2 opacity-80 font-mono bg-red-100 p-2 rounded break-words">
                {error}
              </p>
            )}
          </AlertDescription>
        </Alert>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          onClick={handleGetAnalysis}
          variant="default"
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
        >
          <Brain className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
          נסה שוב
        </Button>
        <Button
          onClick={() => setIsOpen(false)}
          variant="outline"
          size="sm"
          className="border-gray-300 hover:bg-gray-50 text-sm"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
          חזור
        </Button>
      </div>
    </div>
  );

  // 3. פישוט דרמטי של תצוגת התוכן
  const renderAnalysisContent = () => {
    if (!analysis) return null;
    return (
      <div className="px-4 sm:px-6 py-6">
        <UserAiAnalysisDisplay analysis={analysis} />
      </div>
    );
  };

  const renderActionButtons = () => (
    <div className="flex flex-wrap gap-3 p-6 bg-gray-50/80 backdrop-blur-sm border-t border-gray-200 rounded-b-3xl">
      <Button
        variant="default"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Download className="w-4 h-4 ml-2" />
        ייצא לPDF
      </Button>

      <Button
        variant="outline"
        className="border-gray-300 hover:bg-white hover:shadow-md transition-all duration-200"
      >
        <Share2 className="w-4 h-4 ml-2" />
        שתף עם שדכן
      </Button>

      <Button
        variant="outline"
        className="border-gray-300 hover:bg-white hover:shadow-md transition-all duration-200"
      >
        <Bookmark className="w-4 h-4 ml-2" />
        שמור בפרופיל
      </Button>

      <div className="mr-auto">
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          סגור
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={handleGetAnalysis}
          variant="outline"
          size="lg"
          className="relative overflow-hidden group bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 text-blue-700 hover:from-blue-100 hover:via-purple-100 hover:to-pink-100 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl sm:rounded-2xl px-4 sm:px-8 py-3 sm:py-4 font-semibold text-sm sm:text-lg"
          disabled={isLoading}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover:animate-shimmer"></div>
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 animate-spin text-blue-600" />
            ) : (
              <div className="relative">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 text-blue-600" />
                <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )}
            <span className="text-sm sm:text-lg font-bold">
              {isLoading ? (
                'מכין ניתוח חכם...'
              ) : (
                <>
                  <span className="hidden sm:inline">ניתוח התאמה מבוסס AI</span>
                  <span className="sm:hidden">ניתוח AI</span>
                </>
              )}
            </span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-6xl w-[95vw] sm:w-[90vw] h-[95vh] sm:h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-lg"
        dir="rtl"
      >
        <DialogHeader className="p-4 sm:p-8 border-b border-blue-100 bg-white/90 backdrop-blur-sm rounded-t-2xl sm:rounded-t-3xl">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-xl sm:text-3xl font-bold text-gray-800">
            <div className="p-3 sm:p-4 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block">
                ניתוח התאמה חכם
              </span>
              <div className="text-xs sm:text-sm font-normal text-gray-600 mt-1">
                {currentUserName} ⟵ {suggestedUserName}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-lg text-gray-600 mt-2 sm:mt-3">
            ניתוח מקיף ומקצועי של רמת ההתאמה, נקודות החוזק והאתגרים הפוטנציאליים
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto">
          {' '}
          {isLoading ? (
            renderLoadingScreen()
          ) : error ? (
            renderErrorScreen()
          ) : analysis ? (
            renderAnalysisContent()
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto">
                  <Brain className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-gray-600 font-medium text-lg">
                  מכין את הניתוח החכם...
                </p>
              </div>
            </div>
          )}
        </div>
        {analysis && !isLoading && !error && renderActionButtons()}
      </DialogContent>
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .group:hover .animate-shimmer {
          animation-duration: 1.5s;
        }
      `}</style>
    </Dialog>
  );
};
