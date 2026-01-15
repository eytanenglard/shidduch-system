// File: src/components/matchmaker/new/CandidatesManager/SplitView.tsx
'use client';

import React, { useMemo, useEffect, useState, useCallback } from 'react';
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
  CheckCircle2,
  X,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

// 🆕 Import the global context
import {
  useMatchingJobContext,
  type SearchMethod,
  type MatchResult,
} from '@/app/[locale]/contexts/MatchingJobContext';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type BackgroundCompatibility =
  | 'excellent'
  | 'good'
  | 'possible'
  | 'problematic'
  | 'not_recommended';

interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

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
  similarity?: number;
}

interface AiMatchMeta {
  fromCache: boolean;
  savedAt?: string;
  isStale?: boolean;
  algorithmVersion: string;
  totalCandidatesScanned?: number;
  durationMs?: number;
}

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
// AI REASONING DISPLAY COMPONENT
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
    </motion.div>
  );
};

// ============================================================================
// SEARCH METHOD TABS COMPONENT
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
// 🆕 INLINE PROGRESS COMPONENT - Progress קטן בתוך הכפתורים
// ============================================================================

const InlineJobProgress: React.FC<{
  progress: number;
  progressMessage: string;
  method: SearchMethod;
  onCancel: () => void;
}> = ({ progress, progressMessage, method, onCancel }) => {
  const isVector = method === 'vector';
  const gradientClass = isVector
    ? 'from-blue-500 to-cyan-500'
    : 'from-purple-500 to-pink-500';
  const bgClass = isVector ? 'bg-blue-50' : 'bg-purple-50';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn('rounded-lg p-3 border', bgClass)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2
            className={cn(
              'w-4 h-4 animate-spin',
              isVector ? 'text-blue-600' : 'text-purple-600'
            )}
          />
          <span className="text-sm font-medium text-gray-700">
            {progressMessage || 'מעבד...'}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      <div className="relative">
        <Progress value={progress} className="h-2" />
      </div>

      <div className="flex justify-between mt-1 text-xs text-gray-500">
        <span>{progress}%</span>
        <span>רץ ברקע - ניתן להמשיך לעבוד</span>
      </div>
    </motion.div>
  );
};

// ============================================================================
// 🆕 JOB COMPLETE BANNER
// ============================================================================

const JobCompleteBanner: React.FC<{
  matchesCount: number;
  targetName: string;
  method: SearchMethod;
  onViewResults: () => void;
  onDismiss: () => void;
}> = ({ matchesCount, targetName, method, onViewResults, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <span className="font-medium text-green-800">
              נמצאו {matchesCount} התאמות עבור {targetName}!
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onViewResults}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Sparkles className="w-4 h-4 ml-1" />
            הצג
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
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
  // 🆕 Props from context
  jobProgress: number;
  jobProgressMessage: string;
  jobStatus: string;
  onCancelJob: () => void;
  showCompleteBanner: boolean;
  onDismissBanner: () => void;
  onViewResults: () => void;
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
  jobProgress,
  jobProgressMessage,
  jobStatus,
  onCancelJob,
  showCompleteBanner,
  onDismissBanner,
  onViewResults,
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
  const isJobRunning = jobStatus === 'pending' || jobStatus === 'processing';

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
          {/* 🆕 Show completion banner if job just completed */}
          <AnimatePresence>
            {showCompleteBanner && (
              <JobCompleteBanner
                matchesCount={
                  activeResultsTab === 'vector'
                    ? vectorMatchesCount
                    : aiMatchesCount
                }
                targetName={aiTargetCandidate?.firstName || 'המועמד'}
                method={currentSearchMethod}
                onViewResults={onViewResults}
                onDismiss={onDismissBanner}
              />
            )}
          </AnimatePresence>

          {/* 🆕 Show progress if job is running */}
          <AnimatePresence>
            {isJobRunning && (
              <InlineJobProgress
                progress={jobProgress}
                progressMessage={jobProgressMessage}
                method={currentSearchMethod}
                onCancel={onCancelJob}
              />
            )}
          </AnimatePresence>

          {/* Search buttons - always visible, not disabled during search */}
          {!isJobRunning && !showCompleteBanner && (
            <>
              <div className="flex gap-2">
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }}>
                  <Button
                    onClick={(e) => onFindAiMatches(e, false, 'algorithmic')}
                    className={cn(
                      'w-full h-11 font-bold transition-all duration-300 shadow-lg',
                      'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                    )}
                  >
                    <Brain className="w-5 h-5 ml-2" />
                    <span>חיפוש AI מתקדם</span>
                  </Button>
                </motion.div>

                <motion.div className="flex-1" whileHover={{ scale: 1.02 }}>
                  <Button
                    onClick={(e) => onFindAiMatches(e, false, 'vector')}
                    className={cn(
                      'w-full h-11 font-bold transition-all duration-300 shadow-lg',
                      'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                    )}
                  >
                    <Zap className="w-5 h-5 ml-2" />
                    <span>דמיון מהיר ⚡</span>
                  </Button>
                </motion.div>

                {hasAnyResults && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={(e) => onFindAiMatches(e, true, activeResultsTab)}
                    className="h-11 w-11"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <div className="flex gap-2 text-xs text-gray-500">
                <span className="flex-1 text-center">
                  ~3-5 דקות • ניתוח מעמיק
                </span>
                <span className="flex-1 text-center">
                  ~30 שניות • חיפוש דמיון
                </span>
              </div>
            </>
          )}

          {/* Results tabs */}
          {hasAnyResults && !isJobRunning && (
            <div className="flex items-center justify-between mt-2">
              <SearchMethodTabs
                activeMethod={activeResultsTab}
                onMethodChange={onResultsTabChange}
                algorithmicCount={aiMatchesCount}
                vectorCount={vectorMatchesCount}
                isLoading={isJobRunning}
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
// HELPER FUNCTION
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

  // 🆕 Use global context
  const matchingJobContext = useMatchingJobContext();
  const { currentJob, startJob, cancelJob, isJobRunning, onJobComplete } =
    matchingJobContext;

  const [isMobile, setIsMobile] = useState(false);
  const [aiMatchMeta, setAiMatchMeta] = useState<AiMatchMeta | null>(null);
  const [vectorMatches, setVectorMatches] = useState<AiMatch[]>([]);
  const [vectorMatchMeta, setVectorMatchMeta] = useState<AiMatchMeta | null>(
    null
  );
  const [currentSearchMethod, setCurrentSearchMethod] =
    useState<SearchMethod>('algorithmic');
  const [activeResultsTab, setActiveResultsTab] =
    useState<SearchMethod>('algorithmic');
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 🆕 Subscribe to job completion
  useEffect(() => {
    const unsubscribe = onJobComplete((result) => {
      if (result?.matches) {
        // Update the appropriate state based on method
        if (currentJob.method === 'vector') {
          setVectorMatches(result.matches as AiMatch[]);
          setVectorMatchMeta({
            fromCache: currentJob.fromCache,
            algorithmVersion: result.meta?.algorithmVersion || 'vector-v1',
            totalCandidatesScanned: result.meta?.totalCandidatesScanned,
          });
          setActiveResultsTab('vector');
        } else {
          setAiMatches(result.matches as AiMatch[]);
          setAiMatchMeta({
            fromCache: currentJob.fromCache,
            algorithmVersion: result.meta?.algorithmVersion || 'v3.1',
            totalCandidatesScanned: result.meta?.totalCandidatesScanned,
          });
          setActiveResultsTab('algorithmic');
        }
        setShowCompleteBanner(true);
      }
    });

    return unsubscribe;
  }, [onJobComplete, currentJob.method, currentJob.fromCache, setAiMatches]);

  // 🆕 Listen for "view results" event
  useEffect(() => {
    const handleViewResults = () => {
      setShowCompleteBanner(false);
      const resultsEl = document.getElementById('candidates-results');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('matching-job-view-results', handleViewResults);
    return () =>
      window.removeEventListener(
        'matching-job-view-results',
        handleViewResults
      );
  }, []);

  // 🆕 Updated function - uses global context
  const handleFindAiMatches = useCallback(
    async (
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

      setCurrentSearchMethod(method);
      setShowCompleteBanner(false);

      // Clear previous results for this method
      if (method === 'vector') {
        setVectorMatches([]);
        setVectorMatchMeta(null);
      } else {
        setAiMatches([]);
        setAiMatchMeta(null);
      }

      // 🆕 Use global context to start job
      await startJob(
        aiTargetCandidate.id,
        aiTargetCandidate.firstName,
        method,
        forceRefresh
      );
    },
    [aiTargetCandidate, setAiMatches, startJob]
  );

  const handleViewResults = useCallback(() => {
    setShowCompleteBanner(false);
    const resultsEl = document.getElementById('candidates-results');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Get active matches
  const getActiveMatches = (): AiMatch[] => {
    return activeResultsTab === 'vector' ? vectorMatches : aiMatches;
  };

  // Merge candidates with AI scores
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
        isAiLoading={isJobRunning}
        currentSearchMethod={currentSearchMethod}
        isMobileView={isMobileView}
        dict={dict.candidatesManager.splitView.panelHeaders}
        aiMatchMeta={aiMatchMeta}
        vectorMatchMeta={vectorMatchMeta}
        aiMatchesCount={aiMatches.length}
        vectorMatchesCount={vectorMatches.length}
        activeResultsTab={activeResultsTab}
        onResultsTabChange={setActiveResultsTab}
        // 🆕 Pass context data
        jobProgress={currentJob.progress}
        jobProgressMessage={currentJob.progressMessage}
        jobStatus={currentJob.status}
        onCancelJob={cancelJob}
        showCompleteBanner={showCompleteBanner}
        onDismissBanner={() => setShowCompleteBanner(false)}
        onViewResults={handleViewResults}
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
                  <div className="mb-4">{renderPanelHeader('male', true)}</div>
                )}
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
              <div
                id="candidates-results"
                className="flex-grow min-h-0 overflow-y-auto"
              >
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
                  <div className="mb-4">
                    {renderPanelHeader('female', true)}
                  </div>
                )}
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
              <div
                id="candidates-results"
                className="flex-grow min-h-0 overflow-y-auto"
              >
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
            <div
              id="candidates-results"
              className="flex-grow min-h-0 overflow-y-auto p-4"
            >
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