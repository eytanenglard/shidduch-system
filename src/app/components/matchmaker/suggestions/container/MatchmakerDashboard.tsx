"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, RefreshCw, BarChart } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  Suggestion,
  SuggestionFilters,
  ActionAdditionalData,
} from "@/types/suggestions";
import type { NewSuggestionFormData } from "../../suggestions/NewSuggestionForm/schema";
import { MatchSuggestionStatus, Priority } from "@prisma/client";
import NewSuggestionForm from "../../suggestions/NewSuggestionForm";
import SuggestionsStats from "./SuggestionsStats";
import SuggestionActionBar from "./SuggestionActionBar";
import SuggestionDetailsDialog from "../details/SuggestionDetailsDialog";
import SuggestionCard from "../cards/SuggestionCard";
import { toast } from "sonner";
import EditSuggestionForm from "../EditSuggestionForm";
import MessageForm from "../MessageForm";
import MonthlyTrendModal from "./MonthlyTrendModal";
type DialogActionData = {
  suggestionId?: string;
  newStatus?: MatchSuggestionStatus;
  notes?: string;
  suggestion?: Suggestion;
  partyType?: "first" | "second" | "both";
  type?: string;
};
type ConfirmActionData = {
  suggestionId: string;
  partyType?: "first" | "second" | "both";
  type?: string;
};

export default function MatchmakerDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState("pending"); // Changed default tab to "pending"
  const [showNewSuggestion, setShowNewSuggestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SuggestionFilters>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    data: ConfirmActionData;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [, setMessageRecipient] = useState<"first" | "second" | "both">("both");
  const [showMonthlyTrendDialog, setShowMonthlyTrendDialog] = useState(false);

  // Calculate suggestion counts
  const activeCount = suggestions.filter((s) => s.category === "ACTIVE").length;
  const pendingCount = suggestions.filter(
    (s) => s.category === "PENDING"
  ).length;
  const historyCount = suggestions.filter(
    (s) => s.category === "HISTORY"
  ).length;

  // Fetch suggestions data
  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/matchmaker/suggestions");
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();
      setSuggestions(data);

      // Log suggestions data for debugging
      console.log("Fetched suggestions:", data);
      console.log("Total suggestions count:", data.length);

      // Log suggestions by status
      const activeCount = data.filter(
        (s: Suggestion) => s.category === "ACTIVE"
      ).length;
      const pendingCount = data.filter(
        (s: Suggestion) => s.category === "PENDING"
      ).length;
      const historyCount = data.filter(
        (s: Suggestion) => s.category === "HISTORY"
      ).length;
      console.log("Suggestions by status:", {
        active: activeCount,
        pending: pendingCount,
        history: historyCount,
      });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("שגיאה בטעינת ההצעות");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Handle refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSuggestions();
    setIsRefreshing(false);
    toast.success("נתוני ההצעות עודכנו");
  };

  // Handle new suggestion creation
  const handleNewSuggestion = async (data: NewSuggestionFormData) => {
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create suggestion");

      setShowNewSuggestion(false);
      toast.success("ההצעה נוצרה בהצלחה");
      await fetchSuggestions();
    } catch (error) {
      console.error("Error creating suggestion:", error);
      toast.error("שגיאה ביצירת ההצעה");
    }
  };

  // Handle suggestion deletion
  const handleSuggestionDeleted = useCallback((deletedId: string) => {
    setSuggestions((prevSuggestions) =>
      prevSuggestions.filter((suggestion) => suggestion.id !== deletedId)
    );
    toast.success("ההצעה נמחקה בהצלחה");
  }, []);

  // Export suggestions to CSV
  const handleExport = async () => {
    try {
      const response = await fetch("/api/suggestions/export", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export suggestions");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suggestions-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("הקובץ הורד בהצלחה");
    } catch (error) {
      console.error("Error exporting suggestions:", error);
      toast.error("שגיאה בייצוא ההצעות");
    }
  };

  // Handle suggestion actions
  const handleSuggestionAction = (
    type:
      | "view"
      | "contact"
      | "message"
      | "edit"
      | "delete"
      | "resend"
      | "changeStatus"
      | "reminder",
    suggestion: Suggestion,
    additionalData?: ActionAdditionalData
  ) => {
    console.log(
      `Action ${type} for suggestion ${suggestion.id}`,
      additionalData
    );

    switch (type) {
      case "view":
        setSelectedSuggestion(suggestion);
        break;
      case "delete":
        setConfirmAction({
          type: "delete",
          data: { suggestionId: suggestion.id },
        });
        setShowConfirmDialog(true);
        break;
      case "contact":
        // Show reminder sending confirmation
        setConfirmAction({
          type: "contact",
          data: {
            suggestionId: suggestion.id,
            partyType:
              suggestion.status === "PENDING_FIRST_PARTY" ? "first" : "second",
          },
        });
        setShowConfirmDialog(true);
        break;
      case "reminder":
        // Handle reminder action
        setConfirmAction({
          type: "contact", // או "reminder" אם יש טיפול שונה
          data: {
            suggestionId: suggestion.id,
            partyType: additionalData?.partyType || "both",
          },
        });
        setShowConfirmDialog(true);
        break;
      case "edit":
        // לפתיחת חלון עריכה
        setSelectedSuggestion(suggestion);
        setShowEditForm(true);
        break;
      case "message":
        // לפתיחת חלון הודעה
        setSelectedSuggestion(suggestion);
        setShowMessageForm(true);
        break;
      case "resend":
        // Show resend confirmation
        setConfirmAction({
          type: "resend",
          data: { suggestionId: suggestion.id },
        });
        setShowConfirmDialog(true);
        break;
      case "changeStatus":
        if (additionalData?.newStatus) {
          handleStatusChange(
            suggestion.id,
            additionalData.newStatus,
            additionalData?.notes
          );
        } else {
          console.error("Status change requested without providing new status");
          toast.error("שגיאה: סטטוס חדש לא סופק");
        }
        break;
    }
  };
  const getCategoryFromStatus = (
    status: MatchSuggestionStatus
  ): "ACTIVE" | "PENDING" | "HISTORY" => {
    switch (status) {
      case "DRAFT":
      case "AWAITING_MATCHMAKER_APPROVAL":
      case "PENDING_FIRST_PARTY":
      case "PENDING_SECOND_PARTY":
        return "PENDING";

      case "FIRST_PARTY_DECLINED":
      case "SECOND_PARTY_DECLINED":
      case "MATCH_DECLINED":
      case "ENDED_AFTER_FIRST_DATE":
      case "ENGAGED":
      case "MARRIED":
      case "EXPIRED":
      case "CLOSED":
      case "CANCELLED":
        return "HISTORY";

      default:
        return "ACTIVE";
    }
  };
  // Handle status change
  const handleStatusChange = async (
    suggestionId: string,
    newStatus: MatchSuggestionStatus,
    notes?: string
  ) => {
    try {
      console.log(
        `Updating status for ${suggestionId} to ${newStatus}`,
        notes ? `with notes: ${notes}` : ""
      );

      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            notes: notes || `סטטוס שונה מממשק ניהול הצעות`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Status update API error:", errorData);
        throw new Error(
          errorData.error ||
            `Failed to update status: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Status update success:", data);

      toast.success("סטטוס ההצעה עודכן בהצלחה");

      // עדכון רשימת ההצעות ללא צורך בטעינה מחדש
      setSuggestions((prevSuggestions) =>
        prevSuggestions.map((suggestion) =>
          suggestion.id === suggestionId
            ? {
                ...suggestion,
                status: newStatus,
                // עדכון קטגוריית ההצעה בהתאם לסטטוס החדש
                category: getCategoryFromStatus(newStatus),
                lastActivity: new Date().toISOString(),
                lastStatusChange: new Date().toISOString(),
                previousStatus: suggestion.status,
              }
            : suggestion
        )
      );
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      toast.error(
        `שגיאה בעדכון סטטוס ההצעה: ${
          error instanceof Error ? error.message : "שגיאה לא מזוהה"
        }`
      );
    }
  };

  // Handle dialog actions
  const handleDialogAction = (action: string, data?: DialogActionData) => {
    console.log(`Dialog action: ${action}`, data);

    switch (action) {
      case "changeStatus":
        if (data?.suggestionId && data?.newStatus) {
          handleStatusChange(data.suggestionId, data.newStatus, data?.notes);
        }
        setSelectedSuggestion(null);
        break;
      case "delete":
        setConfirmAction({
          type: "delete",
          data: { suggestionId: data?.suggestionId as string },
        });
        setShowConfirmDialog(true);
        setSelectedSuggestion(null);
        break;
      case "message":
        // פתיחת טופס שליחת הודעה
        if (data?.suggestion) {
          setSelectedSuggestion(data.suggestion);
          setShowMessageForm(true);
          setMessageRecipient(data.partyType || "both");
        }
        break;
      case "edit":
        // פתיחת טופס עריכה
        if (data?.suggestion) {
          setSelectedSuggestion(data.suggestion);
          setShowEditForm(true);
        } else if (data?.suggestionId) {
          // מצב שבו יש רק מזהה הצעה
          const suggestion = suggestions.find(
            (s) => s.id === data.suggestionId
          );
          if (suggestion) {
            setSelectedSuggestion(suggestion);
            setShowEditForm(true);
          }
        }
        break;
      case "contact":
      case "reminder":
        if (data?.partyType && data?.suggestionId) {
          sendReminder(data.suggestionId, data.partyType);
        }
        break;
      case "sendReminder":
        if (data?.suggestionId && data?.type) {
          sendReminder(
            data.suggestionId,
            data.type as "first" | "second" | "both"
          );
        }
        break;
      case "resendToAll":
        if (data?.suggestionId) {
          resendSuggestion(data.suggestionId, "both");
        }
        break;
      case "export":
      case "exportHistory":
        toast.info("פונקציונליות ייצוא בפיתוח");
        break;
      case "scheduleMeeting":
        toast.info("פונקציונליות תיאום פגישה בפיתוח");
        break;
      case "shareContacts":
        if (data?.suggestionId) {
          setConfirmAction({
            type: "shareContacts",
            data: { suggestionId: data.suggestionId },
          });
          setShowConfirmDialog(true);
        }
        break;
    }
  };
  const handleUpdateSuggestion = async (data: {
    suggestionId: string;
    updates: {
      priority?: Priority;
      matchingReason?: string;
      firstPartyNotes?: string;
      secondPartyNotes?: string;
      internalNotes?: string;
      decisionDeadline?: Date;
    };
  }) => {
    try {
      const response = await fetch(`/api/suggestions/${data.suggestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.updates),
      });

      if (!response.ok) throw new Error("Failed to update suggestion");

      toast.success("פרטי ההצעה עודכנו בהצלחה");

      // Update suggestions list without refetching
      setSuggestions((prevSuggestions) =>
        prevSuggestions.map((s) =>
          s.id === data.suggestionId ? { ...s, ...data.updates } : s
        )
      );

      setShowEditForm(false);
    } catch (error) {
      console.error("Error updating suggestion:", error);
      toast.error("שגיאה בעדכון פרטי ההצעה");
    }
  };

  // Handle sending message
  const handleSendMessage = async (data: {
    suggestionId: string;
    partyType: "first" | "second" | "both";
    messageType: "message" | "reminder" | "update";
    messageContent: string;
  }) => {
    try {
      // שימוש בנתיב API הנכון
      const response = await fetch(
        `/api/matchmaker/suggestions/${data.suggestionId}/message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partyType: data.partyType,
            messageType: data.messageType,
            content: data.messageContent,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      toast.success("ההודעה נשלחה בהצלחה");
      setShowMessageForm(false);
      fetchSuggestions(); // רענון נתונים לאחר שליחת הודעה
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(
        `שגיאה בשליחת ההודעה: ${
          error instanceof Error ? error.message : "שגיאה לא מזוהה"
        }`
      );
    }
  };

  // Send reminder function
  const sendReminder = async (
    suggestionId: string,
    partyType: "first" | "second" | "both" = "both" // Default value
  ) => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/remind`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partyType }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reminder");
      }

      toast.success(
        `תזכורת נשלחה ${
          partyType === "first"
            ? "לצד א'"
            : partyType === "second"
            ? "לצד ב'"
            : "לשני הצדדים"
        }`
      );
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error(
        `שגיאה בשליחת התזכורת: ${
          error instanceof Error ? error.message : "שגיאה לא מזוהה"
        }`
      );
    }
  };

  // Resend suggestion function
  const resendSuggestion = async (
    suggestionId: string,
    partyType: "first" | "second" | "both"
  ) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyType }),
      });

      if (!response.ok) throw new Error("Failed to resend suggestion");

      toast.success(
        `ההצעה נשלחה מחדש ${
          partyType === "first"
            ? "לצד א'"
            : partyType === "second"
            ? "לצד ב'"
            : "לשני הצדדים"
        }`
      );
      fetchSuggestions();
    } catch (error) {
      console.error("Error resending suggestion:", error);
      toast.error("שגיאה בשליחת ההצעה מחדש");
    }
  };

  // Share contact details function
  const shareContactDetails = async (suggestionId: string) => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/share-contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to share contact details");
      }

      toast.success("פרטי הקשר שותפו בהצלחה בין שני הצדדים");
      fetchSuggestions(); // רענון הנתונים לאחר שיתוף פרטי קשר
    } catch (error) {
      console.error("Error sharing contact details:", error);
      toast.error(
        `שגיאה בשיתוף פרטי הקשר: ${
          error instanceof Error ? error.message : "שגיאה לא מזוהה"
        }`
      );
    }
  };

  // Handle confirm dialog actions
  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      switch (confirmAction.type) {
        case "delete":
          const deleteResponse = await fetch(
            `/api/suggestions/${confirmAction.data.suggestionId}/delete`,
            {
              method: "DELETE",
            }
          );

          if (!deleteResponse.ok)
            throw new Error("Failed to delete suggestion");

          handleSuggestionDeleted(confirmAction.data.suggestionId);
          break;
        case "contact":
          await sendReminder(
            confirmAction.data.suggestionId,
            confirmAction.data.partyType || "both" // Provide a default value
          );
          break;
        case "resend":
          await resendSuggestion(confirmAction.data.suggestionId, "both");
          break;
        case "shareContacts":
          await shareContactDetails(confirmAction.data.suggestionId);
          break;
      }
    } catch (error) {
      console.error(`Error processing ${confirmAction.type} action:`, error);
      toast.error(`שגיאה בביצוע הפעולה: ${confirmAction.type}`);
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 rtl matchmaker-dashboard">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 justify-end">
            <Badge variant="outline" className="text-sm">
              {suggestions.length} הצעות
            </Badge>
            <h1 className="text-2xl font-bold">ניהול הצעות שידוכים</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "מעדכן..." : "רענן נתונים"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              ייצוא
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMonthlyTrendDialog(true)}
            >
              <BarChart className="w-4 h-4 mr-2" />
              מגמה חודשית
            </Button>

            <Button onClick={() => setShowNewSuggestion(true)}>
              <Plus className="w-4 h-4 mr-2" />
              הצעה חדשה
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <SuggestionsStats
          suggestions={suggestions}
          className="mb-6"
          onFilterChange={(filter) => {
            if (filter) {
              setFilters((currentFilters) => ({
                ...currentFilters,
                ...filter,
              }));
            }
          }}
        />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList dir="rtl" className="flex-row-reverse">
              <TabsTrigger value="pending">ממתין לאישור</TabsTrigger>
              <TabsTrigger value="active">הצעות פעילות</TabsTrigger>
              <TabsTrigger value="history">היסטוריה</TabsTrigger>
            </TabsList>
          </div>

          {/* Action Bar */}
          <SuggestionActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            totalCount={suggestions.length}
            activeCount={activeCount}
            pendingCount={pendingCount}
            historyCount={historyCount}
          />

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">טוען...</div>
            </div>
          ) : (
            <>
              {/* Suggestions Lists */}
              <TabsContent value="pending">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grid-flow-row-dense">
                  {suggestions
                    .filter((s) => s.category === "PENDING")
                    .filter((s) => {
                      // Apply search filter
                      if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        return (
                          s.firstParty.firstName
                            .toLowerCase()
                            .includes(query) ||
                          s.firstParty.lastName.toLowerCase().includes(query) ||
                          s.secondParty.firstName
                            .toLowerCase()
                            .includes(query) ||
                          s.secondParty.lastName
                            .toLowerCase()
                            .includes(query) ||
                          (s.matchingReason &&
                            s.matchingReason.toLowerCase().includes(query)) ||
                          (s.firstParty.profile?.city &&
                            s.firstParty.profile.city
                              .toLowerCase()
                              .includes(query)) ||
                          (s.secondParty.profile?.city &&
                            s.secondParty.profile.city
                              .toLowerCase()
                              .includes(query))
                        );
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply priority filter
                      if (filters.priority && filters.priority.length > 0) {
                        return filters.priority.includes(s.priority);
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply status filter
                      if (filters.status && filters.status.length > 0) {
                        return filters.status.includes(s.status);
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply date range filter
                      if (filters.dateRange) {
                        const createdAt = new Date(s.createdAt);
                        return (
                          createdAt >= filters.dateRange.start &&
                          createdAt <= (filters.dateRange.end || new Date())
                        );
                      }
                      return true;
                    })
                    .map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onAction={handleSuggestionAction}
                      />
                    ))}
                </div>

                {suggestions.filter((s) => s.category === "PENDING").length ===
                  0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p>אין הצעות ממתינות</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="active">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grid-flow-row-dense">
                  {suggestions
                    .filter((s) => s.category === "ACTIVE")
                    .filter((s) => {
                      // Apply search filter
                      if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        return (
                          s.firstParty.firstName
                            .toLowerCase()
                            .includes(query) ||
                          s.firstParty.lastName.toLowerCase().includes(query) ||
                          s.secondParty.firstName
                            .toLowerCase()
                            .includes(query) ||
                          s.secondParty.lastName
                            .toLowerCase()
                            .includes(query) ||
                          (s.matchingReason &&
                            s.matchingReason.toLowerCase().includes(query)) ||
                          (s.firstParty.profile?.city &&
                            s.firstParty.profile.city
                              .toLowerCase()
                              .includes(query)) ||
                          (s.secondParty.profile?.city &&
                            s.secondParty.profile.city
                              .toLowerCase()
                              .includes(query))
                        );
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply priority filter
                      if (filters.priority && filters.priority.length > 0) {
                        return filters.priority.includes(s.priority);
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply status filter
                      if (filters.status && filters.status.length > 0) {
                        return filters.status.includes(s.status);
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply date range filter
                      if (filters.dateRange) {
                        const createdAt = new Date(s.createdAt);
                        return (
                          createdAt >= filters.dateRange.start &&
                          createdAt <= (filters.dateRange.end || new Date())
                        );
                      }
                      return true;
                    })
                    .map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onAction={handleSuggestionAction}
                      />
                    ))}
                </div>

                {suggestions.filter((s) => s.category === "ACTIVE").length ===
                  0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p>אין הצעות פעילות</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 grid-flow-row-dense">
                  {suggestions
                    .filter((s) => s.category === "HISTORY")
                    .filter((s) => {
                      // Apply search filter
                      if (searchQuery) {
                        const query = searchQuery.toLowerCase();
                        return (
                          s.firstParty.firstName
                            .toLowerCase()
                            .includes(query) ||
                          s.firstParty.lastName.toLowerCase().includes(query) ||
                          s.secondParty.firstName
                            .toLowerCase()
                            .includes(query) ||
                          s.secondParty.lastName
                            .toLowerCase()
                            .includes(query) ||
                          (s.matchingReason &&
                            s.matchingReason.toLowerCase().includes(query)) ||
                          (s.firstParty.profile?.city &&
                            s.firstParty.profile.city
                              .toLowerCase()
                              .includes(query)) ||
                          (s.secondParty.profile?.city &&
                            s.secondParty.profile.city
                              .toLowerCase()
                              .includes(query))
                        );
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply priority filter
                      if (filters.priority && filters.priority.length > 0) {
                        return filters.priority.includes(s.priority);
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply status filter
                      if (filters.status && filters.status.length > 0) {
                        return filters.status.includes(s.status);
                      }
                      return true;
                    })
                    .filter((s) => {
                      // Apply date range filter
                      if (filters.dateRange) {
                        const createdAt = new Date(s.createdAt);
                        return (
                          createdAt >= filters.dateRange.start &&
                          createdAt <= (filters.dateRange.end || new Date())
                        );
                      }
                      return true;
                    })
                    .map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        onAction={handleSuggestionAction}
                      />
                    ))}
                </div>

                {suggestions.filter((s) => s.category === "HISTORY").length ===
                  0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p>אין הצעות בהיסטוריה</p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* New Suggestion Form */}
      <NewSuggestionForm
        isOpen={showNewSuggestion}
        onClose={() => setShowNewSuggestion(false)}
        candidates={[]}
        onSubmit={handleNewSuggestion}
      />

      {/* Suggestion Details Dialog */}
      <SuggestionDetailsDialog
        suggestion={selectedSuggestion}
        isOpen={!!selectedSuggestion}
        onClose={() => setSelectedSuggestion(null)}
        onAction={handleDialogAction}
      />

      {/* Monthly Trend Dialog */}
      <Dialog
        open={showMonthlyTrendDialog}
        onOpenChange={setShowMonthlyTrendDialog}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>מגמה חודשית</DialogTitle>
            <DialogDescription>ניתוח מגמות הצעות לאורך זמן</DialogDescription>
          </DialogHeader>

          <div className="p-4">
            <MonthlyTrendModal suggestions={suggestions} />
          </div>

          <DialogFooter>
            <Button onClick={() => setShowMonthlyTrendDialog(false)}>
              סגור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      {showConfirmDialog && (
        <AlertDialog>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם את/ה בטוח/ה?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.type === "delete" &&
                  "פעולה זו תמחק את ההצעה לצמיתות ולא ניתן יהיה לשחזר אותה."}
                {confirmAction?.type === "contact" &&
                  "האם לשלוח תזכורת למועמד לגבי ההצעה?"}
                {confirmAction?.type === "resend" &&
                  "האם לשלוח את ההצעה מחדש לשני הצדדים?"}
                {confirmAction?.type === "shareContacts" &&
                  "האם לשתף את פרטי הקשר בין שני הצדדים?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleConfirmAction();
                  setShowConfirmDialog(false);
                }}
                className={
                  confirmAction?.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                {confirmAction?.type === "delete" ? "מחק" : "אשר"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Edit Suggestion Form */}
      <EditSuggestionForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        suggestion={selectedSuggestion}
        onSave={handleUpdateSuggestion}
      />

      {/* Message Form */}
      <MessageForm
        isOpen={showMessageForm}
        onClose={() => setShowMessageForm(false)}
        suggestion={selectedSuggestion}
        onSend={handleSendMessage}
      />
    </div>
  );
}
