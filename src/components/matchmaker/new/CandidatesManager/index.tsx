// File: src/components/matchmaker/new/CandidatesManager/index.tsx

'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Users, Activity } from 'lucide-react';
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

// --- Custom Hooks ---
import { useCandidates } from '../hooks/useCandidates';
import { useFilterLogic } from '../hooks/useFilterLogic';

// --- Zustand Stores ---
import { useCandidateUIStore, useAiMatchingStore } from '../stores';

// --- Internal Components ---
import MinimalHeader from './MinimalHeader';
import ControlsBar from './ControlsBar';
import ComparisonFloatingBar from './ComparisonFloatingBar';
import DialogsContainer from './DialogsContainer';
import SplitView from './SplitView';
import FilterPanel from '../Filters/FilterPanel';
import { LoadingContainer } from '../shared/LoadingStates';
import BulkActionToolbar from '../shared/BulkActionToolbar';
import { BulkSuggestionsProvider } from '@/app/[locale]/contexts/BulkSuggestionsContext';

// --- Types ---
import type { Candidate, CandidateAction } from '../types/candidates';
import type { FilterState } from '../types/filters';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';

// ============================================================================
// Main Candidates Manager Component
// ============================================================================

interface CandidatesManagerProps {
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
  locale: string;
}

const CandidatesManager: React.FC<CandidatesManagerProps> = ({
  matchmakerDict,
  profileDict,
  locale,
}) => {
  // --- Zustand UI Store ---
  const {
    viewMode,
    setViewMode,
    mobileView,
    setMobileView,
    isMobile,
    setIsMobile,
    isHeaderCompact,
    toggleHeaderCompact,
    isQuickViewEnabled,
    toggleQuickView,
    showFiltersPanel,
    setShowFiltersPanel,
    showFiltersMobile,
    setShowFiltersMobile,
    showManualAddDialog,
    showBulkImportDialog,
    showCardImportDialog,
    showBulkSuggestionsDialog,
    showVirtualUserDialog,
    showSavedVirtualProfiles,
    isAnalysisDialogOpen,
    feedbackCandidate,
    analyzedCandidate,
    isBulkUpdating,
    openDialog,
    closeDialog,
    setFeedbackCandidate,
    setAnalyzedCandidate,
    setIsBulkUpdating,
  } = useCandidateUIStore();

  // --- Zustand AI Store ---
  const {
    aiTargetCandidate,
    aiMatches,
    isAiLoading,
    comparisonSelection,
    existingSuggestions,
    setAiTarget,
    clearAiTarget,
    setAiMatches,
    setIsAiLoading,
    toggleComparison,
    clearComparison,
    setExistingSuggestions,
  } = useAiMatchingStore();

  // --- Session & Permissions ---
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  // --- Data Hooks ---
  const {
    loading,
    candidates,
    maleCandidates,
    femaleCandidates,
    setSorting,
    setFilters: setCandidatesFilters,
    refresh,
    selectedIds,
    selectAllOnPage,
    clearSelection,
    exportCandidates,
    filters: candidatesFilters,
    pagination,
    loadMore,
    isLoadingMore,
  } = useCandidates();

  const {
    filters,
    setFilters,
    savedFilters,
    recentSearches,
    popularFilters,
    activeFilters,
    saveFilter,
    resetFilters,
    clearRecentSearches,
    toggleSeparateFiltering,
    updateMaleFilters,
    updateFemaleFilters,
    copyFilters,
    updateMaleSearchQuery,
    updateFemaleSearchQuery,
    removeFilter,
  } = useFilterLogic({ onFilterChange: setCandidatesFilters });

  // --- Derived State ---
  const activeFilterCount = useMemo(() => activeFilters.length, [activeFilters]);

  const heroStats = useMemo(() => {
    const total = pagination.total || candidates.length;
    const male = candidates.filter((c) => c.profile.gender === 'MALE').length;
    const female = candidates.filter((c) => c.profile.gender === 'FEMALE').length;
    const verified = candidates.filter((c) => c.isVerified).length;
    const activeToday = candidates.filter((c) => {
      const lastActive = new Date(c.createdAt);
      const today = new Date();
      return (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24) <= 7;
    }).length;
    const loadedCount = candidates.length || 1;
    const profilesComplete =
      loadedCount > 0
        ? Math.round(
            (candidates.filter((c) => c.isProfileComplete).length / loadedCount) *
              100
          )
        : 0;
    return { total, male, female, verified, activeToday, profilesComplete };
  }, [candidates, pagination.total]);

  // --- Pending AI Target (for confirmation dialog) ---
  const [pendingAiTarget, setPendingAiTarget] = useState<Candidate | null>(null);

  // --- System-wide stats (unfiltered, fetched once on mount) ---
  const [systemStats, setSystemStats] = useState<{
    totalActive: number;
    maleCount: number;
    femaleCount: number;
    newThisWeek: number;
  } | null>(null);
  const systemStatsFetched = useRef(false);

  useEffect(() => {
    if (systemStatsFetched.current) return;
    systemStatsFetched.current = true;

    fetch('/api/matchmaker/dashboard?section=stats')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.stats) {
          setSystemStats({
            totalActive: data.stats.totalActiveUsers ?? 0,
            maleCount: data.stats.maleCount ?? 0,
            femaleCount: data.stats.femaleCount ?? 0,
            newThisWeek: data.stats.newUsersThisWeek ?? 0,
          });
        }
      })
      .catch(() => { /* silent */ });
  }, []);

  // --- Matchmaker custom tags ---
  const [matchmakerTags, setMatchmakerTags] = useState<Array<{ id: string; name: string; color: string; candidateCount: number }>>([]);
  const tagsFetched = useRef(false);

  const fetchMatchmakerTags = useCallback(() => {
    fetch('/api/matchmaker/tags')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.success) setMatchmakerTags(data.tags);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tagsFetched.current) return;
    tagsFetched.current = true;
    fetchMatchmakerTags();
  }, [fetchMatchmakerTags]);

  const handleTagsChanged = useCallback(() => {
    refresh();
    fetchMatchmakerTags();
  }, [refresh, fetchMatchmakerTags]);

  // --- Effects ---
  useEffect(() => {
    const mqlMobile = window.matchMedia('(max-width: 767px)');
    const mqlDesktop = window.matchMedia('(min-width: 1024px)');

    setIsMobile(mqlMobile.matches);
    setShowFiltersPanel(mqlDesktop.matches);

    const handleMobile = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    const handleDesktop = (e: MediaQueryListEvent) =>
      setShowFiltersPanel(e.matches);

    mqlMobile.addEventListener('change', handleMobile);
    mqlDesktop.addEventListener('change', handleDesktop);
    return () => {
      mqlMobile.removeEventListener('change', handleMobile);
      mqlDesktop.removeEventListener('change', handleDesktop);
    };
  }, [setIsMobile, setShowFiltersPanel]);

  // Fetch existing suggestions when target changes
  useEffect(() => {
    if (!aiTargetCandidate) {
      setExistingSuggestions({});
      return;
    }

    const fetchExistingSuggestions = async () => {
      try {
        const res = await fetch(
          `/api/matchmaker/existing-suggestions?userId=${aiTargetCandidate.id}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setExistingSuggestions(data.existingSuggestions);
          }
        }
      } catch {
        // Silently fail — existing suggestions are non-critical
      }
    };

    fetchExistingSuggestions();
  }, [aiTargetCandidate?.id, setExistingSuggestions]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Event Handlers ---
  const handleCandidateAdded = useCallback(() => {
    refresh();
    toast.success('מועמד חדש נוסף בהצלחה!');
  }, [refresh]);

  const handleSearch = useCallback(
    (value: string) => {
      setFilters({ searchQuery: value });
    },
    [setFilters]
  );

  const handleRemoveFilter = useCallback(
    (key: keyof FilterState, value?: string) => {
      removeFilter(key, value);
    },
    [removeFilter]
  );

  const handleCandidateAction = useCallback(
    async (_type: CandidateAction, _candidate: Candidate) => {
      // Action handler — extensible per action type
    },
    []
  );

  // --- Show Similar Candidates ---
  const [similarCandidateIds, setSimilarCandidateIds] = useState<Set<string> | null>(null);

  const handleShowSimilar = useCallback(
    async (candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      const toastId = toast.loading(`מחפש מועמדים דומים ל${candidate.firstName}...`);
      try {
        const res = await fetch(`/api/matchmaker/candidates/similar?userId=${candidate.id}`);
        const data = await res.json();
        if (data.success && data.similarIds?.length > 0) {
          setSimilarCandidateIds(new Set(data.similarIds));
          toast.success(`נמצאו ${data.similarIds.length} מועמדים דומים ל${candidate.firstName}`, {
            id: toastId,
            duration: 4000,
            action: {
              label: 'נקה סינון',
              onClick: () => setSimilarCandidateIds(null),
            },
          });
        } else {
          toast.info('לא נמצאו מועמדים דומים (אין וקטור זמין)', { id: toastId });
        }
      } catch {
        toast.error('שגיאה בחיפוש מועמדים דומים', { id: toastId });
      }
    },
    []
  );

  // Apply similar filter to candidates
  const displayCandidates = useMemo(() => {
    if (!similarCandidateIds) return candidates;
    return candidates.filter((c) => similarCandidateIds.has(c.id));
  }, [candidates, similarCandidateIds]);

  const displayMaleCandidates = useMemo(() => {
    if (!similarCandidateIds) return maleCandidates;
    return maleCandidates.filter((c) => similarCandidateIds.has(c.id));
  }, [maleCandidates, similarCandidateIds]);

  const displayFemaleCandidates = useMemo(() => {
    if (!similarCandidateIds) return femaleCandidates;
    return femaleCandidates.filter((c) => similarCandidateIds.has(c.id));
  }, [femaleCandidates, similarCandidateIds]);

  const handleFilterSave = useCallback(
    async (name: string) => {
      try {
        await saveFilter(name, filters);
        toast.success('הפילטר נשמר בהצלחה');
      } catch {
        toast.error('שגיאה בשמירת הפילטר');
      }
    },
    [filters, saveFilter]
  );

  const handleSetAiTarget = useCallback(
    (candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      if (aiTargetCandidate?.id === candidate.id) {
        clearAiTarget();
        toast.info('בחירת מועמד מטרה בוטלה.', { position: 'bottom-center' });
        return;
      }
      // If there's already a target, ask for confirmation before replacing
      if (aiTargetCandidate) {
        setPendingAiTarget(candidate);
        return;
      }
      setAiTarget(candidate);
      toast.info(`מועמד מטרה נבחר: ${candidate.firstName}.`, {
        position: 'bottom-center',
      });
    },
    [aiTargetCandidate, clearAiTarget, setAiTarget]
  );

  const handleConfirmAiTargetSwitch = useCallback(() => {
    if (pendingAiTarget) {
      setAiTarget(pendingAiTarget);
      toast.info(`מועמד מטרה הוחלף ל: ${pendingAiTarget.firstName}.`, {
        position: 'bottom-center',
      });
      setPendingAiTarget(null);
    }
  }, [pendingAiTarget, setAiTarget]);

  const handleClearAiTarget = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      clearAiTarget();
      toast.info('בחירת מועמד מטרה בוטלה.', { position: 'bottom-center' });
    },
    [clearAiTarget]
  );

  const handleToggleComparison = useCallback(
    (candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      toggleComparison(candidate);
    },
    [toggleComparison]
  );

  // Virtual Profile Handler
  const handleVirtualProfileSelect = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (virtualProfile: any) => {
      const mockCandidate = {
        id: virtualProfile.id,
        firstName: virtualProfile.name || 'משתמש',
        lastName: 'וירטואלי (AI)',
        email: 'virtual@ai.com',
        createdAt: new Date(),
        status: 'ACTIVE',
        images: [],
        isProfileComplete: true,
        source: 'MANUAL_ENTRY',
        isVerified: false,
        profile: {
          gender: virtualProfile.gender,
          religiousLevel: virtualProfile.religiousLevel,
          city: virtualProfile.generatedProfile?.inferredCity,
          occupation: virtualProfile.generatedProfile?.inferredOccupation,
          birthDate: new Date(
            new Date().setFullYear(
              new Date().getFullYear() -
                (virtualProfile.generatedProfile?.inferredAge ?? 30)
            )
          ),
          availabilityStatus: 'AVAILABLE',
        },
        aiReasoning:
          virtualProfile.editedSummary ||
          virtualProfile.generatedProfile?.displaySummary,
      } as unknown as Candidate;

      setAiTarget(mockCandidate);
      toast.success('פרופיל וירטואלי נטען! כעת ניתן לבצע חיפוש AI.');
    },
    [setAiTarget]
  );

  const handleUpdateAllProfiles = useCallback(async () => {
    if (
      !confirm(
        'פעולה זו תפעיל את ה-AI על כל המועמדים במערכת. זה עשוי לקחת מספר דקות. האם להמשיך?'
      )
    )
      return;

    setIsBulkUpdating(true);
    const toastId = toast.loading('מאתחל תהליך עדכון...', {
      duration: Infinity,
    });

    try {
      const resetRes = await fetch('/api/ai/matchmaker/batch-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_FLAGS' }),
      });

      if (!resetRes.ok) throw new Error('Failed to start process');
      const resetData = await resetRes.json();
      const totalToProcess = resetData.count;
      let processedSoFar = 0;

      toast.message(
        `נמצאו ${totalToProcess} פרופילים לעדכון. מתחיל עיבוד...`,
        { id: toastId }
      );

      let completed = false;

      while (!completed) {
        const batchRes = await fetch('/api/ai/matchmaker/batch-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'PROCESS_BATCH', batchSize: 4 }),
        });

        if (!batchRes.ok) throw new Error('Error during batch processing');

        const batchData = await batchRes.json();
        processedSoFar += batchData.processed;
        const percent = Math.round((processedSoFar / totalToProcess) * 100);

        toast.loading(
          `מעבד פרופילים... ${percent}% (${processedSoFar}/${totalToProcess})`,
          { id: toastId }
        );

        if (batchData.completed || batchData.remaining === 0) {
          completed = true;
        }
      }

      toast.success('העדכון הכללי הושלם בהצלחה!', {
        id: toastId,
        duration: 4000,
      });
      refresh();
    } catch {
      toast.error('שגיאה בתהליך העדכון. נסה שוב מאוחר יותר.', {
        id: toastId,
        duration: 4000,
      });
    } finally {
      setIsBulkUpdating(false);
    }
  }, [refresh, setIsBulkUpdating]);

  const direction = locale === 'he' ? 'rtl' : 'ltr';

  // --- Render ---
  return (
    <BulkSuggestionsProvider>
      <div
        className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/10 to-purple-50/5"
        dir={direction}
      >
        <MinimalHeader
          stats={heroStats}
          onAddCandidate={() => openDialog('manualAdd')}
          onBulkImport={() => openDialog('bulkImport')}
          onCardImport={() => openDialog('cardImport')}
          onRefresh={refresh}
          isRefreshing={loading}
          onBulkUpdate={handleUpdateAllProfiles}
          isBulkUpdating={isBulkUpdating}
          isAdmin={isAdmin}
          isCompact={isHeaderCompact}
          onToggleCompact={toggleHeaderCompact}
          dict={matchmakerDict.candidatesManager.header}
        />

        {isHeaderCompact && (
          <ControlsBar
            searchQuery={filters.searchQuery || ''}
            onSearch={handleSearch}
            recentSearches={recentSearches}
            onClearRecentSearches={clearRecentSearches}
            filters={filters}
            onFiltersChange={setFilters}
            onSavePreset={handleFilterSave}
            onResetFilters={resetFilters}
            savedFilters={savedFilters}
            popularFilters={popularFilters}
            activeFilters={activeFilters}
            activeFilterCount={activeFilterCount}
            onRemoveFilter={handleRemoveFilter}
            separateFiltering={filters.separateFiltering ?? false}
            onToggleSeparateFiltering={toggleSeparateFiltering}
            onMaleFiltersChange={updateMaleFilters}
            onFemaleFiltersChange={updateFemaleFilters}
            onCopyFilters={copyFilters}
            onSortChange={setSorting}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            mobileView={mobileView}
            onMobileViewChange={setMobileView}
            isMobile={isMobile}
            isQuickViewEnabled={isQuickViewEnabled}
            onToggleQuickView={toggleQuickView}
            onOpenSavedVirtualProfiles={() => openDialog('savedVirtualProfiles')}
            showFiltersPanel={showFiltersPanel}
            onToggleFiltersPanel={() => setShowFiltersPanel(!showFiltersPanel)}
            showFiltersMobile={showFiltersMobile}
            onSetFiltersMobile={setShowFiltersMobile}
            matchmakerTags={matchmakerTags}
            locale={locale}
            dict={matchmakerDict}
          />
        )}

        {/* System Stats Bar — always visible */}
        {systemStats && (
          <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="container mx-auto px-6 py-2">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-blue-100">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-gray-500">מועמדים פעילים:</span>
                  <span className="font-bold text-blue-700">{systemStats.totalActive}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-gray-500">גברים:</span>
                  <span className="font-semibold text-indigo-700">{systemStats.maleCount}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-gray-500">נשים:</span>
                  <span className="font-semibold text-purple-700">{systemStats.femaleCount}</span>
                </div>
                {systemStats.newThisWeek > 0 && (
                  <div className="hidden md:flex items-center gap-2">
                    <div className="p-1 rounded-md bg-emerald-100">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-gray-500">חדשים השבוע:</span>
                    <span className="font-semibold text-emerald-700">+{systemStats.newThisWeek}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Similar filter active banner */}
        {similarCandidateIds && (
          <div className="bg-indigo-50 border-b border-indigo-200">
            <div className="container mx-auto px-6 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <Users className="w-4 h-4" />
                <span className="font-medium">
                  מציג {similarCandidateIds.size} מועמדים דומים
                </span>
              </div>
              <button
                onClick={() => setSimilarCandidateIds(null)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1 rounded-md hover:bg-indigo-100 transition-colors"
              >
                נקה סינון
              </button>
            </div>
          </div>
        )}

        <main
          className={cn(
            'flex-1 container mx-auto px-6 pb-4 pt-4',
            !isHeaderCompact && 'mt-32'
          )}
        >
          <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 10rem)' }}>
            {showFiltersPanel && (
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col overflow-hidden">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onSavePreset={handleFilterSave}
                    onReset={resetFilters}
                    savedFilters={savedFilters.map((f) => ({
                      id: f.id,
                      name: f.name,
                      isDefault: f.isDefault,
                    }))}
                    popularFilters={popularFilters}
                    separateFiltering={filters.separateFiltering}
                    onToggleSeparateFiltering={toggleSeparateFiltering}
                    onMaleFiltersChange={updateMaleFilters}
                    onFemaleFiltersChange={updateFemaleFilters}
                    onCopyFilters={copyFilters}
                    className="flex-1 overflow-y-auto"
                    dict={matchmakerDict.candidatesManager.filterPanel}
                  />
                </div>
              </aside>
            )}

            <div className="flex-1 min-w-0" style={{ minHeight: 'calc(100vh - 10rem)' }}>
              {loading ? (
                <LoadingContainer>
                  <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse shadow-lg" />
                </LoadingContainer>
              ) : (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 overflow-hidden" style={{ height: 'calc(100vh - 10rem)' }}>
                  <SplitView
                    onOpenAiAnalysis={(c) => setAnalyzedCandidate(c)}
                    onSendProfileFeedback={(c) => setFeedbackCandidate(c)}
                    maleCandidates={displayMaleCandidates}
                    femaleCandidates={displayFemaleCandidates}
                    allCandidates={candidates}
                    onCandidateAction={handleCandidateAction}
                    onCandidateClick={() => {}}
                    viewMode={viewMode}
                    mobileView={mobileView}
                    isLoading={loading || isAiLoading}
                    className="flex-1 overflow-hidden"
                    aiTargetCandidate={aiTargetCandidate}
                    aiMatches={aiMatches}
                    isAiLoading={isAiLoading}
                    onSetAiTarget={handleSetAiTarget}
                    onClearAiTarget={handleClearAiTarget}
                    setAiMatches={setAiMatches}
                    setIsAiLoading={setIsAiLoading}
                    comparisonSelection={comparisonSelection}
                    onToggleComparison={handleToggleComparison}
                    existingSuggestions={existingSuggestions}
                    separateFiltering={filters.separateFiltering ?? false}
                    maleFilters={filters.maleFilters}
                    femaleFilters={filters.femaleFilters}
                    onMaleFiltersChange={updateMaleFilters}
                    onFemaleFiltersChange={updateFemaleFilters}
                    onCopyFilters={copyFilters}
                    maleSearchQuery={filters.maleSearchQuery}
                    femaleSearchQuery={filters.femaleSearchQuery}
                    onMaleSearchChange={updateMaleSearchQuery}
                    onFemaleSearchChange={updateFemaleSearchQuery}
                    dict={matchmakerDict}
                    profileDict={profileDict}
                    isQuickViewEnabled={isQuickViewEnabled}
                    locale={locale}
                    onEndReached={loadMore}
                    isLoadingMore={isLoadingMore}
                    onShowSimilar={handleShowSimilar}
                    onTagsChanged={handleTagsChanged}
                  />
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Bulk Action Toolbar */}
        <BulkActionToolbar
          selectedCount={selectedIds.size}
          totalCount={candidates.length}
          onSelectAll={selectAllOnPage}
          onClearSelection={clearSelection}
          onBulkExport={() => {
            const selectedCandidates = candidates.filter((c) =>
              selectedIds.has(c.id)
            );
            exportCandidates(selectedCandidates, candidatesFilters);
            clearSelection();
          }}
        />

        {/* Comparison Floating Bar */}
        <ComparisonFloatingBar
          aiTargetCandidate={aiTargetCandidate}
          comparisonSelection={comparisonSelection}
          onOpenAnalysis={() => openDialog('analysis')}
          onOpenBulkSuggestions={() => openDialog('bulkSuggestions')}
          onClearComparison={clearComparison}
          compareButtonLabel={
            matchmakerDict.candidatesManager.controls.compareButton
          }
          locale={locale}
        />

        {/* AI Target Switch Confirmation */}
        <AlertDialog
          open={!!pendingAiTarget}
          onOpenChange={(open) => { if (!open) setPendingAiTarget(null); }}
        >
          <AlertDialogContent className="text-right" dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>החלפת מועמד מטרה</AlertDialogTitle>
              <AlertDialogDescription>
                מועמד המטרה הנוכחי הוא <strong>{aiTargetCandidate?.firstName}</strong>.
                {' '}האם ברצונך להחליף ל<strong>{pendingAiTarget?.firstName}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2">
              <AlertDialogAction onClick={handleConfirmAiTargetSwitch}>
                כן, החלף
              </AlertDialogAction>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* All Dialogs */}
        <DialogsContainer
          showManualAddDialog={showManualAddDialog}
          onCloseManualAdd={() => closeDialog('manualAdd')}
          onCandidateAdded={handleCandidateAdded}
          showBulkImportDialog={showBulkImportDialog}
          onCloseBulkImport={() => closeDialog('bulkImport')}
          onImportComplete={() => {
            refresh();
            toast.success('הייבוא הושלם בהצלחה!');
          }}
          showCardImportDialog={showCardImportDialog}
          onCloseCardImport={() => closeDialog('cardImport')}
          onCardImportComplete={() => {
            refresh();
            toast.success('הייבוא הושלם בהצלחה!');
          }}
          analyzedCandidate={analyzedCandidate}
          onCloseAiAnalysis={() => setAnalyzedCandidate(null)}
          feedbackCandidate={feedbackCandidate}
          onCloseFeedback={() => setFeedbackCandidate(null)}
          isAnalysisDialogOpen={isAnalysisDialogOpen}
          onCloseAnalysis={() => closeDialog('analysis')}
          aiTargetCandidate={aiTargetCandidate}
          comparisonCandidates={Object.values(comparisonSelection)}
          showBulkSuggestionsDialog={showBulkSuggestionsDialog}
          onCloseBulkSuggestions={() => closeDialog('bulkSuggestions')}
          existingSuggestions={existingSuggestions}
          showVirtualUserDialog={showVirtualUserDialog}
          onCloseVirtualUser={() => closeDialog('virtualUser')}
          onVirtualProfileCreated={handleVirtualProfileSelect}
          showSavedVirtualProfiles={showSavedVirtualProfiles}
          onCloseSavedVirtualProfiles={() =>
            closeDialog('savedVirtualProfiles')
          }
          onSelectVirtualProfile={handleVirtualProfileSelect}
          onCreateNewVirtualProfile={() => {
            closeDialog('savedVirtualProfiles');
            openDialog('virtualUser');
          }}
          dict={matchmakerDict}
          locale={locale}
        />
      </div>
    </BulkSuggestionsProvider>
  );
};

export default CandidatesManager;
