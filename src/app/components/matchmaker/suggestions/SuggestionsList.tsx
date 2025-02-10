// src/app/components/matchmaker/suggestions/SuggestionsList.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Search, Filter, Plus, Clock } from "lucide-react";
import NewSuggestionForm from "../forms/NewSuggestionForm";
import { SuggestionCard } from "./SuggestionCard";
import type { Suggestion } from "@/app/types/suggestions";
import type { CustomSession } from "@/types/next-auth";

export function SuggestionsList() {
  const { data: session } = useSession() as { data: CustomSession | null };
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewSuggestionDialog, setShowNewSuggestionDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    timeframe: "all",
  });
  const router = useRouter();

  const handleSuggestionClick = (suggestionId: string) => {
    router.push(`/matchmaker/suggestions/${suggestionId}`);
  };
  useEffect(() => {
    loadSuggestions();
  }, [session, filters]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      let url = "/api/matchmaker/suggestions?";
      if (filters.status !== "all") url += `status=${filters.status}&`;
      if (filters.priority !== "all") url += `priority=${filters.priority}&`;
      if (filters.timeframe !== "all") url += `timeframe=${filters.timeframe}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error loading suggestions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuggestion = async (data: any) => {
    try {
      const response = await fetch("/api/matchmaker/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create suggestion");
      }

      await loadSuggestions();
      setShowNewSuggestionDialog(false);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error creating suggestion"
      );
    }
  };
  const handleShareContacts = async (suggestion: Suggestion) => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestion.id}/share-contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "CONTACT_DETAILS_SHARED",
            note: "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to share contact details");
      }

      await loadSuggestions(); // רענון הרשימה לאחר שליחת הפרטים
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error sharing contact details"
      );
    }
  };
  const handleDeleteSuggestion = async (suggestionId: string) => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete suggestion");
      }

      await loadSuggestions(); // רענון הרשימה לאחר המחיקה
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error deleting suggestion"
      );
    }
  };
  const handleSendSuggestion = async (
    suggestion: Suggestion,
    partyType: "first" | "second"
  ) => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestion.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status:
              partyType === "first"
                ? "PENDING_FIRST_PARTY"
                : "PENDING_SECOND_PARTY",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update suggestion status");
      }

      await loadSuggestions();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error updating suggestion"
      );
    }
  };

  // הפילטור של ההצעות לפי החיפוש
  const filteredSuggestions = suggestions.filter((suggestion) => {
    if (searchQuery) {
      const searchIn =
        `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} ${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`.toLowerCase();
      if (!searchIn.includes(searchQuery.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="container mx-auto py-8 px-4">
      {/* כותרת וכפתורים */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">ניהול הצעות שידוך</h1>
        <Button
          onClick={() => setShowNewSuggestionDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="ml-2 h-4 w-4" />
          הצעה חדשה
        </Button>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {suggestions.filter((s) => s.status === "DRAFT").length}
            </div>
            <div className="text-gray-500">טיוטות</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {
                suggestions.filter(
                  (s) =>
                    s.status === "PENDING_FIRST_PARTY" ||
                    s.status === "PENDING_SECOND_PARTY"
                ).length
              }
            </div>
            <div className="text-gray-500">ממתינות לתשובה</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {
                suggestions.filter(
                  (s) =>
                    s.status === "SECOND_PARTY_APPROVED" ||
                    s.status === "FIRST_PARTY_APPROVED"
                ).length
              }
            </div>
            <div className="text-gray-500">אישורי מועמדים</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {suggestions.filter((s) => s.status === "MATCH_APPROVED").length}
            </div>
            <div className="text-gray-500">הצעות שאושרו</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {
                suggestions.filter(
                  (s) =>
                    s.status === "DATING" ||
                    s.status === "ENGAGED" ||
                    s.status === "MARRIED"
                ).length
              }
            </div>
            <div className="text-gray-500">בתהליך/הצלחות</div>
          </CardContent>
        </Card>
      </div>

      {/* פילטרים */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>סינון הצעות</CardTitle>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="ml-2 h-4 w-4" />
            {showFilters ? "הסתר סינון" : "הצג סינון"}
          </Button>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="DRAFT">טיוטות</SelectItem>
                    <SelectItem value="PENDING_FIRST_PARTY">
                      ממתין לצד ראשון
                    </SelectItem>
                    <SelectItem value="PENDING_SECOND_PARTY">
                      ממתין לצד שני
                    </SelectItem>
                    <SelectItem value="DATING">בתהליך היכרות</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.priority}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="עדיפות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="HIGH">גבוהה</SelectItem>
                    <SelectItem value="MEDIUM">בינונית</SelectItem>
                    <SelectItem value="LOW">נמוכה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.timeframe}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, timeframe: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="טווח זמן" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="today">היום</SelectItem>
                    <SelectItem value="week">שבוע אחרון</SelectItem>
                    <SelectItem value="month">חודש אחרון</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="חיפוש מועמדים..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* רשימת ההצעות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onSend={handleSendSuggestion}
            onDelete={handleDeleteSuggestion}
            onShareContacts={handleShareContacts}
            isMatchmaker={session?.user?.role === "MATCHMAKER"} // החלק החשוב
            onClick={() => handleSuggestionClick(suggestion.id)}
          />
        ))}
      </div>

      {/* הודעה כשאין תוצאות */}
      {filteredSuggestions.length === 0 && !loading && (
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">אין הצעות</h3>
          <p className="mt-1 text-sm text-gray-500">
            לא נמצאו הצעות העונות לקריטריונים שהוגדרו
          </p>
        </div>
      )}

      {/* טופס הצעה חדשה */}
      <NewSuggestionForm
        isOpen={showNewSuggestionDialog}
        onClose={() => setShowNewSuggestionDialog(false)}
        onSubmit={handleCreateSuggestion}
      />

      {/* הודעת שגיאה */}
      {error && (
        <AlertDialog open={!!error} onOpenChange={() => setError("")}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>שגיאה</AlertDialogTitle>
              <AlertDialogDescription>{error}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setError("")}>
                הבנתי
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default SuggestionsList;
