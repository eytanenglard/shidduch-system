"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import CandidatesList from "./CandidatesList";
import StatsCard from "./StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Clock, Calendar, ChevronDown } from "lucide-react";
import type { Candidate, CandidateAction } from "../types/candidates";
import { Badge } from "@/components/ui/badge";

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

  // State for mobile view tab selection
  const [activeTab, setActiveTab] = useState<"male" | "female">("male");
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
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

  const renderStats = (stats: Stats, total: number, gender: "male" | "female") => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <StatsCard 
        icon={Users} 
        title="סה״כ" 
        value={total} 
        variant="default" 
        bgGradient={gender === "male" ? "from-blue-50 to-blue-100" : "from-purple-50 to-purple-100"} 
        iconColor={gender === "male" ? "text-blue-600" : "text-purple-600"}
      />
      <StatsCard
        icon={Clock}
        title="פעילים"
        value={stats.activeCount}
        variant="success"
        bgGradient={gender === "male" ? "from-blue-50 to-blue-100" : "from-purple-50 to-purple-100"}
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
        bgGradient={gender === "male" ? "from-blue-50 to-blue-100" : "from-purple-50 to-purple-100"}
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
        bgGradient={gender === "male" ? "from-blue-50 to-blue-100" : "from-purple-50 to-purple-100"}
        iconColor={gender === "male" ? "text-blue-600" : "text-purple-600"}
        trend={{
          value: Math.round((stats.availableCount / total) * 100),
          label: "מכלל המועמדים",
          isPositive: true,
        }}
      />
    </div>
  );

  // Mobile view with tabs
  if (isMobile) {
    return (
      <div className={`${className || ""} bg-white rounded-lg shadow-sm border overflow-hidden`}>
        <Tabs 
          defaultValue="male" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "male" | "female")}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 rounded-none">
            <TabsTrigger 
              value="male" 
              className="relative py-4 data-[state=active]:bg-blue-50"
            >
              <div className="flex flex-col items-center">
                <span className="font-semibold">מועמדים</span>
                <Badge className="mt-1 bg-blue-100 text-blue-800 border-0">{maleCandidates.length}</Badge>
              </div>
              {activeTab === "male" && (
                <ChevronDown className="absolute bottom-0 text-blue-500" size={16} />
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="female" 
              className="relative py-4 data-[state=active]:bg-purple-50"
            >
              <div className="flex flex-col items-center">
                <span className="font-semibold">מועמדות</span>
                <Badge className="mt-1 bg-purple-100 text-purple-800 border-0">{femaleCandidates.length}</Badge>
              </div>
              {activeTab === "female" && (
                <ChevronDown className="absolute bottom-0 text-purple-500" size={16} />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="male" className="mt-0 pt-4 px-4 pb-6 focus-visible:outline-none focus-visible:ring-0">
            {renderStats(maleStats, maleCandidates.length, "male")}
            <CandidatesList
              candidates={maleCandidates}
              allCandidates={[...maleCandidates, ...femaleCandidates]}
              onCandidateClick={onCandidateClick}
              onCandidateAction={handleAction}
              viewMode={viewMode}
              isLoading={isLoading}
              className="min-h-[500px]"
            />
          </TabsContent>

          <TabsContent value="female" className="mt-0 pt-4 px-4 pb-6 focus-visible:outline-none focus-visible:ring-0">
            {renderStats(femaleStats, femaleCandidates.length, "female")}
            <CandidatesList
              candidates={femaleCandidates}
              allCandidates={[...maleCandidates, ...femaleCandidates]}
              onCandidateClick={onCandidateClick}
              onCandidateAction={handleAction}
              viewMode={viewMode}
              isLoading={isLoading}
              className="min-h-[500px]"
            />
          </TabsContent>
        </Tabs>
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