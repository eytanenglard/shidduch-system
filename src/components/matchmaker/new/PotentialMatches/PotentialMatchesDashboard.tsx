// src/components/matchmaker/new/PotentialMatches/PotentialMatchesDashboard.tsx

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  RefreshCw,
  Moon,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Eye,
  Clock,
  Send,
  X,
  Trash2,
  Bookmark,
  LayoutGrid,
  List,
  CheckCircle,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Components
import PotentialMatchCard from './PotentialMatchCard';
import PotentialMatchesStats from './PotentialMatchesStats';
import { ProfileCard } from '@/components/profile';

// Import Dialogs
import { AiMatchmakerProfileAdvisorDialog } from '../dialogs/AiMatchmakerProfileAdvisorDialog';
import { ProfileFeedbackDialog } from '../dialogs/ProfileFeedbackDialog';

// Hooks
import { usePotentialMatches } from './hooks/usePotentialMatches';

// Types
import type {
  PotentialMatchFilterStatus,
  PotentialMatchSortBy,
} from './types/potentialMatches';
import type { ProfilePageDictionary } from '@/types/dictionary';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

// =============================================================================
// TYPES
// =============================================================================

interface PotentialMatchesDashboardProps {
  locale?: string;
  profileDict: ProfilePageDictionary;
  matchmakerDict: MatchmakerPageDictionary;
}

const STATUS_OPTIONS: {
  value: PotentialMatchFilterStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'all', label: 'הכל', icon: Heart },
  { value: 'pending', label: 'ממתינות', icon: Clock },
  { value: 'reviewed', label: 'נבדקו', icon: Eye },
  { value: 'sent', label: 'נשלחו', icon: Send },
  { value: 'shortlisted', label: 'שמורים בצד', icon: Bookmark },
  { value: 'dismissed', label: 'נדחו', icon: X },
  { value: 'with_warnings', label: 'עם אזהרות', icon: AlertTriangle },
  { value: 'no_warnings', label: 'ללא אזהרות', icon: CheckCircle },
];

const SORT_OPTIONS: { value: PotentialMatchSortBy; label: string }[] = [
  { value: 'score_desc', label: 'ציון (גבוה לנמוך)' },
  { value: 'score_asc', label: 'ציון (נמוך לגבוה)' },
  { value: 'date_desc', label: 'תאריך (חדש לישן)' },
  { value: 'date_asc', label: 'תאריך (ישן לחדש)' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const PotentialMatchesDashboard: React.FC<PotentialMatchesDashboardProps> = ({
  locale = 'he',
  profileDict,
  matchmakerDict,
}) => {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // ✅ ניהול חיפוש מקומי עבור Debounce
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  const [showBulkActions, setShowBulkActions] = useState(false);

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
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isMatchmakerView, setIsMatchmakerView] = useState(true);

  // --- AI Analysis & Feedback State ---
  const [analyzedCandidate, setAnalyzedCandidate] = useState<any | null>(null);
  const [feedbackCandidate, setFeedbackCandidate] = useState<any | null>(null);

  // Suggestion form state
  const [suggestionPriority, setSuggestionPriority] = useState<
    'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  >('MEDIUM');
  const [suggestionNotes, setSuggestionNotes] = useState('');

  // Hook
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
    isScanRunning,
    selectedMatchIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    error,
  } = usePotentialMatches({
    initialFilters: { status: 'pending' },
    autoRefresh: true,
    refreshInterval: 60000,
  });

  // ==========================================================================
  // SERVER SIDE SEARCH EFFECT
  // ==========================================================================

  // ✅ אפקט זה מעדכן את הפילטרים ב-Hook לאחר השהייה (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      // עדכון ה-Hook עם מילת החיפוש הנוכחית
      setFilters({ searchTerm: localSearchTerm });
    }, 600); // המתנה של 600ms מסיום ההקלדה

    return () => clearTimeout(timer);
  }, [localSearchTerm, setFilters]);

  // ==========================================================================
  // PROFILE LOADING EFFECT
  // ==========================================================================

  useEffect(() => {
    const loadProfileData = async () => {
      if (!viewProfileId) {
        setFullProfileData(null);
        setQuestionnaireData(null);
        return;
      }

      setIsLoadingProfile(true);
      try {
        const profileResponse = await fetch(
          `/api/matchmaker/candidates/${viewProfileId}`
        );
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

        const questionnaireResponse = await fetch(
          `/api/profile/questionnaire?userId=${viewProfileId}&locale=${locale}`
        );
        const questionnaireJson = await questionnaireResponse.json();

        if (
          questionnaireJson.success &&
          questionnaireJson.questionnaireResponse
        ) {
          setQuestionnaireData(questionnaireJson.questionnaireResponse);
        }
      } catch (err) {
        console.error('Failed to load full profile:', err);
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

  const handleStartScan = useCallback(async () => {
    setConfirmScanDialog(false);
    await startScan({ method: 'algorithmic' });
  }, [startScan]);

  const handleCreateSuggestion = useCallback(async () => {
    if (!createSuggestionDialog) return;

    const suggestionId = await createSuggestion(createSuggestionDialog, {
      priority: suggestionPriority,
      matchingReason: suggestionNotes || undefined,
    });

    if (suggestionId) {
      setCreateSuggestionDialog(null);
      setSuggestionPriority('MEDIUM');
      setSuggestionNotes('');
    }
  }, [
    createSuggestionDialog,
    createSuggestion,
    suggestionPriority,
    suggestionNotes,
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
    setViewProfileId(userId);
  }, []);

  const handleResetFilters = useCallback(() => {
    setLocalSearchTerm(''); // איפוס גם של שדה החיפוש הויזואלי
    resetFilters();
  }, [resetFilters]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30"
      dir="rtl"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  התאמות פוטנציאליות
                </h1>
                <p className="text-sm text-gray-500">
                  {stats ? `${stats.pending} ממתינות לבדיקה` : 'טוען...'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setConfirmScanDialog(true)}
                disabled={isScanRunning}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg"
              >
                {isScanRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    סריקה... {scanProgress?.progress || 0}%
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 ml-2" />
                    הפעל סריקה
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={refresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn('w-4 h-4 ml-2', isRefreshing && 'animate-spin')}
                />
                רענן
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <PotentialMatchesStats
          stats={stats}
          lastScanInfo={lastScanInfo}
          isScanRunning={isScanRunning}
          scanProgress={scanProgress?.progress || 0}
        />

        {/* Filters & Controls */}
        <Card className="p-4 border-0 shadow-lg">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-md relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="חיפוש לפי שם..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ status: value as PotentialMatchFilterStatus })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="w-4 h-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({ sortBy: value as PotentialMatchSortBy })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="מיון" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Score Range */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">ציון:</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={filters.minScore}
                onChange={(e) =>
                  setFilters({ minScore: parseInt(e.target.value) || 0 })
                }
                className="w-16 text-center"
              />
              <span>-</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={filters.maxScore}
                onChange={(e) =>
                  setFilters({ maxScore: parseInt(e.target.value) || 100 })
                }
                className="w-16 text-center"
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Bulk Selection Toggle */}
            <Button
              variant={showBulkActions ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setShowBulkActions(!showBulkActions);
                if (showBulkActions) clearSelection();
              }}
            >
              <Check className="w-4 h-4 ml-1" />
              בחירה מרובה
            </Button>

            {/* Reset Filters */}
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              <X className="w-4 h-4 ml-1" />
              נקה פילטרים
            </Button>
          </div>

          {/* Bulk Actions Bar */}
          <AnimatePresence>
            {showBulkActions && selectedMatchIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t"
              >
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    נבחרו {selectedMatchIds.length} התאמות
                  </span>
                  <Button size="sm" variant="outline" onClick={selectAll}>
                    בחר הכל
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    בטל בחירה
                  </Button>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkReview(selectedMatchIds)}
                    disabled={isActioning}
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    סמן כנבדקו
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmBulkDismissDialog(true)}
                    disabled={isActioning}
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    דחה הכל
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="p-6 bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={refresh}>
                נסה שוב
              </Button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && matches.length === 0 && (
          <Card className="p-12 text-center border-0 shadow-lg">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              לא נמצאו התאמות
            </h3>
            <p className="text-gray-500 mb-6">
              {localSearchTerm
                ? 'לא נמצאו תוצאות התואמות את החיפוש שלך.'
                : filters.status !== 'all'
                  ? 'נסה לשנות את הפילטרים או לחפש בכל ההתאמות.'
                  : 'הפעל סריקה לילית למציאת התאמות חדשות.'}
            </p>
            {localSearchTerm || filters.status !== 'all' ? (
              <Button variant="outline" onClick={handleResetFilters}>
                נקה חיפוש ופילטרים
              </Button>
            ) : (
              <Button onClick={() => setConfirmScanDialog(true)}>
                <Moon className="w-4 h-4 ml-2" />
                הפעל סריקה
              </Button>
            )}
          </Card>
        )}

        {/* Matches Grid */}
        {/* ✅ כאן משתמשים ב-matches ישירות, כי הסינון נעשה בשרת */}
        {!isLoading && matches.length > 0 && (
          <>
            <div
              className={cn(
                'grid gap-6',
                viewMode === 'grid'
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              <AnimatePresence mode="popLayout">
                {matches.map((match) => (
                  <PotentialMatchCard
                    key={match.id}
                    match={match}
                    onCreateSuggestion={(id) => setCreateSuggestionDialog(id)}
                    onDismiss={(id) => setDismissDialog(id)}
                    onReview={reviewMatch}
                    onRestore={restoreMatch}
                    onSave={saveMatch}
                    onViewProfile={handleViewProfile}
                    onAnalyzeCandidate={(candidate) =>
                      setAnalyzedCandidate(candidate)
                    }
                    onProfileFeedback={(candidate) =>
                      setFeedbackCandidate(candidate)
                    }
                    isSelected={isSelected(match.id)}
                    onToggleSelect={
                      showBulkActions ? toggleSelection : undefined
                    }
                    showSelection={showBulkActions}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            <Card className="p-4 border-0 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    מציג {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.total
                    )}{' '}
                    מתוך {pagination.total}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  <span className="text-sm px-3">
                    עמוד {pagination.page} מתוך {pagination.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>

                <Select
                  value={String(pagination.pageSize)}
                  onValueChange={(value) => setPageSize(parseInt(value))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          </>
        )}
      </main>

      {/* ======================================================================== */}
      {/* DIALOGS */}
      {/* ======================================================================== */}

      {/* Profile Dialog */}
      <Dialog
        open={!!viewProfileId}
        onOpenChange={(open) => {
          if (!open) {
            setViewProfileId(null);
            setFullProfileData(null);
            setQuestionnaireData(null);
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
              onClick={handleStartScan}
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
        onOpenChange={(open) => !open && setCreateSuggestionDialog(null)}
      >
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-green-600" />
              יצירת הצעה
            </DialogTitle>
            <DialogDescription>
              צור הצעת שידוך מההתאמה הפוטנציאלית
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Priority */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
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

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                הערות להצעה (אופציונלי)
              </label>
              <Textarea
                value={suggestionNotes}
                onChange={(e) => setSuggestionNotes(e.target.value)}
                placeholder="הוסף הערות או סיבת ההתאמה..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateSuggestionDialog(null)}
            >
              ביטול
            </Button>
            <Button
              onClick={handleCreateSuggestion}
              disabled={isActioning}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
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
    </div>
  );
};

export default PotentialMatchesDashboard;
