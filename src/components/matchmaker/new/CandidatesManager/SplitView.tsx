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
  Brain,
  MessageSquare,
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
  // Vector search specific
  similarity?: number;
}

// Interface למטא-דאטה של החיפוש
interface AiMatchMeta {
  fromCache: boolean;
  savedAt?: string;
  isStale?: boolean;
  algorithmVersion: string;
  totalCandidatesScanned?: number;
  durationMs?: number;
}

// סוג שיטת החיפוש
type SearchMethod = 'algorithmic' | 'vector';

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
  aiSimilarity?: number;
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
// AI REASONING DISPLAY COMPONENT - הצגת הערת ה-AI
// ============================================================================

const AiReasoningDisplay: React.FC<{
  reasoning?: string;
  similarity?: number;
  method?: SearchMethod;
  className?: string;
}> = ({ reasoning, similarity, method, className }) => {
  if (!reasoning && !similarity) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mt-2 p-3 rounded-lg text-sm',
        method === 'vector'
          ? 'bg-blue-50 border border-blue-100'
          : 'bg-purple-50 border border-purple-100',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <MessageSquare
          className={cn(
            'w-4 h-4 mt-0.5 flex-shrink-0',
            method === 'vector' ? 'text-blue-500' : 'text-purple-500'
          )}
        />
        <div className="flex-1">
          {similarity !== undefined && (
            <div className="text-xs text-gray-500 mb-1">
              דמיון וקטורי: {(similarity * 100).toFixed(1)}%
            </div>
          )}
          {reasoning && (
            <p className="text-gray-700 leading-relaxed">{reasoning}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// CACHE INFO BADGE COMPONENT
// ============================================================================

const CacheInfoBadge: React.FC<{
  meta: AiMatchMeta | null;
  matchesCount: number;
  method?: SearchMethod;
}> = ({ meta, matchesCount, method }) => {
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

  const methodLabel = method === 'vector' ? 'וקטורי' : 'AI';

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
            <span>
              {methodLabel} ישן ({formatDate(meta.savedAt)})
            </span>
          </>
        ) : (
          <>
            <Database className="w-3 h-3" />
            <span>
              {methodLabel} שמור ({formatDate(meta.savedAt)})
            </span>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border',
        method === 'vector'
          ? 'bg-blue-100 text-blue-700 border-blue-200'
          : 'bg-purple-100 text-purple-700 border-purple-200'
      )}
    >
      {method === 'vector' ? (
        <Zap className="w-3 h-3" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      <span>חדש</span>
      {meta.totalCandidatesScanned && (
        <span className="opacity-70">
          ({meta.totalCandidatesScanned} נסרקו)
        </span>
      )}
      {meta.durationMs && (
        <span className="opacity-70">
          • {Math.round(meta.durationMs / 1000)}
        </span>
      )}
    </motion.div>
  );
};

// ============================================================================
// SEARCH METHOD TABS COMPONENT - טאבים לבחירת שיטת חיפוש
// ============================================================================

const SearchMethodTabs: React.FC<{
  activeMethod: SearchMethod;
  onMethodChange: (method: SearchMethod) => void;
  algorithmicCount: number;
  vectorCount: number;
  isLoading: boolean;
}> = ({
  activeMethod,
  onMethodChange,
  algorithmicCount,
  vectorCount,
  isLoading,
}) => {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onMethodChange('algorithmic')}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          activeMethod === 'algorithmic'
            ? 'bg-white shadow-sm text-purple-700'
            : 'text-gray-600 hover:text-gray-800'
        )}
      >
        <Brain className="w-4 h-4" />
        <span>AI מתקדם</span>
        {algorithmicCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {algorithmicCount}
          </Badge>
        )}
      </button>
      <button
        onClick={() => onMethodChange('vector')}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          activeMethod === 'vector'
            ? 'bg-white shadow-sm text-blue-700'
            : 'text-gray-600 hover:text-gray-800'
        )}
      >
        <Zap className="w-4 h-4" />
        <span>דמיון מהיר</span>
        {vectorCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {vectorCount}
          </Badge>
        )}
      </button>
    </div>
  );
};

// ============================================================================
// PANEL HEADER COMPONENT - מעודכן עם שני כפתורי חיפוש
// ============================================================================

const PanelHeaderComponent: React.FC<{
  gender: 'male' | 'female';
  count: number;
  aiTargetCandidate: Candidate | null;
  isSearchPanel: boolean;
  isTargetPanel: boolean;
  onClearAiTarget: (e: React.MouseEvent) => void;
  onFindAiMatches: (
    e: React.MouseEvent,
    forceRefresh: boolean,
    method: SearchMethod
  ) => void;
  isAiLoading: boolean;
  currentSearchMethod: SearchMethod;
  isMobileView?: boolean;
  dict: MatchmakerPageDictionary['candidatesManager']['splitView']['panelHeaders'];
  aiMatchMeta: AiMatchMeta | null;
  vectorMatchMeta: AiMatchMeta | null;
  aiMatchesCount: number;
  vectorMatchesCount: number;
  activeResultsTab: SearchMethod;
  onResultsTabChange: (method: SearchMethod) => void;
}> = ({
  gender,
  count,
  aiTargetCandidate,
  isSearchPanel,
  isTargetPanel,
  onClearAiTarget,
  onFindAiMatches,
  isAiLoading,
  currentSearchMethod,
  isMobileView = false,
  dict,
  aiMatchMeta,
  vectorMatchMeta,
  aiMatchesCount,
  vectorMatchesCount,
  activeResultsTab,
  onResultsTabChange,
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

  const hasAnyResults = aiMatchesCount > 0 || vectorMatchesCount > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 p-4 rounded-t-2xl',
        !isMobileView &&
          `bg-gradient-to-r ${config.colors.bg} border-b border-gray-100/50`
      )}
    >
      {/* Header Row */}
      <div className="flex justify-between items-center">
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

        {/* Target indicator */}
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
      </div>

      {/* Search buttons - only show on search panel */}
      {isSearchPanel && (
        <div className="flex flex-col gap-2">
          {/* Two search buttons */}
          <div className="flex gap-2">
            {/* כפתור חיפוש AI מתקדם */}
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }}>
              <Button
                onClick={(e) => onFindAiMatches(e, false, 'algorithmic')}
                disabled={isAiLoading}
                className={cn(
                  'w-full h-11 font-bold transition-all duration-300 shadow-lg',
                  'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white',
                  isAiLoading &&
                    currentSearchMethod === 'algorithmic' &&
                    'opacity-70'
                )}
              >
                {isAiLoading && currentSearchMethod === 'algorithmic' ? (
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                ) : (
                  <Brain className="w-5 h-5 ml-2" />
                )}
                <span>חיפוש AI מתקדם</span>
              </Button>
            </motion.div>

            {/* כפתור חיפוש דמיון מהיר */}
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }}>
              <Button
                onClick={(e) => onFindAiMatches(e, false, 'vector')}
                disabled={isAiLoading}
                className={cn(
                  'w-full h-11 font-bold transition-all duration-300 shadow-lg',
                  'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white',
                  isAiLoading &&
                    currentSearchMethod === 'vector' &&
                    'opacity-70'
                )}
              >
                {isAiLoading && currentSearchMethod === 'vector' ? (
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                ) : (
                  <Zap className="w-5 h-5 ml-2" />
                )}
                <span>דמיון מהיר ⚡</span>
              </Button>
            </motion.div>

            {/* Refresh button */}
            {hasAnyResults && (
              <Button
                size="icon"
                variant="outline"
                onClick={(e) => onFindAiMatches(e, true, activeResultsTab)}
                disabled={isAiLoading}
                className="h-11 w-11"
              >
                <RefreshCw
                  className={cn('w-5 h-5', isAiLoading && 'animate-spin')}
                />
              </Button>
            )}
          </div>

          {/* Time estimates */}
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="flex-1 text-center">~80 שניות • ניתוח מעמיק</span>
            <span className="flex-1 text-center">~30 שניות • חיפוש דמיון</span>
          </div>

          {/* Results tabs - show when we have results */}
          {hasAnyResults && (
            <div className="flex items-center justify-between mt-2">
              <SearchMethodTabs
                activeMethod={activeResultsTab}
                onMethodChange={onResultsTabChange}
                algorithmicCount={aiMatchesCount}
                vectorCount={vectorMatchesCount}
                isLoading={isAiLoading}
              />
              <CacheInfoBadge
                meta={
                  activeResultsTab === 'vector' ? vectorMatchMeta : aiMatchMeta
                }
                matchesCount={
                  activeResultsTab === 'vector'
                    ? vectorMatchesCount
                    : aiMatchesCount
                }
                method={activeResultsTab}
              />
            </div>
          )}
        </div>
      )}
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
// AI LOADING PROGRESS COMPONENT - מעודכן עם תמיכה בשיטות שונות
// ============================================================================

const AiLoadingProgress: React.FC<{
  isLoading: boolean;
  gender: 'male' | 'female';
  method: SearchMethod;
}> = ({ isLoading, gender, method }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>('fetching');

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setStage('fetching');
      return;
    }

    // Different stages based on method
    const stages =
      method === 'vector'
        ? [
            { name: 'vector_search', duration: 2000, progressEnd: 30 },
            { name: 'filtering', duration: 1000, progressEnd: 50 },
            { name: 'ai_ranking', duration: 25000, progressEnd: 95 },
            { name: 'saving', duration: 2000, progressEnd: 100 },
          ]
        : [
            { name: 'fetching', duration: 2000, progressEnd: 10 },
            { name: 'scoring', duration: 2000, progressEnd: 20 },
            { name: 'analyzing', duration: 40000, progressEnd: 70 },
            { name: 'deep', duration: 30000, progressEnd: 95 },
            { name: 'saving', duration: 3000, progressEnd: 100 },
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
  }, [isLoading, method]);

  if (!isLoading) return null;

  const stageLabels: Record<string, string> = {
    // Vector stages
    vector_search: 'מחפש פרופילים דומים...',
    filtering: 'מסנן תוצאות...',
    ai_ranking: 'מדרג עם AI...',
    // Algorithmic stages
    fetching: 'שולף מועמדים רלוונטיים...',
    scoring: 'מחשב ציונים אלגוריתמיים...',
    analyzing: 'מנתח התאמות (סריקה ראשונית)...',
    deep: 'ניתוח מעמיק של המובילים...',
    saving: 'שומר תוצאות...',
  };

  const config =
    gender === 'male'
      ? {
          gradient:
            method === 'vector'
              ? 'from-blue-500 to-cyan-500'
              : 'from-blue-500 to-cyan-500',
          bg: method === 'vector' ? 'bg-blue-100' : 'bg-blue-100',
        }
      : {
          gradient:
            method === 'vector'
              ? 'from-blue-500 to-cyan-500'
              : 'from-purple-500 to-pink-500',
          bg: method === 'vector' ? 'bg-blue-100' : 'bg-purple-100',
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-4 mb-4"
    >
      <div className={cn('rounded-xl p-4 shadow-lg', config.bg)}>
        <div className="flex items-center gap-3 mb-3">
          {method === 'vector' ? (
            <Zap className="w-5 h-5 text-blue-600" />
          ) : (
            <Loader2 className="w-5 h-5 animate-spin text-gray-700" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {stageLabels[stage] || 'מעבד...'}
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

  // 🆕 State חדש עבור Vector Search
  const [vectorMatches, setVectorMatches] = useState<AiMatch[]>([]);
  const [vectorMatchMeta, setVectorMatchMeta] = useState<AiMatchMeta | null>(
    null
  );
  const [currentSearchMethod, setCurrentSearchMethod] =
    useState<SearchMethod>('algorithmic');
  const [activeResultsTab, setActiveResultsTab] =
    useState<SearchMethod>('algorithmic');

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 🆕 פונקציה מעודכנת עם תמיכה בשיטות חיפוש שונות
  const handleFindAiMatches = async (
    e: React.MouseEvent,
    forceRefresh: boolean = false,
    method: SearchMethod = 'algorithmic'
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
    setCurrentSearchMethod(method);

    // נקה את התוצאות של השיטה הנוכחית
    if (method === 'vector') {
      setVectorMatches([]);
      setVectorMatchMeta(null);
    } else {
      setAiMatches([]);
      setAiMatchMeta(null);
    }

    const methodName = method === 'vector' ? 'דמיון מהיר' : 'AI מתקדם';

    try {
      toast.loading(`מחפש התאמות (${methodName})...`, {
        id: 'ai-search',
        position: 'top-center',
      });

      console.log(
        `[AI Matching] Starting ${methodName} search for ${aiTargetCandidate.firstName}...`
      );

      const response = await fetch('/api/ai/find-matches-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: aiTargetCandidate.id,
          forceRefresh,
          method, // 👈 שולח את השיטה לשרת
        }),
      });

      const data = await response.json();

      toast.dismiss('ai-search');

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || data.details || 'Failed to fetch matches'
        );
      }

      console.log(
        `[AI Matching] ✅ ${methodName} completed! Found ${data.matches?.length || 0} matches`
      );

      const matches = data.matches || [];
      const meta: AiMatchMeta = {
        fromCache: data.fromCache || false,
        savedAt: data.meta?.savedAt,
        isStale: data.meta?.isStale,
        algorithmVersion: data.meta?.algorithmVersion || 'unknown',
        totalCandidatesScanned: data.meta?.totalCandidatesScanned,
        durationMs: data.meta?.durationMs,
      };

      // עדכון התוצאות לפי השיטה
      if (method === 'vector') {
        setVectorMatches(matches);
        setVectorMatchMeta(meta);
        setActiveResultsTab('vector');
      } else {
        setAiMatches(matches);
        setAiMatchMeta(meta);
        setActiveResultsTab('algorithmic');
      }

      // הודעת הצלחה
      const durationText = meta.durationMs
        ? ` ב-${Math.round(meta.durationMs / 1000)} שניות`
        : '';

      if (meta.fromCache) {
        const savedDate = meta.savedAt
          ? new Date(meta.savedAt).toLocaleDateString('he-IL')
          : 'לא ידוע';

        toast.success(
          `נטענו ${matches.length} התאמות שמורות (${methodName}) 📂`,
          {
            position: 'top-center',
            description: meta.isStale
              ? `התוצאות מ-${savedDate}. מומלץ לרענן.`
              : `עודכן ב-${savedDate}`,
            duration: 4000,
          }
        );
      } else {
        const topMatch = matches[0];
        const scannedText = meta.totalCandidatesScanned
          ? ` (מתוך ${meta.totalCandidatesScanned} שנסרקו)`
          : '';

        toast.success(
          `נמצאו ${matches.length} התאמות (${methodName})${durationText}${scannedText} 🎯`,
          {
            position: 'top-center',
            description: topMatch
              ? `התאמה מובילה: ${topMatch.firstName} ${topMatch.lastName} (${topMatch.finalScore || topMatch.score}%)`
              : undefined,
            duration: 5000,
          }
        );
      }
    } catch (error) {
      toast.dismiss('ai-search');
      console.error('[AI Matching] ❌ Error:', error);
      toast.error(`שגיאה בחיפוש ${methodName}`, {
        description:
          error instanceof Error ? error.message : 'נסה שוב מאוחר יותר.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // 🆕 פונקציה לקבלת התוצאות הפעילות
  const getActiveMatches = (): AiMatch[] => {
    return activeResultsTab === 'vector' ? vectorMatches : aiMatches;
  };

  // 🔧 מיזוג מועמדים עם ציוני AI - מעודכן לתמוך בשתי שיטות
  const maleCandidatesWithScores: CandidateWithAiData[] = useMemo(() => {
    const activeMatches = getActiveMatches();
    if (activeMatches.length === 0) return maleCandidates;
    const matchMap = new Map(activeMatches.map((m) => [m.userId, m]));

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
          aiSimilarity: match?.similarity,
        };
      })
      .sort((a, b) => {
        if (a.aiRank && b.aiRank) return a.aiRank - b.aiRank;
        return (b.aiScore ?? -1) - (a.aiScore ?? -1);
      });
  }, [maleCandidates, aiMatches, vectorMatches, activeResultsTab]);

  const femaleCandidatesWithScores: CandidateWithAiData[] = useMemo(() => {
    const activeMatches = getActiveMatches();
    if (activeMatches.length === 0) return femaleCandidates;
    const matchMap = new Map(activeMatches.map((m) => [m.userId, m]));

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
          aiSimilarity: match?.similarity,
        };
      })
      .sort((a, b) => {
        if (a.aiRank && b.aiRank) return a.aiRank - b.aiRank;
        return (b.aiScore ?? -1) - (a.aiScore ?? -1);
      });
  }, [femaleCandidates, aiMatches, vectorMatches, activeResultsTab]);

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
        currentSearchMethod={currentSearchMethod}
        isMobileView={isMobileView}
        dict={dict.candidatesManager.splitView.panelHeaders}
        aiMatchMeta={aiMatchMeta}
        vectorMatchMeta={vectorMatchMeta}
        aiMatchesCount={aiMatches.length}
        vectorMatchesCount={vectorMatches.length}
        activeResultsTab={activeResultsTab}
        onResultsTabChange={setActiveResultsTab}
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
                    className="mb-4 flex flex-col gap-2"
                  >
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) =>
                          handleFindAiMatches(e, false, 'algorithmic')
                        }
                        disabled={isAiLoading}
                        className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg font-bold rounded-xl"
                      >
                        {isAiLoading &&
                        currentSearchMethod === 'algorithmic' ? (
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        ) : (
                          <Brain className="w-5 h-5 ml-2" />
                        )}
                        AI מתקדם
                      </Button>
                      <Button
                        onClick={(e) => handleFindAiMatches(e, false, 'vector')}
                        disabled={isAiLoading}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg font-bold rounded-xl"
                      >
                        {isAiLoading && currentSearchMethod === 'vector' ? (
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        ) : (
                          <Zap className="w-5 h-5 ml-2" />
                        )}
                        דמיון מהיר ⚡
                      </Button>
                    </div>
                    {(aiMatches.length > 0 || vectorMatches.length > 0) && (
                      <SearchMethodTabs
                        activeMethod={activeResultsTab}
                        onMethodChange={setActiveResultsTab}
                        algorithmicCount={aiMatches.length}
                        vectorCount={vectorMatches.length}
                        isLoading={isAiLoading}
                      />
                    )}
                  </motion.div>
                )}
              <AnimatePresence>
                {isAiLoading &&
                  aiTargetCandidate?.profile.gender === 'FEMALE' && (
                    <AiLoadingProgress
                      isLoading={isAiLoading}
                      gender="male"
                      method={currentSearchMethod}
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
                    className="mb-4 flex flex-col gap-2"
                  >
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) =>
                          handleFindAiMatches(e, false, 'algorithmic')
                        }
                        disabled={isAiLoading}
                        className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg font-bold rounded-xl"
                      >
                        {isAiLoading &&
                        currentSearchMethod === 'algorithmic' ? (
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        ) : (
                          <Brain className="w-5 h-5 ml-2" />
                        )}
                        AI מתקדם
                      </Button>
                      <Button
                        onClick={(e) => handleFindAiMatches(e, false, 'vector')}
                        disabled={isAiLoading}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg font-bold rounded-xl"
                      >
                        {isAiLoading && currentSearchMethod === 'vector' ? (
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        ) : (
                          <Zap className="w-5 h-5 ml-2" />
                        )}
                        דמיון מהיר ⚡
                      </Button>
                    </div>
                    {(aiMatches.length > 0 || vectorMatches.length > 0) && (
                      <SearchMethodTabs
                        activeMethod={activeResultsTab}
                        onMethodChange={setActiveResultsTab}
                        algorithmicCount={aiMatches.length}
                        vectorCount={vectorMatches.length}
                        isLoading={isAiLoading}
                      />
                    )}
                  </motion.div>
                )}
              <AnimatePresence>
                {isAiLoading &&
                  aiTargetCandidate?.profile.gender === 'MALE' && (
                    <AiLoadingProgress
                      isLoading={isAiLoading}
                      gender="female"
                      method={currentSearchMethod}
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
                    gender="male"
                    method={currentSearchMethod}
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
                  gender="female"
                  method={currentSearchMethod}
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
