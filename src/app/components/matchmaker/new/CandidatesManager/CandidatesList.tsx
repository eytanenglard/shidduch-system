import React, { useState, useCallback, useEffect } from "react";
import { User } from "lucide-react";
import MinimalCard from "../CandidateCard/MinimalCard";
import QuickView from "../CandidateCard/QuickView";
import { ProfileCard } from "@/app/components/shared/shared/profile";
import type { Candidate, CandidateAction } from "../types/candidates";
import type { QuestionnaireResponse } from "@/types/next-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ActionDialogs } from "../dialogs/ActionDialogs";
import NewSuggestionForm from "../NewSuggestionForm";

interface CandidatesListProps {
  candidates: Candidate[];
  allCandidates: Candidate[];
  onCandidateClick?: (candidate: Candidate) => void;
  onCandidateAction?: (type: CandidateAction, candidate: Candidate) => void;
  viewMode: "grid" | "list";
  isLoading?: boolean;
  className?: string;
}

const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  allCandidates,
  onCandidateClick,
  onCandidateAction,
  viewMode,
  isLoading = false,
  className,
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

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [dialogCandidate, setDialogCandidate] = useState<Candidate | null>(
    null
  );
  
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

  const handleCreateSuggestion = async (data: any) => {
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

  const handleAction = useCallback(
    (action: CandidateAction, candidate: Candidate) => {
      setDialogCandidate(candidate);

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
        default:
          onCandidateAction?.(action, candidate);
      }
    },
    [onCandidateAction, onCandidateClick]
  );

  if (isLoading) {
    return (
      <div
        className={`${
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 gap-4"
            : "space-y-4"
        } ${className || ""}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <User className="w-12 h-12 mb-4" />
        <p>לא נמצאו מועמדים</p>
      </div>
    );
  }

  return (
    <>
      {/* Candidates List */}
      <div
        className={`${
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 gap-4"
            : "space-y-4"
        } ${className || ""}`}
      >
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="group relative"
            onMouseEnter={() => setHoveredCandidate(candidate)}
            onMouseLeave={() => setHoveredCandidate(null)}
          >
            <MinimalCard
              candidate={candidate}
              onClick={() => handleAction("view", candidate)}
              className={viewMode === "list" ? "flex gap-4" : ""}
            />
            {hoveredCandidate?.id === candidate.id && (
              <div className="absolute right-0 left-0 z-10 mt-2">
                <QuickView
                  candidate={candidate}
                  onAction={(action) => handleAction(action, candidate)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Profile Dialog */}
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
            <DialogTitle>פרופיל מועמד</DialogTitle>
            <DialogDescription>צפייה בפרטי המועמד</DialogDescription>
            <Select
              value={isMatchmaker ? "matchmaker" : "candidate"}
              onValueChange={(value) => setIsMatchmaker(value === "matchmaker")}
            >
              <SelectTrigger>
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

      {/* Action Dialogs */}
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

      {/* New Suggestion Form */}
      <NewSuggestionForm
        isOpen={showSuggestDialog}
        onClose={() => setShowSuggestDialog(false)}
        candidates={allCandidates}
        selectedCandidate={selectedCandidate}
        onSubmit={handleCreateSuggestion}
      />
    </>
  );
};

export default CandidatesList;
