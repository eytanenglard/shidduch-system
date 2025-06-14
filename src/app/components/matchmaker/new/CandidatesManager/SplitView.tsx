// File: src/app/components/matchmaker/new/CandidatesManager/SplitView.tsx

"use client";

import React, { useMemo, useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import CandidatesList from "./CandidatesList";
import { Badge } from "@/components/ui/badge";
import { Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Candidate, CandidateAction } from "../types/candidates";
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
  
  const mapScoresToCandidates = (candidates: Candidate[]): (Candidate & { aiScore?: number })[] => {
    if (aiMatches.length === 0) return candidates;
    const scoreMap = new Map(aiMatches.map(m => [m.userId, m.score]));
    return candidates
      .map(c => ({ ...c, aiScore: scoreMap.get(c.id) }))
      .sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
  };

  const maleCandidatesWithScores = useMemo(() => mapScoresToCandidates(maleCandidates), [maleCandidates, aiMatches]);
  const femaleCandidatesWithScores = useMemo(() => mapScoresToCandidates(femaleCandidates), [femaleCandidates, aiMatches]);

 const renderPanelHeader = (gender: 'male' | 'female') => {
    const panelGenderEnum = gender === 'male' ? Gender.MALE : Gender.FEMALE;
    const isTargetPanel = aiTargetCandidate?.profile.gender === panelGenderEnum;
    const isSearchPanel = aiTargetCandidate && aiTargetCandidate.profile.gender !== panelGenderEnum;
    const count = gender === 'male' ? maleCandidates.length : femaleCandidates.length;

    return (
      <div className="flex justify-between items-center mb-2 p-2 rounded-t-lg bg-gray-50 border-b">
        <h2 className={cn("text-lg font-bold", gender === 'male' ? "text-blue-800" : "text-purple-800")}>
          {gender === 'male' ? `מועמדים (${count})` : `מועמדות (${count})`}
        </h2>
        <div className="flex-grow" />
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
    );
};


  if (isMobile) {
    return (
        <div className="p-4">
            <h3 className="font-bold text-center">תצוגת AI אינה זמינה במצב מובייל.</h3>
            <p className="text-center text-sm text-gray-500">אנא עבור לתצוגת דסקטופ כדי להשתמש ביכולות הבינה המלאכותית.</p>
        </div>
    );
  }

  return (
    <div className={cn("h-full", className)}>
      <ResizablePanelGroup direction="horizontal" className="min-h-[800px] rounded-lg bg-white shadow-sm border">
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