import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Clock,
  Calendar,
  MessageCircle,
  History,
  User,
  FileText,
} from "lucide-react";
import type { MatchSuggestion } from "@prisma/client";
import type {
  UserProfile,
  UserImage,
  QuestionnaireResponse,
} from "@/types/next-auth";
import { ProfileCard } from "@/app/components/shared/shared/profile";

interface PartyInfo {
  id: string;
  firstName: string;
  lastName: string;
  profile: UserProfile;
  images: UserImage[];
}

interface ExtendedMatchSuggestion extends MatchSuggestion {
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: {
    id: string;
    status: string;
    notes?: string;
    createdAt: Date;
  }[];
}

interface SuggestionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: ExtendedMatchSuggestion;
  onStatusChange?: (status: string, notes?: string) => Promise<void>;
  onSendMessage?: (message: string) => Promise<void>;
}

const SuggestionDetailsDialog: React.FC<SuggestionDetailsDialogProps> = ({
  isOpen,
  onClose,
  suggestion,
  onStatusChange,
  onSendMessage,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [newMessage, setNewMessage] = useState("");
  const [firstPartyQuestionnaire, setFirstPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [secondPartyQuestionnaire, setSecondPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);

  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        const [firstRes, secondRes] = await Promise.all([
          fetch(`/api/profile/questionnaire?userId=${suggestion.firstPartyId}`),
          fetch(
            `/api/profile/questionnaire?userId=${suggestion.secondPartyId}`
          ),
        ]);

        if (firstRes.ok) {
          const firstData = await firstRes.json();
          setFirstPartyQuestionnaire(firstData.questionnaireResponse);
        }

        if (secondRes.ok) {
          const secondData = await secondRes.json();
          setSecondPartyQuestionnaire(secondData.questionnaireResponse);
        }
      } catch (error) {
        console.error("Error loading questionnaires:", error);
      }
    };

    if (isOpen) {
      loadQuestionnaires();
    }
  }, [suggestion.firstPartyId, suggestion.secondPartyId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>פרטי הצעת שידוך</DialogTitle>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm">
              {suggestion.status}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {format(new Date(suggestion.createdAt), "dd/MM/yyyy", {
                locale: he,
              })}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
            <TabsTrigger value="firstParty">צד א׳</TabsTrigger>
            <TabsTrigger value="secondParty">צד ב׳</TabsTrigger>
            <TabsTrigger value="history">היסטוריה</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Matching Reason */}
            <Card className="p-4">
              <h3 className="font-medium mb-2">סיבת ההתאמה</h3>
              <p className="text-gray-600">{suggestion.matchingReason}</p>
            </Card>

            {/* Notes */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h3 className="font-medium mb-2">הערות לצד א׳</h3>
                <p className="text-gray-600">{suggestion.firstPartyNotes}</p>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-2">הערות לצד ב׳</h3>
                <p className="text-gray-600">{suggestion.secondPartyNotes}</p>
              </Card>
            </div>

            {/* Internal Notes & Communications */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">הערות פנימיות ותקשורת</h3>

              <div className="space-y-4">
                {suggestion.internalNotes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600">{suggestion.internalNotes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="כתוב/י הודעה חדשה..."
                    className="mb-2"
                  />
                  <Button
                    variant="default"
                    className="w-full"
                    disabled={!newMessage.trim()}
                    onClick={() => {
                      if (onSendMessage) {
                        onSendMessage(newMessage);
                        setNewMessage("");
                      }
                    }}
                  >
                    <MessageCircle className="w-4 h-4 ml-2" />
                    שליחת הודעה
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

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

          <TabsContent value="history">
            <Card className="p-4">
              <h3 className="font-medium mb-4">היסטוריית סטטוסים</h3>
              <div className="space-y-4">
                {suggestion.statusHistory.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-4 pb-4 border-b last:border-0"
                  >
                    <div className="flex-shrink-0">
                      <History className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{event.status}</Badge>
                        <span className="text-sm text-gray-500">
                          {format(
                            new Date(event.createdAt),
                            "dd/MM/yyyy HH:mm",
                            {
                              locale: he,
                            }
                          )}
                        </span>
                      </div>
                      {event.notes && (
                        <p className="mt-2 text-sm text-gray-600">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDetailsDialog;
