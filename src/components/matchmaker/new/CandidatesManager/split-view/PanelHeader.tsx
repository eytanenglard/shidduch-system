'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XCircle,
  Target,
  Crown,
  Zap,
  Brain,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Candidate } from '../../types/candidates';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { SearchMethod } from '@/app/[locale]/contexts/MatchingJobContext';
import type { AiMatchMeta } from './types';
import SearchMethodTabs from './SearchMethodTabs';
import CacheInfoBadge from './CacheInfoBadge';
import InlineJobProgress from './InlineJobProgress';
import JobCompleteBanner from './JobCompleteBanner';

export interface PanelHeaderProps {
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
  onRefreshAllMethods: (e: React.MouseEvent) => void;
  isRefreshingAll: boolean;
  isAiLoading: boolean;
  currentSearchMethod: SearchMethod;
  isMobileView?: boolean;
  dict: MatchmakerPageDictionary['candidatesManager']['splitView']['panelHeaders'];
  aiMatchMeta: AiMatchMeta | null;
  vectorMatchMeta: AiMatchMeta | null;
  hybridMatchMeta: AiMatchMeta | null;
  aiMatchesCount: number;
  vectorMatchesCount: number;
  hybridMatchesCount: number;
  activeResultsTab: SearchMethod;
  onResultsTabChange: (method: SearchMethod) => void;
  jobProgress: number;
  jobProgressMessage: string;
  jobStatus: string;
  onCancelJob: () => void;
  showCompleteBanner: boolean;
  onDismissBanner: () => void;
  onViewResults: () => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({
  gender,
  count,
  aiTargetCandidate,
  isSearchPanel,
  isTargetPanel,
  onClearAiTarget,
  onFindAiMatches,
  onRefreshAllMethods,
  isRefreshingAll,
  isAiLoading,
  currentSearchMethod,
  isMobileView = false,
  dict,
  aiMatchMeta,
  vectorMatchMeta,
  hybridMatchMeta,
  aiMatchesCount,
  vectorMatchesCount,
  hybridMatchesCount,
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
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
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
  const hasAnyResults =
    aiMatchesCount > 0 || vectorMatchesCount > 0 || hybridMatchesCount > 0;
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
                `${aiTargetCandidate.firstName} ${aiTargetCandidate.lastName}`
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
          {/* Show completion banner if job just completed */}
          <AnimatePresence>
            {showCompleteBanner && (
              <JobCompleteBanner
                matchesCount={
                  activeResultsTab === 'vector'
                    ? vectorMatchesCount
                    : aiMatchesCount
                }
                targetName={
                  aiTargetCandidate
                    ? `${aiTargetCandidate.firstName} ${aiTargetCandidate.lastName}`
                    : 'המועמד'
                }
                method={currentSearchMethod}
                onViewResults={onViewResults}
                onDismiss={onDismissBanner}
              />
            )}
          </AnimatePresence>

          {/* Show progress if job is running */}
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
              <div className="flex gap-2 flex-wrap">
                {/* AI advanced button */}
                <motion.div
                  className="flex-1 min-w-[120px]"
                  whileHover={{ scale: 1.02 }}
                >
                  <Button
                    onClick={(e) => onFindAiMatches(e, false, 'algorithmic')}
                    className={cn(
                      'w-full h-11 font-bold transition-all duration-300 shadow-lg px-2 sm:px-4',
                      'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white'
                    )}
                  >
                    <Brain className="w-5 h-5 ml-1.5 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">
                      AI מתקדם
                    </span>
                  </Button>
                </motion.div>

                {/* Fast similarity button */}
                <motion.div
                  className="flex-1 min-w-[120px]"
                  whileHover={{ scale: 1.02 }}
                >
                  <Button
                    onClick={(e) => onFindAiMatches(e, false, 'vector')}
                    className={cn(
                      'w-full h-11 font-bold transition-all duration-300 shadow-lg px-2 sm:px-4',
                      'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
                    )}
                  >
                    <Zap className="w-5 h-5 ml-1.5 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">
                      דמיון מהיר ⚡
                    </span>
                  </Button>
                </motion.div>

                {/* Hybrid scan button */}
                <motion.div
                  className="flex-1 min-w-[120px]"
                  whileHover={{ scale: 1.02 }}
                >
                  <Button
                    onClick={(e) => onFindAiMatches(e, false, 'hybrid')}
                    className={cn(
                      'w-full h-11 font-bold transition-all duration-300 shadow-lg px-2 sm:px-4',
                      'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                    )}
                  >
                    <Users className="w-5 h-5 ml-1.5 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">
                      היברידי 🔥
                    </span>
                  </Button>
                </motion.div>
                <motion.div
                  className="flex-1 min-w-[120px]"
                  whileHover={{ scale: 1.02 }}
                >
                  <Button
                    onClick={(e) => onFindAiMatches(e, false, 'metrics_v2')}
                    className={cn(
                      'w-full h-11 font-bold transition-all duration-300 shadow-lg px-2 sm:px-4',
                      'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white'
                    )}
                  >
                    <Target className="w-5 h-5 ml-1.5 flex-shrink-0" />
                    <span className="truncate text-xs sm:text-sm">
                      מדדים V2 🎯
                    </span>
                  </Button>
                </motion.div>
                {/* Refresh button with confirmation */}
                {hasAnyResults && (
                  <div className="relative flex-shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowRefreshConfirm(true);
                      }}
                      disabled={isRefreshingAll}
                      title="רענן את כל הסריקות"
                      className="h-11 w-11 bg-white shadow-sm border-gray-200 hover:bg-gray-50"
                    >
                      <RefreshCw
                        className={cn(
                          'w-5 h-5 text-gray-600',
                          isRefreshingAll && 'animate-spin'
                        )}
                      />
                    </Button>
                    {/* Confirm popover */}
                    {showRefreshConfirm && (
                      <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowRefreshConfirm(false)} />
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-64 animate-in fade-in zoom-in-95 duration-150">
                        <p className="text-sm font-semibold text-gray-800 text-center mb-1">
                          רענון סריקות
                        </p>
                        <p className="text-xs text-gray-500 text-center mb-3">
                          האם לרענן את כל תוצאות הסריקה?
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg px-4 text-xs"
                            onClick={() => setShowRefreshConfirm(false)}
                          >
                            ביטול
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-lg px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={(e) => {
                              setShowRefreshConfirm(false);
                              onRefreshAllMethods(e);
                            }}
                          >
                            רענן
                          </Button>
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Time estimates */}
              <div className="flex gap-2 text-xs text-gray-500 mt-1">
                <span className="flex-1 text-center truncate">~3-5 דק</span>
                <span className="flex-1 text-center truncate">~30 שנ</span>
                <span className="flex-1 text-center truncate">~1-2 דק 🆕</span>
                {hasAnyResults && (
                  <div className="w-11 flex-shrink-0 hidden sm:block" />
                )}
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
                hybridCount={hybridMatchesCount}
                isLoading={isJobRunning}
              />
              <CacheInfoBadge
                meta={
                  activeResultsTab === 'vector'
                    ? vectorMatchMeta
                    : activeResultsTab === 'hybrid'
                      ? hybridMatchMeta
                      : aiMatchMeta
                }
                matchesCount={
                  activeResultsTab === 'vector'
                    ? vectorMatchesCount
                    : activeResultsTab === 'hybrid'
                      ? hybridMatchesCount
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

export default PanelHeader;
