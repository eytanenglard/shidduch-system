"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, RefreshCw, BarChart, Loader2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MatchSuggestionStatus, Priority } from "@prisma/client";

// --- START: Type Imports and Definitions ---
import type {
  Suggestion,
  SuggestionFilters,
  ActionAdditionalData,
} from "@/types/suggestions";
import type { NewSuggestionFormData } from "../../suggestions/NewSuggestionForm/schema";
import type { Candidate } from "../../new/types/candidates";

// Hooks
import { useCandidates } from "../../new/hooks/useCandidates";

// Components
import NewSuggestionForm from "../../suggestions/NewSuggestionForm";
import SuggestionsStats from "./SuggestionsStats";
import SuggestionActionBar from "./SuggestionActionBar";
import SuggestionDetailsDialog from "../details/SuggestionDetailsDialog";
import SuggestionCard from "../cards/SuggestionCard";
import EditSuggestionForm from "../EditSuggestionForm";
import MessageForm from "../MessageForm";
import MonthlyTrendModal from "./MonthlyTrendModal";

// --- Defining specific payload types to replace 'any' ---
interface SuggestionUpdatePayload {
  priority?: Priority;
  status?: MatchSuggestionStatus;
  statusNotes?: string;
  matchingReason?: string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
  internalNotes?: string;
  decisionDeadline?: Date;
}

interface SendMessagePayload {
  suggestionId: string;
  partyType: "first" | "second" | "both";
  messageType: "message" | "reminder" | "update";
  messageContent: string;
}

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
// --- END: Type Imports and Definitions ---

export default function MatchmakerDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState("pending");
  const [showNewSuggestion, setShowNewSuggestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SuggestionFilters>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Dialogs and selected items state
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; data: ConfirmActionData; } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showMonthlyTrendDialog, setShowMonthlyTrendDialog] = useState(false);

  // Fetch candidates list to pass to the form
  const { candidates: allCandidates } = useCandidates();

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/matchmaker/suggestions");
      if (!response.ok) throw new Error("Failed to fetch suggestions");
      const data = await response.json();
      
      // =================  LOGGING START  =================
      console.log("[MatchmakerDashboard] Fetched suggestions data:", data);
      const createdSuggestion = data.find((s: Suggestion) => s.status === 'PENDING_FIRST_PARTY');
      if (createdSuggestion) {
        console.log("[MatchmakerDashboard] Found a newly created suggestion:", createdSuggestion);
      }
      // =================   LOGGING END   =================

      setSuggestions(data);
    } catch (error: unknown) {
      console.error("Error fetching suggestions:", error);
      toast.error("שגיאה בטעינת ההצעות");
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);
  
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match =
          (s.firstParty.firstName + " " + s.firstParty.lastName).toLowerCase().includes(query) ||
          (s.secondParty.firstName + " " + s.secondParty.lastName).toLowerCase().includes(query) ||
          (s.firstParty.profile?.city && s.firstParty.profile.city.toLowerCase().includes(query)) ||
          (s.secondParty.profile?.city && s.secondParty.profile.city.toLowerCase().includes(query));
        if (!match) return false;
      }
      if (filters.priority?.length && !filters.priority.includes(s.priority)) return false;
      if (filters.status?.length && !filters.status.includes(s.status)) return false;
      if (filters.dateRange) {
        const createdAt = new Date(s.createdAt);
        if (createdAt < filters.dateRange.start || (filters.dateRange.end && createdAt > filters.dateRange.end)) return false;
      }
      return true;
    });
  }, [suggestions, searchQuery, filters]);
  
  const pendingSuggestions = useMemo(() => filteredSuggestions.filter(s => s.category === 'PENDING'), [filteredSuggestions]);
  const activeSuggestions = useMemo(() => filteredSuggestions.filter(s => s.category === 'ACTIVE'), [filteredSuggestions]);
  const historySuggestions = useMemo(() => filteredSuggestions.filter(s => s.category === 'HISTORY'), [filteredSuggestions]);

  const pendingCount = pendingSuggestions.length;
  const activeCount = activeSuggestions.length;
  const historyCount = historySuggestions.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSuggestions();
    setIsRefreshing(false);
    toast.success("נתוני ההצעות עודכנו");
  };

  const handleNewSuggestion = async (data: NewSuggestionFormData) => {
    try {
      const response = await fetch("/api/matchmaker/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to create suggestion");
      setShowNewSuggestion(false);
      toast.success("ההצעה נוצרה בהצלחה");
      await fetchSuggestions();
    } catch (error: unknown) {
      console.error("Error creating suggestion:", error);
      toast.error("שגיאה ביצירת ההצעה: " + (error instanceof Error ? error.message : ""));
    }
  };

  const handleSuggestionDeleted = useCallback((deletedId: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== deletedId));
    if (selectedSuggestion?.id === deletedId) setSelectedSuggestion(null);
  }, [selectedSuggestion]);

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === "delete") {
        const response = await fetch(`/api/matchmaker/suggestions/${confirmAction.data.suggestionId}/delete`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete suggestion");
        handleSuggestionDeleted(confirmAction.data.suggestionId);
        toast.success("ההצעה נמחקה בהצלחה");
      }
    } catch (error: unknown) {
      toast.error("אירעה שגיאה בביצוע הפעולה");
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };
  
  const handleStatusChange = async (suggestionId: string, newStatus: MatchSuggestionStatus, notes?: string) => {
    try {
      const response = await fetch(`/api/matchmaker/suggestions/${suggestionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: notes || `סטטוס שונה מממשק ניהול` }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to update status");
      toast.success("סטטוס ההצעה עודכן בהצלחה");
      fetchSuggestions();
    } catch (error: unknown) {
      console.error("Error updating suggestion status:", error);
      toast.error("שגיאה בעדכון סטטוס ההצעה: " + (error instanceof Error ? error.message : ""));
    }
  };

  // --- START OF FIX: Replaced 'any' with specific type ---
  const handleUpdateSuggestion = async (data: {
    suggestionId: string;
    updates: SuggestionUpdatePayload;
  }) => {
  // --- END OF FIX ---
    try {
        const response = await fetch(`/api/matchmaker/suggestions/${data.suggestionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.updates),
        });
        if (!response.ok) throw new Error('Failed to update suggestion');
        toast.success("פרטי ההצעה עודכנו בהצלחה");
        setShowEditForm(false);
        fetchSuggestions();
    } catch (error: unknown) {
        console.error("Error updating suggestion:", error);
        toast.error("שגיאה בעדכון פרטי ההצעה");
    }
  };

  // --- START OF FIX: Replaced 'any' with specific type ---
  const handleSendMessage = async (data: SendMessagePayload) => {
  // --- END OF FIX ---
    try {
      const response = await fetch(`/api/matchmaker/suggestions/${data.suggestionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            partyType: data.partyType,
            messageType: data.messageType,
            content: data.messageContent
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to send message');
      toast.success("ההודעה נשלחה בהצלחה");
      setShowMessageForm(false);
    } catch (error: unknown) {
      toast.error("שגיאה בשליחת ההודעה: " + (error instanceof Error ? error.message : ""));
    }
  };
  
  const handleDialogAction = (action: string, data?: DialogActionData) => {
    if (action === 'delete' && data?.suggestionId) {
      setConfirmAction({ type: 'delete', data: { suggestionId: data.suggestionId } });
      setShowConfirmDialog(true);
      setSelectedSuggestion(null);
    } else if (action === 'edit' && data?.suggestion) {
      setSelectedSuggestion(data.suggestion);
      setShowEditForm(true);
    } else if (action === 'message' && data?.suggestion) {
      setSelectedSuggestion(data.suggestion);
      setShowMessageForm(true);
    } else if (action === 'changeStatus' && data?.suggestionId && data.newStatus) {
        handleStatusChange(data.suggestionId, data.newStatus, data.notes);
    }
  };
  
  const handleSuggestionAction = (type: string, suggestion: Suggestion, additionalData?: ActionAdditionalData) => {
    handleDialogAction(type, { ...additionalData, suggestionId: suggestion.id, suggestion });
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6 rtl matchmaker-dashboard">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">ניהול הצעות שידוכים</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "מעדכן..." : "רענן"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowMonthlyTrendDialog(true)}>
              <BarChart className="w-4 h-4 mr-2" />
              מגמה חודשית
            </Button>
            <Button onClick={() => setShowNewSuggestion(true)}>
              <Plus className="w-4 h-4 mr-2" />
              הצעה חדשה
            </Button>
          </div>
        </div>

        <SuggestionsStats
          suggestions={suggestions}
          className="mb-6"
          onFilterChange={(filter) => setFilters(prev => ({...prev, ...filter}))}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
                   <TabsList dir="rtl">
              {/* --- START OF CHANGE --- */}
              <TabsTrigger value="pending">
                ממתין לאישור <Badge className="mr-2">{pendingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="active">
                פעילות <Badge className="mr-2">{activeCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="history">
                היסטוריה <Badge className="mr-2">{historyCount}</Badge>
              </TabsTrigger>
              {/* --- END OF CHANGE --- */}
            </TabsList>

          </div>
          
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
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
          ) : (
            <>
              <TabsContent value="pending">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingSuggestions.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} onAction={handleSuggestionAction} />
                  ))}
                </div>
                {pendingSuggestions.length === 0 && <div className="text-center p-10 text-gray-500">אין הצעות ממתינות לאישור.</div>}
              </TabsContent>
              <TabsContent value="active">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSuggestions.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} onAction={handleSuggestionAction} />
                  ))}
                </div>
                {activeSuggestions.length === 0 && <div className="text-center p-10 text-gray-500">אין הצעות פעילות.</div>}
              </TabsContent>
              <TabsContent value="history">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {historySuggestions.map((suggestion) => (
                    <SuggestionCard key={suggestion.id} suggestion={suggestion} onAction={handleSuggestionAction} />
                  ))}
                </div>
                {historySuggestions.length === 0 && <div className="text-center p-10 text-gray-500">אין הצעות בהיסטוריה.</div>}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      <NewSuggestionForm
        isOpen={showNewSuggestion}
        onClose={() => setShowNewSuggestion(false)}
        candidates={allCandidates}
        onSubmit={handleNewSuggestion}
      />
      
      <SuggestionDetailsDialog
        suggestion={selectedSuggestion}
        isOpen={!!selectedSuggestion}
        onClose={() => setSelectedSuggestion(null)}
        onAction={handleDialogAction}
      />
      
      <Dialog open={showMonthlyTrendDialog} onOpenChange={setShowMonthlyTrendDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>מגמה חודשית</DialogTitle></DialogHeader>
          <MonthlyTrendModal suggestions={suggestions} />
        </DialogContent>
      </Dialog>
      
      <EditSuggestionForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        suggestion={selectedSuggestion}
        onSave={handleUpdateSuggestion}
      />
      
      <MessageForm
        isOpen={showMessageForm}
        onClose={() => setShowMessageForm(false)}
        suggestion={selectedSuggestion}
        onSend={handleSendMessage}
      />

      {confirmAction && (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>האם את/ה בטוח/ה?</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction.type === "delete" && "פעולה זו תמחק את ההצעה לצמיתות."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAction}>אישור</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}