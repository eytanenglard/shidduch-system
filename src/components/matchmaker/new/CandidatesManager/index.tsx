// File: src/components/matchmaker/new/CandidatesManager/index.tsx

'use client';

// --- React & Next.js Imports ---
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// --- Third-party Libraries ---
import {
  UserPlus,
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  RotateCw,
  Bot,
  Loader2,
  Columns,
  View,
  Users,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  GitCompare,
  X,
  UserCircle, // <-- אייקון חדש לחיפוש וירטואלי
} from 'lucide-react';
import { toast } from 'sonner';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// --- Custom Hooks ---
import { useCandidates } from '../hooks/useCandidates';
import { useFilterLogic } from '../hooks/useFilterLogic';

// --- Internal Components ---
import SplitView from './SplitView';
import FilterPanel from '../Filters/FilterPanel';
import ActiveFilters from '../Filters/ActiveFilters';
import SearchBar from '../Filters/SearchBar';
import { LoadingContainer } from '../shared/LoadingStates';
import { AddManualCandidateDialog } from '../dialogs/AddManualCandidateDialog';
import { AiMatchAnalysisDialog } from '../dialogs/AiMatchAnalysisDialog';
import { ProfileFeedbackDialog } from '../dialogs/ProfileFeedbackDialog';
import { AiMatchmakerProfileAdvisorDialog } from '../dialogs/AiMatchmakerProfileAdvisorDialog';

// --- Virtual Search Components (NEW) ---
import { VirtualUserDialog, SavedVirtualProfiles } from '../VirtualSearch';

// --- Types, Constants & Utils ---
import type {
  Candidate,
  ViewMode,
  CandidatesFilter,
  CandidateAction,
  MobileView,
} from '../types/candidates';
import { SORT_OPTIONS, VIEW_OPTIONS } from '../constants/filterOptions';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';


// הוספת שדה מותאם אישית ל-Candidate כדי למנוע שגיאות TS (אפשר גם להשתמש ב-as any)
type VirtualCandidate = Candidate & {
  isVirtual: boolean;
  virtualData?: any; // אובייקט לשמירת הנתונים הגולמיים
};


// --- Interfaces Definitions ---
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
}

// ============================================================================
// Minimal Compact Header Component
// ============================================================================
const MinimalHeader: React.FC<{
  stats: {
    total: number;
    male: number;
    female: number;
    verified: number;
    activeToday: number;
    profilesComplete: number;
  };
  onAddCandidate: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onBulkUpdate?: () => void;
  isBulkUpdating?: boolean;
  isAdmin?: boolean;
  isCompact: boolean;
  onToggleCompact: () => void;
  dict: MatchmakerPageDictionary['candidatesManager']['header'];
}> = ({
  stats,
  onAddCandidate,
  onRefresh,
  isRefreshing,
  onBulkUpdate,
  isBulkUpdating,
  isAdmin,
  isCompact,
  onToggleCompact,
  dict,
}) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm transition-all duration-300',
        isCompact ? 'h-16' : 'h-32'
      )}
    >
      <div className="container mx-auto px-6 h-full">
        {isCompact ? (
          // --- COMPACT MODE ---
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <Users className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-bold text-gray-800">
                  {dict.title}
                </h1>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  {stats.total} {dict.totalLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  {stats.verified} {dict.verifiedLabel}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-orange-50 text-orange-700 border-orange-200"
                >
                  {stats.profilesComplete}
                  {dict.profilesCompleteLabel}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onAddCandidate}
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
              >
                <UserPlus className="w-4 h-4 ml-1" />
                {dict.addButton}
              </Button>
              <Button
                onClick={onRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="border-gray-300 hover:bg-gray-50"
              >
                <RotateCw
                  className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
                />
              </Button>
              {isAdmin && onBulkUpdate && (
                <Button
                  onClick={onBulkUpdate}
                  variant="secondary"
                  size="sm"
                  disabled={isBulkUpdating}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  {isBulkUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                onClick={onToggleCompact}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
                title={dict.expandTooltip}
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          // --- EXPANDED MODE ---
          <div className="flex flex-col justify-center h-full py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {dict.advancedTitle}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {dict.advancedSubtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={onAddCandidate}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                >
                  <UserPlus className="w-4 h-4 ml-2" />
                  {dict.addCandidateButton}
                  <Sparkles className="w-3 h-3 mr-1" />
                </Button>
                <Button
                  onClick={onRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                >
                  <RotateCw
                    className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
                  />
                </Button>
                {isAdmin && onBulkUpdate && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={isBulkUpdating}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      >
                        {isBulkUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {dict.bulkUpdateDialog.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {dict.bulkUpdateDialog.description}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {dict.bulkUpdateDialog.cancel}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={onBulkUpdate}>
                          {dict.bulkUpdateDialog.confirm}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button
                  onClick={onToggleCompact}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  title={dict.collapseTooltip}
                >
                  <TrendingDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-3">
              <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-2 shadow-sm border border-blue-100">
                <div className="text-lg font-bold text-blue-700">
                  {stats.total}
                </div>
                <div className="text-xs text-blue-600">{dict.stats.total}</div>
              </div>
              <div className="text-center bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-2 shadow-sm border border-indigo-100">
                <div className="text-lg font-bold text-indigo-700">
                  {stats.male}
                </div>
                <div className="text-xs text-indigo-600">{dict.stats.male}</div>
              </div>
              <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 shadow-sm border border-purple-100">
                <div className="text-lg font-bold text-purple-700">
                  {stats.female}
                </div>
                <div className="text-xs text-purple-600">
                  {dict.stats.female}
                </div>
              </div>
              <div className="text-center bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-2 shadow-sm border border-emerald-100">
                <div className="text-lg font-bold text-emerald-700">
                  {stats.verified}
                </div>
                <div className="text-xs text-emerald-600">
                  {dict.stats.verified}
                </div>
              </div>
              <div className="text-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-2 shadow-sm border border-orange-100">
                <div className="text-lg font-bold text-orange-700">
                  {stats.activeToday}
                </div>
                <div className="text-xs text-orange-600">
                  {dict.stats.active}
                </div>
              </div>
              <div className="text-center bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-2 shadow-sm border border-teal-100">
                <div className="text-lg font-bold text-teal-700">
                  {stats.profilesComplete}%
                </div>
                <div className="text-xs text-teal-600">
                  {dict.stats.complete}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

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
  // --- State Management ---
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mobileView, setMobileView] = useState<MobileView>('double');
  const [isMobile, setIsMobile] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(true);
  const [isQuickViewEnabled, setIsQuickViewEnabled] = useState(false);

  // --- Virtual Search State ---
  const [showVirtualUserDialog, setShowVirtualUserDialog] = useState(false);
  const [showSavedVirtualProfiles, setShowSavedVirtualProfiles] =
    useState(false);

  // --- AI State ---
  const [aiTargetCandidate, setAiTargetCandidate] = useState<Candidate | null>(
    null
  );
  const [comparisonSelection, setComparisonSelection] = useState<
    Record<string, Candidate>
  >({});
  const [aiMatches, setAiMatches] = useState<AiMatch[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [feedbackCandidate, setFeedbackCandidate] = useState<Candidate | null>(
    null
  );
  const [analyzedCandidate, setAnalyzedCandidate] = useState<Candidate | null>(
    null
  );

  // --- Session & Permissions ---
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const handleOpenAiAnalysis = useCallback((candidate: Candidate) => {
    setAnalyzedCandidate(candidate);
  }, []);

  const handleOpenProfileFeedback = useCallback((candidate: Candidate) => {
    setFeedbackCandidate(candidate);
  }, []);

  const handleCloseAiAnalysis = () => {
    setAnalyzedCandidate(null);
  };

  // --- Custom Hooks ---
  const {
    loading,
    candidates,
    maleCandidates,
    femaleCandidates,
    setSorting,
    setFilters: setCandidatesFilters,
    refresh,
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
  const activeFilterCount = useMemo(
    () => activeFilters.length,
    [activeFilters]
  );

  const heroStats = useMemo(() => {
    const total = candidates.length;
    const male = candidates.filter((c) => c.profile.gender === 'MALE').length;
    const female = candidates.filter(
      (c) => c.profile.gender === 'FEMALE'
    ).length;
    const verified = candidates.filter((c) => c.isVerified).length;
    const activeToday = candidates.filter((c) => {
      const lastActive = new Date(c.createdAt);
      const today = new Date();

      return (
        (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24) <= 7
      );
    }).length;
    const profilesComplete =
      total > 0
        ? Math.round(
            (candidates.filter((c) => c.isProfileComplete).length / total) * 100
          )
        : 0;
    return { total, male, female, verified, activeToday, profilesComplete };
  }, [candidates]);

  // --- Effects ---
  useEffect(() => {
    const checkScreen = () => {
      setShowFiltersPanel(window.innerWidth >= 1024);
      setIsMobile(window.innerWidth < 768);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

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
    (key: keyof CandidatesFilter, value?: string) => {
      removeFilter(key, value);
    },
    [removeFilter]
  );

  const handleCandidateAction = useCallback(
    async (type: CandidateAction, candidate: Candidate) => {
      console.log(
        `Action '${type}' triggered for candidate: ${candidate.firstName}`
      );
    },
    []
  );

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
        handleClearAiTarget(e);
        return;
      }
      setAiTargetCandidate(candidate);
      setAiMatches([]);
      setComparisonSelection({});
      toast.info(`מועמד מטרה נבחר: ${candidate.firstName}.`, {
        position: 'bottom-center',
      });
    },
    [aiTargetCandidate]
  );

  const handleClearAiTarget = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAiTargetCandidate(null);
    setAiMatches([]);
    setComparisonSelection({});
    toast.info('בחירת מועמד מטרה בוטלה.', { position: 'bottom-center' });
  };

  const handleToggleComparison = useCallback(
    (candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      setComparisonSelection((prev) => {
        const newSelection = { ...prev };
        if (newSelection[candidate.id]) delete newSelection[candidate.id];
        else newSelection[candidate.id] = candidate;
        return newSelection;
      });
    },
    []
  );

  // --- Virtual Profile Handler ---
  const handleVirtualProfileSelect = useCallback((virtualProfile: any) => {
    // המרת הפרופיל הוירטואלי למבנה של מועמד (Candidate)
    const mockCandidate: VirtualCandidate = {
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
        // ממלאים פרטים נוספים מהפרופיל הגנרטיבי
        city: virtualProfile.generatedProfile.inferredCity,
        occupation: virtualProfile.generatedProfile.inferredOccupation,
        // חישוב גיל ליום הולדת
        birthDate: new Date(
          new Date().setFullYear(
            new Date().getFullYear() -
              virtualProfile.generatedProfile.inferredAge
          )
        ),
        availabilityStatus: 'AVAILABLE',
      },
      // שדות מיוחדים לזיהוי וירטואלי ותצוגת AI
      isVirtual: true,
      aiReasoning:
        virtualProfile.editedSummary ||
        virtualProfile.generatedProfile.displaySummary,
      
      // 🔥 התיקון: שמירת המידע הגולמי לשימוש בחיפוש 🔥
      virtualData: {
        virtualProfileId: virtualProfile.id,
        virtualProfile: virtualProfile.generatedProfile,
        gender: virtualProfile.gender,
        religiousLevel: virtualProfile.religiousLevel,
        editedSummary: virtualProfile.editedSummary
      }
    } as unknown as VirtualCandidate;

    setAiTargetCandidate(mockCandidate);
    setAiMatches([]);
    setComparisonSelection({});

    toast.success('פרופיל וירטואלי נטען! כעת ניתן לבצע חיפוש AI.');
  }, []);


  const handleUpdateAllProfiles = async () => {
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
      // שלב 1: איפוס דגלים
      const resetRes = await fetch('/api/ai/matchmaker/batch-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_FLAGS' }),
      });

      if (!resetRes.ok) throw new Error('Failed to start process');
      const resetData = await resetRes.json();
      const totalToProcess = resetData.count;
      let processedSoFar = 0;

      toast.message(`נמצאו ${totalToProcess} פרופילים לעדכון. מתחיל עיבוד...`, {
        id: toastId,
      });

      // שלב 2: לולאת עיבוד
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
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast.error('שגיאה בתהליך העדכון. נסה שוב מאוחר יותר.', {
        id: toastId,
        duration: 4000,
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const direction = locale === 'he' ? 'rtl' : 'ltr';

  // --- Render ---
  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/10 to-purple-50/5"
      dir={direction}
    >
      <MinimalHeader
        stats={heroStats}
        onAddCandidate={() => setShowManualAddDialog(true)}
        onRefresh={refresh}
        isRefreshing={loading}
        onBulkUpdate={handleUpdateAllProfiles}
        isBulkUpdating={isBulkUpdating}
        isAdmin={isAdmin}
        isCompact={isHeaderCompact}
        onToggleCompact={() => setIsHeaderCompact(!isHeaderCompact)}
        dict={matchmakerDict.candidatesManager.header}
      />

      {isHeaderCompact && (
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 py-3 px-4 mt-16">
          <div className="container mx-auto px-2">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
              {!filters.separateFiltering && (
                <div className="w-full md:flex-1 md:max-w-md">
                  <SearchBar
                    value={filters.searchQuery || ''}
                    onChange={handleSearch}
                    placeholder={
                      matchmakerDict.candidatesManager.searchBar
                        .generalPlaceholder
                    }
                    recentSearches={recentSearches}
                    onClearRecentSearches={clearRecentSearches}
                    dict={matchmakerDict.candidatesManager.searchBar}
                  />
                </div>
              )}

              <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/90 shadow-sm border border-gray-200"
                    >
                      <ArrowUpDown
                        className={cn(
                          'w-4 h-4',
                          locale === 'he' ? 'ml-1' : 'mr-1'
                        )}
                      />
                      {matchmakerDict.candidatesManager.controls.sort}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {matchmakerDict.candidatesManager.controls.sortBy}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {SORT_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() =>
                          setSorting(
                            option.value,
                            option.defaultOrder as 'asc' | 'desc'
                          )
                        }
                      >
                        {
                          matchmakerDict.candidatesManager.sortOptions[
                            option.value as keyof typeof matchmakerDict.candidatesManager.sortOptions
                          ]
                        }
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickViewEnabled(!isQuickViewEnabled)}
                  className="bg-white/90 shadow-sm border border-gray-200"
                >
                  {isQuickViewEnabled ? (
                    <EyeOff
                      className={cn(
                        'w-4 h-4',
                        locale === 'he' ? 'ml-1' : 'mr-1'
                      )}
                    />
                  ) : (
                    <Eye
                      className={cn(
                        'w-4 h-4',
                        locale === 'he' ? 'ml-1' : 'mr-1'
                      )}
                    />
                  )}

                  {isQuickViewEnabled
                    ? matchmakerDict.candidatesManager.controls.disableQuickView
                    : matchmakerDict.candidatesManager.controls.enableQuickView}
                </Button>

                {/* --- כפתור חיפוש וירטואלי חדש --- */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavedVirtualProfiles(true)}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 hover:opacity-90 shadow-sm"
                >
                  <UserCircle
                    className={cn('w-4 h-4', locale === 'he' ? 'ml-1' : 'mr-1')}
                  />
                  חיפוש וירטואלי
                </Button>

                <div className="hidden lg:flex">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                    className="bg-white/90 shadow-sm border border-gray-200"
                  >
                    <Filter className="w-4 h-4 ml-1" />
                    {showFiltersPanel
                      ? matchmakerDict.candidatesManager.controls.hideFilters
                      : matchmakerDict.candidatesManager.controls.filters}
                  </Button>
                </div>

                <Sheet
                  open={showFiltersMobile}
                  onOpenChange={setShowFiltersMobile}
                >
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="lg:hidden relative bg-white/90 shadow-sm border border-gray-200"
                    >
                      <Filter className="w-4 h-4 ml-1" />
                      {matchmakerDict.candidatesManager.controls.filters}
                      {activeFilterCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-indigo-500 border-0 text-xs">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    className="w-full h-full flex flex-col p-0 sm:max-w-md"
                    side={direction === 'rtl' ? 'right' : 'left'}
                  >
                    <div className="flex-1 overflow-y-auto p-4 pt-10">
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
                        dict={matchmakerDict.candidatesManager.filterPanel}
                        className="pb-10"
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <div className="flex gap-1 bg-white/90 p-1 rounded-lg shadow-sm border border-gray-200">
                  {isMobile ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-24 justify-between px-2 border-0"
                        >
                          {mobileView === 'split' && (
                            <Users className="w-4 h-4" />
                          )}
                          {mobileView === 'single' && (
                            <View className="w-4 h-4" />
                          )}
                          {mobileView === 'double' && (
                            <Columns className="w-4 h-4" />
                          )}
                          <ArrowUpDown className="w-3 h-3 opacity-50 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuRadioGroup
                          value={mobileView}
                          onValueChange={(value) =>
                            setMobileView(value as MobileView)
                          }
                        >
                          <DropdownMenuRadioItem value="split">
                            <Users className="w-4 h-4 mr-2" />
                            {
                              matchmakerDict.candidatesManager.controls.mobile
                                .split
                            }
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="single">
                            <View className="w-4 h-4 mr-2" />
                            {
                              matchmakerDict.candidatesManager.controls.mobile
                                .singleCol
                            }
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="double">
                            <Columns className="w-4 h-4 mr-2" />
                            {
                              matchmakerDict.candidatesManager.controls.mobile
                                .doubleCol
                            }
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    VIEW_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={
                          viewMode === option.value ? 'default' : 'ghost'
                        }
                        size="icon"
                        onClick={() => setViewMode(option.value as ViewMode)}
                        className={cn(
                          'h-8 w-8',
                          viewMode === option.value &&
                            'bg-indigo-500 text-white'
                        )}
                      >
                        {option.value === 'grid' ? (
                          <LayoutGrid className="w-4 h-4" />
                        ) : (
                          <List className="w-4 h-4" />
                        )}
                      </Button>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <ActiveFilters
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                onResetAll={resetFilters}
                dict={matchmakerDict.candidatesManager.activeFilters}
              />
            </div>
          </div>
        </div>
      )}

      <main
        className={cn(
          'flex-1 min-h-0 container mx-auto px-6 pb-4 pt-4',
          !isHeaderCompact && 'mt-32'
        )}
      >
        <div className="flex gap-4 h-full">
          {showFiltersPanel && (
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 h-full flex flex-col">
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

          <div className="flex-1 min-w-0 h-full">
            {loading ? (
              <LoadingContainer>
                <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse shadow-lg"></div>
              </LoadingContainer>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border-0 overflow-hidden h-full">
                <SplitView
                  onOpenAiAnalysis={handleOpenAiAnalysis}
                  onSendProfileFeedback={handleOpenProfileFeedback}
                  maleCandidates={maleCandidates}
                  femaleCandidates={femaleCandidates}
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
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <AnimatePresence>
        {aiTargetCandidate && Object.keys(comparisonSelection).length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-2xl border flex items-center gap-4">
              <div className="flex items-center -space-x-4">
                {Object.values(comparisonSelection)
                  .slice(0, 3)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-gray-200 flex items-center justify-center text-gray-500 font-bold"
                    >
                      {c.images?.find((img) => img.isMain) ? (
                        <Image
                          src={getRelativeCloudinaryPath(
                            c.images.find((img) => img.isMain)!.url
                          )}
                          alt={c.firstName}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      ) : (
                        <span>
                          {c.firstName.charAt(0)}
                          {c.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                  ))}
                {Object.keys(comparisonSelection).length > 3 && (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 border-2 border-white">
                    +{Object.keys(comparisonSelection).length - 3}
                  </div>
                )}
              </div>
              <Button
                onClick={() => setIsAnalysisDialogOpen(true)}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold shadow-lg"
              >
                <GitCompare
                  className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                />
                {matchmakerDict.candidatesManager.controls.compareButton.replace(
                  '{{count}}',
                  String(Object.keys(comparisonSelection).length)
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setComparisonSelection({})}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AiMatchmakerProfileAdvisorDialog
        isOpen={!!analyzedCandidate}
        onClose={handleCloseAiAnalysis}
        candidate={analyzedCandidate}
        dict={matchmakerDict.candidatesManager.aiProfileAdvisor}
        locale={locale}
      />
      <ProfileFeedbackDialog
        isOpen={!!feedbackCandidate}
        onClose={() => setFeedbackCandidate(null)}
        candidate={feedbackCandidate}
        locale={locale}
        dict={matchmakerDict.candidatesManager.profileFeedbackDialog}
      />

      {/* --- Dialogs --- */}
      <AddManualCandidateDialog
        isOpen={showManualAddDialog}
        onClose={() => setShowManualAddDialog(false)}
        onCandidateAdded={handleCandidateAdded}
        dict={matchmakerDict.candidatesManager.addManualCandidateDialog}
        locale={locale}
      />

      <AiMatchAnalysisDialog
        isOpen={isAnalysisDialogOpen}
        onClose={() => setIsAnalysisDialogOpen(false)}
        targetCandidate={aiTargetCandidate}
        comparisonCandidates={Object.values(comparisonSelection)}
        dict={matchmakerDict.candidatesManager.aiAnalysis}
        locale={locale}
      />

      {/* --- Virtual Search Dialogs (NEW) --- */}
      <VirtualUserDialog
        isOpen={showVirtualUserDialog}
        onClose={() => setShowVirtualUserDialog(false)}
        onProfileCreated={handleVirtualProfileSelect}
        locale={locale}
      />

      <SavedVirtualProfiles
        isOpen={showSavedVirtualProfiles}
        onClose={() => setShowSavedVirtualProfiles(false)}
        onSelectProfile={handleVirtualProfileSelect}
        onCreateNew={() => {
          setShowSavedVirtualProfiles(false);
          setShowVirtualUserDialog(true);
        }}
        locale={locale}
      />
    </div>
  );
};

export default CandidatesManager;
