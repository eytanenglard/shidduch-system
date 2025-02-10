"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Clock, History, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

interface ExtendedMatchSuggestion extends MatchSuggestion {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
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
  const [, setHistorySuggestions] = useState<ExtendedMatchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [viewMode] = useState<"grid" | "list">("grid");

  // Fetch suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        setIsLoading(true);
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

        setActiveSuggestions(activeData.suggestions);
        setHistorySuggestions(historyData.suggestions);
      } catch (error) {
        console.error("Error loading suggestions:", error);
        setError("אירעה שגיאה בטעינת ההצעות");
      } finally {
        setIsLoading(false);
      }
    };

    loadSuggestions();
  }, [userId]);

  // Handle suggestion status change
  const handleStatusChange = async (
    suggestionId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(`/api/suggestions/${suggestionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update suggestion status");
      }

      // Update local state
      setActiveSuggestions((prev) =>
        prev.filter((suggestion) => suggestion.id !== suggestionId)
      );

      const updatedSuggestion = await response.json();
      setHistorySuggestions((prev) => [updatedSuggestion, ...prev]);
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      throw error;
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              הצעות פעילות
              {activeSuggestions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                  {activeSuggestions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              היסטוריה
            </TabsTrigger>
          </TabsList>
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
          />
        </TabsContent>

        <TabsContent value="history">
          <SuggestionsList
            suggestions={activeSuggestions}
            userId={userId}
            viewMode={viewMode}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MatchSuggestionsContainer;
