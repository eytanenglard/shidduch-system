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
  Users,
  User,
  Target,
  Crown,
  Zap,
  Search,
  Loader2,
  Star,
  TrendingUp,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface AiMatch {
  userId: string;
  score: number;
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
// HELPER COMPONENTS
// ============================================================================

/**
 * דגש 1: קומפוננטת כותרת פאנל משופרת עם אנימציות ומצבי UI שונים
 */
const PanelHeaderComponent: React.FC<{
  gender: 'male' | 'female';
  count: number;
  aiTargetCandidate: Candidate | null;
  isSearchPanel: boolean;
  isTargetPanel: boolean;
  onClearAiTarget: (e: React.MouseEvent) => void;
  onFindAiMatches: (e: React.MouseEvent) => void;
  isAiLoading: boolean;
  isMobileView?: boolean;
  dict: MatchmakerPageDictionary['candidatesManager']['splitView']['panelHeaders'];
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
          whileHover={{ scale: 1.1, rotate: 5 }}
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

      {/* דגש 2: תצוגת סטטוס AI מתקדמת */}
      <div className="flex items-center gap-2">
        {isTargetPanel && aiTargetCandidate && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-2 bg-green-100 p-2 rounded-full shadow-lg"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-800 px-2">
              {dict.targetLabel.replace('{{name}}', aiTargetCandidate.firstName)}
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
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="sm"
              onClick={onFindAiMatches}
              disabled={isAiLoading}
              className={cn(
                'relative overflow-hidden shadow-lg font-bold transition-all duration-300',
                `bg-gradient-to-r ${config.colors.gradient} hover:opacity-90 text-white`,
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Sparkles
                className={cn('ml-2 h-4 w-4 relative z-10', isAiLoading && 'animate-spin')}
              />
              <span className="relative z-10">
                {isAiLoading ? dict.searchingButton : dict.findMatchesButton}
              </span>
              {!isAiLoading && <Zap className="w-3 h-3 mr-1 relative z-10" />}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

/**
 * דגש 3: קומפוננטת טעינה אלגנטית עם אנימציות
 */
const LoadingComponent: React.FC<{ gender: 'male' | 'female' }> = ({ gender }) => {
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
        className={cn('p-6 rounded-full mb-4', `bg-gradient-to-r ${config.gradient}`)}
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
 * דגש 4: קומפוננטת מצב ריק משופרת עם הצעות פעולה
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

  // דגש 6: זיהוי רספונסיבי משופר
  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  /**
   * דגש 7: לוגיקת חיפוש AI מרוכזת ומשופרת עם טיפול בשגיאות
   */
  const handleFindAiMatches = async (e: React.MouseEvent) => {
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

    const targetGender = aiTargetCandidate.profile.gender;
    const candidatePool = targetGender === Gender.MALE ? femaleCandidates : maleCandidates;
    const candidatePoolIds = candidatePool.map((c) => c.id);

    if (candidatePoolIds.length === 0) {
      toast.error('אין מועמדים במאגר לחיפוש התאמות.', {
        position: 'top-center',
        description: 'נסה לשנות את הפילטרים או להוסיף מועמדים נוספים',
      });
      setIsAiLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ai/find-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: aiTargetCandidate.id,
          candidatePoolIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch AI matches');
      }

      setAiMatches(data.matches);
      
      toast.success(`נמצאו ${data.matches.length} התאמות AI פוטנציאליות! 🎉`, {
        position: 'top-center',
        description: 'המועמדים הממולצים מסומנים ומיוינו לראש הרשימה.',
        duration: 5000,
      });
    } catch (error) {
      console.error('Error finding AI matches:', error);
      toast.error('שגיאה במציאת התאמות AI.', {
        description: error instanceof Error ? error.message : 'נסה שוב מאוחר יותר.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * דגש 8: ציון מועמדים עם ניקוד AI
   */
  const maleCandidatesWithScores = useMemo(() => {
    if (aiMatches.length === 0) return maleCandidates;
    const scoreMap = new Map(aiMatches.map((m) => [m.userId, m.score]));
    return maleCandidates
      .map((c) => ({ ...c, aiScore: scoreMap.get(c.id) }))
      .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
  }, [maleCandidates, aiMatches]);

  const femaleCandidatesWithScores = useMemo(() => {
    if (aiMatches.length === 0) return femaleCandidates;
    const scoreMap = new Map(aiMatches.map((m) => [m.userId, m.score]));
    return femaleCandidates
      .map((c) => ({ ...c, aiScore: scoreMap.get(c.id) }))
      .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
  }, [femaleCandidates, aiMatches]);

  const renderPanelHeader = (gender: 'male' | 'female', isMobileView: boolean = false) => {
    const panelGenderEnum = gender === 'male' ? Gender.MALE : Gender.FEMALE;
    const isTargetPanel = aiTargetCandidate?.profile.gender === panelGenderEnum;
    const isSearchPanel = !!(aiTargetCandidate && aiTargetCandidate.profile.gender !== panelGenderEnum);
    const count = gender === 'male' ? maleCandidates.length : femaleCandidates.length;

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
      />
    );
  };

  const renderCandidatesListForMobile = (
    candidates: (Candidate & { aiScore?: number })[],
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

  /**
   * דגש 9: תצוגת מובייל מתקדמת עם UI/UX משופר
   */
  if (isMobile) {
    // Split view for mobile
    if (mobileView === 'split') {
      return (
        <div className="grid grid-cols-2 gap-3 h-full p-3">
          <Card className="flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-blue-50/30 overflow-hidden rounded-2xl">
            <div className="p-3 text-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <h2 className="text-sm font-bold flex items-center justify-center gap-1">
                <Target className="w-4 h-4" />
                {dict.candidatesManager.splitView.mobile.splitLabels.male}
                <Badge variant="secondary" className="bg-white/20 text-white border-0 ml-1">
                  {maleCandidates.length}
                </Badge>
              </h2>
            </div>
            <div className="flex-grow min-h-0 overflow-y-auto p-2">
              {renderCandidatesListForMobile(
                maleCandidatesWithScores,
                'male',
                maleSearchQuery,
                onMaleSearchChange
              )}
            </div>
          </Card>

          <Card className="flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-purple-50/30 overflow-hidden rounded-2xl">
            <div className="p-3 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <h2 className="text-sm font-bold flex items-center justify-center gap-1">
                <Crown className="w-4 h-4" />
                {dict.candidatesManager.splitView.mobile.splitLabels.female}
                <Badge variant="secondary" className="bg-white/20 text-white border-0 ml-1">
                  {femaleCandidates.length}
                </Badge>
              </h2>
            </div>
            <div className="flex-grow min-h-0 overflow-y-auto p-2">
              {renderCandidatesListForMobile(
                femaleCandidatesWithScores,
                'female',
                femaleSearchQuery,
                onFemaleSearchChange
              )}
            </div>
          </Card>
        </div>
      );
    }

    // Tabs view for mobile
    return (
      <div className={cn('w-full h-full', className)}>
        <Tabs defaultValue="male" className="w-full h-full flex flex-col">
          {/* דגש 10: באנר סטטוס AI גלובלי למובייל */}
          <AnimatePresence>
            {aiTargetCandidate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex-shrink-0 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-green-500 shadow-lg">
                    <Star className="w-4 h-4 text-white fill-current" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-900">
                      מטרה נבחרה: {aiTargetCandidate.firstName} {aiTargetCandidate.lastName}
                    </p>
                    <p className="text-xs text-green-600">
                      {aiTargetCandidate.profile.gender === 'MALE' ? '👨 גברים' : '👩 נשים'} •{' '}
                      {aiTargetCandidate.profile.city || 'לא צוין'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClearAiTarget}
                    className="h-8 w-8 rounded-full hover:bg-white/50"
                  >
                    <X className="w-4 h-4 text-green-600" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <TabsList className="grid w-full grid-cols-2 flex-shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 p-1 rounded-2xl shadow-lg">
            <TabsTrigger
              value="male"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Target className="h-4 w-4" />
              {dict.candidatesManager.splitView.mobile.tabs.male}
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-0">
                {maleCandidates.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="female"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
            >
              <Crown className="h-4 w-4" />
              {dict.candidatesManager.splitView.mobile.tabs.female}
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-0">
                {femaleCandidates.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Male Tab Content */}
          <TabsContent value="male" className="mt-4 flex-1 min-h-0">
            <Card className="p-4 flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-blue-50/30 rounded-2xl">
              {/* AI Action Button for Male Tab */}
              {aiTargetCandidate && aiTargetCandidate.profile.gender === 'FEMALE' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <Button
                    onClick={handleFindAiMatches}
                    disabled={isAiLoading}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2 relative z-10" />
                        <span className="relative z-10">מחפש התאמות AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 ml-2 relative z-10" />
                        <span className="relative z-10">מצא התאמות AI ({maleCandidates.length})</span>
                        <Zap className="w-4 h-4 mr-2 relative z-10" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

            
              {/* Search Bar */}
              {separateFiltering && onMaleSearchChange && (
                <div className="mb-4 w-full">
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
              {aiTargetCandidate && aiTargetCandidate.profile.gender === 'MALE' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <Button
                    onClick={handleFindAiMatches}
                    disabled={isAiLoading}
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:scale-100 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    {isAiLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2 relative z-10" />
                        <span className="relative z-10">מחפש התאמות AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 ml-2 relative z-10" />
                        <span className="relative z-10">מצא התאמות AI ({femaleCandidates.length})</span>
                        <Zap className="w-4 h-4 mr-2 relative z-10" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Search Bar */}
              {separateFiltering && onFemaleSearchChange && (
                <div className="mb-4 w-full">
                  <SearchBar
                    value={femaleSearchQuery}
                    onChange={onFemaleSearchChange}
                    placeholder={dict.candidatesManager.searchBar.femalePlaceholder}
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

            {/* Search Bar */}
            {separateFiltering && onFemaleSearchChange && (
              <div className="p-4 bg-purple-50/30 w-full">
                <SearchBar
                  value={femaleSearchQuery}
                  onChange={onFemaleSearchChange}
                  placeholder={dict.candidatesManager.searchBar.femalePlaceholder}
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