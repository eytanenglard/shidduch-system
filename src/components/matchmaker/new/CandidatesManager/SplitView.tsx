// File: src/components/matchmaker/new/CandidatesManager/SplitView.tsx
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import CandidatesList from './CandidatesList';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  XCircle,
  Target,
  Crown,
  Zap,
  Search,
  Loader2,
  RefreshCw,
  Database,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import type {
  Candidate,
  CandidateAction,
  MobileView,
} from '../types/candidates';
import type { FilterState } from '../types/filters';
import SearchBar from '../Filters/SearchBar';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Gender } from '@prisma/client';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// טיפוסים להתאמת רקע
type BackgroundCompatibility =
  | 'excellent'
  | 'good'
  | 'possible'
  | 'problematic'
  | 'not_recommended';

// מבנה ציון מפורט - V3.0
interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

// Interface מעודכן עם כל השדות החדשים מ-V3.1
interface AiMatch {
  userId: string;
  firstName?: string;
  lastName?: string;
  score?: number;
  firstPassScore?: number;
  finalScore?: number;
  scoreBreakdown?: ScoreBreakdown;
  reasoning?: string;
  shortReasoning?: string;
  detailedReasoning?: string;
  rank?: number;
  backgroundMultiplier?: number;
  backgroundCompatibility?: BackgroundCompatibility;
}

// Interface למטא-דאטה של החיפוש
interface AiMatchMeta {
  fromCache: boolean;
  savedAt?: string;
  isStale?: boolean;
  algorithmVersion: string;
  totalCandidatesScanned?: number;
}

// טיפוס מורחב למועמד עם נתוני AI
type CandidateWithAiData = Candidate & {
  aiScore?: number;
  aiReasoning?: string;
  aiMatch?: AiMatch;
  aiRank?: number;
  aiFirstPassScore?: number;
  aiScoreBreakdown?: ScoreBreakdown;
  aiBackgroundMultiplier?: number;
  aiBackgroundCompatibility?: BackgroundCompatibility;
};

interface SplitViewProps {
  isQuickViewEnabled: boolean;
  maleCandidates: Candidate[];
  femaleCandidates: Candidate[];
  allCandidates: Candidate[];
  onOpenAiAnalysis: (candidate: Candidate) => void;
  onSendProfileFeedback: (candidate: Candidate, e?: React.MouseEvent) => void;
  onCandidateAction: (type: CandidateAction, candidate: Candidate) => void;
  onCandidateClick: (candidate: Candidate) => void;
  viewMode: 'grid' | 'list';
  mobileView: MobileView;
  isLoading?: boolean;
  className?: string;
  locale: string;
  aiTargetCandidate: Candidate | null;
  aiMatches: AiMatch[];
  isAiLoading: boolean;
  onSetAiTarget: (candidate: Candidate, e: React.MouseEvent) => void;
  onClearAiTarget: (e: React.MouseEvent) => void;
  setAiMatches: React.Dispatch<React.SetStateAction<AiMatch[]>>;
  setIsAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
  comparisonSelection: Record<string, Candidate>;
  onToggleComparison: (candidate: Candidate, e: React.MouseEvent) => void;
  separateFiltering: boolean;
  maleFilters?: Partial<FilterState>;
  femaleFilters?: Partial<FilterState>;
  onMaleFiltersChange: (filters: Partial<FilterState>) => void;
  onFemaleFiltersChange: (filters: Partial<FilterState>) => void;
  onCopyFilters: (source: 'male' | 'female', target: 'male' | 'female') => void;
  maleSearchQuery?: string;
  femaleSearchQuery?: string;
  onMaleSearchChange?: (query: string) => void;
  onFemaleSearchChange?: (query: string) => void;
  dict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
}

// ============================================================================
// SCORE BREAKDOWN DISPLAY COMPONENT
// ============================================================================

const ScoreBreakdownDisplay: React.FC<{
  breakdown: ScoreBreakdown;
  className?: string;
}> = ({ breakdown, className }) => {
  const categories = [
    { key: 'religious', label: 'התאמה דתית', max: 35, color: 'bg-purple-500' },
    {
      key: 'careerFamily',
      label: 'קריירה-משפחה',
      max: 15,
      color: 'bg-blue-500',
    },
    { key: 'lifestyle', label: 'סגנון חיים', max: 15, color: 'bg-green-500' },
    { key: 'ambition', label: 'שאפתנות', max: 12, color: 'bg-orange-500' },
    { key: 'communication', label: 'תקשורת', max: 12, color: 'bg-cyan-500' },
    { key: 'values', label: 'ערכים', max: 11, color: 'bg-pink-500' },
  ];

  return (
    <div className={cn('space-y-1.5', className)}>
      {categories.map((cat) => {
        const value = breakdown[cat.key as keyof ScoreBreakdown] || 0;
        const percentage = (value / cat.max) * 100;
        return (
          <div key={cat.key} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-20 truncate">
              {cat.label}
            </span>
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn('h-full rounded-full', cat.color)}
              />
            </div>
            <span className="text-xs text-gray-500 w-10 text-right">
              {value}/{cat.max}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// CACHE INFO BADGE COMPONENT
// ============================================================================

const CacheInfoBadge: React.FC<{
  meta: AiMatchMeta | null;
  matchesCount: number;
}> = ({ meta, matchesCount }) => {
  if (!meta || matchesCount === 0) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (meta.fromCache) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
          meta.isStale
            ? 'bg-amber-100 text-amber-700 border border-amber-200'
            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        )}
      >
        {meta.isStale ? (
          <>
            <Clock className="w-3 h-3" />
            <span>ישן ({formatDate(meta.savedAt)})</span>
          </>
        ) : (
          <>
            <Database className="w-3 h-3" />
            <span>שמור ({formatDate(meta.savedAt)})</span>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-medium"
    >
      <Sparkles className="w-3 h-3" />
      <span>חדש</span>
      {meta.totalCandidatesScanned && (
        <span className="text-blue-500">
          ({meta.totalCandidatesScanned} נסרקו)
        </span>
      )}
    </motion.div>
  );
};

// ============================================================================
// PANEL HEADER COMPONENT
// ============================================================================

const PanelHeaderComponent: React.FC<{
  gender: 'male' | 'female';
  count: number;
  aiTargetCandidate: Candidate | null;
  isSearchPanel: boolean;
  isTargetPanel: boolean;
  onClearAiTarget: (e: React.MouseEvent) => void;
  onFindAiMatches: (e: React.MouseEvent, forceRefresh?: boolean) => void;
  isAiLoading: boolean;
  isMobileView?: boolean;
  dict: MatchmakerPageDictionary['candidatesManager']['splitView']['panelHeaders'];
  aiMatchMeta: AiMatchMeta | null;
  aiMatchesCount: number;
}> = ({
  gender,
  count,
  aiTargetCandidate,
  isSearchPanel,
  isTargetPanel,
  onClearAiTarget,
  onFindAiMatches,
  isAiLoading,
  isMobileView = false,
  dict,
  aiMatchMeta,
  aiMatchesCount,
}) => {
  const genderConfig = {
    male: {
      title: dict.male.title,
      subtitle: dict.male.subtitle.replace('{{count}}', count.toString()),
      icon: Target,
      colors: {
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'from-blue-50 to-cyan-50',
        text: 'text-blue-800',
        badge: 'bg-blue-500',
      },
    },
    female: {
      title: dict.female.title,
      subtitle: dict.female.subtitle.replace('{{count}}', count.toString()),
      icon: Crown,
      colors: {
        gradient: 'from-purple-500 to-pink-500',
        bg: 'from-purple-50 to-pink-50',
        text: 'text-purple-800',
        badge: 'bg-purple-500',
      },
    },
  };

  const config = genderConfig[gender];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        'flex justify-between items-center p-4 rounded-t-2xl',
        !isMobileView &&
          `bg-gradient-to-r ${config.colors.bg} border-b border-gray-100/50`
      )}
    >
      <div className="flex items-center gap-3">
        <motion.div
          className={cn(
            'p-3 rounded-full shadow-lg text-white transition-transform',
            `bg-gradient-to-r ${config.colors.gradient}`
          )}
        >
          <IconComponent className="w-6 h-6" />
        </motion.div>
        <div>
          <h2 className={cn('text-xl font-bold', config.colors.text)}>
            {config.title}
          </h2>
          <p className="text-sm text-gray-600">{config.subtitle}</p>
        </div>
        <Badge
          className={cn(
            'text-white border-0 shadow-lg px-3 py-1 font-bold',
            config.colors.badge
          )}
        >
          {count}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        {isSearchPanel && aiMatchesCount > 0 && (
          <CacheInfoBadge meta={aiMatchMeta} matchesCount={aiMatchesCount} />
        )}

        {isTargetPanel && aiTargetCandidate && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-2 bg-green-100 p-2 rounded-full shadow-lg"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-800 px-2">
              {dict.targetLabel.replace(
                '{{name}}',
                aiTargetCandidate.firstName
              )}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-green-700 hover:bg-green-200 rounded-full"
              onClick={onClearAiTarget}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {isSearchPanel && (
          <div className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Button
                size="sm"
                onClick={(e) => onFindAiMatches(e, false)}
                disabled={isAiLoading}
                className={cn(
                  'relative overflow-hidden shadow-lg font-bold transition-all duration-300',
                  `bg-gradient-to-r ${config.colors.gradient} hover:opacity-90 text-white`,
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Sparkles
                  className={cn(
                    'ml-2 h-4 w-4 relative z-10',
                    isAiLoading && 'animate-spin'
                  )}
                />
                <span className="relative z-10">
                  {isAiLoading ? dict.searchingButton : dict.findMatchesButton}
                </span>
                {!isAiLoading && <Zap className="w-3 h-3 mr-1 relative z-10" />}
              </Button>
            </motion.div>

            {aiMatchMeta?.fromCache && aiMatchesCount > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => onFindAiMatches(e, true)}
                  disabled={isAiLoading}
                  className={cn(
                    'px-2 transition-all',
                    aiMatchMeta.isStale
                      ? 'border-amber-300 text-amber-600 hover:bg-amber-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <RefreshCw
                    className={cn('w-4 h-4', isAiLoading && 'animate-spin')}
                  />
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// LOADING COMPONENT
// ============================================================================

const LoadingComponent: React.FC<{ gender: 'male' | 'female' }> = ({
  gender,
}) => {
  const config =
    gender === 'male'
      ? {
          gradient: 'from-blue-200 to-cyan-200',
          icon: Target,
          title: 'טוען מועמדים...',
        }
      : {
          gradient: 'from-purple-200 to-pink-200',
          icon: Crown,
          title: 'טוענת מועמדות...',
        };
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-64 p-8"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          'p-6 rounded-full mb-4',
          `bg-gradient-to-r ${config.gradient}`
        )}
      >
        <IconComponent className="w-12 h-12 text-white" />
      </motion.div>
      <h3 className="text-lg font-bold text-gray-700">{config.title}</h3>
    </motion.div>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyStateComponent: React.FC<{
  gender: 'male' | 'female';
  searchQuery?: string;
  onClearSearch?: () => void;
  dict: MatchmakerPageDictionary['candidatesManager']['list']['emptyState'];
}> = ({ gender, searchQuery, onClearSearch, dict }) => {
  const config =
    gender === 'male'
      ? { gradient: 'from-blue-100 to-cyan-100', icon: Target }
      : { gradient: 'from-purple-100 to-pink-100', icon: Crown };
  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-64 p-8"
    >
      <div
        className={cn(
          'w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg',
          `bg-gradient-to-br ${config.gradient}`
        )}
      >
        <IconComponent className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{dict.title}</h3>
      <p className="text-gray-600 text-center mb-4">
        {searchQuery
          ? `לא נמצאו תוצאות עבור "${searchQuery}"`
          : dict.description}
      </p>
      {searchQuery && onClearSearch && (
        <Button variant="outline" onClick={onClearSearch}>
          <Search className="w-4 h-4 ml-2" />
          נקה חיפוש
        </Button>
      )}
    </motion.div>
  );
};

// ============================================================================
// AI LOADING PROGRESS COMPONENT
// ============================================================================

const AiLoadingProgress: React.FC<{
  isLoading: boolean;
  gender: 'male' | 'female';
  progress?: number;
  stage?: string;
}> = ({ isLoading, gender, progress: realProgress, stage: realStage }) => {
  const [fakeProgress, setFakeProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setFakeProgress(0);
      return;
    }

    // אם יש progress אמיתי מהשרת - השתמש בו
    if (realProgress !== undefined) return;

    // אחרת, הצג progress מזויף לUX
    const interval = setInterval(() => {
      setFakeProgress((prev) => Math.min(prev + 0.5, 95));
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, realProgress]);

  if (!isLoading) return null;

  const progress = realProgress ?? fakeProgress;
  const stage =
    realStage ||
    (progress < 20
      ? 'fetching'
      : progress < 70
        ? 'analyzing'
        : progress < 95
          ? 'deep'
          : 'saving');

  const stageLabels: Record<string, string> = {
    queued: 'בתור...',
    fetching: 'שולף מועמדים רלוונטיים...',
    analyzing: 'מנתח התאמות (סריקה ראשונית)...',
    deep: 'ניתוח מעמיק של המובילים...',
    saving: 'שומר תוצאות...',
    done: 'סיום!',
  };

  const config =
    gender === 'male'
      ? { gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-100' }
      : { gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-100' };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-4 mb-4"
    >
      <div className={cn('rounded-xl p-4 shadow-lg', config.bg)}>
        <div className="flex items-center gap-3 mb-3">
          <Loader2 className="w-5 h-5 animate-spin text-gray-700" />
          <span className="text-sm font-medium text-gray-700">
            {stageLabels[stage] || stage}
          </span>
          <span className="text-xs text-gray-500 mr-auto">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-white/50 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full bg-gradient-to-r',
              config.gradient
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// HELPER FUNCTION - Type-safe background compatibility casting
// ============================================================================

function toBackgroundCompatibility(
  value: string | undefined
): BackgroundCompatibility | undefined {
  const validValues: BackgroundCompatibility[] = [
    'excellent',
    'good',
    'possible',
    'problematic',
    'not_recommended',
  ];
  if (value && validValues.includes(value as BackgroundCompatibility)) {
    return value as BackgroundCompatibility;
  }
  return undefined;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const SplitView: React.FC<SplitViewProps> = ({
  dict,
  onOpenAiAnalysis,
  onSendProfileFeedback,
  profileDict,
  isQuickViewEnabled,
  locale,
  ...props
}) => {
  const {
    maleCandidates,
    femaleCandidates,
    allCandidates,
    onCandidateAction,
    onCandidateClick,
    viewMode,
    mobileView,
    isLoading = false,
    className,
    maleSearchQuery = '',
    femaleSearchQuery = '',
    onMaleSearchChange,
    onFemaleSearchChange,
    aiTargetCandidate,
    aiMatches,
    isAiLoading,
    onSetAiTarget,
    onClearAiTarget,
    setAiMatches,
    setIsAiLoading,
    comparisonSelection,
    onToggleComparison,
    separateFiltering,
  } = props;

  const [isMobile, setIsMobile] = useState(false);
  const [aiMatchMeta, setAiMatchMeta] = useState<AiMatchMeta | null>(null);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // State נוסף לpolling
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStage, setJobStage] = useState<string>('');

  // פונקציה לבדיקת סטטוס עבודה
  const pollJobStatus = async (jobId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/ai/find-matches-v2/status?jobId=${jobId}`
      );
      const data = await response.json();

      if (!data.success && data.status === 'failed') {
        throw new Error(data.error || 'Job failed');
      }

      // עדכן התקדמות
      setJobProgress(data.progress || 0);
      setJobStage(data.stage || '');

      if (data.status === 'completed') {
        // העבודה הסתיימה - שמור תוצאות
        setAiMatches(data.matches || []);
        setAiMatchMeta({
          fromCache: false,
          savedAt: data.meta?.savedAt,
          isStale: false,
          algorithmVersion: data.meta?.algorithmVersion || 'v3.1',
          totalCandidatesScanned: data.meta?.totalCandidatesScanned,
        });

        const topMatch = data.matches?.[0];
        toast.success(`נמצאו ${data.matches?.length || 0} התאמות! 🎯`, {
          position: 'top-center',
          description: topMatch
            ? `ההתאמה הטובה ביותר: ${topMatch.firstName} ${topMatch.lastName} (${topMatch.finalScore || topMatch.score}%)`
            : 'סיום מוצלח',
          duration: 5000,
        });

        return true; // סיים
      }

      return false; // עדיין עובד
    } catch (error) {
      console.error('Error polling job status:', error);
      throw error;
    }
  };

  const handleFindAiMatches = async (
    e: React.MouseEvent,
    forceRefresh: boolean = false
  ) => {
    e.stopPropagation();

    if (!aiTargetCandidate) {
      toast.error('אנא בחר מועמד/ת מטרה תחילה', {
        position: 'top-center',
        icon: '⚠️',
      });
      return;
    }

    setIsAiLoading(true);
    setAiMatches([]);
    setAiMatchMeta(null);
    setJobProgress(0);
    setJobStage('queued');

    try {
      // שלב 1: שלח בקשה
      const response = await fetch('/api/ai/find-matches-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: aiTargetCandidate.id,
          forceRefresh,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start matching job');
      }

      // אם חזר מcache - סיימנו
      if (data.fromCache && data.matches) {
        setAiMatches(data.matches);
        setAiMatchMeta({
          fromCache: true,
          savedAt: data.meta.savedAt,
          isStale: data.meta.isStale,
          algorithmVersion: data.meta.algorithmVersion,
          totalCandidatesScanned: data.meta.totalCandidatesScanned,
        });

        const savedDate = data.meta.savedAt
          ? new Date(data.meta.savedAt).toLocaleDateString('he-IL')
          : 'לא ידוע';
        toast.success(`נטענו ${data.matches.length} התאמות שמורות 📂`, {
          position: 'top-center',
          description: data.meta.isStale
            ? `התוצאות מ-${savedDate}. מומלץ לרענן.`
            : `עודכן ב-${savedDate}`,
          duration: 4000,
        });
        setIsAiLoading(false);
        return;
      }

      // אחרת, יש לנו jobId - מתחיל polling
      if (data.jobId) {
        setCurrentJobId(data.jobId);
        toast.info('החיפוש התחיל, אנא המתן...', {
          position: 'top-center',
          duration: 3000,
        });

        // Polling loop
        let attempts = 0;
        const maxAttempts = 120; // 10 דקות מקסימום (120 * 5 שניות)

        const pollInterval = setInterval(async () => {
          attempts++;

          try {
            const isDone = await pollJobStatus(data.jobId);

            if (isDone || attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setCurrentJobId(null);
              setIsAiLoading(false);

              if (attempts >= maxAttempts) {
                toast.error('החיפוש לקח יותר מדי זמן. נסה שוב מאוחר יותר.');
              }
            }
          } catch (error) {
            clearInterval(pollInterval);
            setCurrentJobId(null);
            setIsAiLoading(false);
            toast.error('שגיאה בחיפוש.', {
              description:
                error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }, 3000); // בדוק כל 3 שניות
      }
    } catch (error) {
      console.error('Error finding AI matches:', error);
      toast.error('שגיאה במציאת התאמות AI.', {
        description:
          error instanceof Error ? error.message : 'נסה שוב מאוחר יותר.',
      });
      setIsAiLoading(false);
    }
  };

  // 🔧 תוקן: המרה בטוחה של backgroundCompatibility
  const maleCandidatesWithScores: CandidateWithAiData[] = useMemo(() => {
    if (aiMatches.length === 0) return maleCandidates;
    const matchMap = new Map(aiMatches.map((m) => [m.userId, m]));

    return maleCandidates
      .map((c): CandidateWithAiData => {
        const match = matchMap.get(c.id);
        return {
          ...c,
          aiScore: match?.finalScore ?? match?.score,
          aiReasoning:
            match?.detailedReasoning ??
            match?.reasoning ??
            match?.shortReasoning,
          aiMatch: match,
          aiRank: match?.rank,
          aiFirstPassScore: match?.firstPassScore,
          aiScoreBreakdown: match?.scoreBreakdown,
          aiBackgroundMultiplier: match?.backgroundMultiplier,
          aiBackgroundCompatibility: toBackgroundCompatibility(
            match?.backgroundCompatibility
          ),
        };
      })
      .sort((a, b) => {
        if (a.aiRank && b.aiRank) return a.aiRank - b.aiRank;
        return (b.aiScore ?? -1) - (a.aiScore ?? -1);
      });
  }, [maleCandidates, aiMatches]);

  const femaleCandidatesWithScores: CandidateWithAiData[] = useMemo(() => {
    if (aiMatches.length === 0) return femaleCandidates;
    const matchMap = new Map(aiMatches.map((m) => [m.userId, m]));

    return femaleCandidates
      .map((c): CandidateWithAiData => {
        const match = matchMap.get(c.id);
        return {
          ...c,
          aiScore: match?.finalScore ?? match?.score,
          aiReasoning:
            match?.detailedReasoning ??
            match?.reasoning ??
            match?.shortReasoning,
          aiMatch: match,
          aiRank: match?.rank,
          aiFirstPassScore: match?.firstPassScore,
          aiScoreBreakdown: match?.scoreBreakdown,
          aiBackgroundMultiplier: match?.backgroundMultiplier,
          aiBackgroundCompatibility: toBackgroundCompatibility(
            match?.backgroundCompatibility
          ),
        };
      })
      .sort((a, b) => {
        if (a.aiRank && b.aiRank) return a.aiRank - b.aiRank;
        return (b.aiScore ?? -1) - (a.aiScore ?? -1);
      });
  }, [femaleCandidates, aiMatches]);

  const renderPanelHeader = (
    gender: 'male' | 'female',
    isMobileView: boolean = false
  ) => {
    const panelGenderEnum = gender === 'male' ? Gender.MALE : Gender.FEMALE;
    const isTargetPanel = aiTargetCandidate?.profile.gender === panelGenderEnum;
    const isSearchPanel = !!(
      aiTargetCandidate && aiTargetCandidate.profile.gender !== panelGenderEnum
    );
    const count =
      gender === 'male' ? maleCandidates.length : femaleCandidates.length;

    return (
      <PanelHeaderComponent
        gender={gender}
        count={count}
        aiTargetCandidate={aiTargetCandidate}
        isSearchPanel={isSearchPanel}
        isTargetPanel={isTargetPanel}
        onClearAiTarget={onClearAiTarget}
        onFindAiMatches={handleFindAiMatches}
        isAiLoading={isAiLoading}
        isMobileView={isMobileView}
        dict={dict.candidatesManager.splitView.panelHeaders}
        aiMatchMeta={aiMatchMeta}
        aiMatchesCount={aiMatches.length}
      />
    );
  };

  const renderCandidatesListForMobile = (
    candidates: CandidateWithAiData[],
    gender: 'male' | 'female',
    searchQuery: string,
    onSearchChange?: (query: string) => void
  ) => {
    if (isLoading) return <LoadingComponent gender={gender} />;
    if (candidates.length === 0)
      return (
        <EmptyStateComponent
          gender={gender}
          searchQuery={searchQuery}
          onClearSearch={() => onSearchChange?.('')}
          dict={dict.candidatesManager.list.emptyState}
        />
      );
    return (
      <CandidatesList
        candidates={candidates}
        allCandidates={allCandidates}
        onOpenAiAnalysis={onOpenAiAnalysis}
        onCandidateClick={onCandidateClick}
        onSendProfileFeedback={onSendProfileFeedback}
        onCandidateAction={onCandidateAction}
        viewMode={viewMode}
        mobileView={mobileView}
        isLoading={isLoading}
        highlightTerm={searchQuery}
        aiTargetCandidate={aiTargetCandidate}
        onSetAiTarget={onSetAiTarget}
        comparisonSelection={comparisonSelection}
        onToggleComparison={onToggleComparison}
        quickViewSide={gender === 'male' ? 'right' : 'left'}
        isQuickViewEnabled={isQuickViewEnabled}
        dict={dict}
        profileDict={profileDict}
        locale={locale}
      />
    );
  };

  // MOBILE VIEW
  if (isMobile) {
    return (
      <div className={cn('flex flex-col h-full', className)}>
        <Tabs
          defaultValue="male"
          className="flex flex-col h-full overflow-hidden"
        >
          <TabsList className="grid grid-cols-2 mx-4 mb-2 bg-gradient-to-r from-blue-100 to-purple-100 p-1 rounded-xl shadow-lg">
            <TabsTrigger
              value="male"
              className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-700 transition-all"
            >
              <Target className="w-4 h-4 ml-1" />
              {dict.candidatesManager.splitView.panelHeaders.male.title} (
              {maleCandidates.length})
            </TabsTrigger>
            <TabsTrigger
              value="female"
              className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 transition-all"
            >
              <Crown className="w-4 h-4 ml-1" />
              {dict.candidatesManager.splitView.panelHeaders.female.title} (
              {femaleCandidates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="male" className="mt-4 flex-1 min-h-0">
            <Card className="p-4 flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-blue-50/30 rounded-2xl">
              {aiTargetCandidate &&
                aiTargetCandidate.profile.gender === 'FEMALE' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex gap-2"
                  >
                    <Button
                      onClick={(e) => handleFindAiMatches(e, false)}
                      disabled={isAiLoading}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg font-bold rounded-xl"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      ) : (
                        <Sparkles className="w-5 h-5 ml-2" />
                      )}
                      {isAiLoading
                        ? 'סורק...'
                        : `מצא התאמות AI (${maleCandidates.length})`}
                    </Button>
                    {aiMatchMeta?.fromCache && aiMatches.length > 0 && (
                      <Button
                        onClick={(e) => handleFindAiMatches(e, true)}
                        disabled={isAiLoading}
                        variant="outline"
                        className="h-12 px-4 rounded-xl"
                      >
                        <RefreshCw
                          className={cn(
                            'w-5 h-5',
                            isAiLoading && 'animate-spin'
                          )}
                        />
                      </Button>
                    )}
                  </motion.div>
                )}
              <AnimatePresence>
                {isAiLoading &&
                  aiTargetCandidate?.profile.gender === 'FEMALE' && (
                    <AiLoadingProgress
                      isLoading={isAiLoading}
                      progress={jobProgress}
                      stage={jobStage}
                      gender="male"
                    />
                  )}
              </AnimatePresence>
              {separateFiltering && onMaleSearchChange && (
                <div className="mb-4 w-full">
                  <SearchBar
                    value={maleSearchQuery}
                    onChange={onMaleSearchChange}
                    placeholder={
                      dict.candidatesManager.searchBar.malePlaceholder
                    }
                    genderTarget="male"
                    separateMode={true}
                    dict={dict.candidatesManager.searchBar}
                  />
                </div>
              )}
              <div className="flex-grow min-h-0 overflow-y-auto">
                {renderCandidatesListForMobile(
                  maleCandidatesWithScores,
                  'male',
                  maleSearchQuery,
                  onMaleSearchChange
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="female" className="mt-4 flex-1 min-h-0">
            <Card className="p-4 flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-purple-50/30 rounded-2xl">
              {aiTargetCandidate &&
                aiTargetCandidate.profile.gender === 'MALE' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 flex gap-2"
                  >
                    <Button
                      onClick={(e) => handleFindAiMatches(e, false)}
                      disabled={isAiLoading}
                      className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg font-bold rounded-xl"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      ) : (
                        <Sparkles className="w-5 h-5 ml-2" />
                      )}
                      {isAiLoading
                        ? 'סורק...'
                        : `מצא התאמות AI (${femaleCandidates.length})`}
                    </Button>
                    {aiMatchMeta?.fromCache && aiMatches.length > 0 && (
                      <Button
                        onClick={(e) => handleFindAiMatches(e, true)}
                        disabled={isAiLoading}
                        variant="outline"
                        className="h-12 px-4 rounded-xl"
                      >
                        <RefreshCw
                          className={cn(
                            'w-5 h-5',
                            isAiLoading && 'animate-spin'
                          )}
                        />
                      </Button>
                    )}
                  </motion.div>
                )}
              <AnimatePresence>
                {isAiLoading &&
                  aiTargetCandidate?.profile.gender === 'MALE' && (
                    <AiLoadingProgress
                      isLoading={isAiLoading}
                      progress={jobProgress}
                      stage={jobStage}
                      gender="female"
                    />
                  )}
              </AnimatePresence>
              {separateFiltering && onFemaleSearchChange && (
                <div className="mb-4 w-full">
                  <SearchBar
                    value={femaleSearchQuery}
                    onChange={onFemaleSearchChange}
                    placeholder={
                      dict.candidatesManager.searchBar.femalePlaceholder
                    }
                    genderTarget="female"
                    separateMode={true}
                    dict={dict.candidatesManager.searchBar}
                  />
                </div>
              )}
              <div className="flex-grow min-h-0 overflow-y-auto">
                {renderCandidatesListForMobile(
                  femaleCandidatesWithScores,
                  'female',
                  femaleSearchQuery,
                  onFemaleSearchChange
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // DESKTOP VIEW
  return (
    <div className={cn('h-full', className)}>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full rounded-2xl bg-white shadow-2xl border-0 overflow-hidden"
      >
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50/20">
            {renderPanelHeader('male')}
            <AnimatePresence>
              {isAiLoading &&
                aiTargetCandidate?.profile.gender === 'FEMALE' && (
                  <AiLoadingProgress
                    isLoading={isAiLoading}
                    progress={jobProgress}
                    stage={jobStage}
                    gender="male"
                  />
                )}
            </AnimatePresence>
            {separateFiltering && onMaleSearchChange && (
              <div className="p-4 bg-blue-50/30 w-full">
                <SearchBar
                  value={maleSearchQuery}
                  onChange={onMaleSearchChange}
                  placeholder={dict.candidatesManager.searchBar.malePlaceholder}
                  genderTarget="male"
                  separateMode={true}
                  dict={dict.candidatesManager.searchBar}
                />
              </div>
            )}
            <div className="flex-grow min-h-0 overflow-y-auto p-4">
              <CandidatesList
                candidates={maleCandidatesWithScores}
                allCandidates={allCandidates}
                onOpenAiAnalysis={onOpenAiAnalysis}
                onSendProfileFeedback={onSendProfileFeedback}
                onCandidateClick={onCandidateClick}
                onCandidateAction={onCandidateAction}
                viewMode={viewMode}
                mobileView={mobileView}
                isLoading={isLoading}
                highlightTerm={maleSearchQuery}
                aiTargetCandidate={aiTargetCandidate}
                onSetAiTarget={onSetAiTarget}
                comparisonSelection={comparisonSelection}
                onToggleComparison={onToggleComparison}
                quickViewSide="right"
                isQuickViewEnabled={isQuickViewEnabled}
                dict={dict}
                profileDict={profileDict}
                locale={locale}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-gradient-to-b from-indigo-300 to-purple-300 hover:from-indigo-400 hover:to-purple-400 transition-colors w-2"
        />

        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full bg-gradient-to-b from-white to-purple-50/20">
            {renderPanelHeader('female')}
            <AnimatePresence>
              {isAiLoading && aiTargetCandidate?.profile.gender === 'MALE' && (
                <AiLoadingProgress
                  isLoading={isAiLoading}
                  progress={jobProgress}
                  stage={jobStage}
                  gender="female"
                />
              )}
            </AnimatePresence>
            {separateFiltering && onFemaleSearchChange && (
              <div className="p-4 bg-purple-50/30 w-full">
                <SearchBar
                  value={femaleSearchQuery}
                  onChange={onFemaleSearchChange}
                  placeholder={
                    dict.candidatesManager.searchBar.femalePlaceholder
                  }
                  genderTarget="female"
                  separateMode={true}
                  dict={dict.candidatesManager.searchBar}
                />
              </div>
            )}
            <div className="flex-grow min-h-0 overflow-y-auto p-4">
              <CandidatesList
                candidates={femaleCandidatesWithScores}
                allCandidates={allCandidates}
                onOpenAiAnalysis={onOpenAiAnalysis}
                onSendProfileFeedback={onSendProfileFeedback}
                onCandidateClick={onCandidateClick}
                onCandidateAction={onCandidateAction}
                viewMode={viewMode}
                mobileView={mobileView}
                isLoading={isLoading}
                highlightTerm={femaleSearchQuery}
                aiTargetCandidate={aiTargetCandidate}
                onSetAiTarget={onSetAiTarget}
                comparisonSelection={comparisonSelection}
                onToggleComparison={onToggleComparison}
                quickViewSide="left"
                isQuickViewEnabled={isQuickViewEnabled}
                dict={dict}
                profileDict={profileDict}
                locale={locale}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SplitView;
