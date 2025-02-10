"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  Clock,
  Check,
  X,
  RulerIcon,
  Calendar,
  MessageCircle,
  AlertCircle,
  Users,
  ThumbsUp,
  ThumbsDown,
  HourglassIcon,
  Briefcase,
  GraduationCap,
  User,
  MapPin,
  Ruler,
  Star,
} from "lucide-react";
import type { Suggestion } from "@/app/types/suggestions";
import type { MeetingFeedback } from "@/types/meetings";
import MeetingFeedbackDialog from "@/app/components/meetings/MeetingFeedbackDialog";

// Utility function to calculate age from birthdate
const calculateAge = (birthdate: Date | undefined): string => {
  if (!birthdate) return "לא צוין";

  const today = new Date();

  // Check if the date is valid
  if (isNaN(birthdate.getTime())) return "לא צוין";

  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();

  // Adjust age if birthday hasn't occurred this year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--;
  }

  return age.toString();
};

export default function UserSuggestions() {
  const { data: session } = useSession() as { data: Session | null };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadSuggestions();
    }
  }, [session]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/suggestions");
      if (!response.ok) {
        throw new Error("Failed to load suggestions");
      }

      const data = await response.json();
      const filteredSuggestions = data.filter((suggestion: Suggestion) => {
        const isSecondParty = suggestion.secondPartyId === session?.user?.id;
        return !(isSecondParty && suggestion.status === "PENDING_FIRST_PARTY");
      });
      setSuggestions(filteredSuggestions);
    } catch (err) {
      console.error("Error loading suggestions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load suggestions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (approved: boolean) => {
    if (!selectedSuggestion) return;

    try {
      setIsSubmitting(true);
      const isFirstParty =
        selectedSuggestion.firstPartyId === session?.user?.id;

      const newStatus = isFirstParty
        ? approved
          ? "FIRST_PARTY_APPROVED"
          : "FIRST_PARTY_DECLINED"
        : approved
        ? "SECOND_PARTY_APPROVED"
        : "SECOND_PARTY_DECLINED";

      const res = await fetch(
        `/api/matchmaker/suggestions/${selectedSuggestion.id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            note: response,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update suggestion");
      }

      await loadSuggestions();
      setShowResponseDialog(false);
      setSelectedSuggestion(null);
      setResponse("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMeetingFeedback = async (feedback: MeetingFeedback) => {
    if (!selectedSuggestion) return;

    try {
      setIsSubmitting(true);
      const lastMeeting =
        selectedSuggestion.meetings[selectedSuggestion.meetings.length - 1];

      const res = await fetch(
        `/api/matchmaker/suggestions/${selectedSuggestion.id}/meetings/${lastMeeting.id}/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(feedback),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to submit feedback");
      }

      await loadSuggestions();
      setShowFeedbackDialog(false);
      setSelectedSuggestion(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit feedback"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (suggestion: Suggestion) => {
    const isFirstParty = session?.user?.id === suggestion.firstPartyId;

    const statusConfig = {
      PENDING_FIRST_PARTY: {
        text: isFirstParty ? "ממתין לתשובתך" : "ממתין לתשובת הצד הראשון",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-4 h-4" />,
      },
      PENDING_SECOND_PARTY: {
        text: isFirstParty ? "ממתין לתשובת הצד השני" : "ממתין לתשובתך",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="w-4 h-4" />,
      },
      CONTACT_DETAILS_SHARED: {
        text: "פרטי קשר נשלחו",
        color: "bg-blue-100 text-blue-800",
        icon: <Users className="w-4 h-4" />,
      },
      AWAITING_FIRST_DATE_FEEDBACK: {
        text: "נא למלא משוב על הפגישה",
        color: "bg-purple-100 text-purple-800",
        icon: <MessageCircle className="w-4 h-4" />,
      },
      THINKING_AFTER_DATE: {
        text: "בתהליך חשיבה",
        color: "bg-indigo-100 text-indigo-800",
        icon: <HourglassIcon className="w-4 h-4" />,
      },
      DATING: {
        text: "בתהליך היכרות",
        color: "bg-green-100 text-green-800",
        icon: <Heart className="w-4 h-4" />,
      },
      PROCEEDING_TO_SECOND_DATE: {
        text: "ממשיכים לדייט שני",
        color: "bg-green-100 text-green-800",
        icon: <ThumbsUp className="w-4 h-4" />,
      },
      ENDED_AFTER_FIRST_DATE: {
        text: "הסתיים אחרי דייט ראשון",
        color: "bg-red-100 text-red-800",
        icon: <ThumbsDown className="w-4 h-4" />,
      },
    };

    const config = statusConfig[
      suggestion.status as keyof typeof statusConfig
    ] || {
      text: suggestion.status,
      color: "bg-gray-100 text-gray-800",
      icon: <AlertCircle className="w-4 w-4" />,
    };

    return (
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.color}`}
      >
        {config.icon}
        <span className="text-sm">{config.text}</span>
      </div>
    );
  };

  const renderActionButtons = (suggestion: Suggestion) => {
    const isFirstParty = session?.user?.id === suggestion.firstPartyId;

    switch (suggestion.status) {
      case "PENDING_FIRST_PARTY":
        return isFirstParty ? (
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => {
                setSelectedSuggestion(suggestion);
                setShowResponseDialog(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              מעוניין/ת
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSuggestion(suggestion);
                setShowResponseDialog(true);
              }}
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              לא מעוניין/ת
            </Button>
          </div>
        ) : null;

      case "PENDING_SECOND_PARTY":
        return !isFirstParty ? (
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => {
                setSelectedSuggestion(suggestion);
                setShowResponseDialog(true);
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4" />
              מעוניין/ת
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSuggestion(suggestion);
                setShowResponseDialog(true);
              }}
              className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
              לא מעוניין/ת
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">ממתין לתשובת הצד השני</div>
        );

      case "AWAITING_FIRST_DATE_FEEDBACK":
        return (
          <Button
            onClick={() => {
              setSelectedSuggestion(suggestion);
              setShowFeedbackDialog(true);
            }}
            className="flex items-center gap-2 w-full justify-center"
          >
            <MessageCircle className="h-4 w-4" />
            מילוי משוב פגישה
          </Button>
        );

      case "CONTACT_DETAILS_SHARED":
        const hasScheduledMeeting = suggestion.meetings.some(
          (m) => m.status === "SCHEDULED"
        );
        return hasScheduledMeeting ? null : (
          <div className="text-sm text-gray-600 text-center bg-blue-50 p-3 rounded-md">
            <Clock className="h-4 w-4 inline-block mr-2" />
            נא ליצור קשר לתיאום פגישה
          </div>
        );

      case "THINKING_AFTER_DATE":
        return (
          <div className="text-sm text-purple-600 text-center bg-purple-50 p-3 rounded-md">
            <HourglassIcon className="h-4 w-4 inline-block mr-2" />
            בתהליך חשיבה לאחר הפגישה
          </div>
        );

      case "PROCEEDING_TO_SECOND_DATE":
        return (
          <div className="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md">
            <Calendar className="h-4 w-4 inline-block mr-2" />
            בתהליך תיאום פגישה שנייה
          </div>
        );

      case "ENDED_AFTER_FIRST_DATE":
        return (
          <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">
            <X className="h-4 w-4 inline-block mr-2" />
            הסתיים לאחר פגישה ראשונה
          </div>
        );

      case "FIRST_PARTY_APPROVED":
        return isFirstParty ? (
          <div className="text-sm text-green-600 text-center bg-green-50 p-3 rounded-md">
            <Check className="h-4 w-4 inline-block mr-2" />
            אישרת את ההצעה, ממתין לצד השני
          </div>
        ) : null;

      default:
        return null;
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-800">אנא התחבר למערכת</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              אין הצעות שידוכים
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              עדיין אין הצעות שידוכים פעילות עבורך
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                {/* Status */}
                <div className="flex justify-between items-center mb-4">
                  {getStatusDisplay(suggestion)}
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>

                {/* Suggestion Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">
                      הצעה מאת {suggestion.matchmaker.firstName}{" "}
                      {suggestion.matchmaker.lastName}
                    </h3>

                    {/* מידע על הצד השני */}
                    <div className="mt-4 space-y-2 bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-lg mb-3">
                        פרטי המועמד/ת:
                      </h4>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-500 ml-2" />
                          <span className="text-gray-600">שם:</span>
                          <span className="font-medium mr-1">
                            {session?.user?.id === suggestion.firstPartyId
                              ? `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`
                              : `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-500 ml-2" />
                          <span className="text-gray-600">גיל:</span>
                          <span className="font-medium mr-1">
                            {session?.user?.id === suggestion.firstPartyId
                              ? calculateAge(
                                  suggestion.secondParty.profile?.birthDate
                                )
                              : calculateAge(
                                  suggestion.firstParty.profile?.birthDate
                                )}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <RulerIcon className="w-4 h-4 text-gray-500 ml-2" />
                          <span className="text-gray-600">גובה:</span>
                          <span className="font-medium mr-1">
                            {session?.user?.id === suggestion.firstPartyId
                              ? `${suggestion.secondParty.profile?.height} ס"מ`
                              : `${suggestion.firstParty.profile?.height} ס"מ`}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-500 ml-2" />
                          <span className="text-gray-600">עיר מגורים:</span>
                          <span className="font-medium mr-1">
                            {session?.user?.id === suggestion.firstPartyId
                              ? suggestion.secondParty.profile?.city
                              : suggestion.firstParty.profile?.city}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-gray-500 ml-2" />
                          <span className="text-gray-600">רמת דתיות:</span>
                          <span className="font-medium mr-1">
                            {session?.user?.id === suggestion.firstPartyId
                              ? suggestion.secondParty.profile?.religiousLevel
                              : suggestion.firstParty.profile?.religiousLevel}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Heart className="w-4 h-4 text-gray-500 ml-2" />
                          <span className="text-gray-600">מצב משפחתי:</span>
                          <span className="font-medium mr-1">
                            {session?.user?.id === suggestion.firstPartyId
                              ? suggestion.secondParty.profile?.maritalStatus
                              : suggestion.firstParty.profile?.maritalStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meetings */}
                  {suggestion.meetings.length > 0 && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">פגישות</h4>
                      {suggestion.meetings.map((meeting) => (
                        <div
                          key={meeting.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>
                              {new Date(
                                meeting.scheduledDate
                              ).toLocaleDateString("he-IL")}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              meeting.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : meeting.status === "SCHEDULED"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {meeting.status === "COMPLETED"
                              ? "הושלם"
                              : meeting.status === "SCHEDULED"
                              ? "מתוכנן"
                              : "בוטל"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4">{renderActionButtons(suggestion)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <AlertDialog
        open={showResponseDialog}
        onOpenChange={setShowResponseDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>תגובה להצעת השידוך</AlertDialogTitle>
            <AlertDialogDescription>
              אנא הוסף/י הערות או תגובה להצעה (אופציונלי)
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="הערות או תגובה..."
            className="min-h-[100px]"
          />

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowResponseDialog(false);
                setSelectedSuggestion(null);
                setResponse("");
              }}
            >
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleResponse(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              <X className="ml-2 h-4 w-4" />
              לא מעוניין/ת
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => handleResponse(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="ml-2 h-4 w-4" />
              מעוניין/ת
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Meeting Feedback Dialog */}
      <MeetingFeedbackDialog
        isOpen={showFeedbackDialog}
        onClose={() => {
          setShowFeedbackDialog(false);
          setSelectedSuggestion(null);
        }}
        onSubmit={handleMeetingFeedback}
        meetingId={
          selectedSuggestion?.meetings[selectedSuggestion.meetings.length - 1]
            ?.id || ""
        }
      />

      {/* Error Dialog */}
      {error && (
        <AlertDialog open={!!error} onOpenChange={() => setError(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>שגיאה</AlertDialogTitle>
              <AlertDialogDescription>{error}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setError(null)}>
                הבנתי
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
