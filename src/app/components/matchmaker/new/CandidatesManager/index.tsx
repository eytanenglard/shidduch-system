// File: src/app/components/matchmaker/new/CandidatesManager/index.tsx

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Filter, LayoutGrid, List, ArrowUpDown, RotateCw, BarChart2, Bot, Loader2, Columns, View, Users, Split, Sparkles, Crown, Target, Zap, TrendingUp, Star, Activity } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { useSession } from "next-auth/react";

// Custom Hooks
import { useCandidates } from "../hooks/useCandidates";
import { useFilterLogic } from "../hooks/useFilterLogic";

// Components
import SplitView from "./SplitView";
import FilterPanel from "../Filters/FilterPanel";
import ActiveFilters from "../Filters/ActiveFilters";
import SearchBar from "../Filters/SearchBar";
import { LoadingContainer } from "../shared/LoadingStates";
import { AddManualCandidateDialog } from "../dialogs/AddManualCandidateDialog";
import { AiMatchAnalysisDialog } from "../dialogs/AiMatchAnalysisDialog";

// Types
import type { Candidate, ViewMode, CandidatesFilter, CandidateAction, MobileView } from "../types/candidates"; 

// Constants
import { SORT_OPTIONS, VIEW_OPTIONS } from "../constants/filterOptions";
import { cn } from "@/lib/utils";

interface AiMatch {
  userId: string;
  score: number;
}

// Enhanced Hero Section Component - COMPACT VERSION
const CandidatesHeroSection: React.FC<{
  onAddCandidate: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  stats: {
    total: number;
    male: number;
    female: number;
    verified: number;
    activeToday: number;
    profilesComplete: number;
  };
  onBulkUpdate?: () => void;
  isBulkUpdating?: boolean;
  isAdmin?: boolean;
}> = ({ onAddCandidate, onRefresh, isRefreshing, stats, onBulkUpdate, isBulkUpdating, isAdmin }) => {
  return (
    <div className="relative min-h-[200px] bg-gradient-to-br from-indigo-50 via-purple-50/30 to-pink-50/20 overflow-hidden rounded-2xl shadow-lg mb-4">
      {/* Background decorative elements - smaller */}
      <div className="absolute inset-0">
        <div className="absolute top-5 right-5 w-32 h-32 bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-5 left-5 w-24 h-24 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 p-4 lg:p-6">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                ניהול מועמדים מתקדם
              </h1>
              <p className="text-sm text-gray-600">מערכת ניהול עם AI</p>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onAddCandidate}
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
            >
              <UserPlus className="w-4 h-4 ml-2" />
              הוסף מועמד
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </Button>

            {isAdmin && onBulkUpdate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onBulkUpdate}
                disabled={isBulkUpdating}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {isBulkUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Compact Stats - Single Row */}
        <div className="grid grid-cols-6 gap-2">
          <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-gray-600">סך הכל</div>
          </div>
          <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="text-lg font-bold text-blue-700">{stats.male}</div>
            <div className="text-xs text-gray-600">גברים</div>
          </div>
          <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="text-lg font-bold text-purple-600">{stats.female}</div>
            <div className="text-xs text-gray-600">נשים</div>
          </div>
          <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="text-lg font-bold text-emerald-600">{stats.verified}</div>
            <div className="text-xs text-gray-600">מאומתים</div>
          </div>
          <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="text-lg font-bold text-orange-600">{stats.activeToday}</div>
            <div className="text-xs text-gray-600">פעילים</div>
          </div>
          <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2 shadow-sm">
            <div className="text-lg font-bold text-teal-600">{stats.profilesComplete}%</div>
            <div className="text-xs text-gray-600">מלאים</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stats Section
const QuickStatsSection: React.FC<{
  candidates: Candidate[];
  onFilterChange?: (filter: Partial<CandidatesFilter>) => void;
}> = ({ candidates, onFilterChange }) => {
  const stats = useMemo(() => {
    const total = candidates.length;
    const male = candidates.filter(c => c.profile.gender === 'MALE').length;
    const female = candidates.filter(c => c.profile.gender === 'FEMALE').length;
    const verified = candidates.filter(c => c.isVerified).length;
    const activeToday = candidates.filter(c => {
      // Using createdAt as proxy for recent activity
      const lastActive = new Date(c.createdAt);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7; // Active within last week (more realistic)
    }).length;
    const profilesComplete = total > 0 ? Math.round((candidates.filter(c => c.isProfileComplete).length / total) * 100) : 0;

    return { total, male, female, verified, activeToday, profilesComplete };
  }, [candidates]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Candidates */}
      <Card
        className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        onClick={() => onFilterChange?.({})}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">
                סך הכל מועמדים
              </p>
              <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  +{stats.activeToday} פעילים השבוע
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gender Distribution */}
      <Card
        className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        onClick={() => onFilterChange?.({ gender: 'MALE' })}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">
                פילוח מגדרי
              </p>
              <p className="text-2xl font-bold text-purple-700">
                {stats.male}/{stats.female}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-purple-600">
                  גברים/נשים
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Target className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verified Users */}
      <Card
        className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        onClick={() => onFilterChange?.({ isVerified: true })}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1">
                מועמדים מאומתים
              </p>
              <p className="text-3xl font-bold text-emerald-700">{stats.verified}</p>
              <div className="flex items-center mt-2">
                <Crown className="w-4 h-4 text-emerald-500 mr-1" />
                <span className="text-sm text-emerald-600">
                  {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% מהכלל
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Crown className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion */}
      <Card
        className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        onClick={() => onFilterChange?.({ isProfileComplete: true })}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">
                פרופילים מלאים
              </p>
              <p className="text-3xl font-bold text-orange-700">{stats.profilesComplete}%</p>
              <div className="flex items-center mt-2">
                <Star className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">
                  איכות גבוהה
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Star className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CandidatesManager: React.FC = () => {
  // --- UI and General State ---
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [mobileView, setMobileView] = useState<MobileView>('split'); 
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  
  // --- AI State Management ---
  const [aiTargetCandidate, setAiTargetCandidate] = useState<Candidate | null>(null);
  const [comparisonSelection, setComparisonSelection] = useState<Record<string, Candidate>>({});
  const [aiMatches, setAiMatches] = useState<AiMatch[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false); 

  // --- Session and Permissions ---
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  // Custom Hooks
  const {
    loading,
    candidates,
    maleCandidates,
    femaleCandidates,
    setSorting,
    setFilters,
    refresh,
  } = useCandidates();

  const {
    filters,
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
  } = useFilterLogic({
    onFilterChange: setFilters,
  });

  // --- Handlers ---
  const handleCandidateAdded = useCallback(() => { refresh(); toast.success("מועמד חדש נוסף בהצלחה!"); }, [refresh]);
  const handleSearch = useCallback((value: string) => { if (!filters.separateFiltering) { setFilters(prev => ({ ...prev, searchQuery: value })); } }, [setFilters, filters.separateFiltering]);
  const handleRemoveFilter = useCallback((key: keyof CandidatesFilter, value?: string) => { setFilters(prev => { const newFilters = { ...prev }; if (key === "cities" && value) newFilters.cities = newFilters.cities?.filter(city => city !== value); else if (key === "occupations" && value) newFilters.occupations = newFilters.occupations?.filter(occ => occ !== value); else delete newFilters[key]; return newFilters; }); }, [setFilters]);
  const handleCandidateAction = useCallback(async (type: CandidateAction, candidate: Candidate) => { console.log(`Action '${type}' triggered for candidate: ${candidate.firstName}`); }, []);
  const handleFilterSave = useCallback(async (name: string) => { try { await saveFilter(name, filters); toast.success("הפילטר נשמר בהצלחה"); } catch { toast.error("שגיאה בשמירת הפילטר"); } }, [filters, saveFilter]);
  const handleSetAiTarget = useCallback((candidate: Candidate, e: React.MouseEvent) => { e.stopPropagation(); if (aiTargetCandidate?.id === candidate.id) { handleClearAiTarget(e); return; } setAiTargetCandidate(candidate); setAiMatches([]); setComparisonSelection({}); toast.info(`מועמד מטרה נבחר: ${candidate.firstName}. כעת ניתן לחפש התאמות בפאנל הנגדי.`, { position: "bottom-center" }); }, [aiTargetCandidate]);
  const handleClearAiTarget = (e: React.MouseEvent) => { e.stopPropagation(); setAiTargetCandidate(null); setAiMatches([]); setComparisonSelection({}); toast.info("בחירת מועמד מטרה בוטלה.", { position: "bottom-center" }); };
  const handleToggleComparison = useCallback((candidate: Candidate, e: React.MouseEvent) => { e.stopPropagation(); setComparisonSelection(prev => { const newSelection = {...prev}; if (newSelection[candidate.id]) { delete newSelection[candidate.id]; } else { newSelection[candidate.id] = candidate; } return newSelection; }); }, []);
  const handleUpdateAllProfiles = async () => { setIsBulkUpdating(true); toast.info("מתחיל תהליך עדכון פרופילי AI...", { description: "התהליך ירוץ ברקע. אין צורך להישאר בעמוד זה.", }); try { const response = await fetch('/api/ai/update-all-profiles', { method: 'POST', }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'שגיאה בהפעלת העדכון הכללי.'); toast.success("העדכון הכללי הופעל בהצלחה!", { description: data.message, duration: 8000, }); } catch (error) { console.error("Failed to initiate bulk AI profile update:", error); toast.error("שגיאה בהפעלת העדכון", { description: error instanceof Error ? error.message : 'אנא נסה שוב מאוחר יותר.', }); } finally { setIsBulkUpdating(false); } };
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const isDesktop = window.innerWidth >= 1024;
      const isMob = window.innerWidth < 768;
      setShowFiltersPanel(isDesktop);
      setIsMobile(isMob);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const activeFilterCount = useMemo(() => activeFilters.length, [activeFilters]);

  // Calculate stats for hero section
  const heroStats = useMemo(() => {
    const total = candidates.length;
    const male = candidates.filter(c => c.profile.gender === 'MALE').length;
    const female = candidates.filter(c => c.profile.gender === 'FEMALE').length;
    const verified = candidates.filter(c => c.isVerified).length;
    const activeToday = candidates.filter(c => {
      // Using createdAt as proxy for recent activity since updatedAt doesn't exist on Candidate type
      const lastActive = new Date(c.createdAt);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7; // Active within last week (more realistic)
    }).length;
    const profilesComplete = total > 0 ? Math.round((candidates.filter(c => c.isProfileComplete).length / total) * 100) : 0;

    return { total, male, female, verified, activeToday, profilesComplete };
  }, [candidates]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/10">
      {/* Enhanced Header */}
      <header className="flex-shrink-0 z-30 bg-white/90 backdrop-blur-sm border-b border-indigo-100 shadow-lg">
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ניהול מועמדים
                </h1>
                <p className="text-sm text-gray-600">מערכת ניהול מתקדמת עם AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setShowManualAddDialog(true)} size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                <UserPlus className="w-4 h-4 ml-2" />
                הוסף מועמד ידנית
              </Button>
               {Object.keys(comparisonSelection).length > 0 && aiTargetCandidate && (
                <Button onClick={() => setIsAnalysisDialogOpen(true)} size="sm" variant="secondary" className="shadow-lg border-2 border-indigo-200">
                    <BarChart2 className="w-4 h-4 ml-2"/>
                    נתח התאמה ({Object.keys(comparisonSelection).length})
                </Button>
              )}
              
              {isAdmin && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="secondary" size="sm" disabled={isBulkUpdating || loading} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg">
                            {isBulkUpdating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Bot className="w-4 h-4 ml-2" />}
                            עדכון כללי AI
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl" className="rounded-2xl border-0 shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">אישור עדכון AI כללי</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 leading-relaxed">
                                פעולה זו תפעיל תהליך עדכון וקטורים עבור **כל** המשתמשים הפעילים. 
                                התהליך ירוץ ברקע ועשוי לקחת מספר דקות. 
                                האם אתה בטוח שברצונך להמשיך?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUpdateAllProfiles} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl">כן, הפעל עדכון</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}

              <Button onClick={refresh} variant="outline" size="icon" title="רענן רשימה" disabled={loading} className="border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 shadow-lg">
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* Enhanced Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!filters.separateFiltering && (
              <div className="flex-1">
                <SearchBar
                  value={filters.searchQuery || ""}
                  onChange={handleSearch}
                  placeholder="חיפוש כללי בשם, עיר, עיסוק..."
                  recentSearches={recentSearches}
                  onClearRecentSearches={clearRecentSearches}
                />
              </div>
            )}
            <div className="flex gap-2 justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/90 shadow-lg border-2 border-gray-200 hover:border-indigo-300">
                    <ArrowUpDown className="w-4 h-4 ml-2" />מיון
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
                  <DropdownMenuLabel className="font-bold text-indigo-700">מיון לפי</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => setSorting(option.value, option.defaultOrder as "asc" | "desc")} className="hover:bg-indigo-50 rounded-lg mx-2">
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden lg:flex">
                <Button variant="outline" size="sm" onClick={() => setShowFiltersPanel(!showFiltersPanel)} className="bg-white/90 shadow-lg border-2 border-gray-200 hover:border-indigo-300">
                  <Filter className="w-4 h-4 ml-2" />
                  {showFiltersPanel ? "הסתר סינון" : "הצג סינון"}
                </Button>
              </div>

              <Sheet open={showFiltersMobile} onOpenChange={setShowFiltersMobile}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden relative bg-white/90 shadow-lg border-2 border-gray-200 hover:border-indigo-300">
                    <Filter className="w-4 h-4 ml-2" />
                    סינון
                    {activeFilterCount > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-500 border-0">{activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                    <FilterPanel
                        filters={filters}
                        onFiltersChange={setFilters}
                        onSavePreset={handleFilterSave}
                        onReset={resetFilters}
                        savedFilters={savedFilters.map((f) => ({ id: f.id, name: f.name, isDefault: f.isDefault }))}
                        popularFilters={popularFilters}
                        separateFiltering={filters.separateFiltering}
                        onToggleSeparateFiltering={toggleSeparateFiltering}
                        onMaleFiltersChange={updateMaleFilters}
                        onFemaleFiltersChange={updateFemaleFilters}
                        onCopyFilters={copyFilters}
                    />
                </SheetContent>
              </Sheet>
              
               <div className="flex gap-1 bg-white/90 p-1 rounded-lg shadow-lg border border-gray-200">
                {isMobile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-32 justify-between px-3 border-0">
                        {mobileView === 'split' && (
                          <>
                            <Users className="w-4 h-4" />
                            <span>מפוצל</span>
                          </>
                        )}
                        {mobileView === 'single' && (
                          <>
                            <View className="w-4 h-4" />
                            <span>טור אחד</span>
                          </>
                        )}
                        {mobileView === 'double' && (
                          <>
                            <Columns className="w-4 h-4" />
                            <span>שני טורים</span>
                          </>
                        )}
                        <ArrowUpDown className="w-3 h-3 opacity-50 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-2xl">
                      <DropdownMenuLabel className="font-bold text-indigo-700">תצוגת מובייל</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup value={mobileView} onValueChange={(value) => setMobileView(value as MobileView)}>
                        <DropdownMenuRadioItem value="split" className="hover:bg-indigo-50 rounded-lg mx-2">
                          <Users className="w-4 h-4 mr-2" />
                          תצוגה מפוצלת (גברים/נשים)
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="single" className="hover:bg-indigo-50 rounded-lg mx-2">
                          <View className="w-4 h-4 mr-2" />
                          תצוגת טור אחד
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="double" className="hover:bg-indigo-50 rounded-lg mx-2">
                          <Columns className="w-4 h-4 mr-2" />
                          תצוגת שני טורים
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  VIEW_OPTIONS.map((option) => (
                    <Button 
                      key={option.value} 
                      variant={viewMode === option.value ? "default" : "ghost"} 
                      size="icon" 
                      onClick={() => setViewMode(option.value as ViewMode)}
                      className={cn(
                        "transition-all duration-200",
                        viewMode === option.value 
                          ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105" 
                          : "hover:bg-indigo-50 hover:scale-105"
                      )}
                    >
                      {option.value === 'grid' ? <LayoutGrid className="w-4 h-4"/> : <List className="w-4 h-4"/>}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Enhanced Active Filters */}
          <div className="mt-4">
            <ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} onResetAll={resetFilters} />
          </div>
        </div>
      </header>
      
      {/* Hero Section - COMPACT */}
      <div className="flex-shrink-0 px-6">
        <CandidatesHeroSection
          onAddCandidate={() => setShowManualAddDialog(true)}
          onRefresh={refresh}
          isRefreshing={loading}
          stats={heroStats}
          onBulkUpdate={handleUpdateAllProfiles}
          isBulkUpdating={isBulkUpdating}
          isAdmin={isAdmin}
        />
      </div>
      
      {/* Main Content Area - MORE SPACE FOR CANDIDATES */}
      <main className="flex-1 min-h-0 container mx-auto px-6 pb-6">
        <div className="flex gap-6 h-full">
          {showFiltersPanel && (
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden h-full">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  onSavePreset={handleFilterSave}
                  onReset={resetFilters}
                  savedFilters={savedFilters.map((f) => ({ id: f.id, name: f.name, isDefault: f.isDefault }))}
                  popularFilters={popularFilters}
                  separateFiltering={filters.separateFiltering}
                  onToggleSeparateFiltering={toggleSeparateFiltering}
                  onMaleFiltersChange={updateMaleFilters}
                  onFemaleFiltersChange={updateFemaleFilters}
                  onCopyFilters={copyFilters}
                />
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0 h-full">
            {loading ? (
              <LoadingContainer>
                <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse shadow-xl"></div>
              </LoadingContainer>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden h-full">
                <SplitView
                  maleCandidates={maleCandidates}
                  femaleCandidates={femaleCandidates}
                  allCandidates={candidates}
                  onCandidateAction={handleCandidateAction}
                  onCandidateClick={() => {}}
                  viewMode={viewMode}
                  mobileView={mobileView}
                  isLoading={loading || isAiLoading}
                  className="h-full"
                  
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
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Enhanced Dialogs */}
      <AddManualCandidateDialog
        isOpen={showManualAddDialog}
        onClose={() => setShowManualAddDialog(false)}
        onCandidateAdded={handleCandidateAdded}
      />

      <AiMatchAnalysisDialog
        isOpen={isAnalysisDialogOpen}
        onClose={() => setIsAnalysisDialogOpen(false)}
        targetCandidate={aiTargetCandidate}
        comparisonCandidates={Object.values(comparisonSelection)}
      />

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .bg-gradient-mesh {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-size: 400% 400%;
          animation: gradientShift 8s ease infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default CandidatesManager;