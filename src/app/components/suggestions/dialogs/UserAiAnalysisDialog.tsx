// File: src/app/components/suggestions/dialogs/UserAiAnalysisDialog.tsx
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
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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
  CheckCircle,
  Info,
  MessageSquare,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';

// --- Interfaces ---
interface UserAiAnalysisDialogProps {
  suggestedUserId: string;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  currentUserName?: string;
  suggestedUserName?: string;
}

// --- Demo Data ---
const mockAnalysisResult: AiSuggestionAnalysisResult = {
  overallScore: 91,
  matchTitle: 'שילוב של שאפתנות ועומק רגשי',
  matchSummary:
    'החיבור בין דניאל לנועה מציג פוטנציאל גבוה ליצירת זוגיות יציבה וצומחת. השילוב בין האופי המעשי והשאפתני של דניאל לבין העומק הרגשי והיצירתיות של נועה יוצר בסיס מעניין לשותפות ארוכת טווח, המבוססת על ערכים משותפים וכבוד הדדי.',
  compatibilityPoints: [
    {
      area: 'ערכים משותפים וראיית עולם',
      explanation:
        'שניכם רואים בזוגיות שותפות אמת ובמשפחה ערך עליון. הרצון של נועה ב"טוב לב" והרצון של דניאל ב"שותפות" מתחברים באופן מושלם לבסיס של קשר בריא.',
    },
    {
      area: 'התאמה אינטלקטואלית ורגשית',
      explanation:
        'הרצון של נועה ב"שיחות עומק" והחיפוש אחר אינטליגנציה וסקרנות תואמים את אופיו האנליטי והלמדני של דניאל. יש פוטנציאל לחיבור אינטלקטואלי מרתק.',
    },
    {
      area: 'יציבות ואמינות',
      explanation:
        'הדגש של דניאל על יושרה ואחריות, והיותו "אדם של עשייה", עונים על הצורך בביטחון ויציבות שחשובים בבניית קשר רציני.',
    },
    {
      area: 'סגנון חיים מאוזן',
      explanation:
        'שניכם מעריכים איזון בין פעילות למנוחה, ובין בילויים בחוץ לזמן איכות שקט. האהבה המשותפת לטיולים בטבע יכולה להוות מקור לחוויות משותפות רבות.',
    },
  ],
  pointsToConsider: [
    {
      area: 'שמירת נגיעה',
      explanation:
        'נועה, חשוב לדעת שדניאל שומר נגיעה. זוהי נקודה מהותית שכדאי לדבר עליה בפתיחות ובכבוד כדי להבין את המשמעויות עבור שניכם.',
    },
    {
      area: 'מיקום גיאוגרפי',
      explanation:
        'דניאל מתגורר בירושלים ואת בתל אביב. זהו פער שיש לתת עליו את הדעת ולדון בגמישות של שניכם לגבי מקום מגורים עתידי.',
    },
    {
      area: 'שאיפות קריירה שונות',
      explanation:
        'המסלול של דניאל בהייטק מאוד תובעני, בעוד את מחפשת איזון עם עולם היצירה. זו הזדמנות לדבר על איך תומכים אחד בשנייה בשאיפות שונות.',
    },
  ],
  suggestedConversationStarters: [
    'מהי "שותפות" אמיתית בעיניך, ואיך היא באה לידי ביטוי ביום-יום?',
    'איך אתם מאזנים בין השאיפות המקצועיות שלכם לבין הרצון לחיים אישיים, רוחניים ויצירתיים מלאים?',
    'ספרו על פרויקט או אתגר שלקחתם על עצמכם ומה למדתם מהתהליך.',
    'מה הדבר הכי חשוב לכם שבן/בת הזוג יבינו עליכם כבר בהתחלה?',
  ],
};

// --- Sub-components for better modularity ---

const AnalysisItem: React.FC<{
  icon: React.ElementType;
  iconColor: string;
  area: string;
  explanation: string;
}> = ({ icon: Icon, iconColor, area, explanation }) => (
  <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
    <div
      className={cn(
        'mt-1 flex-shrink-0 rounded-full p-2 bg-opacity-10',
        iconColor.replace('text-', 'bg-')
      )}
    >
      <Icon className={cn('h-5 w-5', iconColor)} />
    </div>
    <div>
      <h4 className="font-semibold text-gray-800">{area}</h4>
      <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
    </div>
  </div>
);

const LoadingScreen: React.FC<{ progress: number; step: number }> = ({
  progress,
  step,
}) => {
  const loadingSteps = [
    { icon: Brain, label: 'מעבד פרופילים' },
    { icon: Heart, label: 'בוחן ערכים' },
    { icon: Users, label: 'מודד תאימות' },
    { icon: Target, label: 'מציע תובנות' },
    { icon: Sparkles, label: 'מסיים ניתוח' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 animate-pulse border-4 border-white shadow-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          מנתח התאמה עמוקה...
        </h3>
        <p className="text-gray-600 max-w-md text-lg">
          אנו בוחנים עשרות פרמטרים כדי לספק לך תמונה מקיפה ומדויקת
        </p>
      </div>
      <div className="w-full max-w-md space-y-4">
        <Progress value={progress} className="h-3 bg-gray-200" />
        <p className="text-sm text-gray-500 font-medium">{progress}% הושלם</p>
      </div>
      {step < loadingSteps.length && (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100"
        >
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg">
            {React.createElement(loadingSteps[step].icon, {
              className: 'w-5 h-5',
            })}
          </div>
          <p className="font-semibold text-gray-800">
            {loadingSteps[step].label}
          </p>
        </motion.div>
      )}
    </div>
  );
};

const ErrorScreen: React.FC<{ error: string; onRetry: () => void }> = ({
  error,
  onRetry,
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-8">
    <XCircle className="w-16 h-16 text-red-400" />
    <div className="space-y-4 max-w-md">
      <h3 className="text-2xl font-bold text-gray-800">משהו השתבש בדרך...</h3>
      <Alert variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-semibold">
          לא הצלחנו להשלים את הניתוח
        </AlertTitle>
        <AlertDescription className="mt-2">
          {error || 'אנו מתנצלים על התקלה. אנא נסו שוב או פנו לתמיכה.'}
        </AlertDescription>
      </Alert>
    </div>
    <Button onClick={onRetry}>
      <Brain className="w-4 h-4 ml-2" />
      נסה שוב
    </Button>
  </div>
);

// --- DialogBody component: contains all logic and complex JSX (גרסה מתוקנת) ---
const DialogBody: React.FC<
  UserAiAnalysisDialogProps & { onOpenChange: (open: boolean) => void }
> = ({
  suggestedUserId,
  isDemo = false,
  demoAnalysisData = null,
  currentUserName,
  suggestedUserName,
  onOpenChange,
}) => {
  const [analysis, setAnalysis] = useState<AiSuggestionAnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);
    setCurrentStep(0);

    if (isDemo) {
      const timer = setInterval(() => {
        setLoadingProgress((prev) => {
          const newProgress = Math.min(prev + 2, 100);
          setCurrentStep(Math.floor(newProgress / 20));
          return newProgress;
        });
      }, 80);
      setTimeout(() => {
        clearInterval(timer);
        setAnalysis(demoAnalysisData || mockAnalysisResult);
        setIsLoading(false);
      }, 4000);
      return;
    }

    try {
      const response = await fetch('/api/ai/analyze-suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      toast.error('שגיאה בתהליך הניתוח', { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedUserId, isDemo]);

  return (
    <>
      <DialogHeader className="p-6 border-b flex-row justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              ניתוח התאמה חכם
            </DialogTitle>
            <DialogDescription className="text-sm">
              {currentUserName} ⟵ {suggestedUserName}
            </DialogDescription>
          </div>
        </div>
        <DialogClose asChild>
          <Button variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </DialogClose>
      </DialogHeader>

      <main className="flex-1 flex flex-col min-h-0 bg-white">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" exit={{ opacity: 0 }} className="flex-1">
              <LoadingScreen progress={loadingProgress} step={currentStep} />
            </motion.div>
          ) : error ? (
            <motion.div key="error" exit={{ opacity: 0 }} className="flex-1">
              <ErrorScreen error={error} onRetry={fetchAnalysis} />
            </motion.div>
          ) : analysis ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <Tabs
                defaultValue="summary"
                className="flex-1 flex flex-col min-h-0"
              >
                <TabsList className="mx-4 mt-4 bg-slate-100 p-1 rounded-lg flex-shrink-0">
                  <TabsTrigger value="summary">סיכום וחיבור</TabsTrigger>
                  <TabsTrigger value="consider">נקודות למחשבה</TabsTrigger>
                  <TabsTrigger value="conversation">נושאים לשיחה</TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <TabsContent value="summary" className="space-y-6 mt-0">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-blue-600">
                          <Info className="w-5 h-5" />
                          {analysis.matchTitle}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {analysis.matchSummary}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          נקודות חוזק וחיבור
                        </h3>
                        <div className="space-y-4">
                          {analysis.compatibilityPoints.map((point) => (
                            <AnalysisItem
                              key={point.area}
                              icon={CheckCircle}
                              iconColor="text-green-500"
                              {...point}
                            />
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="consider" className="mt-0">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        נקודות למחשבה ולשיחה פתוחה
                      </h3>
                      <div className="space-y-4">
                        {analysis.pointsToConsider.map((point) => (
                          <AnalysisItem
                            key={point.area}
                            icon={AlertTriangle}
                            iconColor="text-amber-500"
                            {...point}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="conversation" className="mt-0">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-indigo-500" />
                        נושאים מומלצים לפתיחת שיחה
                      </h3>
                      <ul className="space-y-3 list-inside">
                        {analysis.suggestedConversationStarters.map(
                          (starter, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 p-2 rounded-md hover:bg-indigo-50/50"
                            >
                              <MessageSquare className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {starter}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
      <div className="p-4 bg-gray-50/80 border-t flex justify-end flex-shrink-0">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          <ArrowLeft className="w-4 h-4 ml-2" />
          סגור
        </Button>
      </div>
    </>
  );
};

// --- Main exported wrapper component ---
export const UserAiAnalysisDialog: React.FC<UserAiAnalysisDialogProps> = (
  props
) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const triggerButton = (
    <Button
      variant="outline"
      size="lg"
      className="relative overflow-hidden group bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-pink-100 hover:border-blue-300 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover:animate-shimmer" />
      <div className="relative z-10 flex items-center gap-3">
        <div className="relative">
          <Brain className="w-6 h-6 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 text-blue-600" />
          <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-purple-500 opacity-0 group-hover:opacity-100" />
        </div>
        <span className="text-lg font-bold">ניתוח התאמה מבוסס AI</span>
      </div>
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent
        className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl bg-gray-50"
        dir="rtl"
      >
        {isOpen && <DialogBody {...props} onOpenChange={handleOpenChange} />}
      </DialogContent>
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </Dialog>
  );
};