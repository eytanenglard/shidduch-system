"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, LayoutGrid, List, Plus } from "lucide-react";
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
import { LoadingContainer, LoadingError } from "../shared/LoadingStates";

// Types
import type {
  Candidate,
  ViewMode,
  CandidatesFilter,
  CandidateAction,
} from "../types/candidates";

// Constants
import { VIEW_OPTIONS } from "../constants/filterOptions";

const CandidatesManager: React.FC = () => {
  // Local State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [localFilters, setLocalFilters] = useState<CandidatesFilter>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom Hooks
  const {
    loading,
    error,
    maleCandidates,
    femaleCandidates,
    refresh,
    exportCandidates,
  } = useCandidates();

  const { filters, saveFilter, resetFilters } = useFilterLogic({
    onFilterChange: (newFilters) => {
      setLocalFilters(newFilters);
    },
  });

  // Initialize local filters
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearch = useCallback((value: string) => {
    setLocalFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

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
            // אין צורך בקריאת API כאן - הכל מטופל בתוך NewSuggestionForm
            break;

          case "invite":
            await fetch("/api/matchmaker/invitations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidateId: candidate.id }),
            });
            toast.success("ההזמנה נשלחה בהצלחה");
            break;

          case "contact":
            toast.success("בקשת יצירת הקשר נשלחה");
            break;

          case "favorite":
            await fetch("/api/matchmaker/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ candidateId: candidate.id }),
            });
            toast.success("המועמד/ת נוספ/ה למועדפים");
            break;
        }
      } catch {
        toast.error("אירעה שגיאה בביצוע הפעולה");
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
        toast.success("הפילטר נשמר בהצלחה");
      } catch (error) {
        toast.error("שגיאה בשמירת הפילטר");
      }
    },
    [localFilters, saveFilter]
  );

  const handleExport = useCallback(async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await exportCandidates(
        [...maleCandidates, ...femaleCandidates],
        localFilters
      );
      toast.success("הנתונים יוצאו בהצלחה");
    } catch (error) {
      toast.error("שגיאה בייצוא הנתונים");
      console.error("Failed to export candidates:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    maleCandidates,
    femaleCandidates,
    localFilters,
    exportCandidates,
    isProcessing,
  ]);

  if (error) {
    return <LoadingError message={error} onRetry={refresh} className="m-8" />;
  }

  const totalCandidates = maleCandidates.length + femaleCandidates.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">ניהול מועמדים</h1>
              <Badge variant="outline" className="text-sm">
                {totalCandidates} מועמדים
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats((prev) => !prev)}
                disabled={isProcessing}
              >
                סטטיסטיקות
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isProcessing}
              >
                <Download className="w-4 h-4 ml-2" />
                ייצוא
              </Button>

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
          <div className="mt-4 flex gap-4">
            <SearchBar
              value={localFilters.searchQuery || ""}
              onChange={handleSearch}
              className="flex-1"
            />

            <Button
              variant="outline"
              onClick={() => setShowFilters((prev) => !prev)}
              disabled={isProcessing}
            >
              <Filter className="w-4 h-4 ml-2" />
              {showFilters ? "הסתר סינון" : "הצג סינון"}
            </Button>

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

          {/* Active Filters */}
          <ActiveFilters
            filters={localFilters}
            onRemoveFilter={handleRemoveFilter}
            onResetAll={() => {
              setLocalFilters({});
              resetFilters();
            }}
          />
        </div>
      </div>

      <div className="container mx-auto py-6">
        {/* Statistics Overview */}
        {showStats && (
          <CandidatesStats
            candidates={[...maleCandidates, ...femaleCandidates]}
            className="mb-6"
          />
        )}

        <div className="flex gap-6">
          {/* Filters Panel */}
          {showFilters && (
            <div className="w-80">
              <FilterPanel
                filters={localFilters}
                onFiltersChange={setLocalFilters}
                onReset={() => {
                  setLocalFilters({});
                  resetFilters();
                }}
                onSavePreset={handleFilterSave}
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
                onCandidateAction={handleCandidateAction}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidatesManager;
