// src/components/suggestions/dialogs/UserAiAnalysisDialog.tsx
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
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import type { AiAnalysisDict } from '@/types/dictionary';

// --- Interfaces ---
interface UserAiAnalysisDialogProps {
  suggestedUserId: string;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  currentUserName?: string;
  suggestedUserName?: string;
  dict: AiAnalysisDict;
  locale: 'he' | 'en';
}

// --- Demo Data ---
const mockAnalysisResult: AiSuggestionAnalysisResult = {
  overallScore: 91,
  matchTitle: 'A Partnership of Stability and Creativity',
  matchSummary:
    "The connection between Daniel and Noa shows particularly high potential, based on a fascinating balance between shared core values and complementary personalities. The combination of Daniel's practical, ambitious nature and Noa's emotional depth and creativity creates a solid foundation for a long-term partnership.",
  compatibilityPoints: [
    {
      area: 'Shared Values and Worldview',
      explanation:
        'You both see a relationship as a "true partnership" and family as a core value. Noa\'s desire for "kindness" and Daniel\'s emphasis on "integrity and responsibility" connect perfectly to form the basis of a healthy, mature relationship.',
    },
    {
      area: 'Intellectual and Emotional Compatibility',
      explanation:
        'Noa\'s desire for "deep conversations" and her search for intelligence and curiosity align with Daniel\'s analytical and scholarly nature. There is potential for a fascinating intellectual connection and conversations late into the night.',
    },
    {
      area: 'Stability and Reliability',
      explanation:
        'Daniel\'s emphasis on integrity and responsibility, being a "man of action," meets the need for security and stability that are important in building a serious relationship.',
    },
    {
      area: 'Balanced Lifestyle',
      explanation:
        'You both appreciate a balance between activity and rest, and between going out and quiet quality time. The shared love for nature hikes can be a source of many common experiences.',
    },
  ],
  pointsToConsider: [
    {
      area: 'Observing Touch (Shomer Negiah)',
      explanation:
        "Noa, it's important to know that Daniel observes 'shomer negiah'. This is a significant point to discuss openly and respectfully to understand the implications for both of you.",
    },
    {
      area: 'Geographical Location',
      explanation:
        'Daniel lives in Jerusalem and you are in Tel Aviv. This is a gap that needs to be considered and discussed regarding your flexibility for a future place of residence.',
    },
    {
      area: 'Different Career Ambitions',
      explanation:
        "Daniel's path in high-tech is very demanding, while you are looking for a balance with the world of creativity. This is an opportunity to talk about how to support each other's different aspirations.",
    },
  ],
  suggestedConversationStarters: [
    'What is a "true partnership" in your eyes, and how does it manifest in daily life?',
    'How do you balance your professional ambitions with the desire for a full personal, spiritual, and creative life?',
    'Tell me about a project or challenge you took on and what you learned from the process.',
    'What is the most important thing for you that your partner understands about you right from the start?',
  ],
};

// --- Sub-components ---

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

// --- Loading Screen Updated (Teal/Orange/Rose) ---
const LoadingScreen: React.FC<{
  progress: number;
  step: number;
  dict: AiAnalysisDict;
  locale: 'he' | 'en';
}> = ({ progress, step, dict, locale }) => {
  const loadingSteps = [
    { icon: Brain, label: dict.loadingSteps.step1 },
    { icon: Heart, label: dict.loadingSteps.step2 },
    { icon: Users, label: dict.loadingSteps.step3 },
    { icon: Target, label: dict.loadingSteps.step4 },
    { icon: Sparkles, label: dict.loadingSteps.step5 },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8">
      <div className="relative">
        {/* Spinner Background: Teal -> Orange -> Rose */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 via-orange-50 to-rose-100 animate-pulse border-4 border-white shadow-xl" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        </div>
      </div>
      <div className="space-y-3">
        {/* Text Gradient: Teal -> Orange -> Rose */}
        <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
          {dict.loadingTitle}
        </h3>
        <p className="text-gray-600 max-w-md text-lg">
          {dict.loadingDescription}
        </p>
      </div>
      <div className="w-full max-w-md space-y-4">
        <Progress value={progress} className="h-3 bg-gray-200" />
        <p className="text-sm text-gray-500 font-medium">
          {progress}% {locale === 'he' ? 'הושלם' : 'Completed'}
        </p>
      </div>
      {step < loadingSteps.length && (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-lg border border-gray-100"
        >
          {/* Step Icon: Teal -> Orange */}
          <div className="p-3 rounded-full bg-gradient-to-br from-teal-500 to-orange-500 text-white shadow-lg">
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

const ErrorScreen: React.FC<{
  error: string;
  onRetry: () => void;
  dict: AiAnalysisDict;
  locale: 'he' | 'en';
}> = ({ error, onRetry, dict, locale }) => (
  <div className="flex flex-col items-center justify-center h-full text-center space-y-6 p-8">
    <XCircle className="w-16 h-16 text-rose-400" />
    <div className="space-y-4 max-w-md">
      <h3 className="text-2xl font-bold text-gray-800">{dict.errorTitle}</h3>
      <Alert variant="destructive">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-semibold">
          {dict.errorAlertTitle}
        </AlertTitle>
        <AlertDescription className="mt-2">
          {error || dict.errorAlertDescription}
        </AlertDescription>
      </Alert>
    </div>
    <Button onClick={onRetry} className="bg-teal-600 hover:bg-teal-700 text-white">
      <Brain className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')} />
      {dict.retryButton}
    </Button>
  </div>
);

// --- DialogBody component ---
export const DialogBody: React.FC<
  UserAiAnalysisDialogProps & { onOpenChange: (open: boolean) => void }
> = ({
  suggestedUserId,
  isDemo = false,
  demoAnalysisData = null,
  currentUserName,
  suggestedUserName,
  onOpenChange,
  dict,
  locale,
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
  }, [suggestedUserId, isDemo]);

  const BackButtonIcon = locale === 'he' ? ArrowRight : ArrowLeft;
  const directionArrow = locale === 'he' ? '⟵' : '⟶';

  return (
    <>
      <DialogHeader className="relative p-6 border-b text-center bg-gradient-to-b from-slate-50 to-white flex-shrink-0">
        <div className="flex flex-col items-center gap-2">
          {/* Bot Icon: Teal -> Orange -> Rose */}
          <div className="p-3 rounded-full bg-gradient-to-br from-teal-500 via-orange-500 to-rose-500 text-white shadow-lg">
            <Bot className="w-7 h-7" />
          </div>
          {/* Title: Teal -> Orange -> Rose */}
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-teal-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">
            {dict.dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-500">
            {currentUserName} {directionArrow} {suggestedUserName}
          </DialogDescription>
        </div>
        <div
          className={cn(
            'absolute top-4',
            locale === 'he' ? 'left-4' : 'right-4'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </DialogHeader>

      <main className="flex-1 flex flex-col min-h-0 bg-white">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div key="loading" exit={{ opacity: 0 }} className="flex-1">
              <LoadingScreen
                progress={loadingProgress}
                step={currentStep}
                dict={dict}
                locale={locale}
              />
            </motion.div>
          ) : error ? (
            <motion.div key="error" exit={{ opacity: 0 }} className="flex-1">
              <ErrorScreen
                error={error}
                onRetry={fetchAnalysis}
                dict={dict}
                locale={locale}
              />
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
                  <TabsTrigger value="summary">{dict.tabs.summary}</TabsTrigger>
                  <TabsTrigger value="consider">
                    {dict.tabs.consider}
                  </TabsTrigger>
                  <TabsTrigger value="conversation">
                    {dict.tabs.conversation}
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                  <div className={cn('p-6', locale === 'en' && 'text-left')}>
                    <TabsContent value="summary" className="space-y-6 mt-0">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        {/* Match Title: Teal */}
                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-teal-600">
                          <Info className="w-5 h-5" />
                          {analysis.matchTitle}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {analysis.matchSummary}
                        </p>
                      </div>
                      <div>
                        {/* Strength: Emerald (Success) */}
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          {dict.summaryTab.strengthTitle}
                        </h3>
                        <div className="space-y-4">
                          {analysis.compatibilityPoints.map((point) => (
                            <AnalysisItem
                              key={point.area}
                              icon={CheckCircle}
                              iconColor="text-emerald-500"
                              {...point}
                            />
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="consider" className="mt-0">
                      {/* Considerations: Amber/Orange */}
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        {dict.considerTab.title}
                      </h3>
                      <div className="space-y-4">
                        {analysis.pointsToConsider.map((point) => (
                          <AnalysisItem
                            key={point.area}
                            icon={AlertTriangle}
                            iconColor="text-orange-500"
                            {...point}
                          />
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="conversation" className="mt-0">
                      {/* Conversation: Teal */}
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-teal-500" />
                        {dict.conversationTab.title}
                      </h3>
                      <ul className="space-y-3 list-inside">
                        {analysis.suggestedConversationStarters.map(
                          (starter, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 p-2 rounded-md hover:bg-teal-50/50"
                            >
                              <MessageSquare className="w-4 h-4 text-teal-400 mt-1 flex-shrink-0" />
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
          <BackButtonIcon
            className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
          />
          {dict.backButton}
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
  const { dict, locale } = props;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* Trigger Button: Teal -> Orange -> Rose */}
        <Button
          variant="outline"
          size="lg"
          className="relative overflow-hidden group bg-gradient-to-r from-teal-50 via-orange-50 to-rose-50 border-2 border-teal-200 text-teal-700 hover:from-teal-100 hover:to-rose-100 hover:border-teal-300 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover:animate-shimmer" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="relative">
              <Brain className="w-6 h-6 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 text-teal-600" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-orange-500 opacity-0 group-hover:opacity-100" />
            </div>
            <span className="text-lg font-bold">{dict.triggerButton}</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl bg-gray-50 z-[9999]"
        dir={locale === 'he' ? 'rtl' : 'ltr'}
        style={{ zIndex: 9999 }}
      >
        {isOpen && <DialogBody {...props} onOpenChange={handleOpenChange} />}
      </DialogContent>
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        [data-radix-dialog-overlay] {
          z-index: 9998 !important;
        }
        
        [data-radix-dialog-content] {
          z-index: 9999 !important;
        }
      `}</style>
    </Dialog>
  );
};