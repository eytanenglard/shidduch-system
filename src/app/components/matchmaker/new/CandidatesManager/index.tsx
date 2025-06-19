// File: src/app/components/matchmaker/new/CandidatesManager/index.tsx

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Filter, LayoutGrid, List, ArrowUpDown, RotateCw, BarChart2, Bot, Loader2, Columns, View, Users, Split } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
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

interface AiMatch {
  userId: string;
  score: number;
}

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

  return (
    // --- START OF FIX ---
    // 1. שינוי מבנה העמוד הראשי ל-flex-col עם גובה מסך מלא (h-screen)
    //    זה מאפשר לנו לשלוט בגובה של אזור התוכן הראשי.
    <div className="h-screen flex flex-col bg-gray-50/50">
      {/* 2. הכותרת הופכת ל-flex-shrink-0 כדי לא לתפוס גובה גמיש.
          הסרנו את "sticky" כדי לאפשר layout יציב ופשוט יותר. */}
      <header className="flex-shrink-0 z-30 bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="container mx-auto py-3 px-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-primary/90">ניהול מועמדים</h1>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowManualAddDialog(true)} size="sm">
                <UserPlus className="w-4 h-4 ml-2" />
                הוסף מועמד ידנית
              </Button>
               {Object.keys(comparisonSelection).length > 0 && aiTargetCandidate && (
                <Button onClick={() => setIsAnalysisDialogOpen(true)} size="sm" variant="secondary">
                    <BarChart2 className="w-4 h-4 ml-2"/>
                    נתח התאמה ({Object.keys(comparisonSelection).length})
                </Button>
              )}
              
              {isAdmin && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isBulkUpdating || loading}>
                            {isBulkUpdating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Bot className="w-4 h-4 ml-2" />}
                            עדכון כללי AI
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                            <AlertDialogTitle>אישור עדכון AI כללי</AlertDialogTitle>
                            <AlertDialogDescription>
                                פעולה זו תפעיל תהליך עדכון וקטורים עבור **כל** המשתמשים הפעילים. 
                                התהליך ירוץ ברקע ועשוי לקחת מספר דקות. 
                                האם אתה בטוח שברצונך להמשיך?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUpdateAllProfiles}>כן, הפעל עדכון</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}

              <Button onClick={refresh} variant="outline" size="icon" title="רענן רשימה" disabled={loading}>
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
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
                  <Button variant="outline" size="sm"><ArrowUpDown className="w-4 h-4 ml-2" />מיון</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>מיון לפי</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => setSorting(option.value, option.defaultOrder as "asc" | "desc")}>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden lg:flex">
                <Button variant="outline" size="sm" onClick={() => setShowFiltersPanel(!showFiltersPanel)}>
                  <Filter className="w-4 h-4 ml-2" />
                  {showFiltersPanel ? "הסתר סינון" : "הצג סינון"}
                </Button>
              </div>

              <Sheet open={showFiltersMobile} onOpenChange={setShowFiltersMobile}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden relative">
                    <Filter className="w-4 h-4 ml-2" />
                    סינון
                    {activeFilterCount > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent>
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
              
               <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {isMobile ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-32 justify-between px-2">
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>תצוגת מובייל</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup value={mobileView} onValueChange={(value) => setMobileView(value as MobileView)}>
                        <DropdownMenuRadioItem value="split">
                          <Users className="w-4 h-4 mr-2" />
                          תצוגה מפוצלת (גברים/נשים)
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="single">
                          <View className="w-4 h-4 mr-2" />
                          תצוגת טור אחד
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="double">
                          <Columns className="w-4 h-4 mr-2" />
                          תצוגת שני טורים
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  VIEW_OPTIONS.map((option) => (
                    <Button key={option.value} variant={viewMode === option.value ? "default" : "ghost"} size="icon" onClick={() => setViewMode(option.value as ViewMode)}>
                      {option.value === 'grid' ? <LayoutGrid className="w-4 h-4"/> : <List className="w-4 h-4"/>}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} onResetAll={resetFilters} />
          </div>
        </div>
      </header>
      
      {/* 3. אזור התוכן הראשי מקבל flex-1 ו-min-h-0 כדי למלא את הגובה הנותר ולא לגלוש החוצה. */}
      <main className="flex-1 min-h-0 container mx-auto py-6 px-4">
        {/* 4. הקונטיינר הפנימי מקבל h-full כדי להעביר את הגובה הלאה לילדיו. */}
        <div className="flex gap-6 h-full">
          {showFiltersPanel && (
            // 5. פאנל הסינון בצד - אם הוא נהיה ארוך מדי, הוא יגלוש פנימית.
            <aside className="hidden lg:block w-80 flex-shrink-0 overflow-y-auto">
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
            </aside>
          )}

          {/* 6. הקונטיינר של SplitView מקבל h-full כדי שהוא ידע מה הגובה שלו. */}
          <div className="flex-1 min-w-0 h-full">
            {loading ? (
              <LoadingContainer>
                {/* התאמת גובה הסקלטון לגובה המלא של הקונטיינר */}
                <div className="h-full bg-gray-200 rounded-lg animate-pulse"></div>
              </LoadingContainer>
            ) : (
              // 7. SplitView מקבלת h-full וכעת יכולה לממש את הגלילה הפנימית הנפרדת לכל עמודה.
              <SplitView
                maleCandidates={maleCandidates}
                femaleCandidates={femaleCandidates}
                allCandidates={candidates}
                onCandidateAction={handleCandidateAction}
                onCandidateClick={() => {}}
                viewMode={viewMode}
                mobileView={mobileView}
                isLoading={loading || isAiLoading}
                className="h-full" // הוספת h-full כאן היא קריטית
                
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
            )}
          </div>
        </div>
      </main>
      {/* --- END OF FIX --- */}

      {/* Dialogs */}
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
    </div>
  );
};

export default CandidatesManager;