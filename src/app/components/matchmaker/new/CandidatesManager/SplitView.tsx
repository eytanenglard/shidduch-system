"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CandidatesList from "./CandidatesList";
import StatsCard from "./StatsCard";
import { Users, UserCheck, Clock, Calendar } from "lucide-react";
import type { Candidate, CandidateAction } from "../types/candidates";

interface SplitViewProps {
  maleCandidates: Candidate[];
  femaleCandidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
  onCandidateAction: (type: CandidateAction, candidate: Candidate) => void;
  viewMode: "grid" | "list";
  isLoading?: boolean;
  className?: string;
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

  // Wrapper function for handling all action types
  // SplitView.tsx
  const handleAction = useCallback(
    (type: CandidateAction, candidate: Candidate) => {
      if (type === "view" && onCandidateClick) {
        // בדיקה אם הפונקציה קיימת
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

  const renderStats = (stats: Stats, total: number) => (
    <div className="grid grid-cols-4 gap-3 mb-4">
      <StatsCard icon={Users} title="סה״כ" value={total} variant="default" />
      <StatsCard
        icon={Clock}
        title="פעילים"
        value={stats.activeCount}
        variant="success"
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
        trend={{
          value: Math.round((stats.availableCount / total) * 100),
          label: "מכלל המועמדים",
          isPositive: true,
        }}
      />
    </div>
  );

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
        >
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">מועמדים</h2>
              {renderStats(maleStats, maleCandidates.length)}
            </div>
            <CandidatesList
              candidates={maleCandidates}
              allCandidates={[...maleCandidates, ...femaleCandidates]} // חדש!
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
        >
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">מועמדות</h2>
              {renderStats(femaleStats, femaleCandidates.length)}
            </div>
            <CandidatesList
              candidates={femaleCandidates}
              allCandidates={[...maleCandidates, ...femaleCandidates]} // חדש!
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
