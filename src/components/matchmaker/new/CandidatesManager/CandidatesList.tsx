// File: src/components/matchmaker/new/CandidatesManager/CandidatesList.tsx

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { UserX, Edit, X, ChevronsDownUp, ChevronsUpDown, Loader2 } from 'lucide-react';
import { VirtuosoGrid, Virtuoso } from 'react-virtuoso';
import MinimalCard from '../CandidateCard/MinimalCard';
import QuickView from '../CandidateCard/QuickView';
import { ProfileCard } from '@/components/profile';
import type {
  Candidate,
  CandidateAction,
  MobileView,
} from '../types/candidates';
import type { QuestionnaireResponse } from '@/types/next-auth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { ActionDialogs } from '../dialogs/ActionDialogs';
import NewSuggestionForm from '../../suggestions/NewSuggestionForm';
import MatchmakerEditProfile from '../MatchmakerEditProfile';
import { cn } from '@/lib/utils';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import {
  NoCandidatesEmpty,
  NoSearchResultsEmpty,
  NoFilterResultsEmpty,
} from '../shared/EmptyStates';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';

// ============================================================================
// TYPES
// ============================================================================

interface CreateSuggestionData {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  firstPartyId: string;
  secondPartyId: string;
  status:
    | 'DRAFT'
    | 'PENDING_FIRST_PARTY'
    | 'FIRST_PARTY_APPROVED'
    | 'FIRST_PARTY_DECLINED'
    | string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
  firstPartyLanguage?: 'he' | 'en';
  secondPartyLanguage?: 'he' | 'en';
}

interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

type CandidateWithAiData = Candidate & {
  aiScore?: number;
  aiReasoning?: string;
  aiRank?: number;
  aiFirstPassScore?: number;
  aiScoreBreakdown?: ScoreBreakdown;
  aiBackgroundMultiplier?: number;
  aiBackgroundCompatibility?:
    | 'excellent'
    | 'good'
    | 'possible'
    | 'problematic'
    | 'not_recommended';
  aiSimilarity?: number;
};

interface CandidatesListProps {
  candidates: CandidateWithAiData[];
  allCandidates: Candidate[];
  onOpenAiAnalysis: (candidate: Candidate) => void;
  onSendProfileFeedback: (candidate: Candidate, e?: React.MouseEvent) => void;
  onCandidateClick?: (candidate: Candidate) => void;
  onCandidateAction?: (type: CandidateAction, candidate: Candidate) => void;
  viewMode: 'grid' | 'list';
  mobileView: MobileView;
  isLoading?: boolean;
  className?: string;
  highlightTerm?: string;
  aiTargetCandidate: Candidate | null;
  onSetAiTarget: (candidate: Candidate, e: React.MouseEvent) => void;
  comparisonSelection: Record<string, Candidate>;
  onToggleComparison: (candidate: Candidate, e: React.MouseEvent) => void;
  existingSuggestions: Record<string, { status: string; createdAt: string }>;
  quickViewSide?: 'left' | 'right' | 'center';
  isQuickViewEnabled: boolean;
  locale: string;
  dict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
  /** Whether the list has active search/filter — used for empty state variant */
  hasActiveSearch?: boolean;
  searchTerm?: string;
  activeFilterCount?: number;
  onClearSearch?: () => void;
  onResetFilters?: () => void;
  /** Callback when user scrolls near the end (for server-side pagination) */
  onEndReached?: () => void;
  /** Whether more items are being loaded (infinite scroll) */
  isLoadingMore?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  allCandidates,
  locale,
  onCandidateClick,
  onCandidateAction,
  isQuickViewEnabled,
  onOpenAiAnalysis,
  onSendProfileFeedback,
  viewMode,
  mobileView,
  isLoading = false,
  className,
  highlightTerm,
  aiTargetCandidate,
  onSetAiTarget,
  comparisonSelection,
  onToggleComparison,
  existingSuggestions,
  quickViewSide = 'center',
  dict,
  profileDict,
  hasActiveSearch,
  searchTerm,
  activeFilterCount,
  onClearSearch,
  onResetFilters,
  onEndReached,
  isLoadingMore = false,
}) => {
  // Base states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse | null>(null);
  const [isMatchmaker, setIsMatchmaker] = useState(true);
  // QuickView Sheet state (replaces hover-based QuickView)
  const [quickViewCandidate, setQuickViewCandidate] =
    useState<CandidateWithAiData | null>(null);

  // Store scroll position before opening dialogs
  const scrollPositionRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [dialogCandidate, setDialogCandidate] = useState<Candidate | null>(
    null
  );

  const [isMobile, setIsMobile] = useState(false);
  const [isCompact, setIsCompact] = useState(true);

  // ============================================================================
  // Keyboard navigation
  // ============================================================================
  const columns = useMemo(() => {
    if (isMobile) return mobileView === 'double' ? 2 : 1;
    return viewMode === 'grid' ? 3 : 1;
  }, [isMobile, mobileView, viewMode]);

  const {
    focusedIndex,
    isFocused,
    resetFocus,
    containerProps: keyboardContainerProps,
    getItemProps,
  } = useKeyboardNavigation({
    totalItems: candidates.length,
    columns,
    isRTL: locale === 'he',
    onSelect: (index) => {
      if (candidates[index]) {
        handleAction('view', candidates[index]);
      }
    },
    onEscape: () => {
      if (quickViewCandidate) {
        setQuickViewCandidate(null);
      }
    },
    onSuggest: (index) => {
      if (candidates[index]) {
        handleAction('suggest', candidates[index]);
      }
    },
    onEdit: (index) => {
      if (candidates[index]) {
        handleAction('edit', candidates[index]);
      }
    },
    enabled: !selectedCandidate && !showSuggestDialog && !showEditProfileDialog,
  });

  // ============================================================================
  // Media query
  // ============================================================================
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const loadQuestionnaire = async () => {
      if (!selectedCandidate) {
        setQuestionnaireResponse(null);
        return;
      }
      try {
        const params = new URLSearchParams();
        params.append('userId', selectedCandidate.id);
        params.append('locale', locale);

        const response = await fetch(
          `/api/profile/questionnaire?${params.toString()}`
        );
        const data = await response.json();
        if (data.success && data.questionnaireResponse) {
          setQuestionnaireResponse(data.questionnaireResponse);
        } else {
          setQuestionnaireResponse(null);
        }
      } catch {
        toast.error('שגיאה בטעינת השאלון');
      }
    };
    loadQuestionnaire();
  }, [selectedCandidate, locale]);

  // Action handlers

  const handleInvite = async (candidate: Candidate, email: string) => {
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/invite-setup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: candidate.id, email }),
        }
      );
      if (!response.ok) throw new Error('Failed to send invitation');
      toast.success('ההזמנה נשלחה בהצלחה');
      onCandidateAction?.('invite', candidate);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending invite:', error);
      }
      throw error;
    }
  };

  const handleAvailabilityCheck = async (candidate: Candidate) => {
    try {
      const response = await fetch('/api/availability/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: candidate.id }),
      });
      if (!response.ok) throw new Error('Failed to check availability');
      toast.success('בדיקת הזמינות נשלחה');
      onCandidateAction?.('contact', candidate);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking availability:', error);
      }
      throw error;
    }
  };

  const handleCreateSuggestion = async (data: CreateSuggestionData) => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions?locale=${locale}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to create suggestion');
      toast.success('ההצעה נוצרה בהצלחה');
      onCandidateAction?.('suggest', dialogCandidate!);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating suggestion:', error);
      }
      throw error;
    }
  };

  const handleEditProfile = useCallback((candidate: Candidate) => {
    const scrollContainer = containerRef.current?.closest(
      '.overflow-y-auto, [data-radix-scroll-area-viewport]'
    );
    if (scrollContainer) {
      scrollPositionRef.current = scrollContainer.scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY;
    }
    setDialogCandidate(candidate);
    setShowEditProfileDialog(true);
  }, []);

  // Restore scroll position when edit dialog closes
  const handleCloseEditProfile = useCallback(() => {
    setShowEditProfileDialog(false);

    requestAnimationFrame(() => {
      const scrollContainer = containerRef.current?.closest(
        '.overflow-y-auto, [data-radix-scroll-area-viewport]'
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPositionRef.current;
      } else {
        window.scrollTo(0, scrollPositionRef.current);
      }
    });
  }, []);

  const handleAction = useCallback(
    (
      action: CandidateAction | 'analyze' | 'sendFeedback',
      candidate: Candidate
    ) => {
      setDialogCandidate(candidate);
      setQuickViewCandidate(null);
      switch (action) {
        case 'invite':
          setShowInviteDialog(true);
          break;
        case 'contact':
          setShowAvailabilityDialog(true);
          break;
        case 'suggest':
          setShowSuggestDialog(true);
          break;
        case 'view': {
          const scrollContainer = containerRef.current?.closest(
            '.overflow-y-auto, [data-radix-scroll-area-viewport]'
          );
          if (scrollContainer) {
            scrollPositionRef.current = scrollContainer.scrollTop;
          } else {
            scrollPositionRef.current = window.scrollY;
          }
          setSelectedCandidate(candidate);
          onCandidateClick?.(candidate);
          break;
        }
        case 'edit':
          handleEditProfile(candidate);
          break;
        case 'analyze':
          onOpenAiAnalysis(candidate);
          break;
        case 'sendFeedback':
          if (onSendProfileFeedback) {
            onSendProfileFeedback(candidate);
          }
          break;
        default:
          onCandidateAction?.(action as CandidateAction, candidate);
      }
    },
    [
      onCandidateAction,
      onCandidateClick,
      onOpenAiAnalysis,
      onSendProfileFeedback,
      handleEditProfile,
    ]
  );

  // Handle QuickView via Sheet (replaces hover-based positioning)
  const handleCardRightClick = useCallback(
    (candidate: CandidateWithAiData, e: React.MouseEvent) => {
      if (!isQuickViewEnabled || isMobile) return;
      e.preventDefault();
      setQuickViewCandidate(candidate);
    },
    [isQuickViewEnabled, isMobile]
  );

  // Handle profile dialog close with scroll restoration
  const handleCloseProfileDialog = useCallback((open: boolean) => {
    if (!open) {
      setSelectedCandidate(null);
      setQuestionnaireResponse(null);

      requestAnimationFrame(() => {
        const scrollContainer = containerRef.current?.closest(
          '.overflow-y-auto, [data-radix-scroll-area-viewport]'
        );
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPositionRef.current;
        } else {
          window.scrollTo(0, scrollPositionRef.current);
        }
      });
    }
  }, []);

  const gridLayoutClass = useMemo(() => {
    if (isMobile) {
      return mobileView === 'double'
        ? 'grid grid-cols-2 gap-2'
        : 'grid grid-cols-1 gap-3';
    }
    return viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4'
      : 'space-y-4';
  }, [isMobile, mobileView, viewMode]);

  // ============================================================================
  // Render individual card
  // ============================================================================
  const renderCard = useCallback(
    (index: number, candidate: CandidateWithAiData) => {
      const itemProps = getItemProps(index);
      const focused = isFocused(index);

      return (
        <div
          key={candidate.id}
          {...itemProps}
          className={cn(
            'group relative',
            focused && 'ring-2 ring-primary/50 rounded-xl'
          )}
          onContextMenu={(e) => handleCardRightClick(candidate, e)}
          onClick={() => handleAction('view', candidate)}
        >
          <MinimalCard
            candidate={candidate}
            onClick={() => handleAction('view', candidate)}
            onAnalyze={(c, e) => {
              e.stopPropagation();
              handleAction('analyze', c);
            }}
            aiTargetName={
              aiTargetCandidate
                ? `${aiTargetCandidate.firstName} ${aiTargetCandidate.lastName}`
                : undefined
            }
            onSendProfileFeedback={(c, e) => {
              e.stopPropagation();
              handleAction('sendFeedback', c);
            }}
            onEdit={(c, e) => {
              e.stopPropagation();
              handleAction('edit', c);
            }}
            className={cn(
              viewMode === 'list' && !isMobile
                ? 'flex flex-row-reverse gap-4 h-32'
                : '',
              isMobile && mobileView === 'double' ? 'transform scale-90' : '',
              isMobile && mobileView === 'single' ? 'transform scale-95' : ''
            )}
            highlightTerm={highlightTerm}
            aiScore={candidate.aiScore}
            onSetAiTarget={onSetAiTarget}
            isAiTarget={aiTargetCandidate?.id === candidate.id}
            isSelectableForComparison={
              !!aiTargetCandidate &&
              aiTargetCandidate.profile.gender !== candidate.profile.gender &&
              aiTargetCandidate.id !== candidate.id
            }
            isSelectedForComparison={!!comparisonSelection[candidate.id]}
            onToggleComparison={onToggleComparison}
            existingSuggestion={existingSuggestions[candidate.id] ?? null}
            isCompact={isCompact}
            dict={dict.candidatesManager.list.minimalCard}
          />
          <button
            className="absolute top-2 left-2 bg-primary text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('edit', candidate);
            }}
            aria-label={dict.candidatesManager.list.editProfileTooltip}
            title={dict.candidatesManager.list.editProfileTooltip}
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      );
    },
    [
      getItemProps,
      isFocused,
      handleCardRightClick,
      handleAction,
      aiTargetCandidate,
      viewMode,
      isMobile,
      mobileView,
      highlightTerm,
      onSetAiTarget,
      comparisonSelection,
      onToggleComparison,
      existingSuggestions,
      isCompact,
      dict,
    ]
  );

  // ============================================================================
  // Loading state
  // ============================================================================
  if (isLoading) {
    return (
      <div
        className={`${
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        } ${className || ''}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative">
            <Skeleton
              className={
                viewMode === 'list' ? 'h-32 w-full' : 'h-[350px] w-full'
              }
            />
            <div className="absolute top-3 right-3">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ============================================================================
  // Empty states
  // ============================================================================
  if (candidates.length === 0) {
    // Search active but no results
    if (searchTerm) {
      return (
        <NoSearchResultsEmpty
          searchTerm={searchTerm}
          onClearSearch={onClearSearch}
          className={className}
        />
      );
    }

    // Filters active but no results
    if (activeFilterCount && activeFilterCount > 0) {
      return (
        <NoFilterResultsEmpty
          activeFilterCount={activeFilterCount}
          onResetFilters={onResetFilters}
          className={className}
        />
      );
    }

    // No candidates at all
    if (!hasActiveSearch) {
      return (
        <NoCandidatesEmpty className={className} />
      );
    }

    // Fallback empty state
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <UserX className="w-8 h-8 mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-500 mb-1">
          {dict.candidatesManager.list.emptyState.title}
        </p>
        <p className="text-xs text-gray-400">
          {dict.candidatesManager.list.emptyState.description}
        </p>
      </div>
    );
  }

  // ============================================================================
  // Main render with Virtuoso
  // ============================================================================
  return (
    <>
      {/* Compact / Expanded toggle — only on desktop grid */}
      {!isMobile && viewMode === 'grid' && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setIsCompact((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:border-gray-300 px-2.5 py-1 rounded-lg transition-all"
            title={isCompact ? 'הצג פרטים נוספים' : 'הצג פחות פרטים'}
          >
            {isCompact
              ? <><ChevronsUpDown className="w-3.5 h-3.5" /> תצוגה מורחבת</>
              : <><ChevronsDownUp className="w-3.5 h-3.5" /> תצוגה מצומצמת</>
            }
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        {...keyboardContainerProps}
        className={cn('outline-none', className || '')}
      >
        {viewMode === 'list' || (isMobile && mobileView === 'single') ? (
          // List view — Virtuoso (single column)
          <Virtuoso
            style={{ height: '70vh' }}
            totalCount={candidates.length}
            itemContent={(index) => (
              <div className="mb-4">
                {renderCard(index, candidates[index])}
              </div>
            )}
            endReached={onEndReached}
            overscan={200}
            components={{
              Footer: () =>
                isLoadingMore ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">טוען עוד מועמדים...</span>
                  </div>
                ) : null,
            }}
          />
        ) : (
          // Grid view — VirtuosoGrid
          <VirtuosoGrid
            style={{ height: '70vh' }}
            totalCount={candidates.length}
            listClassName={gridLayoutClass}
            itemContent={(index) => renderCard(index, candidates[index])}
            endReached={onEndReached}
            overscan={200}
          />
        )}
      </div>

      {/* QuickView as Sheet drawer (replaces hover-positioned absolute div) */}
      <Sheet
        open={!!quickViewCandidate}
        onOpenChange={(open) => {
          if (!open) setQuickViewCandidate(null);
        }}
      >
        <SheetContent
          side={locale === 'he' ? 'left' : 'right'}
          className="w-[450px] sm:max-w-[450px] p-0 overflow-y-auto"
        >
          {quickViewCandidate && (
            <QuickView
              candidate={quickViewCandidate}
              onAction={(action) => handleAction(action, quickViewCandidate)}
              onSetAiTarget={(c, e) => onSetAiTarget(c, e)}
              isAiTarget={aiTargetCandidate?.id === quickViewCandidate.id}
              dict={dict.candidatesManager.list.quickView}
              aiScore={quickViewCandidate.aiScore}
              aiReasoning={quickViewCandidate.aiReasoning}
              aiRank={quickViewCandidate.aiRank}
              aiSimilarity={quickViewCandidate.aiSimilarity}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* --- Main Profile Dialog --- */}
      <Dialog
        open={!!selectedCandidate}
        onOpenChange={handleCloseProfileDialog}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto p-0"
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          {/* Custom Sticky Header */}
          <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-gray-800">
                {selectedCandidate
                  ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
                  : ''}
              </DialogTitle>
              {selectedCandidate?.isVerified && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700"
                >
                  מאומת
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={isMatchmaker ? 'matchmaker' : 'candidate'}
                onValueChange={(value) =>
                  setIsMatchmaker(value === 'matchmaker')
                }
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue
                    placeholder={
                      dict.candidatesManager.list.profileDialog.viewAsLabel
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidate">
                    {dict.candidatesManager.list.profileDialog.candidateView}
                  </SelectItem>
                  <SelectItem value="matchmaker">
                    {dict.candidatesManager.list.profileDialog.matchmakerView}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('edit', selectedCandidate!)}
                className="h-9 w-9 p-0 rounded-full hover:bg-gray-100"
                title={dict.candidatesManager.list.profileDialog.editButton}
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCloseProfileDialog(false)}
                className="h-9 w-9 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {selectedCandidate && (
            <div className="p-0">
              <ProfileCard
                profile={selectedCandidate.profile}
                images={selectedCandidate.images}
                questionnaire={questionnaireResponse}
                viewMode={isMatchmaker ? 'matchmaker' : 'candidate'}
                isProfileComplete={selectedCandidate.isProfileComplete}
                dict={profileDict.profileCard}
                locale={locale}
                onClose={() => handleCloseProfileDialog(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ActionDialogs
        suggestDialog={{
          isOpen: showSuggestDialog,
          onClose: () => setShowSuggestDialog(false),
          onSubmit: handleCreateSuggestion,
          selectedCandidate: dialogCandidate,
        }}
        availabilityDialog={{
          isOpen: showAvailabilityDialog,
          onClose: () => setShowAvailabilityDialog(false),
          onCheck: handleAvailabilityCheck,
          selectedCandidate: dialogCandidate,
        }}
        inviteDialog={{
          isOpen: showInviteDialog,
          onClose: () => setShowInviteDialog(false),
          onInvite: handleInvite,
          selectedCandidate: dialogCandidate,
        }}
        dict={dict.candidatesManager.actionDialogs}
      />

      <NewSuggestionForm
        isOpen={showSuggestDialog}
        onClose={() => setShowSuggestDialog(false)}
        candidates={allCandidates}
        selectedCandidate={dialogCandidate}
        onSubmit={handleCreateSuggestion}
        dict={dict}
        locale={locale}
      />

      <MatchmakerEditProfile
        isOpen={showEditProfileDialog}
        onClose={handleCloseEditProfile}
        candidate={dialogCandidate}
        dict={dict.candidatesManager.editProfile}
        profileDict={profileDict}
        locale={locale}
      />
    </>
  );
};

export default React.memo(CandidatesList);
