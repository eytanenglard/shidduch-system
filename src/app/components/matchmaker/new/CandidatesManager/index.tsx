// File: src/app/components/matchmaker/new/CandidatesManager/index.tsx

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Filter, LayoutGrid, List, ArrowUpDown, RotateCw, BarChart2, Bot, Loader2 } from "lucide-react"; // Added Bot, Loader2
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { useSession } from "next-auth/react"; // Import useSession to check for admin role

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
import type { Candidate, ViewMode, CandidatesFilter, CandidateAction } from "../types/candidates";

// Constants
import { SORT_OPTIONS, VIEW_OPTIONS } from "../constants/filterOptions";

interface AiMatch {
  userId: string;
  score: number;
}

const CandidatesManager: React.FC = () => {
  // --- UI and General State ---
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  
  // --- AI State Management ---
  const [aiTargetCandidate, setAiTargetCandidate] = useState<Candidate | null>(null);
  const [comparisonSelection, setComparisonSelection] = useState<Record<string, Candidate>>({});
  const [aiMatches, setAiMatches] = useState<AiMatch[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false); // <-- New state for bulk update button

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

  const handleCandidateAdded = useCallback(() => {
    refresh();
    toast.success("מועמד חדש נוסף בהצלחה!");
  }, [refresh]);

  const handleSearch = useCallback((value: string) => {
    if (!filters.separateFiltering) {
      setFilters(prev => ({ ...prev, searchQuery: value }));
    }
  }, [setFilters, filters.separateFiltering]);
  
  const handleRemoveFilter = useCallback((key: keyof CandidatesFilter, value?: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (key === "cities" && value) newFilters.cities = newFilters.cities?.filter(city => city !== value);
      else if (key === "occupations" && value) newFilters.occupations = newFilters.occupations?.filter(occ => occ !== value);
      else delete newFilters[key];
      return newFilters;
    });
  }, [setFilters]);

  const handleCandidateAction = useCallback(async (type: CandidateAction, candidate: Candidate) => {
    console.log(`Action '${type}' triggered for candidate: ${candidate.firstName}`);
  }, []);

  const handleFilterSave = useCallback(async (name: string) => {
    try {
      await saveFilter(name, filters);
      toast.success("הפילטר נשמר בהצלחה");
    } catch {
      toast.error("שגיאה בשמירת הפילטר");
    }
  }, [filters, saveFilter]);

  // --- AI-Specific Handlers ---

  const handleSetAiTarget = useCallback((candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiTargetCandidate?.id === candidate.id) {
        handleClearAiTarget(e);
        return;
    }
    setAiTargetCandidate(candidate);
    setAiMatches([]);
    setComparisonSelection({});
    toast.info(`מועמד מטרה נבחר: ${candidate.firstName}. כעת ניתן לחפש התאמות בפאנל הנגדי.`, { position: "bottom-center" });
  }, [aiTargetCandidate]);

  const handleClearAiTarget = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAiTargetCandidate(null);
    setAiMatches([]);
    setComparisonSelection({});
    toast.info("בחירת מועמד מטרה בוטלה.", { position: "bottom-center" });
  };
  
  const handleToggleComparison = useCallback((candidate: Candidate, e: React.MouseEvent) => {
      e.stopPropagation();
      setComparisonSelection(prev => {
          const newSelection = {...prev};
          if (newSelection[candidate.id]) {
              delete newSelection[candidate.id]; // Unselect
          } else {
              newSelection[candidate.id] = candidate; // Select
          }
          return newSelection;
      });
  }, []);

  const handleUpdateAllProfiles = async () => {
    setIsBulkUpdating(true);
    toast.info("מתחיל תהליך עדכון פרופילי AI...", {
      description: "התהליך ירוץ ברקע. אין צורך להישאר בעמוד זה.",
    });

    try {
      const response = await fetch('/api/ai/update-all-profiles', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה בהפעלת העדכון הכללי.');
      toast.success("העדכון הכללי הופעל בהצלחה!", {
        description: data.message,
        duration: 8000,
      });
    } catch (error) {
      console.error("Failed to initiate bulk AI profile update:", error);
      toast.error("שגיאה בהפעלת העדכון", {
        description: error instanceof Error ? error.message : 'אנא נסה שוב מאוחר יותר.',
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };


  useEffect(() => {
    const checkDesktop = () => setShowFiltersPanel(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const activeFilterCount = useMemo(() => activeFilters.length, [activeFilters]);

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b shadow-sm">
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
              
              {/* --- NEW: AI Bulk Update Button --- */}
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
              {/* --- END OF NEW BUTTON --- */}

              <Button onClick={refresh} variant="outline" size="icon" title="רענן רשימה" disabled={loading}>
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          {/* ... a lot of code ... */}
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
                {VIEW_OPTIONS.map((option) => (
                  <Button key={option.value} variant={viewMode === option.value ? "default" : "ghost"} size="icon" onClick={() => setViewMode(option.value as ViewMode)}>
                    {option.value === 'grid' ? <LayoutGrid className="w-4 h-4"/> : <List className="w-4 h-4"/>}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ActiveFilters filters={filters} onRemoveFilter={handleRemoveFilter} onResetAll={resetFilters} />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-6 px-4">
        <div className="flex gap-6">
          {showFiltersPanel && (
            <aside className="hidden lg:block w-80 flex-shrink-0">
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

          <div className="flex-1 min-w-0">
            {loading ? (
              <LoadingContainer>
                <div className="h-[800px] bg-gray-200 rounded-lg animate-pulse"></div>
              </LoadingContainer>
            ) : (
              <SplitView
                maleCandidates={maleCandidates}
                femaleCandidates={femaleCandidates}
                allCandidates={candidates}
                onCandidateAction={handleCandidateAction}
                onCandidateClick={() => {}}
                viewMode={viewMode}
                isLoading={loading || isAiLoading}
                
                // --- Pass AI State and Handlers Down ---
                aiTargetCandidate={aiTargetCandidate}
                aiMatches={aiMatches}
                isAiLoading={isAiLoading}
                onSetAiTarget={handleSetAiTarget}
                onClearAiTarget={handleClearAiTarget}
                setAiMatches={setAiMatches}
                setIsAiLoading={setIsAiLoading}
                comparisonSelection={comparisonSelection}
                onToggleComparison={handleToggleComparison}
                
                // --- Filters ---
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