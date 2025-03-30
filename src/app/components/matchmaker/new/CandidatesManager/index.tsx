"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Filter,
  LayoutGrid,
  List,
  Plus,
  ArrowUpDown,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// Custom Hooks
import { useCandidates } from "../hooks/useCandidates";
import { useFilterLogic } from "../hooks/useFilterLogic";

// Components
import SplitView from "./SplitView";
import FilterPanel from "../Filters/FilterPanel";
import ActiveFilters from "../Filters/ActiveFilters";
import SearchBar from "../Filters/SearchBar";
import CandidatesStats from "./CandidatesStats";
import { LoadingContainer } from "../shared/LoadingStates";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Types
import type {
  Candidate,
  ViewMode,
  CandidatesFilter,
  CandidateAction,
} from "../types/candidates";

// Constants
import { SORT_OPTIONS, VIEW_OPTIONS } from "../constants/filterOptions";

const CandidatesManager: React.FC = () => {
  // Local State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [localFilters, setLocalFilters] = useState<CandidatesFilter>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setIsMobileView] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  // Custom Hooks
  const {
    loading,
    candidates,
    maleCandidates,
    femaleCandidates,
    filteredCandidates,
    exportCandidates,
    totalCount,
    searchResults,
    sorting,
    setSorting,
    setFilters, // Add this
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
    loadSavedFilter,
  } = useFilterLogic({
    onFilterChange: (newFilters) => {
      setLocalFilters(newFilters);
    },
  });

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Initialize local filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Search handlers
  const handleSearch = useCallback(
    (value: string) => {
      // Update local UI state
      setLocalFilters((prev) => ({
        ...prev,
        searchQuery: value,
      }));

      // Update filter state in useCandidates hook
      setFilters((prev) => ({
        ...prev,
        searchQuery: value,
      }));

      setShowSearchResults(!!value);
    },
    [setFilters] // This dependency is now valid
  );

  const handleRemoveFilter = useCallback(
    (key: keyof CandidatesFilter, value?: string) => {
      setLocalFilters((prev) => {
        const newFilters = { ...prev };

        if (key === "cities" && value) {
          return {
            ...newFilters,
            cities: prev.cities?.filter((city) => city !== value),
          };
        }

        if (key === "occupations" && value) {
          return {
            ...newFilters,
            occupations: prev.occupations?.filter((occ) => occ !== value),
          };
        }

        delete newFilters[key];
        return newFilters;
      });
    },
    []
  );

  const handleCandidateAction = useCallback(
    async (type: CandidateAction, candidate: Candidate) => {
      if (isProcessing) return;

      setIsProcessing(true);
      try {
        switch (type) {
          case "suggest":
            // Handled by NewSuggestionForm
            toast.success("הצעת השידוך נוצרה בהצלחה", {
              description: `נוצרה הצעת שידוך עבור ${candidate.firstName} ${candidate.lastName}`,
            });
            break;

          case "invite":
            await fetch("/api/matchmaker/invitations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidateId: candidate.id }),
            });
            toast.success("ההזמנה נשלחה בהצלחה", {
              description: `ההזמנה נשלחה ל${candidate.firstName} ${candidate.lastName}`,
            });
            break;

          case "contact":
            toast.success("בקשת יצירת הקשר נשלחה", {
              description: `בקשה ליצירת קשר נשלחה ל${candidate.firstName} ${candidate.lastName}`,
            });
            break;

          case "favorite":
            await fetch("/api/matchmaker/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidateId: candidate.id }),
            });
            toast.success("המועמד/ת נוספ/ה למועדפים", {
              description: `${candidate.firstName} ${candidate.lastName} נוספ/ה למועדפים שלך`,
            });
            break;

          case "edit":
            // Handled by specific component
            break;
        }
      } catch (error) {
        toast.error("אירעה שגיאה בביצוע הפעולה", {
          description:
            error instanceof Error ? error.message : "שגיאה לא ידועה",
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing]
  );

  const handleFilterSave = useCallback(
    async (name: string) => {
      try {
        await saveFilter(name, localFilters);
        toast.success("הפילטר נשמר בהצלחה", {
          description: `הפילטר "${name}" נשמר ויהיה זמין לשימוש עתידי`,
        });
      } catch {
        toast.error("שגיאה בשמירת הפילטר");
      }
    },
    [localFilters, saveFilter]
  );

  const handleExport = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await exportCandidates(filteredCandidates, localFilters);
      toast.success("הנתונים יוצאו בהצלחה", {
        description: `קובץ CSV עם ${filteredCandidates.length} מועמדים הורד למחשב שלך`,
      });
      setShowExportConfirm(false);
    } catch (error) {
      toast.error("שגיאה בייצוא הנתונים", {
        description: "אירעה שגיאה בעת ייצוא הנתונים, אנא נסה שוב מאוחר יותר.",
      });
      console.error("Failed to export candidates:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [filteredCandidates, localFilters, exportCandidates, isProcessing]);

  const renderSearchSummary = () => {
    if (!searchResults) return null;

    return (
      <div className="bg-blue-50/50 p-3 border rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            <h3 className="font-medium">
              תוצאות חיפוש: {searchResults.term}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white">
              {searchResults.count} תוצאות
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-gray-600"
              onClick={() => handleRemoveFilter("searchQuery")}
            >
              <RefreshCw className="w-3 h-3 ml-1" />
              נקה חיפוש
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-600 mt-1 flex gap-3">
          <span>גברים: {searchResults.male}</span>
          <span>נשים: {searchResults.female}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">
                ניהול מועמדים
              </h1>
              <Badge variant="outline" className="text-sm">
                {filteredCandidates.length} מתוך {totalCount} מועמדים
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStats((prev) => !prev)}
                      disabled={isProcessing}
                      className={
                        showStats
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : ""
                      }
                    >
                      סטטיסטיקות
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{showStats ? "הסתר" : "הצג"} נתונים סטטיסטיים</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExportConfirm(true)}
                      disabled={isProcessing || filteredCandidates.length === 0}
                    >
                      <Download className="w-4 h-4 ml-2" />
                      ייצוא
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ייצוא נתוני המועמדים המסוננים לקובץ Excel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                onClick={() => {
                  /* Add candidate logic */
                }}
                disabled={isProcessing}
              >
                <Plus className="w-4 h-4 ml-2" />
                הוספת מועמד
              </Button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={localFilters.searchQuery || ""}
                onChange={handleSearch}
                onSelect={() => {
                  /* Handle candidate selection */
                }}
                recentSearches={recentSearches}
                onSaveSearch={(term) => handleSearch(term)}
                onClearRecentSearches={clearRecentSearches}
                placeholder="חיפוש לפי שם, עיר, תחום עיסוק ועוד..."
                autoFocus={false}
              />
            </div>

            <div className="flex gap-2">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isProcessing}>
                    <ArrowUpDown className="w-4 h-4 ml-2" />
                    מיון
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>מיון לפי</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() =>
                        setSorting(
                          option.value,
                          option.defaultOrder as "asc" | "desc"
                        )
                      }
                      className={
                        sorting.field === option.value
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : ""
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{option.label}</span>
                        {sorting.field === option.value && (
                          <Badge variant="outline" className="text-xs">
                            {sorting.direction === "asc" ? "עולה" : "יורד"}
                          </Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filter Button - desktop */}
              <Button
                variant="outline"
                onClick={() => setShowFilters((prev) => !prev)}
                disabled={isProcessing}
                className={`hidden md:flex ${
                  showFilters ? "bg-blue-50 text-blue-700 border-blue-200" : ""
                }`}
              >
                <Filter className="w-4 h-4 ml-2" />
                {showFilters ? "הסתר סינון" : "הצג סינון"}
              </Button>

              {/* Filter Button - mobile sheet */}
              <Sheet
                open={showFiltersMobile}
                onOpenChange={setShowFiltersMobile}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="md:hidden relative"
                    disabled={isProcessing}
                  >
                    <Filter className="w-4 h-4 ml-2" />
                    סינון
                    {activeFilters.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                        {activeFilters.length}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-lg p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>סינון מועמדים</SheetTitle>
                    <SheetDescription>
                      הגדר את הפילטרים לסינון המועמדים
                    </SheetDescription>
                  </SheetHeader>
                  <div className="p-1">
                    <FilterPanel
                      filters={localFilters}
                      onFiltersChange={setLocalFilters}
                      onSavePreset={handleFilterSave}
                      onReset={resetFilters}
                      savedFilters={savedFilters.map((f) => ({
                        id: f.id,
                        name: f.name,
                        isDefault: f.isDefault,
                      }))}
                      popularFilters={popularFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="flex gap-2">
                {VIEW_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={viewMode === option.value ? "default" : "outline"}
                    size="icon"
                    onClick={() => setViewMode(option.value as ViewMode)}
                    title={option.label}
                    disabled={isProcessing}
                  >
                    {option.value === "grid" ? (
                      <LayoutGrid className="w-4 h-4" />
                    ) : (
                      <List className="w-4 h-4" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters */}
          <div className="mt-4">
            <ActiveFilters
              filters={localFilters}
              onRemoveFilter={handleRemoveFilter}
              onResetAll={resetFilters}
              onSuggestFilter={() => {
                /* Intelligent filter suggestion logic */
                toast.info("מציע פילטרים חכמים...");
              }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        {/* Search Results Summary */}
        {showSearchResults && renderSearchSummary()}

        {/* Statistics Overview */}
        {showStats && (
          <CandidatesStats candidates={filteredCandidates} className="mb-6" />
        )}

        <div className="flex gap-6">
          {/* Filters Panel - Desktop */}
          {showFilters && (
            <div className="hidden md:block w-80">
              <FilterPanel
                filters={localFilters}
                onFiltersChange={setLocalFilters}
                onReset={resetFilters}
                onSavePreset={handleFilterSave}
                savedFilters={savedFilters.map((f) => ({
                  id: f.id,
                  name: f.name,
                  isDefault: f.isDefault,
                }))}
                popularFilters={popularFilters}
                onApplySavedFilter={loadSavedFilter}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <LoadingContainer>
                <SplitView
                  maleCandidates={[]}
                  femaleCandidates={[]}
                  onCandidateAction={() => {}}
                  viewMode={viewMode}
                  isLoading
                />
              </LoadingContainer>
            ) : (
              <SplitView
                maleCandidates={maleCandidates}
                femaleCandidates={femaleCandidates}
                allCandidates={candidates}
                onCandidateAction={handleCandidateAction}
                viewMode={viewMode}
                highlightTerm={localFilters.searchQuery}
              />
            )}
          </div>
        </div>
      </div>

      {/* Export Confirmation Dialog */}
      <AlertDialog>
        {showExportConfirm && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                האם לייצא את התוצאות הנוכחיות?
              </AlertDialogTitle>
              <AlertDialogDescription>
                אתה עומד לייצא {filteredCandidates.length} מועמדים לקובץ CSV.
                האם להמשיך?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={handleExport} disabled={isProcessing}>
                {isProcessing ? "מייצא..." : "אישור ייצוא"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
};

export default CandidatesManager;
