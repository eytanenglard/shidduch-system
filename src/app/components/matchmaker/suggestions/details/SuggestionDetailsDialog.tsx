// SuggestionDetailsDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ProfileCard } from "@/app/components/shared/shared/profile";
import { Timeline } from "@/components/ui/timeline";
import {
  MessageCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import type { Suggestion } from "@/types/suggestions";
import type { QuestionnaireResponse } from "@/types/next-auth";

interface SuggestionDetailsDialogProps {
  suggestion: Suggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}

const SuggestionDetailsDialog: React.FC<SuggestionDetailsDialogProps> = ({
  suggestion,
  isOpen,
  onClose,
  onAction,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [firstPartyQuestionnaire, setFirstPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [secondPartyQuestionnaire, setSecondPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadQuestionnaire = async (userId: string) => {
      try {
        const response = await fetch(
          `/api/profile/questionnaire?userId=${userId}`
        );
        const data = await response.json();

        if (data.success && data.questionnaireResponse) {
          return {
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
        }
        return null;
      } catch (error) {
        console.error("Failed to load questionnaire:", error);
        toast.error("שגיאה בטעינת השאלון");
        return null;
      }
    };

    const loadQuestionnaires = async () => {
      if (!suggestion) {
        setFirstPartyQuestionnaire(null);
        setSecondPartyQuestionnaire(null);
        return;
      }

      setIsLoading(true);
      try {
        const [firstParty, secondParty] = await Promise.all([
          loadQuestionnaire(suggestion.firstParty.id),
          loadQuestionnaire(suggestion.secondParty.id),
        ]);

        setFirstPartyQuestionnaire(firstParty);
        setSecondPartyQuestionnaire(secondParty);
      } catch (error) {
        console.error("Error loading questionnaires:", error);
        toast.error("שגיאה בטעינת השאלונים");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestionnaires();
  }, [suggestion]);

  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>פרטי הצעת שידוך</DialogTitle>
          <DialogDescription>
            הצעה בין {suggestion.firstParty.firstName}{" "}
            {suggestion.firstParty.lastName} ל{suggestion.secondParty.firstName}{" "}
            {suggestion.secondParty.lastName}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex h-full"
        >
          <div className="w-48 border-l">
            <TabsList className="flex flex-col h-full p-2">
              <TabsTrigger value="overview" className="justify-end">
                סקירה כללית
              </TabsTrigger>
              <TabsTrigger value="firstParty" className="justify-end">
                צד ראשון
              </TabsTrigger>
              <TabsTrigger value="secondParty" className="justify-end">
                צד שני
              </TabsTrigger>
              <TabsTrigger value="timeline" className="justify-end">
                ציר זמן
              </TabsTrigger>
              <TabsTrigger value="communication" className="justify-end">
                תקשורת
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 p-6">
            <TabsContent value="firstParty">
              <ProfileCard
                profile={suggestion.firstParty.profile}
                images={suggestion.firstParty.images}
                questionnaire={firstPartyQuestionnaire}
                viewMode="matchmaker"
              />
            </TabsContent>

            <TabsContent value="secondParty">
              <ProfileCard
                profile={suggestion.secondParty.profile}
                images={suggestion.secondParty.images}
                questionnaire={secondPartyQuestionnaire}
                viewMode="matchmaker"
              />
            </TabsContent>

            <TabsContent value="timeline">
              <ScrollArea className="h-[500px] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    טוען...
                  </div>
                ) : (
                  <Timeline
                    items={(suggestion?.statusHistory || []).map((history) => ({
                      title: history.status,
                      description: history.notes,
                      date: new Date(history.createdAt),
                      icon: history.status.includes("APPROVED")
                        ? CheckCircle
                        : history.status.includes("DECLINED")
                        ? XCircle
                        : AlertCircle,
                    }))}
                  />
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="communication">
              {/* Communication content here */}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDetailsDialog;
