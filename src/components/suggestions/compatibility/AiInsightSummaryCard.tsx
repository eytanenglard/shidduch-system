// src/components/suggestions/compatibility/AiInsightSummaryCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  Bot,
  Brain,
  Heart,
  Users,
  Target,
  AlertTriangle,
  Loader2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProgressRing from './ProgressRing';
import AiInsightDrawer from './AiInsightDrawer';
import type { AiSuggestionAnalysisResult } from '@/lib/services/aiService';
import type { AiInsightDict } from '@/types/dictionary';

interface AiInsightSummaryCardProps {
  suggestedUserId: string;
  isDemo?: boolean;
  demoAnalysisData?: AiSuggestionAnalysisResult | null;
  currentUserName?: string;
  suggestedUserName?: string;
  dict: AiInsightDict;
  locale: 'he' | 'en';
}

const getScoreLabel = (score: number, locale: 'he' | 'en') => {
  if (locale === 'he') {
    if (score >= 85) return 'התאמה מעולה';
    if (score >= 70) return 'התאמה טובה';
    if (score >= 55) return 'התאמה בינונית';
    return 'התאמה מאתגרת';
  }
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Good Match';
  if (score >= 55) return 'Moderate Match';
  return 'Challenging Match';
};

const getChipColor = (type: 'positive' | 'consider') =>
  type === 'positive'
    ? 'bg-teal-50 text-teal-700 border-teal-200'
    : 'bg-orange-50 text-orange-700 border-orange-200';

// Extract short labels from compatibility points for chips
const extractChips = (
  analysis: AiSuggestionAnalysisResult
): Array<{ label: string; type: 'positive' | 'consider' }> => {
  const chips: Array<{ label: string; type: 'positive' | 'consider' }> = [];

  // Take top 2 compatibility points
  analysis.compatibilityPoints.slice(0, 2).forEach((p) => {
    chips.push({ label: p.area, type: 'positive' });
  });

  // Take top 1 consideration
  if (analysis.pointsToConsider.length > 0) {
    chips.push({ label: analysis.pointsToConsider[0].area, type: 'consider' });
  }

  return chips;
};

// --- Loading Overlay ---
const LoadingOverlay: React.FC<{
  progress: number;
  step: number;
  dict: AiInsightDict;
}> = ({ progress, step, dict }) => {
  const loadingSteps = [
    { icon: Brain, label: dict.loading.step1 },
    { icon: Heart, label: dict.loading.step2 },
    { icon: Users, label: dict.loading.step3 },
    { icon: Target, label: dict.loading.step4 },
    { icon: Sparkles, label: dict.loading.step5 },
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-5 py-6 px-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 via-orange-50 to-rose-100 animate-pulse border-2 border-white shadow-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 via-orange-500 to-rose-500 bg-clip-text text-transparent">
          {dict.loading.title}
        </h3>
        <p className="text-sm text-gray-500">{dict.loading.description}</p>
      </div>
      <div className="w-full max-w-xs space-y-2">
        <Progress
          value={progress}
          className="h-2 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-teal-500 [&>div]:to-emerald-500"
        />
        {step < loadingSteps.length && (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-sm text-gray-600"
          >
            {React.createElement(loadingSteps[step].icon, {
              className: 'w-4 h-4 text-teal-500',
            })}
            <span>{loadingSteps[step].label}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Error State ---
const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
  dict: AiInsightDict;
}> = ({ error, onRetry, dict }) => (
  <div className="flex flex-col items-center text-center space-y-3 py-5 px-4">
    <XCircle className="w-10 h-10 text-rose-400" />
    <p className="text-sm text-gray-600">{error || dict.error.description}</p>
    <Button
      size="sm"
      onClick={onRetry}
      className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
    >
      <Brain className="w-3.5 h-3.5 me-1.5" />
      {dict.error.retry}
    </Button>
  </div>
);

// --- Idle State (before fetching) ---
const IdleState: React.FC<{
  onFetch: () => void;
  dict: AiInsightDict;
  locale: 'he' | 'en';
}> = ({ onFetch, dict }) => (
  <div className="flex items-center gap-3 p-4">
    <div className="relative flex-shrink-0">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-md">
        <Bot className="w-6 h-6 text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800">{dict.idle.title}</p>
      <p className="text-xs text-gray-500 mt-0.5">{dict.idle.description}</p>
    </div>
    <Button
      size="sm"
      onClick={onFetch}
      className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-sm rounded-lg text-xs font-bold px-4 flex-shrink-0"
    >
      <Sparkles className="w-3.5 h-3.5 me-1.5" />
      {dict.idle.button}
    </Button>
  </div>
);

// --- Main Component ---
const AiInsightSummaryCard: React.FC<AiInsightSummaryCardProps> = ({
  suggestedUserId,
  isDemo = false,
  demoAnalysisData = null,
  currentUserName,
  suggestedUserName,
  dict,
  locale,
}) => {
  const [analysis, setAnalysis] = useState<AiSuggestionAnalysisResult | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mockAnalysis: AiSuggestionAnalysisResult = demoAnalysisData || {
    overallScore: 91,
    matchTitle: 'שותפות של יציבות ויצירתיות',
    matchSummary: 'החיבור מראה פוטנציאל גבוה במיוחד, המבוסס על איזון מרתק בין ערכים משותפים ואישיויות משלימות.',
    worldInsights: [],
    compatibilityPoints: [
      { area: 'ערכים והשקפת עולם משותפים', explanation: 'שניכם רואים בזוגיות שותפות אמיתית ובמשפחה ערך מרכזי.' },
      { area: 'התאמה אינטלקטואלית ורגשית', explanation: 'יש פוטנציאל לחיבור אינטלקטואלי מרתק ושיחות עד השעות הקטנות.' },
    ],
    pointsToConsider: [
      { area: 'מיקום גיאוגרפי', explanation: 'יש פער שכדאי לדון בו לגבי מקום מגורים עתידי.' },
    ],
    suggestedConversationStarters: [
      'מהי "שותפות אמיתית" בעינייך?',
      'איך את/ה מאזנ/ת בין שאיפות מקצועיות לחיים אישיים?',
    ],
  };

  const fetchAnalysis = async () => {
    setState('loading');
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
        setAnalysis(mockAnalysis);
        setState('loaded');
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
        throw new Error(result.message || dict.error.description);
      }
      setAnalysis(result.data);
      setState('loaded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : dict.error.description;
      setError(errorMessage);
      setState('error');
      toast.error(dict.error.toastTitle, { description: errorMessage });
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      setState((prev) => prev); // no-op, but ensures state is fresh
    };
  }, []);

  const chips = analysis ? extractChips(analysis) : [];

  return (
    <>
      <div
        className={cn(
          'rounded-xl border overflow-hidden transition-all duration-300',
          state === 'loaded'
            ? 'border-teal-200/60 bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/20 shadow-md'
            : 'border-teal-200/60 bg-gradient-to-r from-teal-50 via-white to-orange-50'
        )}
        dir={locale === 'he' ? 'rtl' : 'ltr'}
      >
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <IdleState onFetch={fetchAnalysis} dict={dict} locale={locale} />
            </motion.div>
          )}

          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingOverlay progress={loadingProgress} step={currentStep} dict={dict} />
            </motion.div>
          )}

          {state === 'error' && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ErrorState error={error} onRetry={fetchAnalysis} dict={dict} />
            </motion.div>
          )}

          {state === 'loaded' && analysis && (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="p-4 space-y-3"
            >
              {/* Top row: Progress ring + title + summary */}
              <div className="flex items-start gap-3.5">
                <ProgressRing score={analysis.overallScore} size={72} strokeWidth={5} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-800 leading-tight">
                      {analysis.matchTitle}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        analysis.overallScore >= 70
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : analysis.overallScore >= 55
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                      )}
                    >
                      {getScoreLabel(analysis.overallScore, locale)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {analysis.matchSummary}
                  </p>
                </div>
              </div>

              {/* Highlight chips */}
              {chips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((chip, i) => (
                    <span
                      key={i}
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border',
                        getChipColor(chip.type)
                      )}
                    >
                      {chip.type === 'positive' ? (
                        <Heart className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}

              {/* Deep dive button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDrawerOpen(true)}
                className="w-full text-teal-700 hover:text-teal-800 hover:bg-teal-50 font-semibold text-xs gap-1.5 group"
              >
                <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                {dict.deepDive}
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Layer 2: Bottom sheet drawer */}
      {analysis && (
        <AiInsightDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          analysis={analysis}
          currentUserName={currentUserName}
          suggestedUserName={suggestedUserName}
          dict={dict}
          locale={locale}
        />
      )}
    </>
  );
};

export default AiInsightSummaryCard;
