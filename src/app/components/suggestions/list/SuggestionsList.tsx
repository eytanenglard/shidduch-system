// Full path: src/app/components/suggestions/list/SuggestionsList.tsx

"use client";
import React, { useState, useEffect } from "react";
import {
  User,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Grid3X3,
  List as ListIcon,
  Check,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { MatchSuggestion } from "@prisma/client";
import type {
  UserProfile,
  UserImage,
} from "@/types/next-auth";

import MinimalSuggestionCard from "../cards/MinimalSuggestionCard";
import SuggestionDetailsModal from "../modals/SuggestionDetailsModal";
import AskMatchmakerDialog from "../dialogs/AskMatchmakerDialog";
import { cn } from "@/lib/utils";

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

// 1. (FIX) הסרת השדה secondPartyQuestionnaire מהממשק כאן.
//    הוא היה הגורם המרכזי ללולאה האין-סופית. המודאל יטען את המידע הזה בעצמו.
interface ExtendedMatchSuggestion extends MatchSuggestion {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: StatusHistoryItem[];
}

interface SuggestionsListProps {
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  isHistory?: boolean;
  viewMode: "grid" | "list";
  isLoading?: boolean;
  className?: string;
  onStatusChange?: (
    suggestionId: string,
    newStatus: string,
    notes?: string
  ) => Promise<void>;
  onRefresh?: () => void;
}

type SortOption = "newest" | "oldest" | "deadline" | "priority";
type FilterOption =
  | "all"
  | "pending"
  | "accepted"
  | "declined"
  | "contact_shared";

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions: initialSuggestions,
  isHistory = false,
  viewMode: initialViewMode,
  isLoading = false,
  userId,
  className,
  onStatusChange,
  onRefresh,
}) => {
  // State
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<ExtendedMatchSuggestion | null>(null);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "decline" | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [filteredSuggestions, setFilteredSuggestions] =
    useState<ExtendedMatchSuggestion[]>(initialSuggestions);

  // Filter and sort suggestions
  useEffect(() => {
    let result = [...initialSuggestions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((suggestion) => {
        const targetParty =
          suggestion.firstPartyId === userId
            ? suggestion.secondParty
            : suggestion.firstParty;
        return (
          targetParty.firstName.toLowerCase().includes(query) ||
          targetParty.lastName.toLowerCase().includes(query) ||
          targetParty.profile?.city?.toLowerCase().includes(query) ||
          targetParty.profile?.occupation?.toLowerCase().includes(query) ||
          targetParty.profile?.religiousLevel?.toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (filterOption !== "all") {
      switch (filterOption) {
        case "pending":
          result = result.filter(
            (s) =>
              s.status === "PENDING_FIRST_PARTY" ||
              s.status === "PENDING_SECOND_PARTY"
          );
          break;
        case "accepted":
          result = result.filter(
            (s) =>
              s.status === "FIRST_PARTY_APPROVED" ||
              s.status === "SECOND_PARTY_APPROVED"
          );
          break;
        case "declined":
          result = result.filter(
            (s) =>
              s.status === "FIRST_PARTY_DECLINED" ||
              s.status === "SECOND_PARTY_DECLINED"
          );
          break;
        case "contact_shared":
          result = result.filter((s) => s.status === "CONTACT_DETAILS_SHARED");
          break;
      }
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "deadline":
        result.sort((a, b) => {
          if (!a.decisionDeadline) return 1;
          if (!b.decisionDeadline) return -1;
          return (
            new Date(a.decisionDeadline).getTime() -
            new Date(b.decisionDeadline).getTime()
          );
        });
        break;
      case "priority":
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        result.sort(
          (a, b) =>
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
        );
        break;
    }

    setFilteredSuggestions(result);
  }, [initialSuggestions, searchQuery, sortOption, filterOption, userId]);

  // 2. (FIX) הסרת ה-useEffect שגרם ללולאה האין-סופית.
  //    הלוגיקה לטעינת השאלון עברה במלואה ל-SuggestionDetailsModal.
  //    זה הפיתרון המרכזי והחשוב ביותר.

  // Handlers
  const handleOpenDetails = (suggestion: ExtendedMatchSuggestion) => {
    // --- LOGGING POINT 1 ---
    console.log("[SuggestionsList] handleOpenDetails triggered. Setting selected suggestion.");
    console.log("[SuggestionsList] Suggestion data being passed to modal:", JSON.stringify(suggestion, null, 2));
    setSelectedSuggestion(suggestion);
  };

  const handleInquiry = (suggestion: ExtendedMatchSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowAskDialog(true);
  };

  const handleStatusAction = (
    suggestion: ExtendedMatchSuggestion,
    action: "approve" | "decline"
  ) => {
    setSelectedSuggestion(suggestion);
    setActionType(action);
    setShowStatusDialog(true);
  };

  const handleActionConfirm = async () => {
    if (!selectedSuggestion || !actionType || !onStatusChange) return;

    try {
      const isFirstParty = selectedSuggestion.firstPartyId === userId;

      let newStatus = "";
      if (actionType === "approve") {
        newStatus = isFirstParty
          ? "FIRST_PARTY_APPROVED"
          : "SECOND_PARTY_APPROVED";
      } else {
        newStatus = isFirstParty
          ? "FIRST_PARTY_DECLINED"
          : "SECOND_PARTY_DECLINED";
      }

      await onStatusChange(selectedSuggestion.id, newStatus);

      toast.success(
        actionType === "approve" ? "ההצעה אושרה בהצלחה" : "ההצעה נדחתה בהצלחה"
      );

      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      toast.error("אירעה שגיאה בעדכון הסטטוס");
    } finally {
      setShowStatusDialog(false);
      setSelectedSuggestion(null);
      setActionType(null);
    }
  };

  const handleSendQuestion = async (questionText: string) => {
    if (!selectedSuggestion) return;

    try {
      const response = await fetch(
        `/api/suggestions/${selectedSuggestion.id}/inquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: questionText }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send inquiry");
      }

      toast.success("השאלה נשלחה בהצלחה לשדכן");
      setShowAskDialog(false);
    } catch (error) {
      console.error("Error sending question:", error);
      toast.error("אירעה שגיאה בשליחת השאלה");
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-4",
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  // Render empty state
  if (filteredSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <User className="w-12 h-12 mb-4" />
        {searchQuery || filterOption !== "all" ? (
          <div className="text-center">
            <p>לא נמצאו הצעות התואמות את החיפוש</p>
            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => {
                setSearchQuery("");
                setFilterOption("all");
              }}
            >
              נקה סינון
            </Button>
          </div>
        ) : (
          <p>{isHistory ? "אין הצעות בהיסטוריה" : "אין הצעות פעילות"}</p>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Filters and search bar */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="חיפוש לפי שם, עיר, או מקצוע..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-right"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>סינון הצעות</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFilterOption("all")}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filterOption === "all" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  הכל
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterOption("pending")}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filterOption === "pending" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  ממתינות לתשובה
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterOption("accepted")}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filterOption === "accepted" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  מאושרות
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterOption("declined")}>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filterOption === "declined" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  שנדחו
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilterOption("contact_shared")}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      filterOption === "contact_shared"
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  פרטי קשר שותפו
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Select
            value={sortOption}
            onValueChange={(value) => setSortOption(value as SortOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="מיון לפי" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  החדש ביותר
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  הישן ביותר
                </div>
              </SelectItem>
              <SelectItem value="deadline">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  תאריך יעד
                </div>
              </SelectItem>
              <SelectItem value="priority">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  עדיפות
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1 border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-none",
                viewMode === "grid" ? "" : "hover:bg-muted"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className={cn(
                "rounded-none",
                viewMode === "list" ? "" : "hover:bg-muted"
              )}
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters display */}
        {(searchQuery || filterOption !== "all") && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">סינון פעיל:</span>
            {searchQuery && (
              <Badge variant="outline" className="flex items-center gap-1">
                חיפוש: {searchQuery}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => setSearchQuery("")}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filterOption !== "all" && (
              <Badge variant="outline" className="flex items-center gap-1">
                {filterOption === "pending" && "ממתינות לתשובה"}
                {filterOption === "accepted" && "מאושרות"}
                {filterOption === "declined" && "שנדחו"}
                {filterOption === "contact_shared" && "פרטי קשר שותפו"}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => setFilterOption("all")}
                >
                  <XCircle className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSearchQuery("");
                setFilterOption("all");
              }}
            >
              נקה הכל
            </Button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-gray-500 text-left">
        מציג {filteredSuggestions.length}{" "}
        {filteredSuggestions.length === 1 ? "הצעה" : "הצעות"} מתוך{" "}
        {initialSuggestions.length}
      </div>

      {/* Suggestions grid/list */}
      <div
        className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4",
          className
        )}
      >
        {filteredSuggestions.map((suggestion) => (
          <div key={suggestion.id} className="relative">
            <MinimalSuggestionCard
              suggestion={suggestion}
              userId={userId}
              onClick={() => handleOpenDetails(suggestion)}
              onInquiry={() => handleInquiry(suggestion)}
              onApprove={() => handleStatusAction(suggestion, "approve")}
              onDecline={() => handleStatusAction(suggestion, "decline")}
              isHistory={isHistory}
              className={viewMode === "list" ? "flex" : ""}
            />
          </div>
        ))}
      </div>

      {/* 3. (FIX) הקריאה למודאל נשארת פשוטה. הוא ינהל את טעינת השאלון בעצמו. */}
            {console.log(`[SuggestionsList] Rendering SuggestionDetailsModal. isOpen: ${!!selectedSuggestion && !showAskDialog && !showStatusDialog}`)}

      <SuggestionDetailsModal
        suggestion={selectedSuggestion}
        userId={userId}
        isOpen={!!selectedSuggestion && !showAskDialog && !showStatusDialog}
        onClose={() => setSelectedSuggestion(null)}
        onStatusChange={onStatusChange}
      />

      {/* Ask Matchmaker Dialog */}
      <AskMatchmakerDialog
        isOpen={showAskDialog}
        onClose={() => setShowAskDialog(false)}
        onSubmit={handleSendQuestion}
        matchmakerName={selectedSuggestion?.matchmaker.firstName}
        suggestionId={selectedSuggestion?.id}
      />

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve"
                ? "אישור הצעת השידוך"
                : "דחיית הצעת השידוך"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? "האם אתה בטוח שברצונך לאשר את הצעת השידוך? לאחר האישור, ההצעה תעבור לשלב הבא בתהליך."
                : "האם אתה בטוח שברצונך לדחות את הצעת השידוך? פעולה זו אינה ניתנת לביטול."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleActionConfirm}>
              {actionType === "approve" ? "אישור ההצעה" : "דחיית ההצעה"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SuggestionsList;