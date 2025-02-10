import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send,
  Clock,
  MessageCircle,
  Heart,
  Calendar,
  Check,
  X,
  AlertCircle,
  Users,
  ThumbsUp,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Suggestion } from "@/app/types/suggestions";
import type { Session } from "@/types/next-auth";

interface SuggestionManagementProps {
  suggestionId: string;
}

export default function SuggestionManagement({
  suggestionId,
}: SuggestionManagementProps) {
  console.log("SuggestionManagement mounted with ID:", suggestionId); // Debug log

  const { data: session } = useSession() as { data: CustomSession | null };
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug useEffect to track component lifecycle and data changes
  useEffect(() => {
    console.log("Current state:", {
      session,
      suggestion,
      loading,
      error,
      isSubmitting,
    });
  }, [session, suggestion, loading, error, isSubmitting]);

  const loadSuggestion = async () => {
    try {
      console.log("Loading suggestion, ID:", suggestionId); // Debug log
      setLoading(true);
      setError(null);

      // Validate suggestionId
      if (!suggestionId) {
        throw new Error("Missing suggestion ID");
      }

      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}`
      );
      console.log("API Response:", response); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load suggestion");
      }

      const data = await response.json();
      console.log("Loaded suggestion data:", data); // Debug log
      setSuggestion(data);
    } catch (err) {
      console.error("Error in loadSuggestion:", err); // Debug log
      setError(
        err instanceof Error ? err.message : "Failed to load suggestion"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (suggestionId) {
      loadSuggestion();
    } else {
      console.warn("No suggestionId provided"); // Debug log
    }
  }, [suggestionId]);

  const getStatusDisplay = (suggestion: Suggestion) => {
    const statusConfig = {
      DRAFT: { text: "טיוטה", className: "bg-gray-100 text-gray-800" },
      PENDING_FIRST_PARTY: {
        text: "ממתין לצד ראשון",
        className: "bg-yellow-100 text-yellow-800",
      },
      FIRST_PARTY_APPROVED: {
        text: "אושר על ידי צד ראשון",
        className: "bg-blue-100 text-blue-800",
      },
      PENDING_SECOND_PARTY: {
        text: "ממתין לצד שני",
        className: "bg-yellow-100 text-yellow-800",
      },
      SECOND_PARTY_APPROVED: {
        text: "אושר על ידי שני הצדדים",
        className: "bg-green-100 text-green-800",
      },
      CONTACT_DETAILS_SHARED: {
        text: "פרטי קשר נשלחו",
        className: "bg-blue-100 text-blue-800",
      },
      AWAITING_FIRST_DATE_FEEDBACK: {
        text: "ממתין למשוב פגישה",
        className: "bg-purple-100 text-purple-800",
      },
      DATING: {
        text: "בתהליך היכרות",
        className: "bg-green-100 text-green-800",
      },
      CLOSED: { text: "סגור", className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[
      suggestion.status as keyof typeof statusConfig
    ] || {
      text: suggestion.status,
      className: "bg-gray-100 text-gray-800",
    };

    console.log("Status display:", config); // Debug log
    return (
      <div
        className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${config.className}`}
      >
        <Clock className="w-4 h-4 mr-2" />
        {config.text}
      </div>
    );
  };

  console.log("Rendering with state:", {
    loading,
    error,
    suggestionExists: !!suggestion,
  }); // Debug log

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="mr-2">טוען...</span>
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Could not load suggestion"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 relative">
      <Card className="relative">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">
              הצעת שידוך #{suggestion.id}
            </CardTitle>
            {getStatusDisplay(suggestion)}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">צד ראשון</h3>
                <div className="space-y-2">
                  <p>
                    {suggestion.firstParty.firstName}{" "}
                    {suggestion.firstParty.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {suggestion.firstParty.email}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">צד שני</h3>
                <div className="space-y-2">
                  <p>
                    {suggestion.secondParty.firstName}{" "}
                    {suggestion.secondParty.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {suggestion.secondParty.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">פגישות ומשובים</h3>
              {suggestion.meetings.length > 0 ? (
                <div className="space-y-4">
                  {suggestion.meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {new Date(
                              meeting.scheduledDate
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {meeting.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {meeting.firstPartyFeedback && (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            התקבל משוב מצד ראשון
                          </div>
                        )}
                        {meeting.secondPartyFeedback && (
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            התקבל משוב מצד שני
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  טרם נקבעו פגישות
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
