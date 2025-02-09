import React, { useState, useEffect } from "react";
import { User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileCard } from "@/app/components/shared/shared/profile";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { MatchSuggestion } from "@prisma/client";
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
} from "@/types/next-auth";

import MinimalSuggestionCard from "../cards/MinimalSuggestionCard";
import SuggestionQuickView from "../cards/SuggestionQuickView";
import { AskMatchmakerDialog } from "../dialogs/AskMatchmakerDialog";

interface ExtendedUserProfile extends UserProfile {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PartyInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: ExtendedUserProfile;
  images: UserImage[];
}

interface ExtendedMatchSuggestion extends MatchSuggestion {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
}

interface SuggestionsListProps {
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  isHistory?: boolean;
  viewMode: "grid" | "list";
  isLoading?: boolean;
  className?: string;
  onStatusChange?: (suggestionId: string, newStatus: string) => Promise<void>;
}

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  isHistory = false,
  viewMode,
  isLoading = false,
  userId,
  className,
  onStatusChange,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<ExtendedMatchSuggestion | null>(null);
  const [quickActionSuggestion, setQuickActionSuggestion] = useState<ExtendedMatchSuggestion | null>(null);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [questionnaireResponse, setQuestionnaireResponse] = useState<QuestionnaireResponse | null>(null);

  useEffect(() => {
    const loadQuestionnaire = async () => {
      if (!selectedSuggestion) {
        setQuestionnaireResponse(null);
        return;
      }

      const targetParty = selectedSuggestion.firstPartyId === userId ? 
        selectedSuggestion.secondParty : selectedSuggestion.firstParty;

      try {
        const response = await fetch(`/api/profile/questionnaire?userId=${targetParty.id}`);
        const data = await response.json();

        if (data.success && data.questionnaireResponse) {
          const formattedQuestionnaire = {
            ...data.questionnaireResponse,
            formattedAnswers: {
              values: data.questionnaireResponse.formattedAnswers.values || [],
              personality: data.questionnaireResponse.formattedAnswers.personality || [],
              relationship: data.questionnaireResponse.formattedAnswers.relationship || [],
              partner: data.questionnaireResponse.formattedAnswers.partner || [],
              religion: data.questionnaireResponse.formattedAnswers.religion || [],
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
  }, [selectedSuggestion, userId]);

  const handleAction = async (action: "approve" | "reject" | "ask" | "view", suggestion: ExtendedMatchSuggestion) => {
    try {
      switch (action) {
        case "view":
          setSelectedSuggestion(suggestion);
          break;

        case "ask":
          setSelectedSuggestion(suggestion);
          setShowAskDialog(true);
          break;

        case "approve":
          if (onStatusChange) {
            const isFirstParty = suggestion.firstPartyId === userId;
            const newStatus = isFirstParty ? "FIRST_PARTY_APPROVED" : "SECOND_PARTY_APPROVED";
            await onStatusChange(suggestion.id, newStatus);
            toast.success("ההצעה אושרה בהצלחה");
          }
          break;

        case "reject":
          if (onStatusChange) {
            const isFirstParty = suggestion.firstPartyId === userId;
            const newStatus = isFirstParty ? "FIRST_PARTY_DECLINED" : "SECOND_PARTY_DECLINED";
            await onStatusChange(suggestion.id, newStatus);
            toast.success("ההצעה נדחתה");
          }
          break;
      }
    } catch (error) {
      console.error("Error handling suggestion action:", error);
      toast.error("אירעה שגיאה בעת ביצוע הפעולה");
    }
  };

  const handleSendQuestion = async (questionText: string) => {
    if (!selectedSuggestion) return;

    try {
      await fetch(`/api/suggestions/${selectedSuggestion.id}/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });

      toast.success("השאלה נשלחה בהצלחה לשדכן");
      setShowAskDialog(false);
    } catch (error) {
      console.error("Error sending question:", error);
      toast.error("אירעה שגיאה בשליחת השאלה");
    }
  };

  if (isLoading) {
    return (
      <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"} ${className}`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <User className="w-12 h-12 mb-4" />
        <p>{isHistory ? "אין הצעות בהיסטוריה" : "אין הצעות פעילות"}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"} ${className}`}>
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="relative">
            <MinimalSuggestionCard
              suggestion={suggestion}
              userId={userId}
              onClick={() => handleAction("view", suggestion)}
              onQuickAction={setQuickActionSuggestion}
              onApprove={() => handleAction("approve", suggestion)}
              isHistory={isHistory}
              className={viewMode === "list" ? "flex gap-4" : ""}
            />
          </div>
        ))}
      </div>

      <Dialog
        open={!!selectedSuggestion}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSuggestion(null);
            setQuestionnaireResponse(null);
          }
        }}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פרטי המועמד/ת</DialogTitle>
          </DialogHeader>

          {selectedSuggestion && (
            <div className="space-y-6">
              <ProfileCard
                profile={{
                  ...(selectedSuggestion.firstPartyId === userId
                    ? selectedSuggestion.secondParty.profile
                    : selectedSuggestion.firstParty.profile),
                  user: {
                    firstName:
                      selectedSuggestion.firstPartyId === userId
                        ? selectedSuggestion.secondParty.firstName
                        : selectedSuggestion.firstParty.firstName,
                    lastName:
                      selectedSuggestion.firstPartyId === userId
                        ? selectedSuggestion.secondParty.lastName
                        : selectedSuggestion.firstParty.lastName,
                    email:
                      selectedSuggestion.firstPartyId === userId
                        ? selectedSuggestion.secondParty.email
                        : selectedSuggestion.firstParty.email,
                  },
                }}
                images={
                  selectedSuggestion.firstPartyId === userId
                    ? selectedSuggestion.secondParty.images
                    : selectedSuggestion.firstParty.images
                }
                questionnaire={questionnaireResponse}
                viewMode="candidate"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!quickActionSuggestion}
        onOpenChange={(open) => !open && setQuickActionSuggestion(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>פעולות מהירות</DialogTitle>
          </DialogHeader>
          {quickActionSuggestion && (
            <SuggestionQuickView
              suggestion={quickActionSuggestion}
              onAction={(action) => {
                handleAction(action, quickActionSuggestion);
                if (action !== "view") {
                  setQuickActionSuggestion(null);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AskMatchmakerDialog
        isOpen={showAskDialog}
        onClose={() => setShowAskDialog(false)}
        onSubmit={handleSendQuestion}
        matchmakerName={selectedSuggestion?.matchmaker.firstName}
      />
    </>
  );
};

export default SuggestionsList;