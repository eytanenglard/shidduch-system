// File: src/app/components/matchmaker/new/CandidatesManager/SplitView.tsx

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
  Activity,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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

interface AiMatch {
  userId: string;
  score: number;
}

interface SplitViewProps {
  maleCandidates: Candidate[];
  femaleCandidates: Candidate[];
  allCandidates: Candidate[];
  onCandidateAction: (type: CandidateAction, candidate: Candidate) => void;
  onCandidateClick: (candidate: Candidate) => void;
  viewMode: 'grid' | 'list';
  mobileView: MobileView;
  isLoading?: boolean;
  className?: string;

  // --- AI State and Handlers (Received from Parent) ---
  aiTargetCandidate: Candidate | null;
  aiMatches: AiMatch[];
  isAiLoading: boolean;
  onSetAiTarget: (candidate: Candidate, e: React.MouseEvent) => void;
  onClearAiTarget: (e: React.MouseEvent) => void;
  setAiMatches: React.Dispatch<React.SetStateAction<AiMatch[]>>;
  setIsAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
  comparisonSelection: Record<string, Candidate>;
  onToggleComparison: (candidate: Candidate, e: React.MouseEvent) => void;

  // --- Filter Props ---
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
}

// Enhanced Panel Header Component
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
}) => {
  const genderConfig = {
    male: {
      title: 'מועמדים',
      icon: Target,
      colors: {
        gradient: 'from-blue-500 to-cyan-500',
        bg: 'from-blue-50 to-cyan-50',
        text: 'text-blue-800',
        badge: 'bg-blue-500',
      },
    },
    female: {
      title: 'מועמדות',
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
        <div
          className={cn(
            'p-3 rounded-full shadow-lg text-white transition-transform hover:scale-110',
            `bg-gradient-to-r ${config.colors.gradient}`
          )}
        >
          <IconComponent className="w-6 h-6" />
        </div>
        <div>
          <h2 className={cn('text-xl font-bold', config.colors.text)}>
            {config.title}
          </h2>
          <p className="text-sm text-gray-600">
            {count} {gender === 'male' ? 'מועמדים' : 'מועמדות'} פעילים
          </p>
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
        {isTargetPanel && aiTargetCandidate && (
          <div className="flex items-center gap-2 bg-green-100 p-2 rounded-full shadow-lg animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
            <span className="text-sm font-medium text-green-800 px-2">
              מטרה: {aiTargetCandidate.firstName}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-green-700 hover:bg-green-200 rounded-full"
              onClick={onClearAiTarget}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isSearchPanel && (
          <Button
            size="sm"
            onClick={onFindAiMatches}
            disabled={isAiLoading}
            className={cn(
              'shadow-lg font-bold transition-all duration-300 hover:scale-105',
              `bg-gradient-to-r ${config.colors.gradient} hover:opacity-90 text-white`
            )}
          >
            <Sparkles
              className={cn('ml-2 h-4 w-4', isAiLoading && 'animate-spin')}
            />
            {isAiLoading ? 'מחפש...' : 'מצא התאמות AI'}
            <Zap className="w-3 h-3 mr-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Enhanced Loading Component
const LoadingComponent: React.FC<{ gender: 'male' | 'female' }> = ({
  gender,
}) => {
  const config =
    gender === 'male'
      ? { gradient: 'from-blue-200 to-cyan-200', icon: Target }
      : { gradient: 'from-purple-200 to-pink-200', icon: Crown };

  const IconComponent = config.icon;

  return (
    <div className="flex flex-col items-center justify-center h-64 p-8">
      <div
        className={cn(
          'p-6 rounded-full mb-4 animate-pulse',
          `bg-gradient-to-r ${config.gradient}`
        )}
      >
        <IconComponent className="w-12 h-12 text-white" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-700 mb-2">
          טוען מועמדים...
        </h3>
        <p className="text-gray-500">אנא המתן בזמן שאנו מביאים את הנתונים</p>
      </div>
    </div>
  );
};

// Enhanced Empty State Component
const EmptyStateComponent: React.FC<{
  gender: 'male' | 'female';
  searchQuery?: string;
  onClearSearch?: () => void;
}> = ({ gender, searchQuery, onClearSearch }) => {
  const config =
    gender === 'male'
      ? {
          gradient: 'from-blue-100 to-cyan-100',
          icon: Target,
          title: 'אין מועמדים',
          subtitle: 'לא נמצאו מועמדים התואמים לקריטריונים',
        }
      : {
          gradient: 'from-purple-100 to-pink-100',
          icon: Crown,
          title: 'אין מועמדות',
          subtitle: 'לא נמצאו מועמדות התואמות לקריטריונים',
        };

  const IconComponent = config.icon;

  return (
    <div className="flex flex-col items-center justify-center h-64 p-8">
      <div
        className={cn(
          'w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg',
          `bg-gradient-to-br ${config.gradient}`
        )}
      >
        <IconComponent className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{config.title}</h3>
      <p className="text-gray-600 text-center mb-4 max-w-sm">
        {searchQuery
          ? `לא נמצאו תוצאות עבור "${searchQuery}"`
          : config.subtitle}
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
    </div>
  );
};

const SplitView: React.FC<SplitViewProps> = (props) => {
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
    // --- Destructure AI props ---
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

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleFindAiMatches = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!aiTargetCandidate) return;

    setIsAiLoading(true);
    setAiMatches([]);

    const targetGender = aiTargetCandidate.profile.gender;
    const candidatePool =
      targetGender === Gender.MALE ? femaleCandidates : maleCandidates;
    const candidatePoolIds = candidatePool.map((c) => c.id);

    if (candidatePoolIds.length === 0) {
      toast.error('אין מועמדים במאגר לחיפוש התאמות.', {
        position: 'top-center',
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
      if (!response.ok || !data.success)
        throw new Error(data.error || 'Failed to fetch AI matches');

      setAiMatches(data.matches);
      toast.success(`נמצאו ${data.matches.length} התאמות AI פוטנציאליות.`, {
        position: 'top-center',
        description: 'המועמדים המומלצים מסומנים ומויינו לראש הרשימה.',
      });
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
      />
    );
  };
  
  // --- START OF FIX: This helper function is now ONLY for the mobile view ---
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
        />
      );
    }

    return (
      <CandidatesList
        candidates={candidates}
        allCandidates={allCandidates}
        onCandidateClick={onCandidateClick}
        onCandidateAction={onCandidateAction}
        viewMode={viewMode}
        mobileView={mobileView}
        isLoading={isLoading}
        highlightTerm={searchQuery}
        aiTargetCandidate={aiTargetCandidate}
        onSetAiTarget={onSetAiTarget}
        comparisonSelection={comparisonSelection}
        onToggleComparison={onToggleComparison}
        // For mobile, it will always default to 'center', which is fine.
      />
    );
  };
  // --- END OF FIX ---

  // --- Mobile View Logic ---
  if (isMobile) {
    if (mobileView === 'split') {
      return (
        <div className="grid grid-cols-2 gap-3 h-full p-3">
          {/* Male Candidates Column */}
          <Card className="flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-blue-50/30 overflow-hidden rounded-2xl">
            <div className="p-3 text-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <h2 className="text-sm font-bold flex items-center justify-center gap-1">
                <Target className="w-4 h-4" />
                מועמדים
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0 ml-1"
                >
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

          {/* Female Candidates Column */}
          <Card className="flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-purple-50/30 overflow-hidden rounded-2xl">
            <div className="p-3 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <h2 className="text-sm font-bold flex items-center justify-center gap-1">
                <Crown className="w-4 h-4" />
                מועמדות
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-0 ml-1"
                >
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

    // Original Tabs view for 'single' or 'double' column modes
    return (
      <div className={cn('w-full h-full', className)}>
        <Tabs defaultValue="male" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 p-1 rounded-2xl shadow-lg">
            <TabsTrigger
              value="male"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Target className="h-4 w-4" />
              מועמדים
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 border-0"
              >
                {maleCandidates.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="female"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Crown className="h-4 w-4" />
              מועמדות
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800 border-0"
              >
                {femaleCandidates.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="male" className="mt-4 flex-1 min-h-0">
            <Card className="p-4 flex flex-col h-full shadow-xl border-0 bg-gradient-to-b from-white to-blue-50/30 rounded-2xl">
              {renderPanelHeader('male', true)}
              {separateFiltering && onMaleSearchChange && (
                <div className="mb-4">
                  <SearchBar
                    value={maleSearchQuery}
                    onChange={onMaleSearchChange}
                    placeholder="חיפוש מועמדים..."
                    genderTarget="male"
                    separateMode={true}
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
              {renderPanelHeader('female', true)}
              {separateFiltering && onFemaleSearchChange && (
                <div className="mb-4">
                  <SearchBar
                    value={femaleSearchQuery}
                    onChange={onFemaleSearchChange}
                    placeholder="חיפוש מועמדות..."
                    genderTarget="female"
                    separateMode={true}
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

  // --- Desktop View using Resizable Panels ---
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
              <div className="p-4 bg-blue-50/30">
                <SearchBar
                  value={maleSearchQuery}
                  onChange={onMaleSearchChange}
                  placeholder="חיפוש מועמדים..."
                  genderTarget="male"
                  separateMode={true}
                />
              </div>
            )}
            <div className="flex-grow min-h-0 overflow-y-auto p-4">
              {/* --- START OF FIX: Call CandidatesList directly with the correct prop --- */}
              <CandidatesList
                candidates={maleCandidatesWithScores}
                allCandidates={allCandidates}
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
              />
              {/* --- END OF FIX --- */}
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
              <div className="p-4 bg-purple-50/30">
                <SearchBar
                  value={femaleSearchQuery}
                  onChange={onFemaleSearchChange}
                  placeholder="חיפוש מועמדות..."
                  genderTarget="female"
                  separateMode={true}
                />
              </div>
            )}
            <div className="flex-grow min-h-0 overflow-y-auto p-4">
              {/* --- START OF FIX: Call CandidatesList directly with the correct prop --- */}
              <CandidatesList
                candidates={femaleCandidatesWithScores}
                allCandidates={allCandidates}
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
              />
              {/* --- END OF FIX --- */}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SplitView;