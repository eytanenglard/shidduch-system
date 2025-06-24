// Full path: src/app/components/suggestions/MatchSuggestionsContainer.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, History, AlertCircle, RefreshCw, Bell } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";

import SuggestionsList from "./list/SuggestionsList";
import type { ExtendedMatchSuggestion } from "./types";

// Interfaces remain the same

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
    (s) =>
      s.status === "PENDING_FIRST_PARTY" || s.status === "PENDING_SECOND_PARTY"
  ).length;

  // Fetch suggestions function - wrapped in useCallback
  // Added `activeSuggestions.length` to dependency array because it's used inside
  // for the `hasNewSuggestions` check.
  const fetchSuggestions = useCallback(
    async (showLoadingState = true) => {
      try {
        if (showLoadingState) {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }
        setError(null);

        // Assume API endpoints implicitly use authenticated user context if userId is not passed
        // If userId *was* needed in the URL, it should be a dependency of useCallback
        const [activeResponse, historyResponse] = await Promise.all([
          fetch(`/api/suggestions/active`),
          fetch(`/api/suggestions/history`),
        ]);

        if (!activeResponse.ok || !historyResponse.ok) {
          const activeError = !activeResponse.ok
            ? await activeResponse.text()
            : "";
          const historyError = !historyResponse.ok
            ? await historyResponse.text()
            : "";
          console.error("Fetch errors:", { activeError, historyError });
          throw new Error(
            `Failed to fetch suggestions (${activeResponse.status}/${historyResponse.status})`
          );
        }

        const activeData = await activeResponse.json();
        const historyData = await historyResponse.json();

        // Check if there are new suggestions compared to previous state length
        // Use functional state update for `setHasNewSuggestions` if it depended on previous state
        // but direct comparison with `activeSuggestions.length` is okay here.
        if (
          !showLoadingState &&
          activeData.suggestions.length > activeSuggestions.length
        ) {
          setHasNewSuggestions(true);
          toast.success("התקבלו הצעות שידוך חדשות!");
        }

        setActiveSuggestions(activeData.suggestions);
        setHistorySuggestions(historyData.suggestions);
      } catch (error) {
        console.error("Error loading suggestions:", error);
        setError(
          `אירעה שגיאה בטעינת ההצעות: ${
            error instanceof Error ? error.message : "שגיאה לא ידועה"
          }`
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      // We include `activeSuggestions.length` because it's read inside the function for comparison.
      // While `activeSuggestions` state itself is modified, `useCallback` depends on the value *at the time of definition*.
      // A safer alternative might be to pass the current length as an argument if complex dependencies arise,
      // but for this specific comparison, depending on the length should be acceptable.
      // If the API endpoints depended on `userId`, add `userId` here too.
    },
    [activeSuggestions.length]
  ); // Dependency array for useCallback

  // Initial load and periodic refresh
  useEffect(() => {
    fetchSuggestions(); // Initial fetch

    const intervalId = setInterval(() => {
      fetchSuggestions(false); // Periodic refresh without full loading state
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, [userId, fetchSuggestions]); // Added fetchSuggestions to dependency array

  // Clear new suggestions notification when changing to active tab
  useEffect(() => {
    if (activeTab === "active") {
      setHasNewSuggestions(false);
    }
  }, [activeTab]);

  // Handle suggestion status change - wrapped in useCallback
  const handleStatusChange = useCallback(
    async (suggestionId: string, newStatus: string, notes?: string) => {
      try {
        const response = await fetch(
          `/api/suggestions/${suggestionId}/status`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus, notes }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to update suggestion status"
          );
        }

        // Refresh suggestions to get the updated state
        // Pass false to avoid showing the main loading spinner
        await fetchSuggestions(false);

        const statusMessages: Record<string, string> = {
          FIRST_PARTY_APPROVED: "אישרת את ההצעה בהצלחה",
          SECOND_PARTY_APPROVED: "אישרת את ההצעה בהצלחה",
          FIRST_PARTY_DECLINED: "דחית את ההצעה בהצלחה",
          SECOND_PARTY_DECLINED: "דחית את ההצעה בהצלחה",
        };

        toast.success(statusMessages[newStatus] || "הסטטוס עודכן בהצלחה");
      } catch (error) {
        console.error("Error updating suggestion status:", error);
        toast.error(
          `אירעה שגיאה בעדכון הסטטוס: ${
            error instanceof Error ? error.message : "שגיאה לא ידועה"
          }`
        );
        // Re-throw the error if the calling component needs to handle it (e.g., disable a button)
        // throw error; // Uncomment if needed
      }
    },
    [fetchSuggestions]
  ); // Depends on the memoized fetchSuggestions

  // Handle manual refresh - wrapped in useCallback
  const handleRefresh = useCallback(async () => {
    // Pass false to indicate it's a refresh, not initial load
    await fetchSuggestions(false);
    toast.success("הנתונים עודכנו בהצלחה");
  }, [fetchSuggestions]); // Depends on the memoized fetchSuggestions

  return (
    <Card className={`shadow-md ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          {/* Refresh Button on the left (assuming LTR context despite RTL text for UI layout) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading} // Disable if initial loading or refreshing
            aria-label="רענן הצעות" // Accessibility
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          <CardTitle className="text-xl text-right flex-grow mr-2">
            הצעות שידוך
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          {" "}
          {/* Added dir="rtl" */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            {" "}
            {/* Responsive layout */}
            <TabsList className="relative">
              <TabsTrigger
                value="active"
                className="flex items-center gap-2 px-3"
              >
                {" "}
                {/* Added padding */}
                <Clock className="w-4 h-4 ml-1" /> {/* Icon spacing */}
                <span>פעילות</span> {/* Shortened label */}
                {activeSuggestions.length > 0 && (
                  <Badge className="mr-2 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-normal">
                    {" "}
                    {/* Adjusted badge */}
                    {activeSuggestions.length}
                  </Badge>
                )}
                {/* Keep indicator relative to trigger */}
                {hasNewSuggestions && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="history"
                className="flex items-center gap-2 px-3"
              >
                {" "}
                {/* Added padding */}
                <History className="w-4 h-4 ml-1" /> {/* Icon spacing */}
                <span>היסטוריה</span>
                {historySuggestions.length > 0 && (
                  <Badge
                    variant="outline"
                    className="mr-2 px-1.5 py-0.5 rounded-full text-xs font-normal"
                  >
                    {" "}
                    {/* Adjusted badge */}
                    {historySuggestions.length}
                  </Badge>
                )}
              </TabsTrigger>

              {pendingCount > 0 && (
                <TabsTrigger
                  value="pending"
                  className="flex items-center gap-2 px-3"
                >
                  {" "}
                  {/* Added padding */}
                  <Bell className="w-4 h-4 ml-1" /> {/* Icon spacing */}
                  <span>ממתינות</span>
                  <Badge className="mr-2 px-1.5 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-normal">
                    {" "}
                    {/* Adjusted badge */}
                    {pendingCount}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
            {/* View Mode Toggle on the left */}
            <div className="flex">
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-3" // Adjusted padding
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
              >
                {viewMode === "grid" ? "תצוגת רשימה" : "תצוגת קלפים"}{" "}
                {/* Adjusted text */}
              </Button>
            </div>
          </div>
          {error && (
            <Alert variant="destructive" className="mb-6" dir="rtl">
              {" "}
              {/* Added dir="rtl" */}
              <AlertCircle className="h-4 w-4 ml-2" /> {/* Icon spacing */}
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {/* Pass memoized handlers to child */}
          <TabsContent value="active">
            <SuggestionsList
              suggestions={activeSuggestions}
              userId={userId}
              viewMode={viewMode}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              onRefresh={handleRefresh} // Pass handleRefresh for consistency if needed inside list items
            />
          </TabsContent>
          <TabsContent value="history">
            <SuggestionsList
              suggestions={historySuggestions}
              userId={userId}
              viewMode={viewMode}
              isLoading={isLoading}
              isHistory={true}
              onRefresh={handleRefresh} // Pass handleRefresh for consistency if needed inside list items
              // No status change for history items
            />
          </TabsContent>
          <TabsContent value="pending">
            <SuggestionsList
              suggestions={activeSuggestions.filter(
                (s) =>
                  s.status === "PENDING_FIRST_PARTY" ||
                  s.status === "PENDING_SECOND_PARTY"
              )}
              userId={userId}
              viewMode={viewMode}
              isLoading={isLoading}
              onStatusChange={handleStatusChange}
              onRefresh={handleRefresh} // Pass handleRefresh for consistency if needed inside list items
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MatchSuggestionsContainer;
