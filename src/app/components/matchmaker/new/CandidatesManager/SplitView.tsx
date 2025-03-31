"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CandidatesList from "./CandidatesList";
import StatsCard from "./StatsCard";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  Clock,
  Calendar,
  ChevronDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Candidate, CandidateAction } from "../types/candidates";
import type { FilterState } from "../types/filters";
import { calculateAge } from "@/lib/utils";

interface SplitViewProps {
  maleCandidates: Candidate[];
  femaleCandidates: Candidate[];
  allCandidates?: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
  onCandidateAction: (type: CandidateAction, candidate: Candidate) => void;
  viewMode: "grid" | "list";
  isLoading?: boolean;
  className?: string;
  highlightTerm?: string;

  // פרמטרים לסינון נפרד
  separateFiltering: boolean;
  maleFilters?: Partial<FilterState>;
  femaleFilters?: Partial<FilterState>;
  onMaleFiltersChange: (filters: Partial<FilterState>) => void;
  onFemaleFiltersChange: (filters: Partial<FilterState>) => void;
  onCopyFilters: (source: "male" | "female", target: "male" | "female") => void;
}

interface Stats {
  activeCount: number;
  verifiedCount: number;
  availableCount: number;
}

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

const SplitView: React.FC<SplitViewProps> = ({
  maleCandidates,
  femaleCandidates,
  allCandidates = [],
  onCandidateClick,
  onCandidateAction,
  viewMode,
  isLoading = false,
  className,
  // פרמטרים לסינון נפרד
  separateFiltering,
  maleFilters = {},
  femaleFilters = {},

}) => {
  // Panel configuration state
  const [panels] = useState({
    male: {
      id: "male-panel",
      minSize: 30,
      defaultSize: 50,
    },
    female: {
      id: "female-panel",
      minSize: 30,
      defaultSize: 50,
    },
  });

  // State for mobile view
  const [isMobile, setIsMobile] = useState(false);
  const maleScrollRef = useRef<HTMLDivElement>(null);
  const femaleScrollRef = useRef<HTMLDivElement>(null);
  const [showMaleFilters, setShowMaleFilters] = useState(false);
  const [showFemaleFilters, setShowFemaleFilters] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  // Wrapper function for handling all action types
  const handleAction = useCallback(
    (type: CandidateAction, candidate: Candidate) => {
      if (type === "view" && onCandidateClick) {
        onCandidateClick(candidate);
        return;
      }
      onCandidateAction(type, candidate);
    },
    [onCandidateAction, onCandidateClick]
  );

  // Memoized stats calculations
  const calculateStats = useCallback((candidates: Candidate[]): Stats => {
    const now = Date.now();

    return {
      activeCount: candidates.filter(
        (c) =>
          c.profile.lastActive &&
          new Date(c.profile.lastActive).getTime() > now - ONE_WEEK
      ).length,

      verifiedCount: candidates.filter((c) => c.isVerified).length,

      availableCount: candidates.filter(
        (c) => c.profile.availabilityStatus === "AVAILABLE"
      ).length,
    };
  }, []);

  const maleStats = useMemo(
    () => calculateStats(maleCandidates),
    [maleCandidates, calculateStats]
  );

  const femaleStats = useMemo(
    () => calculateStats(femaleCandidates),
    [femaleCandidates, calculateStats]
  );

  // פונקציית עזר לסינון מועמדים לפי פילטרים
  const applyFiltersToCandidate = useCallback(
    (candidate: Candidate, filters: Partial<FilterState>): boolean => {
      if (!filters) return true;

      // בדיקת גיל
      if (filters.ageRange) {
        const age = calculateAge(new Date(candidate.profile.birthDate));
        if (age < filters.ageRange.min || age > filters.ageRange.max) {
          return false;
        }
      }

      // בדיקת גובה
      if (filters.heightRange && candidate.profile.height) {
        if (
          candidate.profile.height < filters.heightRange.min ||
          candidate.profile.height > filters.heightRange.max
        ) {
          return false;
        }
      }

      // בדיקת רמת דתיות
      if (
        filters.religiousLevel &&
        candidate.profile.religiousLevel !== filters.religiousLevel
      ) {
        return false;
      }

      // בדיקת ערים
      if (filters.cities?.length && candidate.profile.city) {
        if (!filters.cities.includes(candidate.profile.city)) {
          return false;
        }
      }

      // בדיקת עיסוקים
      if (filters.occupations?.length && candidate.profile.occupation) {
        if (!filters.occupations.includes(candidate.profile.occupation)) {
          return false;
        }
      }

      // בדיקת השכלה
      if (
        filters.educationLevel &&
        candidate.profile.education !== filters.educationLevel
      ) {
        return false;
      }

      // בדיקת מצב משפחתי
      if (
        filters.maritalStatus &&
        candidate.profile.maritalStatus !== filters.maritalStatus
      ) {
        return false;
      }

      // בדיקת זמינות
      if (
        filters.availabilityStatus &&
        candidate.profile.availabilityStatus !== filters.availabilityStatus
      ) {
        return false;
      }
      // בדיקת אימות
      if (
        filters.isVerified !== undefined &&
        candidate.isVerified !== filters.isVerified
      ) {
        return false;
      }
      if (
        filters.userStatus !== undefined &&
        candidate.status !== filters.userStatus
      ) {
        return false;
      }
      // בדיקת המלצות
      if (
        filters.hasReferences &&
        !candidate.profile.referenceName1 &&
        !candidate.profile.referenceName2
      ) {
        return false;
      }

      // בדיקת פעילות אחרונה
      if (filters.lastActiveDays && candidate.profile.lastActive) {
        const lastActive = new Date(candidate.profile.lastActive);
        const daysDiff =
          (new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > filters.lastActiveDays) {
          return false;
        }
      }

      // בדיקת שלמות פרופיל
      if (
        filters.isProfileComplete !== undefined &&
        candidate.isProfileComplete !== filters.isProfileComplete
      ) {
        return false;
      }

      // בדיקת מונח חיפוש
      if (filters.searchQuery) {
        const searchTerm = filters.searchQuery.toLowerCase().trim();
        if (searchTerm) {
          const fullName =
            `${candidate.firstName} ${candidate.lastName}`.toLowerCase();
          const city = (candidate.profile.city || "").toLowerCase();
          const occupation = (candidate.profile.occupation || "").toLowerCase();
          const religiousLevel = (
            candidate.profile.religiousLevel || ""
          ).toLowerCase();

          if (
            !fullName.includes(searchTerm) &&
            !city.includes(searchTerm) &&
            !occupation.includes(searchTerm) &&
            !religiousLevel.includes(searchTerm)
          ) {
            return false;
          }
        }
      }

      return true;
    },
    []
  );

  const filteredMaleCandidates = useMemo(() => {
    // Always apply gender-specific filters when separateFiltering is enabled
    if (separateFiltering && maleFilters) {
      return maleCandidates.filter((candidate) =>
        applyFiltersToCandidate(candidate, maleFilters)
      );
    }

    // Fall back to the original candidates list if not using separate filtering
    return maleCandidates;
  }, [maleCandidates, maleFilters, separateFiltering, applyFiltersToCandidate]);

  const filteredFemaleCandidates = useMemo(() => {
    // Always apply gender-specific filters when separateFiltering is enabled
    if (separateFiltering && femaleFilters) {
      return femaleCandidates.filter((candidate) =>
        applyFiltersToCandidate(candidate, femaleFilters)
      );
    }

    // Fall back to the original candidates list if not using separate filtering
    return femaleCandidates;
  }, [
    femaleCandidates,
    femaleFilters,
    separateFiltering,
    applyFiltersToCandidate,
  ]);

  // בדיקת פילטרים פעילים עבור כל מגדר
  const getActiveFilterCount = (
    filters: Partial<FilterState> | undefined
  ): number => {
    if (!filters) return 0;

    let count = 0;
    if (filters.ageRange) count++;
    if (filters.heightRange) count++;
    if (filters.religiousLevel) count++;
    if (filters.cities?.length) count++;
    if (filters.occupations?.length) count++;
    if (filters.educationLevel) count++;
    if (filters.maritalStatus) count++;
    if (filters.availabilityStatus) count++;
    if (filters.isVerified !== undefined) count++;
    if (filters.hasReferences !== undefined) count++;
    if (filters.isProfileComplete !== undefined) count++;
    if (filters.lastActiveDays) count++;

    return count;
  };

  const maleFilterCount = getActiveFilterCount(maleFilters);
  const femaleFilterCount = getActiveFilterCount(femaleFilters);

  const renderStats = (
    stats: Stats,
    total: number,
    gender: "male" | "female"
  ) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
      <StatsCard
        icon={Users}
        title="סה״כ"
        value={total}
        variant="default"
        bgGradient={
          gender === "male"
            ? "from-blue-50 to-blue-100"
            : "from-purple-50 to-purple-100"
        }
        iconColor={gender === "male" ? "text-blue-600" : "text-purple-600"}
      />
      <StatsCard
        icon={Clock}
        title="פעילים"
        value={stats.activeCount}
        variant="success"
        bgGradient={
          gender === "male"
            ? "from-blue-50 to-blue-100"
            : "from-purple-50 to-purple-100"
        }
        iconColor={gender === "male" ? "text-blue-600" : "text-purple-600"}
        trend={{
          value: Math.round((stats.activeCount / total) * 100),
          label: "מכלל המועמדים",
          isPositive: true,
        }}
      />
      <StatsCard
        icon={UserCheck}
        title="מאומתים"
        value={stats.verifiedCount}
        variant="success"
        bgGradient={
          gender === "male"
            ? "from-blue-50 to-blue-100"
            : "from-purple-50 to-purple-100"
        }
        iconColor={gender === "male" ? "text-blue-600" : "text-purple-600"}
        trend={{
          value: Math.round((stats.verifiedCount / total) * 100),
          label: "מכלל המועמדים",
          isPositive: true,
        }}
      />
      <StatsCard
        icon={Calendar}
        title="פנויים"
        value={stats.availableCount}
        variant="warning"
        bgGradient={
          gender === "male"
            ? "from-blue-50 to-blue-100"
            : "from-purple-50 to-purple-100"
        }
        iconColor={gender === "male" ? "text-blue-600" : "text-purple-600"}
        trend={{
          value: Math.round((stats.availableCount / total) * 100),
          label: "מכלל המועמדים",
          isPositive: true,
        }}
      />
    </div>
  );

  // הרכיב של בחירת הפילטרים למגדר ספציפי
// בקובץ SplitView.tsx - הקוד המתוקן

const renderGenderFilterControls = (gender: "male" | "female") => {
  const isMaleGender = gender === "male";
  const toggleFilters = isMaleGender
    ? () => setShowMaleFilters(!showMaleFilters)
    : () => setShowFemaleFilters(!showFemaleFilters);
  const filterCount = isMaleGender ? maleFilterCount : femaleFilterCount;
  
  return (
    <div
      className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-md ${
        isMaleGender ? "bg-blue-50" : "bg-purple-50"
      }`}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleFilters}
        className={`flex items-center gap-1.5 text-xs px-2 py-1 h-7 relative ${
          isMaleGender
            ? "text-blue-700 hover:bg-blue-100"
            : "text-purple-700 hover:bg-purple-100"
        }`}
      >
        <Filter className="w-3.5 h-3.5" />
        <span>סינון</span>
        {filterCount > 0 && (
          <Badge
            className={`h-5 w-5 p-0 flex items-center justify-center absolute -top-2 -right-1 ${
              isMaleGender ? "bg-blue-600" : "bg-purple-600"
            }`}
          >
            {filterCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

  // Mobile view with side-by-side scrollable columns
  if (isMobile) {
    return (
      <div
        className={`${
          className || ""
        } bg-white rounded-lg shadow-sm border overflow-hidden`}
      >
        <div className="flex flex-row h-[calc(100vh-200px)]">
          {/* Male candidates column */}
          <div className="w-1/2 flex flex-col border-l">
            <div className="p-2 text-center bg-blue-50 border-b">
              <div className="font-semibold">מועמדים</div>
              <Badge className="bg-blue-100 text-blue-800 border-0">
                {filteredMaleCandidates.length}
              </Badge>
            </div>

            {/* פקדי הסינון הנפרד */}
            {separateFiltering && renderGenderFilterControls("male")}

            <div
              ref={maleScrollRef}
              className="flex-1 overflow-y-auto p-2 relative"
            >
              {renderStats(maleStats, filteredMaleCandidates.length, "male")}

              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-200 text-blue-800 p-1 rounded-r-md opacity-80">
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </div>
              <CandidatesList
                candidates={filteredMaleCandidates}
                allCandidates={allCandidates}
                onCandidateClick={onCandidateClick}
                onCandidateAction={handleAction}
                viewMode={viewMode}
                isLoading={isLoading}
                className="min-h-[300px] pt-1"
              />
            </div>
          </div>

          {/* Female candidates column */}
          <div className="w-1/2 flex flex-col">
            <div className="p-2 text-center bg-purple-50 border-b">
              <div className="font-semibold">מועמדות</div>
              <Badge className="bg-purple-100 text-purple-800 border-0">
                {filteredFemaleCandidates.length}
              </Badge>
            </div>

            {/* פקדי הסינון הנפרד */}
            {separateFiltering && renderGenderFilterControls("female")}

            <div
              ref={femaleScrollRef}
              className="flex-1 overflow-y-auto p-2 relative"
            >
              {renderStats(
                femaleStats,
                filteredFemaleCandidates.length,
                "female"
              )}

              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-purple-200 text-purple-800 p-1 rounded-l-md opacity-80">
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </div>
              <CandidatesList
                candidates={filteredFemaleCandidates}
                allCandidates={allCandidates}
                onCandidateClick={onCandidateClick}
                onCandidateAction={handleAction}
                viewMode={viewMode}
                isLoading={isLoading}
                className="min-h-[300px] pt-1"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view with resizable panels
  return (
    <div className={`${className || ""}`}>
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[800px] rounded-lg bg-white shadow-sm border"
      >
        {/* צד ימין - מועמדים */}
        <ResizablePanel
          id={panels.male.id}
          defaultSize={panels.male.defaultSize}
          minSize={panels.male.minSize}
          className="transition-all duration-200"
        >
          <div className="p-3">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <Badge className="bg-blue-100 text-blue-800 text-sm px-2.5 py-1 border-0">
                  {filteredMaleCandidates.length} מועמדים
                </Badge>
                <h2 className="text-lg font-bold text-blue-900">מועמדים</h2>
              </div>

              {/* פקדי הסינון הנפרד */}
              {separateFiltering && renderGenderFilterControls("male")}

              {/* סטטיסטיקות */}
              {renderStats(maleStats, filteredMaleCandidates.length, "male")}
            </div>

            {/* רשימת המועמדים המסוננים */}
            <CandidatesList
              candidates={filteredMaleCandidates}
              allCandidates={allCandidates}
              onCandidateClick={onCandidateClick}
              onCandidateAction={handleAction}
              viewMode={viewMode}
              isLoading={isLoading}
              className="min-h-[600px]"
            />
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-2 bg-gray-100 hover:bg-gray-200 transition-colors" />

        {/* צד שמאל - מועמדות */}
        <ResizablePanel
          id={panels.female.id}
          defaultSize={panels.female.defaultSize}
          minSize={panels.female.minSize}
          className="transition-all duration-200"
        >
          <div className="p-3">
            <div className="mb-2">
              <div className="flex justify-between items-center mb-2">
                <Badge className="bg-purple-100 text-purple-800 text-sm px-2.5 py-1 border-0">
                  {filteredFemaleCandidates.length} מועמדות
                </Badge>
                <h2 className="text-lg font-bold text-purple-900">מועמדות</h2>
              </div>

              {/* פקדי הסינון הנפרד */}
              {separateFiltering && renderGenderFilterControls("female")}

              {/* סטטיסטיקות */}
              {renderStats(
                femaleStats,
                filteredFemaleCandidates.length,
                "female"
              )}
            </div>

            {/* רשימת המועמדות המסוננות */}
            <CandidatesList
              candidates={filteredFemaleCandidates}
              allCandidates={allCandidates}
              onCandidateClick={onCandidateClick}
              onCandidateAction={handleAction}
              viewMode={viewMode}
              isLoading={isLoading}
              className="min-h-[600px]"
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SplitView;
