// Full path: src/app/components/suggestions/MatchSuggestionsContainer.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Clock, 
  History, 
  AlertCircle, 
  RefreshCw,
  Bell 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";

import SuggestionsList from "./list/SuggestionsList";

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

interface StatusHistoryItem {
  id: string;
  suggestionId: string;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
}

interface ExtendedMatchSuggestion extends MatchSuggestion {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: StatusHistoryItem[];
}

interface MatchSuggestionsContainerProps {
  userId: string;
  className?: string;
}

const MatchSuggestionsContainer: React.FC<MatchSuggestionsContainerProps> = ({
  userId,
  className,
}) => {
  // States
  const [activeSuggestions, setActiveSuggestions] = useState<
    ExtendedMatchSuggestion[]
  >([]);
  const [historySuggestions, setHistorySuggestions] = useState<
    ExtendedMatchSuggestion[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hasNewSuggestions, setHasNewSuggestions] = useState(false);

  // Calculate counts
  const pendingCount = activeSuggestions.filter(
    s => s.status === "PENDING_FIRST_PARTY" || s.status === "PENDING_SECOND_PARTY"
  ).length;

  // Fetch suggestions function
  const fetchSuggestions = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      // Load both active and history suggestions
      const [activeResponse, historyResponse] = await Promise.all([
        fetch(`/api/suggestions/active`),
        fetch(`/api/suggestions/history`),
      ]);

      if (!activeResponse.ok || !historyResponse.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const activeData = await activeResponse.json();
      const historyData = await historyResponse.json();

      // Check if there are new suggestions compared to previous state
      if (!showLoadingState && activeData.suggestions.length > activeSuggestions.length) {
        setHasNewSuggestions(true);
        toast.success("התקבלו הצעות שידוך חדשות!");
      }

      setActiveSuggestions(activeData.suggestions);
      setHistorySuggestions(historyData.suggestions);
    } catch (error) {
      console.error("Error loading suggestions:", error);
      setError("אירעה שגיאה בטעינת ההצעות");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSuggestions();
    
    // Optional: Set up periodic refresh
    const intervalId = setInterval(() => {
      fetchSuggestions(false);
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [userId]);

  // Clear new suggestions notification when changing to active tab
  useEffect(() => {
    if (activeTab === "active") {
      setHasNewSuggestions(false);
    }
  }, [activeTab]);

  // Handle suggestion status change
  const handleStatusChange = async (
    suggestionId: string,
    newStatus: string,
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update suggestion status");
      }

      // Refresh suggestions to get the updated state
      await fetchSuggestions(false);
      
      // Show success message
      const statusMessages: Record<string, string> = {
        FIRST_PARTY_APPROVED: "אישרת את ההצעה בהצלחה",
        SECOND_PARTY_APPROVED: "אישרת את ההצעה בהצלחה",
        FIRST_PARTY_DECLINED: "דחית את ההצעה בהצלחה",
        SECOND_PARTY_DECLINED: "דחית את ההצעה בהצלחה",
      };
      
      toast.success(statusMessages[newStatus] || "הסטטוס עודכן בהצלחה");
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      toast.error("אירעה שגיאה בעדכון הסטטוס");
      throw error;
    }
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    await fetchSuggestions(false);
    toast.success("הנתונים עודכנו בהצלחה");
  };

  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          
          <CardTitle className="text-xl">הצעות שידוך</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="relative">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                הצעות פעילות
                {activeSuggestions.length > 0 && (
                  <Badge className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                    {activeSuggestions.length}
                  </Badge>
                )}
                {hasNewSuggestions && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                היסטוריה
                {historySuggestions.length > 0 && (
                  <Badge variant="outline" className="px-2 py-0.5 rounded-full text-xs">
                    {historySuggestions.length}
                  </Badge>
                )}
              </TabsTrigger>
              
              {pendingCount > 0 && (
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  ממתינות
                  <Badge className="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs">
                    {pendingCount}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              >
                {viewMode === "grid" ? "תצוגת רשימה" : "תצוגת קמחיות"}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="active">
            <SuggestionsList
              suggestions={activeSuggestions}
              userId={userId}
              viewMode={viewMode}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              onRefresh={() => fetchSuggestions(false)}
            />
          </TabsContent>

          <TabsContent value="history">
            <SuggestionsList
              suggestions={historySuggestions}
              userId={userId}
              viewMode={viewMode}
              isLoading={isLoading}
              isHistory={true}
              onRefresh={() => fetchSuggestions(false)}
            />
          </TabsContent>
          
          <TabsContent value="pending">
            <SuggestionsList
              suggestions={activeSuggestions.filter(
                s => s.status === "PENDING_FIRST_PARTY" || s.status === "PENDING_SECOND_PARTY"
              )}
              userId={userId}
              viewMode={viewMode}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              onRefresh={() => fetchSuggestions(false)}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MatchSuggestionsContainer;