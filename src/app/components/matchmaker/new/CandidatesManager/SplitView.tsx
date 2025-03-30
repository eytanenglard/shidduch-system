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
import { Users, UserCheck, Clock, Calendar, ChevronDown } from "lucide-react";
import type { Candidate, CandidateAction } from "../types/candidates";

interface SplitViewProps {
  maleCandidates: Candidate[];
  femaleCandidates: Candidate[];
  allCandidates?: Candidate[]; // הוסף את זה
  onCandidateClick?: (candidate: Candidate) => void;
  onCandidateAction: (type: CandidateAction, candidate: Candidate) => void;
  viewMode: "grid" | "list";
  isLoading?: boolean;
  className?: string;
  highlightTerm?: string; // כנראה חסר גם זה
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
  onCandidateClick,
  onCandidateAction,
  viewMode,
  isLoading = false,
  className,
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
                {maleCandidates.length}
              </Badge>
            </div>
            <div
              ref={maleScrollRef}
              className="flex-1 overflow-y-auto p-2 relative"
            >
              {renderStats(maleStats, maleCandidates.length, "male")}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-200 text-blue-800 p-1 rounded-r-md opacity-80">
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </div>
              <CandidatesList
                candidates={maleCandidates}
                allCandidates={[...maleCandidates, ...femaleCandidates]}
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
                {femaleCandidates.length}
              </Badge>
            </div>
            <div
              ref={femaleScrollRef}
              className="flex-1 overflow-y-auto p-2 relative"
            >
              {renderStats(femaleStats, femaleCandidates.length, "female")}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-purple-200 text-purple-800 p-1 rounded-l-md opacity-80">
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </div>
              <CandidatesList
                candidates={femaleCandidates}
                allCandidates={[...maleCandidates, ...femaleCandidates]}
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
          <div className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <Badge className="bg-blue-100 text-blue-800 text-sm px-2.5 py-1 border-0">
                  {maleCandidates.length} מועמדים
                </Badge>
                <h2 className="text-xl font-bold text-blue-900">מועמדים</h2>
              </div>
              {renderStats(maleStats, maleCandidates.length, "male")}
            </div>
            <CandidatesList
              candidates={maleCandidates}
              allCandidates={[...maleCandidates, ...femaleCandidates]}
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
          <div className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <Badge className="bg-purple-100 text-purple-800 text-sm px-2.5 py-1 border-0">
                  {femaleCandidates.length} מועמדות
                </Badge>
                <h2 className="text-xl font-bold text-purple-900">מועמדות</h2>
              </div>
              {renderStats(femaleStats, femaleCandidates.length, "female")}
            </div>
            <CandidatesList
              candidates={femaleCandidates}
              allCandidates={[...maleCandidates, ...femaleCandidates]}
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
