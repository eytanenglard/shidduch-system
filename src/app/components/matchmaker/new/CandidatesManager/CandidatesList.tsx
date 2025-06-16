// File: src/app/components/matchmaker/new/CandidatesManager/CandidatesList.tsx

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { UserX, Edit } from "lucide-react";
import MinimalCard from "../CandidateCard/MinimalCard";
import QuickView from "../CandidateCard/QuickView";
import { ProfileCard } from "@/app/components/profile";
import type { Candidate, CandidateAction, MobileView } from "../types/candidates";
import type { QuestionnaireResponse } from "@/types/next-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ActionDialogs } from "../dialogs/ActionDialogs";
import NewSuggestionForm from "../../suggestions/NewSuggestionForm";
import MatchmakerEditProfile from "../MatchmakerEditProfile";
import { cn } from "@/lib/utils";

interface CreateSuggestionData {
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  firstPartyId: string;
  secondPartyId: string;
  status:
    | "DRAFT"
    | "PENDING_FIRST_PARTY"
    | "FIRST_PARTY_APPROVED"
    | "FIRST_PARTY_DECLINED"
    | string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
}

interface CandidatesListProps {
  candidates: (Candidate & { aiScore?: number })[];
  allCandidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
  onCandidateAction?: (type: CandidateAction, candidate: Candidate) => void;
  viewMode: "grid" | "list";
  mobileView: MobileView;
  isLoading?: boolean;
  className?: string;
  highlightTerm?: string;
  
  // --- AI-RELATED PROPS ---
  aiTargetCandidate: Candidate | null;
  onSetAiTarget: (candidate: Candidate, e: React.MouseEvent) => void;
  comparisonSelection: Record<string, Candidate>;
  onToggleComparison: (candidate: Candidate, e: React.MouseEvent) => void;
}

const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  allCandidates,
  onCandidateClick,
  onCandidateAction,
  viewMode,
  mobileView,
  isLoading = false,
  className,
  highlightTerm,
  aiTargetCandidate,
  onSetAiTarget,
  comparisonSelection,
  onToggleComparison,
}) => {
  // Base states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse | null>(null);
  const [isMatchmaker, setIsMatchmaker] = useState(false);
  const [hoveredCandidate, setHoveredCandidate] = useState<Candidate | null>(
    null
  );
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const quickViewRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [dialogCandidate, setDialogCandidate] = useState<Candidate | null>(
    null
  );

  const [isMobile, setIsMobile] = useState(false);

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

  // Close QuickView when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hoveredCandidate &&
        quickViewRef.current &&
        !quickViewRef.current.contains(event.target as Node)
      ) {
        setHoveredCandidate(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hoveredCandidate]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Load questionnaire when candidate is selected
  useEffect(() => {
    const loadQuestionnaire = async () => {
      if (!selectedCandidate) {
        setQuestionnaireResponse(null);
        return;
      }

      try {
        const response = await fetch(
          `/api/profile/questionnaire?userId=${selectedCandidate.id}`
        );
        const data = await response.json();

        if (data.success && data.questionnaireResponse) {
          const formattedQuestionnaire = {
            ...data.questionnaireResponse,
            formattedAnswers: {
              values: data.questionnaireResponse.formattedAnswers.values || [],
              personality:
                data.questionnaireResponse.formattedAnswers.personality || [],
              relationship:
                data.questionnaireResponse.formattedAnswers.relationship || [],
              partner:
                data.questionnaireResponse.formattedAnswers.partner || [],
              religion:
                data.questionnaireResponse.formattedAnswers.religion || [],
            },
          };
          setQuestionnaireResponse(formattedQuestionnaire);
        }
      } catch (error) {
        console.error("Failed to load questionnaire:", error);
        toast.error("שגיאה בטעינת השאלון");
      }
    };

    loadQuestionnaire();
  }, [selectedCandidate]);

  // Action handlers
  const handleInvite = async (candidate: Candidate, email: string) => {
    try {
      const response = await fetch("/api/matchmaker/candidates/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          email,
        }),
      });

      if (!response.ok) throw new Error("Failed to send invitation");

      toast.success("ההזמנה נשלחה בהצלחה");
      onCandidateAction?.("invite", candidate);
    } catch (error) {
      console.error("Error sending invite:", error);
      throw error;
    }
  };

  const handleAvailabilityCheck = async (candidate: Candidate) => {
    try {
      const response = await fetch("/api/availability/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: candidate.id }),
      });

      if (!response.ok) throw new Error("Failed to check availability");

      toast.success("בדיקת הזמינות נשלחה");
      onCandidateAction?.("contact", candidate);
    } catch (error) {
      console.error("Error checking availability:", error);
      throw error;
    }
  };

  const handleCreateSuggestion = async (data: CreateSuggestionData) => {
    try {
      const response = await fetch("/api/matchmaker/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create suggestion");

      toast.success("ההצעה נוצרה בהצלחה");
      onCandidateAction?.("suggest", dialogCandidate!);
    } catch (error) {
      console.error("Error creating suggestion:", error);
      throw error;
    }
  };

  const handleEditProfile = (candidate: Candidate) => {
    setDialogCandidate(candidate);
    setShowEditProfileDialog(true);
  };

  const handleMouseEnter = (candidate: Candidate, e?: React.MouseEvent) => {
    if (isMobile) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    let top = window.scrollY + window.innerHeight / 3;
    let left = window.innerWidth / 2;

    if (e) {
      const element = e.currentTarget as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        const screenMiddle = window.innerWidth / 2;
        const isRightPanel = rect.left < screenMiddle;

        top = rect.top + window.scrollY;

        if (isRightPanel) {
          left = Math.min(rect.right + 10, window.innerWidth - 430);
        } else {
          left = Math.max(rect.left - 430, 10);
        }
      }
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPosition({ top, left });
      setHoveredCandidate(candidate);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setTimeout(() => {
      if (!quickViewRef.current?.matches(":hover")) {
        setHoveredCandidate(null);
      }
    }, 100);
  };

  const handleAction = useCallback(
    (action: CandidateAction, candidate: Candidate) => {
      setDialogCandidate(candidate);
      setHoveredCandidate(null);

      switch (action) {
        case "invite":
          setShowInviteDialog(true);
          break;
        case "contact":
          setShowAvailabilityDialog(true);
          break;
        case "suggest":
          setShowSuggestDialog(true);
          break;
        case "view":
          setSelectedCandidate(candidate);
          onCandidateClick?.(candidate);
          break;
        case "edit":
          handleEditProfile(candidate);
          break;
        default:
          onCandidateAction?.(action, candidate);
      }
    },
    [onCandidateAction, onCandidateClick]
  );
  
  const gridLayoutClass = useMemo(() => {
    if (isMobile) {
      // Mobile view logic
      return mobileView === 'double'
        ? 'grid grid-cols-2 gap-2' // Two columns for mobile
        : 'grid grid-cols-1 gap-3'; // Single column for mobile
    }
    // Desktop view logic
    return viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4'
      : 'space-y-4';
  }, [isMobile, mobileView, viewMode]);

  // Loading states render
  if (isLoading) {
    return (
      <div
        className={`${
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4"
        } ${className || ""}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative">
            <Skeleton
              className={
                viewMode === "list" ? "h-32 w-full" : "h-[350px] w-full"
              }
            />
            <div className="absolute top-3 right-3">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state render with improved UI
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <UserX className="w-8 h-8 mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-500 mb-1">
          לא נמצאו מועמדים
        </p>
        <p className="text-xs text-gray-400">
          נסו להרחיב את החיפוש או להסיר חלק מהמסננים.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn(gridLayoutClass, className || "")}>
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="group relative"
            onMouseEnter={(e) => handleMouseEnter(candidate, e)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleAction("view", candidate)}
          >
            <MinimalCard
              candidate={candidate}
              onClick={() => handleAction("view", candidate)}
              onEdit={(c, e) => {
                e.stopPropagation();
                handleAction("edit", c);
              }}
              className={cn(
                viewMode === "list" && !isMobile ? "flex flex-row-reverse gap-4 h-32" : "",
                isMobile && mobileView === 'double' ? 'transform scale-90' : '',
                isMobile && mobileView === 'single' ? 'transform scale-95' : ''
              )}
              highlightTerm={highlightTerm}
              aiScore={candidate.aiScore}
              onSetAiTarget={onSetAiTarget}
              isAiTarget={aiTargetCandidate?.id === candidate.id}
              isSelectableForComparison={
                !!aiTargetCandidate &&
                aiTargetCandidate.profile.gender !== candidate.profile.gender &&
                aiTargetCandidate.id !== candidate.id
              }
              isSelectedForComparison={!!comparisonSelection[candidate.id]}
              onToggleComparison={onToggleComparison}
            />
            <button
              className="absolute top-2 left-2 bg-primary text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => {
                e.stopPropagation();
                handleAction("edit", candidate);
              }}
              aria-label="ערוך פרופיל"
              title="ערוך פרופיל"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {hoveredCandidate && !isMobile && (
        <div
          ref={quickViewRef}
          className="fixed z-50 md:absolute transform -translate-x-1/2 sm:translate-x-0"
          style={{
            top: `${hoverPosition.top}px`,
            left: `${hoverPosition.left}px`,
            maxWidth: window.innerWidth < 768 ? "calc(100vw - 32px)" : "420px",
            ...(window.innerWidth < 768
              ? {
                  left: "50%",
                  transform: "translateX(-50%)",
                  maxHeight: "85vh",
                }
              : {}),
          }}
        >
          <div className="drop-shadow-2xl">
            <QuickView
              candidate={hoveredCandidate}
              onAction={(action) => handleAction(action, hoveredCandidate)}
              onSetAiTarget={(c, e) => onSetAiTarget(c, e)}
              isAiTarget={aiTargetCandidate?.id === hoveredCandidate.id}
            />
          </div>
        </div>
      )}

      <Dialog
        open={!!selectedCandidate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCandidate(null);
            setQuestionnaireResponse(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>פרופיל מועמד</DialogTitle>
              <Button
                variant="outline"
                onClick={() => handleAction("edit", selectedCandidate!)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                עריכת פרופיל
              </Button>
            </div>
            <DialogDescription>צפייה בפרטי המועמד</DialogDescription>
            <Select
              value={isMatchmaker ? "matchmaker" : "candidate"}
              onValueChange={(value) => setIsMatchmaker(value === "matchmaker")}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="בחר תצוגה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="candidate">תצוגת מועמד</SelectItem>
                <SelectItem value="matchmaker">תצוגת שדכן</SelectItem>
              </SelectContent>
            </Select>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-6">
              <ProfileCard
                profile={selectedCandidate.profile}
                images={selectedCandidate.images}
                questionnaire={questionnaireResponse}
                viewMode={isMatchmaker ? "matchmaker" : "candidate"}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ActionDialogs
        suggestDialog={{
          isOpen: showSuggestDialog,
          onClose: () => setShowSuggestDialog(false),
          onSubmit: handleCreateSuggestion,
          selectedCandidate: dialogCandidate,
        }}
        availabilityDialog={{
          isOpen: showAvailabilityDialog,
          onClose: () => setShowAvailabilityDialog(false),
          onCheck: handleAvailabilityCheck,
          selectedCandidate: dialogCandidate,
        }}
        inviteDialog={{
          isOpen: showInviteDialog,
          onClose: () => setShowInviteDialog(false),
          onInvite: handleInvite,
          selectedCandidate: dialogCandidate,
        }}
      />

      <NewSuggestionForm
        isOpen={showSuggestDialog}
        onClose={() => setShowSuggestDialog(false)}
        candidates={allCandidates}
        selectedCandidate={selectedCandidate}
        onSubmit={handleCreateSuggestion}
      />

      <MatchmakerEditProfile
        isOpen={showEditProfileDialog}
        onClose={() => setShowEditProfileDialog(false)}
        candidate={dialogCandidate}
      />
    </>
  );
};

export default CandidatesList;