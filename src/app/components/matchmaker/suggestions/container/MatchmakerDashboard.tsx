import React, { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Plus, Download } from "lucide-react";
import type { Suggestion } from "@/types/suggestions";
import { MatchSuggestionStatus } from "@prisma/client";
import NewSuggestionForm from "../../new/NewSuggestionForm";
import SuggestionsStats from "./SuggestionsStats";
import SuggestionActionBar from "./SuggestionActionBar";
import ManagerSuggestionsList from "../list/ManagerSuggestionsList";
import { toast } from "sonner";

export default function MatchmakerDashboard() {
  // State management
  const [activeTab, setActiveTab] = useState("active");
  const [showNewSuggestion, setShowNewSuggestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
      const activeCount = data.filter((s: Suggestion) => s.category === 'ACTIVE').length;
      const pendingCount = data.filter((s: Suggestion) => s.category === 'PENDING').length;
      const historyCount = data.filter((s: Suggestion) => s.category === 'HISTORY').length;
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

  // Handle new suggestion creation
  const handleNewSuggestion = async (data: any) => {
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create suggestion");
      }

      setShowNewSuggestion(false);
      toast.success("ההצעה נוצרה בהצלחה");
      
      // Refresh suggestions list
      await fetchSuggestions();
    } catch (error) {
      console.error("Error creating suggestion:", error);
      toast.error("שגיאה ביצירת ההצעה");
    }
  };

  // Handle suggestion deletion
  const handleSuggestionDeleted = useCallback((deletedId: string) => {
    setSuggestions(prevSuggestions => 
      prevSuggestions.filter(suggestion => suggestion.id !== deletedId)
    );
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
    } catch (error) {
      console.error("Error exporting suggestions:", error);
      toast.error("שגיאה בייצוא ההצעות");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">ניהול הצעות שידוכים</h1>
            <Badge variant="outline" className="text-sm">
              {suggestions.length} הצעות
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 ml-2" />
              ייצוא
            </Button>

            <Button onClick={() => setShowNewSuggestion(true)}>
              <Plus className="w-4 h-4 ml-2" />
              הצעה חדשה
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <SuggestionsStats suggestions={suggestions} className="mb-6" />

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="active">הצעות פעילות</TabsTrigger>
              <TabsTrigger value="pending">ממתין לאישור</TabsTrigger>
              <TabsTrigger value="history">היסטוריה</TabsTrigger>
            </TabsList>
          </div>

          {/* Action Bar */}
          <SuggestionActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">טוען...</div>
            </div>
          ) : (
            <>
              {/* Suggestions Lists */}
              <TabsContent value="active">
                <ManagerSuggestionsList
                  suggestions={suggestions}
                  filters={filters}
                  searchQuery={searchQuery}
                  type="active"
                  onSuggestionDeleted={handleSuggestionDeleted}
                />
              </TabsContent>

              <TabsContent value="pending">
                <ManagerSuggestionsList
                  suggestions={suggestions}
                  filters={filters}
                  searchQuery={searchQuery}
                  type="pending"
                  onSuggestionDeleted={handleSuggestionDeleted}
                />
              </TabsContent>

              <TabsContent value="history">
                <ManagerSuggestionsList
                  suggestions={suggestions}
                  filters={filters}
                  searchQuery={searchQuery}
                  type="history"
                  onSuggestionDeleted={handleSuggestionDeleted}
                />
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
    </div>
  );
}