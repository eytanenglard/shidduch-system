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
  Star,
  X,
  RefreshCw,
  Database,
  Clock,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
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

// 🆕 מבנה ציון מפורט - V3.0
interface ScoreBreakdown {
  religious: number; // מתוך 35
  careerFamily: number; // מתוך 15
  lifestyle: number; // מתוך 15
  ambition: number; // מתוך 12
  communication: number; // מתוך 12
  values: number; // מתוך 11
}

// 🆕 Interface מעודכן עם כל השדות החדשים מ-V3.0
interface AiMatch {
  userId: string;
  firstName?: string;
  lastName?: string;

  // ציונים - תאימות אחורה: score = finalScore
  score?: number; // לתאימות אחורה
  firstPassScore?: number; // 🆕 ציון מהסריקה הראשונית
  finalScore?: number; // 🆕 ציון סופי (אחרי סריקה מעמיקה)

  // פירוט ציונים
  scoreBreakdown?: ScoreBreakdown; // 🆕

  // נימוקים
  reasoning?: string; // לתאימות אחורה
  shortReasoning?: string; // 🆕 מהסריקה הראשונית (משפט אחד)
  detailedReasoning?: string; // 🆕 מהסריקה המעמיקה (3-5 שורות)

  // מטא-דאטה
  rank?: number; // 🆕 דירוג סופי (1-15)
}

// 🆕 Interface חדש למטא-דאטה של החיפוש - מעודכן
interface AiMatchMeta {
  fromCache: boolean;
  savedAt?: string;
  isStale?: boolean;
  algorithmVersion: string;
  totalCandidatesScanned?: number; // 🆕 כמה מועמדים נסרקו
}

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
// 🆕 SCORE BREAKDOWN DISPLAY COMPONENT
// ============================================================================

/**
 * קומפוננטה להצגת פירוט הציון
 */
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

/**
 * Badge שמציג מידע על מקור התוצאות (מטמון/חדש/ישן)
 */
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

  // 🆕 הצגת כמות המועמדים שנסרקו
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
// HELPER COMPONENTS
// ============================================================================

/**
 * קומפוננטת כותרת פאנל משופרת עם אנימציות ומצבי UI שונים
 */
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

      {/* תצוגת סטטוס AI */}
      <div className="flex items-center gap-2">
        {/* Badge מידע על המטמון */}
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
            {/* כפתור חיפוש ראשי */}
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
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
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

            {/* כפתור רענון - מופיע רק אם יש תוצאות מהמטמון */}
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
                  title={
                    aiMatchMeta.isStale
                      ? 'התוצאות ישנות - לחץ לרענון'
                      : 'רענן התאמות'
                  }
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

/**
 * קומפוננטת טעינה אלגנטית עם אנימציות
 */
const LoadingComponent: React.FC<{ gender: 'male' | 'female' }> = ({
  gender,
}) => {
  const config =
    gender === 'male'
      ? {
          gradient: 'from-blue-200 to-cyan-200',
          icon: Target,
          title: 'טוען מועמדים...',
          subtitle: 'אנא המתן בזמן שאנו מביאים את הנתונים',
        }
      : {
          gradient: 'from-purple-200 to-pink-200',
          icon: Crown,
          title: 'טוענת מועמדות...',
          subtitle: 'אנא המתיני בזמן שאנו מביאות את הנתונים',
        };

  const IconComponent = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-64 p-8"
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn(
          'p-6 rounded-full mb-4',
          `bg-gradient-to-r ${config.gradient}`
        )}
      >
        <IconComponent className="w-12 h-12 text-white" />
      </motion.div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-700 mb-2">{config.title}</h3>
        <p className="text-gray-500">{config.subtitle}</p>
      </div>
    </motion.div>
  );
};

/**
 * קומפוננטת מצב ריק משופרת עם הצעות פעולה
 */
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
      <p className="text-gray-600 text-center mb-4 max-w-sm">
        {searchQuery
          ? `לא נמצאו תוצאות עבור "${searchQuery}"`
          : dict.description}
      </p>
      {searchQuery && onClearSearch && (
        <Button
          variant="outline"
          onClick={onClearSearch}
          className="border-2 border-gray-300 hover:border-gray-400"
        >
          <Search className="w-4 h-4 ml-2" />
          נקה חיפוש
        </Button>
      )}
    </motion.div>
  );
};

// ============================================================================
// 🆕 AI LOADING PROGRESS COMPONENT
// ============================================================================

/**
 * קומפוננטה להצגת התקדמות סריקת AI
 */
const AiLoadingProgress: React.FC<{
  isLoading: boolean;
  gender: 'male' | 'female';
}> = ({ isLoading, gender }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<
    'fetching' | 'analyzing' | 'deep' | 'saving'
  >('fetching');

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setStage('fetching');
      return;
    }

    const stages = [
      { name: 'fetching' as const, duration: 2000, progressEnd: 10 },
      { name: 'analyzing' as const, duration: 60000, progressEnd: 70 },
      { name: 'deep' as const, duration: 25000, progressEnd: 95 },
      { name: 'saving' as const, duration: 3000, progressEnd: 100 },
    ];

    let currentStageIndex = 0;
    let stageStartTime = Date.now();

    const interval = setInterval(() => {
      const currentStage = stages[currentStageIndex];
      const elapsed = Date.now() - stageStartTime;
      const stageProgress = Math.min(elapsed / currentStage.duration, 1);

      const prevProgress =
        currentStageIndex > 0 ? stages[currentStageIndex - 1].progressEnd : 0;
      const newProgress =
        prevProgress +
        stageProgress * (currentStage.progressEnd - prevProgress);

      setProgress(Math.min(newProgress, 99));
      setStage(currentStage.name);

      if (stageProgress >= 1 && currentStageIndex < stages.length - 1) {
        currentStageIndex++;
        stageStartTime = Date.now();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const stageLabels = {
    fetching: 'שולף מועמדים רלוונטיים...',
    analyzing: 'מנתח התאמות (סריקה ראשונית)...',
    deep: 'ניתוח מעמיק של המובילים...',
    saving: 'שומר תוצאות...',
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
            {stageLabels[stage]}
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

  // State למטא-דאטה של החיפוש
  const [aiMatchMeta, setAiMatchMeta] = useState<AiMatchMeta | null>(null);

  // זיהוי רספונסיבי
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /**
   * 🆕 לוגיקת חיפוש AI V3.0 - עם סריקה מלאה וניתוח מעמיק
   * @param forceRefresh - האם לאלץ חיפוש חדש (ברירת מחדל: false = משתמש במטמון)
   */
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

    try {
      // קריאה ל-API V3.0
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
        throw new Error(data.error || 'Failed to fetch AI matches');
      }

      // שמירת התוצאות והמטא-דאטה
      setAiMatches(data.matches);
      setAiMatchMeta({
        fromCache: data.fromCache,
        savedAt: data.meta.savedAt,
        isStale: data.meta.isStale,
        algorithmVersion: data.meta.algorithmVersion,
        totalCandidatesScanned: data.meta.totalCandidatesScanned,
      });

      // הודעה מותאמת לפי מקור התוצאות
      if (data.fromCache) {
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
      } else {
        const topMatch = data.matches[0];
        const scannedText = data.meta.totalCandidatesScanned
          ? ` (מתוך ${data.meta.totalCandidatesScanned} שנסרקו)`
          : '';

        toast.success(`נמצאו ${data.matches.length} התאמות!${scannedText} 🎯`, {
          position: 'top-center',
          description: topMatch
            ? `ההתאמה הטובה ביותר: ${topMatch.firstName} ${topMatch.lastName} (${topMatch.finalScore || topMatch.score}%)`
            : 'התוצאות נשמרו למטמון',
          duration: 5000,
        });
      }

      // לוג לפיתוח
      if (process.env.NODE_ENV === 'development') {
        console.log('[AI Matches V3.0] Results:', {
          fromCache: data.fromCache,
          count: data.matches.length,
          totalScanned: data.meta.totalCandidatesScanned,
          meta: data.meta,
          topMatches: data.matches.slice(0, 3).map((m: AiMatch) => ({
            name: `${m.firstName} ${m.lastName}`,
            rank: m.rank,
            firstPassScore: m.firstPassScore,
            finalScore: m.finalScore ?? m.score,
            reasoning:
              (
                m.detailedReasoning ??
                m.reasoning ??
                m.shortReasoning ??
                ''
              ).substring(0, 80) + '...',
          })),
        });
      }
    } catch (error) {
      console.error('Error finding AI matches:', error);
      toast.error('שגיאה במציאת התאמות AI.', {
        description:
          error instanceof Error ? error.message : 'נסה שוב מאוחר יותר.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * 🆕 ציון מועמדים עם ניקוד AI - מעודכן לתמיכה ב-V3.0
   */
  const maleCandidatesWithScores = useMemo(() => {
    if (aiMatches.length === 0) return maleCandidates;

    const matchMap = new Map(aiMatches.map((m) => [m.userId, m]));

    return maleCandidates
      .map((c) => {
        const match = matchMap.get(c.id);
        return {
          ...c,
          // תאימות אחורה: aiScore = finalScore או score
          aiScore: match?.finalScore ?? match?.score,
          // תאימות אחורה: aiReasoning = detailedReasoning או reasoning או shortReasoning
          aiReasoning:
            match?.detailedReasoning ??
            match?.reasoning ??
            match?.shortReasoning,
          // 🆕 שדות חדשים
          aiMatch: match,
          aiRank: match?.rank,
          aiFirstPassScore: match?.firstPassScore,
          aiScoreBreakdown: match?.scoreBreakdown,
        };
      })
      .sort((a, b) => {
        // מיון לפי rank אם קיים, אחרת לפי score
        if (a.aiRank && b.aiRank) {
          return a.aiRank - b.aiRank;
        }
        return (b.aiScore ?? -1) - (a.aiScore ?? -1);
      });
  }, [maleCandidates, aiMatches]);

  const femaleCandidatesWithScores = useMemo(() => {
    if (aiMatches.length === 0) return femaleCandidates;

    const matchMap = new Map(aiMatches.map((m) => [m.userId, m]));

    return femaleCandidates
      .map((c) => {
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
        };
      })
      .sort((a, b) => {
        if (a.aiRank && b.aiRank) {
          return a.aiRank - b.aiRank;
        }
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
    candidates: (Candidate & {
      aiScore?: number;
      aiReasoning?: string;
      aiRank?: number;
      aiFirstPassScore?: number;
      aiScoreBreakdown?: ScoreBreakdown;
    })[],
    gender: 'male' | 'female',
    searchQuery: string,
    onSearchChange?: (query: string) => void
  ) => {
    if (isLoading) {
      return <LoadingComponent gender={gender} />;
    }
    if (candidates.length === 0) {
      return (
        <EmptyStateComponent
          gender={gender}
          searchQuery={searchQuery}
          onClearSearch={() => onSearchChange?.('')}
          dict={dict.candidatesManager.list.emptyState}
        />
      );
    }
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

  // ============================================================================
  // MOBILE VIEW RENDERING
  // ============================================================================

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

          {/* Male Tab Content */}
          <TabsContent value="male" className="mt-4 flex-1 min-h-0">
            <Card className="p-4 flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-blue-50/30 rounded-2xl">
              {/* AI Action Button for Male Tab */}
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
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2 relative z-10" />
                          <span className="relative z-10">
                            סורק את כל המועמדים...
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 ml-2 relative z-10" />
                          <span className="relative z-10">
                            מצא התאמות AI ({maleCandidates.length})
                          </span>
                          <Zap className="w-4 h-4 mr-2 relative z-10" />
                        </>
                      )}
                    </Button>
                    {/* כפתור רענון במובייל */}
                    {aiMatchMeta?.fromCache && aiMatches.length > 0 && (
                      <Button
                        onClick={(e) => handleFindAiMatches(e, true)}
                        disabled={isAiLoading}
                        variant="outline"
                        className={cn(
                          'h-12 px-4 rounded-xl',
                          aiMatchMeta.isStale
                            ? 'border-amber-300 text-amber-600'
                            : 'border-gray-300'
                        )}
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

              {/* AI Loading Progress */}
              <AnimatePresence>
                {isAiLoading &&
                  aiTargetCandidate?.profile.gender === 'FEMALE' && (
                    <AiLoadingProgress isLoading={isAiLoading} gender="male" />
                  )}
              </AnimatePresence>

              {/* Search Bar */}
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

              {/* Candidates List */}
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

          {/* Female Tab Content */}
          <TabsContent value="female" className="mt-4 flex-1 min-h-0">
            <Card className="p-4 flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-purple-50/30 rounded-2xl">
              {/* AI Action Button for Female Tab */}
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
                      className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      {isAiLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2 relative z-10" />
                          <span className="relative z-10">
                            סורק את כל המועמדות...
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 ml-2 relative z-10" />
                          <span className="relative z-10">
                            מצא התאמות AI ({femaleCandidates.length})
                          </span>
                          <Zap className="w-4 h-4 mr-2 relative z-10" />
                        </>
                      )}
                    </Button>
                    {/* כפתור רענון במובייל */}
                    {aiMatchMeta?.fromCache && aiMatches.length > 0 && (
                      <Button
                        onClick={(e) => handleFindAiMatches(e, true)}
                        disabled={isAiLoading}
                        variant="outline"
                        className={cn(
                          'h-12 px-4 rounded-xl',
                          aiMatchMeta.isStale
                            ? 'border-amber-300 text-amber-600'
                            : 'border-gray-300'
                        )}
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

              {/* AI Loading Progress */}
              <AnimatePresence>
                {isAiLoading &&
                  aiTargetCandidate?.profile.gender === 'MALE' && (
                    <AiLoadingProgress
                      isLoading={isAiLoading}
                      gender="female"
                    />
                  )}
              </AnimatePresence>

              {/* Search Bar */}
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

              {/* Candidates List */}
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

  // ============================================================================
  // DESKTOP VIEW RENDERING
  // ============================================================================

  return (
    <div className={cn('h-full', className)}>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full rounded-2xl bg-white shadow-2xl border-0 overflow-hidden"
      >
        {/* Male Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full bg-gradient-to-b from-white to-blue-50/20">
            {renderPanelHeader('male')}

            {/* AI Loading Progress */}
            <AnimatePresence>
              {isAiLoading &&
                aiTargetCandidate?.profile.gender === 'FEMALE' && (
                  <AiLoadingProgress isLoading={isAiLoading} gender="male" />
                )}
            </AnimatePresence>

            {/* Search Bar */}
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

            {/* Candidates List */}
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

        {/* Resizable Handle */}
        <ResizableHandle
          withHandle
          className="bg-gradient-to-b from-indigo-300 to-purple-300 hover:from-indigo-400 hover:to-purple-400 transition-colors w-2"
        />

        {/* Female Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full bg-gradient-to-b from-white to-purple-50/20">
            {renderPanelHeader('female')}

            {/* AI Loading Progress */}
            <AnimatePresence>
              {isAiLoading && aiTargetCandidate?.profile.gender === 'MALE' && (
                <AiLoadingProgress isLoading={isAiLoading} gender="female" />
              )}
            </AnimatePresence>

            {/* Search Bar */}
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

            {/* Candidates List */}
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
