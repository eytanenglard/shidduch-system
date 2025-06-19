// File: src/app/components/matchmaker/new/CandidatesManager/SplitView.tsx

"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import CandidatesList from "./CandidatesList";
import { Badge } from "@/components/ui/badge";
import { Sparkles, XCircle, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Candidate, CandidateAction, MobileView } from "../types/candidates";
import type { FilterState } from "../types/filters";
import SearchBar from "../Filters/SearchBar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Gender } from "@prisma/client";

interface AiMatch {
  userId: string;
  score: number;
}

interface SplitViewProps {
  maleCandidates: Candidate[];
  femaleCandidates: Candidate[];
  allCandidates: Candidate[];
  onCandidateAction: (type: CandidateAction, candidate: Candidate) => void;
  onCandidateClick: (candidate: Candidate) => void;
  viewMode: "grid" | "list";
  mobileView: MobileView;
  isLoading?: boolean;
  className?: string;
  
  // --- AI State and Handlers (Received from Parent) ---
  aiTargetCandidate: Candidate | null;
  aiMatches: AiMatch[];
  isAiLoading: boolean;
  onSetAiTarget: (candidate: Candidate, e: React.MouseEvent) => void;
  onClearAiTarget: (e: React.MouseEvent) => void;
  setAiMatches: React.Dispatch<React.SetStateAction<AiMatch[]>>;
  setIsAiLoading: React.Dispatch<React.SetStateAction<boolean>>;
  comparisonSelection: Record<string, Candidate>;
  onToggleComparison: (candidate: Candidate, e: React.MouseEvent) => void;

  // --- Filter Props ---
  separateFiltering: boolean;
  maleFilters?: Partial<FilterState>;
  femaleFilters?: Partial<FilterState>;
  onMaleFiltersChange: (filters: Partial<FilterState>) => void;
  onFemaleFiltersChange: (filters: Partial<FilterState>) => void;
  onCopyFilters: (source: "male" | "female", target: "male" | "female") => void;
  maleSearchQuery?: string;
  femaleSearchQuery?: string;
  onMaleSearchChange?: (query: string) => void;
  onFemaleSearchChange?: (query: string) => void;
}

const SplitView: React.FC<SplitViewProps> = (props) => {
  const {
    maleCandidates,
    femaleCandidates,
    allCandidates,
    onCandidateAction,
    onCandidateClick,
    viewMode,
    mobileView,
    isLoading = false,
    className,
    maleSearchQuery = "",
    femaleSearchQuery = "",
    onMaleSearchChange,
    onFemaleSearchChange,
    // --- Destructure AI props ---
    aiTargetCandidate,
    aiMatches,
    isAiLoading,
    onSetAiTarget,
    onClearAiTarget,
    setAiMatches,
    setIsAiLoading,
    comparisonSelection,
    onToggleComparison,
  } = props;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => setIsMobile(window.innerWidth < 768);
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleFindAiMatches = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!aiTargetCandidate) return;

    setIsAiLoading(true);
    setAiMatches([]);

    const targetGender = aiTargetCandidate.profile.gender;
    const candidatePool = targetGender === Gender.MALE ? femaleCandidates : maleCandidates;
    const candidatePoolIds = candidatePool.map(c => c.id);

    if (candidatePoolIds.length === 0) {
      toast.error("אין מועמדים במאגר לחיפוש התאמות.", { position: "top-center" });
      setIsAiLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/ai/find-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: aiTargetCandidate.id, candidatePoolIds }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch AI matches');
      
      setAiMatches(data.matches);
      toast.success(`נמצאו ${data.matches.length} התאמות AI פוטנציאליות.`, {
         position: "top-center",
         description: "המועמדים המומלצים מסומנים ומוינו לראש הרשימה."
      });
    } catch (error) {
      console.error("Error finding AI matches:", error);
      toast.error("שגיאה במציאת התאמות AI.", {
          description: error instanceof Error ? error.message : "נסה שוב מאוחר יותר.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };
  
  const maleCandidatesWithScores = useMemo(() => {
    if (aiMatches.length === 0) return maleCandidates;
    const scoreMap = new Map(aiMatches.map(m => [m.userId, m.score]));
    return maleCandidates
      .map(c => ({ ...c, aiScore: scoreMap.get(c.id) }))
      .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
  }, [maleCandidates, aiMatches]);

  const femaleCandidatesWithScores = useMemo(() => {
    if (aiMatches.length === 0) return femaleCandidates;
    const scoreMap = new Map(aiMatches.map(m => [m.userId, m.score]));
    return femaleCandidates
      .map(c => ({ ...c, aiScore: scoreMap.get(c.id) }))
      .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
  }, [femaleCandidates, aiMatches]);

  const renderPanelHeader = (gender: 'male' | 'female', isMobileView: boolean = false) => {
      const panelGenderEnum = gender === 'male' ? Gender.MALE : Gender.FEMALE;
      const isTargetPanel = aiTargetCandidate?.profile.gender === panelGenderEnum;
      const isSearchPanel = aiTargetCandidate && aiTargetCandidate.profile.gender !== panelGenderEnum;
      const count = gender === 'male' ? maleCandidates.length : femaleCandidates.length;

      return (
        <div className={cn("flex justify-between items-center mb-2 p-2 rounded-t-lg", !isMobileView && "bg-gray-50 border-b")}>
          <h2 className={cn("text-lg font-bold", gender === 'male' ? "text-blue-800" : "text-purple-800")}>
            {gender === 'male' ? `מועמדים (${count})` : `מועמדות (${count})`}
          </h2>
          <div className="flex-grow" />
          <div className="flex items-center gap-2">
              {isTargetPanel && aiTargetCandidate && (
                <div className="flex items-center gap-2 bg-green-100 p-1.5 rounded-full shadow-sm animate-fade-in">
                  <span className="text-xs font-medium text-green-800 px-2">מטרה: {aiTargetCandidate.firstName}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-green-700 hover:bg-green-200 rounded-full" onClick={onClearAiTarget}>
                    <XCircle className="h-4 w-4"/>
                  </Button>
                </div>
              )}
              {isSearchPanel && (
                <Button size="sm" onClick={handleFindAiMatches} disabled={isAiLoading}>
                  <Sparkles className={`ml-2 h-4 w-4 ${isAiLoading ? 'animate-spin' : ''}`}/>
                  {isAiLoading ? 'מחפש...' : 'מצא התאמות AI'}
                </Button>
              )}
          </div>
        </div>
      );
  };

  // --- Mobile View Logic ---
  if (isMobile) {
    if (mobileView === 'split') {
      // --- START OF CHANGE ---
      // The container now has h-full to take the height from its parent in CandidatesManager
      return (
        <div className="grid grid-cols-2 gap-2 h-full">
          {/* Male Candidates Column */}
          <div className="flex flex-col h-full">
            <div className="p-2 text-center flex-shrink-0">
              <h2 className="text-sm font-bold text-blue-800 flex items-center justify-center gap-1">
                <User className="w-4 h-4" /> מועמדים <Badge variant="secondary">{maleCandidates.length}</Badge>
              </h2>
            </div>
            {/* This div will grow to fill the space and handle its own scrolling */}
            <div className="flex-grow min-h-0 overflow-y-auto">
              <CandidatesList
                candidates={maleCandidatesWithScores}
                allCandidates={allCandidates}
                onCandidateClick={onCandidateClick}
                onCandidateAction={onCandidateAction}
                viewMode="grid"
                mobileView="single"
                isLoading={isLoading}
                highlightTerm={maleSearchQuery}
                aiTargetCandidate={aiTargetCandidate}
                onSetAiTarget={onSetAiTarget}
                comparisonSelection={comparisonSelection}
                onToggleComparison={onToggleComparison}
              />
            </div>
          </div>

          {/* Female Candidates Column */}
          <div className="flex flex-col h-full">
            <div className="p-2 text-center flex-shrink-0">
              <h2 className="text-sm font-bold text-purple-800 flex items-center justify-center gap-1">
                <User className="w-4 h-4" /> מועמדות <Badge variant="secondary">{femaleCandidates.length}</Badge>
              </h2>
            </div>
            <div className="flex-grow min-h-0 overflow-y-auto">
              <CandidatesList
                candidates={femaleCandidatesWithScores}
                allCandidates={allCandidates}
                onCandidateClick={onCandidateClick}
                onCandidateAction={onCandidateAction}
                viewMode="grid"
                mobileView="single"
                isLoading={isLoading}
                highlightTerm={femaleSearchQuery}
                aiTargetCandidate={aiTargetCandidate}
                onSetAiTarget={onSetAiTarget}
                comparisonSelection={comparisonSelection}
                onToggleComparison={onToggleComparison}
              />
            </div>
          </div>
        </div>
      );
      // --- END OF CHANGE ---
    }

    // Original Tabs view for 'single' or 'double' column modes
    return (
        <div className={cn("w-full h-full", className)}>
            <Tabs defaultValue="male" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                    <TabsTrigger value="male" className="flex items-center gap-2">
                        <User className="h-4 w-4"/> מועמדים <Badge variant="secondary">{maleCandidates.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="female" className="flex items-center gap-2">
                        <User className="h-4 w-4"/> מועמדות <Badge variant="secondary">{femaleCandidates.length}</Badge>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="male" className="mt-4 flex-1 min-h-0">
                    <div className="p-1 flex flex-col h-full">
                        {renderPanelHeader('male', true)}
                        {onMaleSearchChange && <SearchBar value={maleSearchQuery} onChange={onMaleSearchChange} placeholder="חיפוש מועמדים..." genderTarget="male" separateMode={true} />}
                        <div className="flex-grow min-h-0 overflow-y-auto">
                            <CandidatesList
                                candidates={maleCandidatesWithScores}
                                allCandidates={allCandidates}
                                onCandidateClick={onCandidateClick}
                                onCandidateAction={onCandidateAction}
                                viewMode={viewMode}
                                mobileView={mobileView}
                                isLoading={isLoading}
                                highlightTerm={maleSearchQuery}
                                aiTargetCandidate={aiTargetCandidate}
                                onSetAiTarget={onSetAiTarget}
                                comparisonSelection={comparisonSelection}
                                onToggleComparison={onToggleComparison}
                            />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="female" className="mt-4 flex-1 min-h-0">
                    <div className="p-1 flex flex-col h-full">
                        {renderPanelHeader('female', true)}
                        {onFemaleSearchChange && <SearchBar value={femaleSearchQuery} onChange={onFemaleSearchChange} placeholder="חיפוש מועמדות..." genderTarget="female" separateMode={true} />}
                        <div className="flex-grow min-h-0 overflow-y-auto">
                            <CandidatesList
                                candidates={femaleCandidatesWithScores}
                                allCandidates={allCandidates}
                                onCandidateClick={onCandidateClick}
                                onCandidateAction={onCandidateAction}
                                viewMode={viewMode}
                                mobileView={mobileView}
                                isLoading={isLoading}
                                highlightTerm={femaleSearchQuery}
                                aiTargetCandidate={aiTargetCandidate}
                                onSetAiTarget={onSetAiTarget}
                                comparisonSelection={comparisonSelection}
                                onToggleComparison={onToggleComparison}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
  }

  // --- Desktop View using Resizable Panels ---
  return (
    <div className={cn("h-full", className)}>
      <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg bg-white shadow-sm border">
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="p-3 flex flex-col h-full">
            {renderPanelHeader('male')}
            {onMaleSearchChange && <SearchBar value={maleSearchQuery} onChange={onMaleSearchChange} placeholder="חיפוש מועמדים..." genderTarget="male" separateMode={true} />}
            <div className="flex-grow min-h-0 overflow-y-auto">
              <CandidatesList
                candidates={maleCandidatesWithScores}
                allCandidates={allCandidates}
                onCandidateClick={onCandidateClick}
                onCandidateAction={onCandidateAction}
                viewMode={viewMode}
                mobileView={mobileView}
                isLoading={isLoading}
                highlightTerm={maleSearchQuery}
                aiTargetCandidate={aiTargetCandidate}
                onSetAiTarget={onSetAiTarget}
                comparisonSelection={comparisonSelection}
                onToggleComparison={onToggleComparison}
              />
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="p-3 flex flex-col h-full">
            {renderPanelHeader('female')}
            {onFemaleSearchChange && <SearchBar value={femaleSearchQuery} onChange={onFemaleSearchChange} placeholder="חיפוש מועמדות..." genderTarget="female" separateMode={true} />}
            <div className="flex-grow min-h-0 overflow-y-auto">
               <CandidatesList
                candidates={femaleCandidatesWithScores}
                allCandidates={allCandidates}
                onCandidateClick={onCandidateClick}
                onCandidateAction={onCandidateAction}
                viewMode={viewMode}
                mobileView={mobileView}
                isLoading={isLoading}
                highlightTerm={femaleSearchQuery}
                aiTargetCandidate={aiTargetCandidate}
                onSetAiTarget={onSetAiTarget}
                comparisonSelection={comparisonSelection}
                onToggleComparison={onToggleComparison}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default SplitView;