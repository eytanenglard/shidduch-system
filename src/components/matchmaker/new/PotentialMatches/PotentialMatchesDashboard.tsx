// src/components/matchmaker/new/PotentialMatches/PotentialMatchesDashboard.tsx

'use client';
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import DailySuggestionsDashboard from './DailySuggestionsDashboard';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHiddenCandidates } from './hooks/useHiddenCandidates';
import MatchmakerEditProfile from '../MatchmakerEditProfile';
import HideCandidateDialog, { CandidateToHide } from './HideCandidateDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  HeartHandshake,
  Moon,
  MessageCircle,
  ArrowLeftRight,
  Loader2,
  AlertTriangle,
  Send,
  X,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CardErrorBoundary } from '@/components/ui/error-boundary';

// Components
import PotentialMatchesStats from './PotentialMatchesStats';
import { ProfileCard } from '@/components/profile';

// Import New V2 Dashboard
import MatchmakerDashboardV2 from './MatchmakerDashboard';

// Import Dialogs
import { AiMatchmakerProfileAdvisorDialog } from '../dialogs/AiMatchmakerProfileAdvisorDialog';
import { ProfileFeedbackDialog } from '../dialogs/ProfileFeedbackDialog';

// Hooks
import { usePotentialMatches } from './hooks/usePotentialMatches';

// Extracted sub-components
import {
  DashboardHeader,
  MatchesToolbar,
  BulkActionBar,
  MatchesGrid,
} from './dashboard';

// Types
import type {
  PotentialMatchesStats as FullStatsType,
  LastScanInfo as FullLastScanInfo,
} from './types/potentialMatches';
import type { ProfilePageDictionary } from '@/types/dictionary';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

// Helper function to safely get main image
const getMainImage = (user: any) => {
  if (user?.images && Array.isArray(user.images)) {
    const main = user.images.find((img: any) => img.isMain);
    return main?.url || user.images[0]?.url || null;
  }
  return null;
};

// =============================================================================
// TYPES
// =============================================================================

interface PotentialMatchesDashboardProps {
  locale?: string;
  profileDict: ProfilePageDictionary;
  matchmakerDict: MatchmakerPageDictionary;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const PotentialMatchesDashboard: React.FC<PotentialMatchesDashboardProps> = ({
  locale = 'he',
  profileDict,
  matchmakerDict,
}) => {
  // --- View Mode (Tabs) ---
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'daily'>(
    'overview'
  );

  // Party swap management (False = male first, True = female first)
  const [isPartiesSwapped, setIsPartiesSwapped] = useState(false);

  // Notification method (auto email or manual whatsapp)
  const [notificationMethod, setNotificationMethod] = useState<
    'EMAIL' | 'WHATSAPP_MANUAL'
  >('EMAIL');
  // State for Matches List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardStyle, setCardStyle] = useState<'expanded' | 'compact'>('expanded');

  // Local search for debounce
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Manual page input
  const [pageInput, setPageInput] = useState('1');

  // Scroll position management
  const scrollPositionRef = useRef(0);

  const [showBulkActions, setShowBulkActions] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Dialogs
  const [confirmScanDialog, setConfirmScanDialog] = useState(false);
  const [confirmBulkDismissDialog, setConfirmBulkDismissDialog] =
    useState(false);
  const [createSuggestionDialog, setCreateSuggestionDialog] = useState<
    string | null
  >(null);
  const [dismissDialog, setDismissDialog] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState('');

  // --- Profile View State ---
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [fullProfileData, setFullProfileData] = useState<any | null>(null);
  const [questionnaireData, setQuestionnaireData] = useState<any | null>(null);
  const [sfAnswersData, setSfAnswersData] = useState<Record<string, unknown> | null>(null);
  const [sfUpdatedAtData, setSfUpdatedAtData] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isMatchmakerView, setIsMatchmakerView] = useState(true);

  // --- AI Analysis & Feedback State ---
  const [analyzedCandidate, setAnalyzedCandidate] = useState<any | null>(null);
  const [feedbackCandidate, setFeedbackCandidate] = useState<any | null>(null);
  const [editProfileCandidate, setEditProfileCandidate] = useState<any | null>(
    null
  );

  // Suggestion form state
  const [suggestionPriority, setSuggestionPriority] = useState<
    'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  >('MEDIUM');
  const [suggestionNotes, setSuggestionNotes] = useState('');
  const [confirmBulkCreateDialog, setConfirmBulkCreateDialog] = useState(false);
  const [bulkCreatePriority, setBulkCreatePriority] = useState<
    'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  >('MEDIUM');

  // Hook for Matches
  const {
    matches,
    stats,
    lastScanInfo,
    pagination,
    isLoading,
    isRefreshing,
    isActioning,
    filters,
    setFilters,
    resetFilters,
    setPage,
    setPageSize,
    refresh,
    reviewMatch,
    dismissMatch,
    restoreMatch,
    saveMatch,
    createSuggestion,
    bulkDismiss,
    bulkReview,
    startScan,
    scanProgress,
    isScanning,
    selectedMatchIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    bulkCreateSuggestions,
    error,
    cancelScan,
    scanResult,
  } = usePotentialMatches({
    initialFilters: { status: 'pending' },
    autoRefresh: true,
    refreshInterval: 60000,
  });

  // Hook for Hidden Candidates
  const {
    hiddenCandidates,
    hiddenCandidateIds,
    isLoading: isLoadingHidden,
    hideCandidate,
    unhideCandidate,
    updateReason,
  } = useHiddenCandidates();

  const [candidateToHide, setCandidateToHide] =
    useState<CandidateToHide | null>(null);
  const [showHideDialog, setShowHideDialog] = useState(false);

  // ==========================================================================
  // SYNC PAGE INPUT
  // ==========================================================================
  useEffect(() => {
    setPageInput(String(pagination.page));
  }, [pagination.page]);

  const handleFilterByUser = useCallback((name: string) => {
    setLocalSearchTerm(name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(`מציג התאמות עבור: ${name}`);
  }, []);

  // ==========================================================================
  // SERVER SIDE SEARCH EFFECT
  // ==========================================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      const term = localSearchTerm.trim();
      if (term.length > 0) {
        setFilters({
          searchTerm: term,
          status: 'all',
        });
      } else {
        setFilters({ searchTerm: '' });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [localSearchTerm, setFilters]);

  // Keyboard focus state (shortcuts defined after filteredMatches)
  const [focusedMatchIndex, setFocusedMatchIndex] = useState(-1);

  // ==========================================================================
  // PROFILE LOADING EFFECT
  // ==========================================================================
  useEffect(() => {
    const loadProfileData = async () => {
      if (!viewProfileId) {
        setFullProfileData(null);
        setQuestionnaireData(null);
        setSfAnswersData(null);
        return;
      }

      setIsLoadingProfile(true);
      try {
        const [profileResponse, questionnaireResponse, sfProfileResponse] = await Promise.all([
          fetch(`/api/matchmaker/candidates/${viewProfileId}`),
          fetch(`/api/profile/questionnaire?userId=${viewProfileId}&locale=${locale}`),
          fetch(`/api/profile?userId=${viewProfileId}`),
        ]);

        const profileJson = await profileResponse.json();
        if (profileJson.success) {
          const formattedData = {
            ...profileJson,
            profile: {
              ...profileJson.profile,
              user: profileJson.user,
            },
          };
          setFullProfileData(formattedData);
        } else {
          toast.error('לא ניתן היה לטעון את הפרופיל');
        }

        const questionnaireJson = await questionnaireResponse.json();
        if (
          questionnaireJson.success &&
          questionnaireJson.questionnaireResponse
        ) {
          setQuestionnaireData(questionnaireJson.questionnaireResponse);
        }

        const sfProfileJson = await sfProfileResponse.json();
        setSfAnswersData(sfProfileJson.success ? sfProfileJson.sfAnswers || null : null);
        setSfUpdatedAtData(sfProfileJson.success ? sfProfileJson.sfUpdatedAt || null : null);
      } catch (err) {
        toast.error('שגיאה בטעינת פרופיל המועמד');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [viewProfileId, locale]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const filteredMatches = useMemo(() => {
    let result = matches;

    if (hiddenCandidateIds.size > 0) {
      result = result.filter(
        (match) =>
          !hiddenCandidateIds.has(match.male.id) &&
          !hiddenCandidateIds.has(match.female.id)
      );
    }

    return result;
  }, [matches, hiddenCandidateIds]);

  // ==========================================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================================
  useEffect(() => {
    if (activeTab !== 'matches') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      switch (e.key.toLowerCase()) {
        case 'j': {
          e.preventDefault();
          setFocusedMatchIndex(prev => {
            const next = Math.min(prev + 1, filteredMatches.length - 1);
            const cards = document.querySelectorAll('[data-match-card]');
            cards[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return next;
          });
          break;
        }
        case 'k': {
          e.preventDefault();
          setFocusedMatchIndex(prev => {
            const next = Math.max(prev - 1, 0);
            const cards = document.querySelectorAll('[data-match-card]');
            cards[next]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return next;
          });
          break;
        }
        case 's': {
          if (focusedMatchIndex >= 0 && focusedMatchIndex < filteredMatches.length) {
            e.preventDefault();
            const match = filteredMatches[focusedMatchIndex];
            if ((match.status as string) !== 'DISMISSED' && (match.status as string) !== 'SENT') {
              saveMatch(match.id);
            }
          }
          break;
        }
        case 'd': {
          if (focusedMatchIndex >= 0 && focusedMatchIndex < filteredMatches.length) {
            e.preventDefault();
            const match = filteredMatches[focusedMatchIndex];
            if ((match.status as string) !== 'DISMISSED' && (match.status as string) !== 'SENT') {
              dismissMatch(match.id);
            }
          }
          break;
        }
        case 'enter': {
          if (focusedMatchIndex >= 0 && focusedMatchIndex < filteredMatches.length) {
            e.preventDefault();
            const match = filteredMatches[focusedMatchIndex];
            if ((match.status as string) !== 'DISMISSED' && (match.status as string) !== 'SENT') {
              setCreateSuggestionDialog(match.id);
            }
          }
          break;
        }
        case 'escape': {
          setFocusedMatchIndex(-1);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, filteredMatches, focusedMatchIndex, saveMatch, dismissMatch]);

  const handleStartScan = (
    method: 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2',
    skipPreparation: boolean
  ) => {
    startScan({
      action: 'full_scan',
      method,
      forceRefresh: false,
      skipPreparation,
    });
  };

  const handleHideCandidate = (candidate: CandidateToHide) => {
    setCandidateToHide(candidate);
    setShowHideDialog(true);
  };

  const handleConfirmHide = async (candidateId: string, reason?: string) => {
    return await hideCandidate(candidateId, reason);
  };

  const handleCreateSuggestion = useCallback(async () => {
    if (!createSuggestionDialog) return;

    const suggestionId = await createSuggestion(createSuggestionDialog, {
      priority: suggestionPriority,
      matchingReason: suggestionNotes || undefined,
      suppressNotifications: notificationMethod === 'WHATSAPP_MANUAL',
      swapParties: isPartiesSwapped,
    });

    if (suggestionId) {
      setCreateSuggestionDialog(null);
      setSuggestionPriority('MEDIUM');
      setSuggestionNotes('');
      setNotificationMethod('EMAIL');
      setIsPartiesSwapped(false);

      if (notificationMethod === 'WHATSAPP_MANUAL') {
        toast.info('ההצעה נוצרה. זכור לשלוח את ההודעה בוואטסאפ!', {
          duration: 5000,
          icon: <MessageCircle className="w-5 h-5 text-green-500" />,
        });
      }
    }
  }, [
    createSuggestionDialog,
    createSuggestion,
    suggestionPriority,
    suggestionNotes,
    notificationMethod,
    isPartiesSwapped,
  ]);

  const handleDismiss = useCallback(async () => {
    if (!dismissDialog) return;

    await dismissMatch(dismissDialog, dismissReason || undefined);
    setDismissDialog(null);
    setDismissReason('');
  }, [dismissDialog, dismissMatch, dismissReason]);

  const handleBulkDismiss = useCallback(async () => {
    setConfirmBulkDismissDialog(false);
    await bulkDismiss(selectedMatchIds, 'דחייה מרובה');
  }, [bulkDismiss, selectedMatchIds]);

  const handleViewProfile = useCallback((userId: string) => {
    scrollPositionRef.current = window.scrollY;
    setViewProfileId(userId);
  }, []);
  const handleEditProfile = useCallback((candidate: any) => {
    scrollPositionRef.current = window.scrollY;
    setEditProfileCandidate(candidate);
  }, []);

  const handleCloseEditProfile = useCallback(() => {
    const savedPosition = scrollPositionRef.current;
    setEditProfileCandidate(null);
    requestAnimationFrame(() => {
      window.scrollTo(0, savedPosition);
    });
  }, []);
  const handleResetFilters = useCallback(() => {
    setLocalSearchTerm('');
    resetFilters();
  }, [resetFilters]);

  // Count active filters for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'pending') count++;
    if (filters.sortBy !== 'score_desc') count++;
    if (filters.minScore !== 70 || filters.maxScore !== 100) count++;
    if (filters.scanMethod) count++;
    if (filters.gender) count++;
    if (filters.religiousLevel) count++;
    if (filters.city) count++;
    if (filters.hasWarning !== null) count++;
    if (filters.scannedAfter) count++;
    if (filters.scannedBefore) count++;
    if (filters.scanSessionId) count++;
    if (filters.availabilityFilter !== 'all') count++;
    if (filters.backgroundCompatibility?.length > 0) count++;
    if (filters.maxAsymmetryGap !== null) count++;
    if (filters.minConfidence !== null) count++;
    if (filters.dataQuality) count++;
    if (filters.isExploratoryMatch !== null) count++;
    if (filters.tier) count++;
    if (filters.maleAgeRange) count++;
    if (filters.femaleAgeRange) count++;
    if ((filters.maleReligiousLevel?.length ?? 0) > 0) count++;
    if ((filters.femaleReligiousLevel?.length ?? 0) > 0) count++;
    return count;
  }, [filters]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = () => {
    const newPage = parseInt(pageInput);
    if (!isNaN(newPage) && newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    } else {
      setPageInput(String(pagination.page));
      toast.error(`נא להזין מספר עמוד בין 1 ל-${pagination.totalPages}`);
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputSubmit();
    }
  };

  // Find the active match for suggestion dialog visualization
  const activeMatchForSuggestion = useMemo(
    () => matches.find((m) => m.id === createSuggestionDialog),
    [matches, createSuggestionDialog]
  );

  const handleToggleBulkActions = useCallback(() => {
    setShowBulkActions((prev) => {
      if (prev) clearSelection();
      return !prev;
    });
  }, [clearSelection]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30"
      dir="rtl"
    >
      {/* Header */}
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={stats ? stats.pending : '...'}
        isScanning={isScanning}
        scanProgress={scanProgress}
        scanResult={scanResult}
        onStartScan={handleStartScan}
        onCancelScan={cancelScan}
        lastScanInfo={lastScanInfo as unknown as FullLastScanInfo}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        hiddenCandidates={hiddenCandidates}
        onUnhide={unhideCandidate}
        onUpdateReason={updateReason}
        isLoadingHidden={isLoadingHidden}
      />

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Conditional Rendering based on Tab */}
        {activeTab === 'overview' ? (
          <CardErrorBoundary>
            <MatchmakerDashboardV2 />
          </CardErrorBoundary>
        ) : activeTab === 'daily' ? (
          <CardErrorBoundary>
            <DailySuggestionsDashboard onViewUser={handleViewProfile} />
          </CardErrorBoundary>
        ) : (
          <>
            {/* Stats */}
            <PotentialMatchesStats
              stats={stats as unknown as FullStatsType}
              lastScanInfo={lastScanInfo as unknown as FullLastScanInfo}
              isScanRunning={isScanning}
              scanProgress={scanProgress?.progressPercent || 0}
              onFilterChange={(newFilters) => {
                setFilters(newFilters as any);
                setActiveTab('matches');
              }}
            />

            {/* Filters & Controls - Sticky */}
            <MatchesToolbar
              localSearchTerm={localSearchTerm}
              onLocalSearchTermChange={setLocalSearchTerm}
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              onResetFilters={handleResetFilters}
              activeFilterCount={activeFilterCount}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              cardStyle={cardStyle}
              onCardStyleChange={setCardStyle}
              showBulkActions={showBulkActions}
              onToggleBulkActions={handleToggleBulkActions}
              mobileFiltersOpen={mobileFiltersOpen}
              onMobileFiltersOpenChange={setMobileFiltersOpen}
            />

            {/* Bulk Actions Bar */}
            <BulkActionBar
              showBulkActions={showBulkActions}
              selectedMatchIds={selectedMatchIds}
              isActioning={isActioning}
              onSelectAll={selectAll}
              onClearSelection={clearSelection}
              onBulkCreate={() => setConfirmBulkCreateDialog(true)}
              onBulkReview={bulkReview}
              onBulkDismissClick={() => setConfirmBulkDismissDialog(true)}
            />

            {/* Matches Grid/List + Pagination + Quick Filters + States */}
            <MatchesGrid
              matches={matches}
              filteredMatches={filteredMatches}
              stats={stats as unknown as FullStatsType}
              isLoading={isLoading}
              error={error}
              viewMode={viewMode}
              cardStyle={cardStyle}
              focusedMatchIndex={focusedMatchIndex}
              onFocusedMatchIndexChange={setFocusedMatchIndex}
              filters={filters}
              setFilters={setFilters}
              localSearchTerm={localSearchTerm}
              onResetFilters={handleResetFilters}
              onConfirmScanDialog={() => setConfirmScanDialog(true)}
              pagination={pagination}
              pageInput={pageInput}
              onPageInputChange={handlePageInputChange}
              onPageInputSubmit={handlePageInputSubmit}
              onPageInputKeyDown={handlePageInputKeyDown}
              onSetPage={setPage}
              onSetPageSize={setPageSize}
              onRefresh={refresh}
              onCreateSuggestion={(id) => setCreateSuggestionDialog(id)}
              onDismiss={(id) => dismissMatch(id)}
              onReview={reviewMatch}
              onRestore={restoreMatch}
              onSave={saveMatch}
              onViewProfile={handleViewProfile}
              onAnalyzeCandidate={(candidate) => setAnalyzedCandidate(candidate)}
              onProfileFeedback={(candidate) => setFeedbackCandidate(candidate)}
              onHideCandidate={handleHideCandidate}
              onFilterByUser={handleFilterByUser}
              hiddenCandidateIds={hiddenCandidateIds}
              showBulkActions={showBulkActions}
              isSelected={isSelected}
              toggleSelection={toggleSelection}
            />
          </>
        )}
      </main>

      {/* ======================================================================== */}
      {/* DIALOGS                                                                  */}
      {/* Note: Dialogs remain in the parent component because they depend on      */}
      {/* multiple pieces of parent state (form values, action handlers, etc.)      */}
      {/* and extracting them would require passing too many props with no benefit. */}
      {/* ======================================================================== */}

      {/* Profile Dialog */}
      <Dialog
        open={!!viewProfileId}
        onOpenChange={(open) => {
          if (!open) {
            const savedPosition = scrollPositionRef.current;

            setViewProfileId(null);
            setFullProfileData(null);
            setQuestionnaireData(null);

            requestAnimationFrame(() => {
              window.scrollTo(0, savedPosition);
            });
          }
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto p-0"
          dir={locale === 'he' ? 'rtl' : 'ltr'}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}
        >
          {/* Custom Header */}
          <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-800">
              {fullProfileData
                ? `${fullProfileData.profile?.user?.firstName || ''} ${fullProfileData.profile?.user?.lastName || ''}`
                : 'טוען פרופיל...'}
            </DialogTitle>

            <div className="flex items-center gap-2">
              <Select
                value={isMatchmakerView ? 'matchmaker' : 'candidate'}
                onValueChange={(value) =>
                  setIsMatchmakerView(value === 'matchmaker')
                }
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidate">תצוגת מועמד</SelectItem>
                  <SelectItem value="matchmaker">תצוגת שדכן</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewProfileId(null)}
                className="h-9 w-9 rounded-full hover:bg-red-50 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="p-0">
            {isLoadingProfile ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
                <p className="text-gray-500">טוען נתוני פרופיל...</p>
              </div>
            ) : fullProfileData ? (
              <ProfileCard
                profile={fullProfileData.profile}
                images={fullProfileData.images}
                questionnaire={questionnaireData}
                sfAnswers={sfAnswersData}
                sfUpdatedAt={sfUpdatedAtData}
                viewMode={isMatchmakerView ? 'matchmaker' : 'candidate'}
                isProfileComplete={
                  fullProfileData.profile?.isProfileComplete || false
                }
                locale={locale}
                onClose={() => setViewProfileId(null)}
                dict={profileDict.profileCard}
              />
            ) : (
              <div className="p-10 text-center text-gray-500">
                לא ניתן לטעון את הפרופיל
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- AI Analysis Dialog --- */}
      <AiMatchmakerProfileAdvisorDialog
        isOpen={!!analyzedCandidate}
        onClose={() => setAnalyzedCandidate(null)}
        candidate={analyzedCandidate}
        dict={matchmakerDict.candidatesManager.aiProfileAdvisor}
        locale={locale}
      />

      {/* --- Profile Feedback Dialog --- */}
      <ProfileFeedbackDialog
        isOpen={!!feedbackCandidate}
        onClose={() => setFeedbackCandidate(null)}
        candidate={feedbackCandidate}
        locale={locale}
        dict={matchmakerDict.candidatesManager.profileFeedbackDialog}
      />

      {/* Confirm Scan Dialog */}
      <AlertDialog open={confirmScanDialog} onOpenChange={setConfirmScanDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-600" />
              הפעלת סריקה לילית
            </AlertDialogTitle>
            <AlertDialogDescription>
              הסריקה תעבור על כל המועמדים במערכת ותמצא התאמות פוטנציאליות חדשות.
              התהליך עשוי לקחת מספר דקות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStartScan('hybrid', false)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500"
            >
              <HeartHandshake className="w-4 h-4 ml-2" />
              התחל סריקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Bulk Dismiss Dialog */}
      <AlertDialog
        open={confirmBulkDismissDialog}
        onOpenChange={setConfirmBulkDismissDialog}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              דחיית {selectedMatchIds.length} התאמות
            </AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לדחות את כל ההתאמות שנבחרו? ניתן יהיה לשחזר
              אותן בהמשך.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDismiss}
              className="bg-red-600 hover:bg-red-700"
            >
              דחה הכל
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Suggestion Dialog */}
      <Dialog
        open={!!createSuggestionDialog}
        onOpenChange={(open) => {
          if (!open) {
            setCreateSuggestionDialog(null);
            setIsPartiesSwapped(false);
            setNotificationMethod('EMAIL');
          }
        }}
      >
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-green-600" />
              יצירת הצעה
            </DialogTitle>
            <DialogDescription>
              קבע את סדר הפנייה ואופן השליחה
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* --- Party swap visualization --- */}
            {activeMatchForSuggestion &&
              (() => {
                const firstPartyImage = isPartiesSwapped
                  ? getMainImage(activeMatchForSuggestion.female)
                  : getMainImage(activeMatchForSuggestion.male);

                const secondPartyImage = isPartiesSwapped
                  ? getMainImage(activeMatchForSuggestion.male)
                  : getMainImage(activeMatchForSuggestion.female);

                return (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      {/* First party */}
                      <div className="flex-1 flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-blue-600 mb-1">
                          צד א (ראשון)
                        </span>
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-200 bg-white shadow-sm mb-1">
                          {firstPartyImage ? (
                            <img
                              src={firstPartyImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center h-full text-xl">
                              {isPartiesSwapped ? '👩' : '👨'}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {isPartiesSwapped
                            ? activeMatchForSuggestion.female.firstName
                            : activeMatchForSuggestion.male.firstName}
                        </span>
                      </div>

                      {/* Swap button */}
                      <div className="flex flex-col items-center px-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsPartiesSwapped(!isPartiesSwapped)}
                          className="rounded-full shadow-sm hover:bg-white hover:border-indigo-300 transition-all active:scale-95"
                          title="החלף צדדים"
                        >
                          <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                        </Button>
                        <span className="text-[10px] text-gray-400 mt-1">
                          החלף
                        </span>
                      </div>

                      {/* Second party */}
                      <div className="flex-1 flex flex-col items-center text-center opacity-70">
                        <span className="text-xs font-bold text-gray-500 mb-1">
                          צד ב (שני)
                        </span>
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 bg-white shadow-sm mb-1">
                          {secondPartyImage ? (
                            <img
                              src={secondPartyImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="flex items-center justify-center h-full text-xl">
                              {isPartiesSwapped ? '👨' : '👩'}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {isPartiesSwapped
                            ? activeMatchForSuggestion.male.firstName
                            : activeMatchForSuggestion.female.firstName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* --- Channel selection --- */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                איך לשלוח את ההצעה?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setNotificationMethod('EMAIL')}
                  className={cn(
                    'cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all',
                    notificationMethod === 'EMAIL'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  )}
                >
                  <Send className="w-5 h-5 mb-1" />
                  <span className="text-sm font-bold">אוטומטי (מייל)</span>
                </div>

                <div
                  onClick={() => setNotificationMethod('WHATSAPP_MANUAL')}
                  className={cn(
                    'cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all',
                    notificationMethod === 'WHATSAPP_MANUAL'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-100 bg-white hover:bg-gray-50'
                  )}
                >
                  <MessageCircle className="w-5 h-5 mb-1" />
                  <span className="text-sm font-bold">ידני (וואטסאפ)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {notificationMethod === 'EMAIL'
                  ? "המערכת תשלח מייל לצד א' (הראשון) באופן אוטומטי."
                  : 'ההצעה תיווצר במערכת, אך לא יישלח מייל. באחריותך לשלוח הודעה.'}
              </p>
            </div>

            {/* --- Priority & notes --- */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  עדיפות
                </label>
                <Select
                  value={suggestionPriority}
                  onValueChange={(value) => setSuggestionPriority(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">נמוכה</SelectItem>
                    <SelectItem value="MEDIUM">בינונית</SelectItem>
                    <SelectItem value="HIGH">גבוהה</SelectItem>
                    <SelectItem value="URGENT">דחופה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                הערות פנימיות (אופציונלי)
              </label>
              <Textarea
                value={suggestionNotes}
                onChange={(e) => setSuggestionNotes(e.target.value)}
                placeholder="הוסף הערות..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCreateSuggestionDialog(null)}
            >
              ביטול
            </Button>
            <Button
              onClick={handleCreateSuggestion}
              disabled={isActioning}
              className="bg-gradient-to-r from-green-500 to-emerald-500 min-w-[120px]"
            >
              {isActioning ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <HeartHandshake className="w-4 h-4 ml-2" />
              )}
              צור הצעה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HideCandidateDialog
        open={showHideDialog}
        onOpenChange={setShowHideDialog}
        candidate={candidateToHide}
        onConfirm={handleConfirmHide}
      />

      {/* Dismiss Dialog */}
      <Dialog
        open={!!dismissDialog}
        onOpenChange={(open) => !open && setDismissDialog(null)}
      >
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="w-5 h-5" />
              דחיית התאמה
            </DialogTitle>
            <DialogDescription>
              ניתן לציין סיבה לדחייה (אופציונלי)
            </DialogDescription>
          </DialogHeader>

          <div>
            <Textarea
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              placeholder="סיבת הדחייה..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDismissDialog(null)}>
              ביטול
            </Button>
            <Button
              onClick={handleDismiss}
              disabled={isActioning}
              variant="destructive"
            >
              {isActioning ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <X className="w-4 h-4 ml-2" />
              )}
              דחה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirm Bulk Create Suggestions Dialog */}
      <AlertDialog
        open={confirmBulkCreateDialog}
        onOpenChange={setConfirmBulkCreateDialog}
      >
        <AlertDialogContent dir="rtl" className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                <Send className="w-5 h-5" />
              </div>
              שליחת {selectedMatchIds.length} הצעות
            </AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לשלוח {selectedMatchIds.length} הצעות?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Content outside header */}
          <div className="space-y-4">
            {/* Priority selection */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">עדיפות:</span>
              <Select
                value={bulkCreatePriority}
                onValueChange={(v: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') =>
                  setBulkCreatePriority(v)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400" />
                      נמוכה
                    </span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      רגילה
                    </span>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      גבוהה
                    </span>
                  </SelectItem>
                  <SelectItem value="URGENT">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      דחופה
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Warning note */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">שים לב:</p>
                  <p className="mt-1">
                    כל הצעה תישלח לשני הצדדים בנפרד. מיילים יישלחו אוטומטית.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="flex-1">ביטול</AlertDialogCancel>
            <AlertDialogAction
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
              onClick={async () => {
                const result = await bulkCreateSuggestions(selectedMatchIds, {
                  priority: bulkCreatePriority,
                });
                setConfirmBulkCreateDialog(false);
                setBulkCreatePriority('MEDIUM');
              }}
            >
              <Send className="w-4 h-4 ml-2" />
              שלח {selectedMatchIds.length} הצעות
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Profile Sheet */}
      <MatchmakerEditProfile
        isOpen={!!editProfileCandidate}
        onClose={handleCloseEditProfile}
        candidate={editProfileCandidate}
        dict={matchmakerDict.candidatesManager.editProfile}
        profileDict={profileDict}
        locale={locale}
      />
    </div>
  );
};

export default PotentialMatchesDashboard;
