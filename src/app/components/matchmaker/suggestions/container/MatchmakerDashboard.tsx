"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, BarChart, Loader2, List, LayoutGrid, Filter, Search } from "lucide-react";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import { MatchSuggestionStatus, Priority } from "@prisma/client";
import { cn } from "@/lib/utils";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

// --- A simple media query hook ---
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, [matches, query]);
  return matches;
};

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
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [mobileView, setMobileView] = useState<'list' | 'kanban'>('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  const handleUpdateSuggestion = async (data: { suggestionId: string; updates: SuggestionUpdatePayload; }) => {
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

  const handleSendMessage = async (data: SendMessagePayload) => {
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
    setSelectedSuggestion(data?.suggestion || null);
    if (action === 'view' && data?.suggestion) {
        setSelectedSuggestion(data.suggestion);
    } else if (action === 'delete' && data?.suggestionId) {
      setConfirmAction({ type: 'delete', data: { suggestionId: data.suggestionId } });
      setShowConfirmDialog(true);
    } else if (action === 'edit' && data?.suggestion) {
      setShowEditForm(true);
    } else if (action === 'message' && data?.suggestion) {
      setShowMessageForm(true);
    } else if (action === 'changeStatus' && data?.suggestionId && data.newStatus) {
        handleStatusChange(data.suggestionId, data.newStatus, data.notes);
    }
  };
  
  const handleSuggestionAction = (type: any, suggestion: Suggestion, additionalData?: ActionAdditionalData) => {
    handleDialogAction(type, { ...additionalData, suggestionId: suggestion.id, suggestion });
  };
  
  const kanbanColumns = useMemo(() => {
    const columns: { title: string; suggestions: Suggestion[] }[] = [
      { title: "דורש טיפול", suggestions: [] },
      { title: "ממתין לתגובה", suggestions: [] },
      { title: "פעילות", suggestions: [] },
      { title: "היסטוריה", suggestions: [] },
    ];

    filteredSuggestions.forEach(s => {
      if (['AWAITING_MATCHMAKER_APPROVAL', 'AWAITING_FIRST_DATE_FEEDBACK'].includes(s.status)) {
        columns[0].suggestions.push(s);
      } else if (['PENDING_FIRST_PARTY', 'PENDING_SECOND_PARTY'].includes(s.status)) {
        columns[1].suggestions.push(s);
      } else if (['CLOSED', 'CANCELLED', 'EXPIRED', 'MARRIED', 'ENGAGED'].includes(s.status)) {
        columns[3].suggestions.push(s);
      } else {
        columns[2].suggestions.push(s);
      }
    });

    return columns;
  }, [filteredSuggestions]);

  // =========================================================================
  // ============================ RENDER LOGIC ===============================
  // =========================================================================

  const renderMobileFilters = () => (
    <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          סינון
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>סינון הצעות</SheetTitle>
        </SheetHeader>
        <div className="py-4">
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
        </div>
      </SheetContent>
    </Sheet>
  );

  const renderMobileView = () => (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-right pr-10 bg-gray-100"
          />
        </div>
        <div className="mr-2">{renderMobileFilters()}</div>
        <ToggleGroup
          type="single"
          value={mobileView}
          onValueChange={(value: 'list' | 'kanban') => value && setMobileView(value)}
          className="mr-2"
        >
          <ToggleGroupItem value="list" aria-label="List view"><List className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="kanban" aria-label="Kanban view"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </div>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : mobileView === 'kanban' ? (
        <ScrollArea className="w-full whitespace-nowrap flex-1">
          <div className="flex gap-4 p-4 h-full">
            {kanbanColumns.map((col, idx) => (
              <div key={idx} className="w-64 flex-shrink-0 bg-gray-100 rounded-lg flex flex-col">
                <div className="p-3 font-semibold text-sm border-b sticky top-0 bg-gray-100/80 backdrop-blur-sm z-10">
                  {col.title} <Badge variant="secondary" className="mr-1">{col.suggestions.length}</Badge>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {col.suggestions.length > 0 ? col.suggestions.map(s => <SuggestionCard key={s.id} suggestion={s} onAction={handleSuggestionAction} variant="compact" />)
                    : <div className="p-4 text-center text-xs text-gray-500">אין הצעות</div>}
                  </div>
                </ScrollArea>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {filteredSuggestions.map(s => <SuggestionCard key={s.id} suggestion={s} onAction={handleSuggestionAction} variant="full" />)}
            {filteredSuggestions.length === 0 && <div className="text-center p-10 text-gray-500">לא נמצאו הצעות תואמות.</div>}
          </div>
        </ScrollArea>
      )}
       <div className="p-4 bg-white border-t sticky bottom-0">
         <Button onClick={() => setShowNewSuggestion(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            הצעה חדשה
         </Button>
       </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול הצעות שידוכים</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}><RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />{isRefreshing ? "מעדכן..." : "רענן"}</Button>
          <Button variant="outline" size="sm" onClick={() => setShowMonthlyTrendDialog(true)}><BarChart className="w-4 h-4 mr-2" />מגמה חודשית</Button>
          <Button onClick={() => setShowNewSuggestion(true)}><Plus className="w-4 h-4 mr-2" />הצעה חדשה</Button>
        </div>
      </div>
      <SuggestionsStats suggestions={suggestions} onFilterChange={(filter) => setFilters(prev => ({...prev, ...filter}))} />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList dir="rtl">
            <TabsTrigger value="pending">ממתין לאישור <Badge className="mr-2">{pendingCount}</Badge></TabsTrigger>
            <TabsTrigger value="active">פעילות <Badge className="mr-2">{activeCount}</Badge></TabsTrigger>
            <TabsTrigger value="history">היסטוריה <Badge className="mr-2">{historyCount}</Badge></TabsTrigger>
          </TabsList>
        </div>
        <SuggestionActionBar
          searchQuery={searchQuery} onSearchChange={setSearchQuery} filters={filters} onFiltersChange={setFilters}
          totalCount={suggestions.length}
          activeCount={activeCount}
          pendingCount={pendingCount}
          historyCount={historyCount}
        />
        {isLoading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <TabsContent value="pending">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingSuggestions.map((suggestion) => ( <SuggestionCard key={suggestion.id} suggestion={suggestion} onAction={handleSuggestionAction} /> ))}
              </div>
              {pendingSuggestions.length === 0 && <div className="text-center p-10 text-gray-500">אין הצעות ממתינות לאישור.</div>}
            </TabsContent>
            <TabsContent value="active">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeSuggestions.map((suggestion) => ( <SuggestionCard key={suggestion.id} suggestion={suggestion} onAction={handleSuggestionAction} /> ))}
              </div>
              {activeSuggestions.length === 0 && <div className="text-center p-10 text-gray-500">אין הצעות פעילות.</div>}
            </TabsContent>
            <TabsContent value="history">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historySuggestions.map((suggestion) => ( <SuggestionCard key={suggestion.id} suggestion={suggestion} onAction={handleSuggestionAction} /> ))}
              </div>
              {historySuggestions.length === 0 && <div className="text-center p-10 text-gray-500">אין הצעות בהיסטוריה.</div>}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-gray-50 rtl", !isMobile && "p-6", isMobile && "p-0")}>
      {isMobile ? renderMobileView() : renderDesktopView()}

      {/* Dialogs and Forms (common for both views) */}
      <NewSuggestionForm isOpen={showNewSuggestion} onClose={() => setShowNewSuggestion(false)} candidates={allCandidates} onSubmit={handleNewSuggestion} />
      <SuggestionDetailsDialog suggestion={selectedSuggestion} isOpen={!!selectedSuggestion} onClose={() => setSelectedSuggestion(null)} onAction={handleDialogAction as any} />
      <Dialog open={showMonthlyTrendDialog} onOpenChange={setShowMonthlyTrendDialog}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>מגמה חודשית</DialogTitle></DialogHeader><MonthlyTrendModal suggestions={suggestions} /></DialogContent></Dialog>
      <EditSuggestionForm isOpen={showEditForm} onClose={() => setShowEditForm(false)} suggestion={selectedSuggestion} onSave={handleUpdateSuggestion} />
      <MessageForm isOpen={showMessageForm} onClose={() => setShowMessageForm(false)} suggestion={selectedSuggestion} onSend={handleSendMessage} />
      {confirmAction && <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>האם את/ה בטוח/ה?</AlertDialogTitle><AlertDialogDescription>{confirmAction.type === "delete" && "פעולה זו תמחק את ההצעה לצמיתות."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ביטול</AlertDialogCancel><AlertDialogAction onClick={handleConfirmAction}>אישור</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
    </div>
  );
}