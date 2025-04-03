import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, SortDesc } from "lucide-react";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";
import SuggestionCard from "../cards/SuggestionCard";
import { LoadingContainer } from "../../new/shared/LoadingStates";
import type {
  Suggestion,
  ActionAdditionalData,
  SuggestionStatusHistory,
} from "@/types/suggestions";

interface PartyInfo {
  id: string;
  firstName: string;
  lastName: string;
  profile: UserProfile;
  images: UserImage[];
}

interface ExtendedMatchSuggestion extends MatchSuggestion {
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: SuggestionStatusHistory[]; // הוספת השדה החסר
}

interface SuggestionsListProps {
  suggestions: ExtendedMatchSuggestion[];
  isLoading?: boolean;
  onAction: (
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
  ) => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: "latest", label: "החדשים ביותר" },
  { value: "oldest", label: "הישנים ביותר" },
  { value: "deadline", label: "לפי תאריך יעד" },
  { value: "priority", label: "לפי דחיפות" },
];

const STATUS_OPTIONS = [
  { value: "PENDING_FIRST_PARTY", label: "ממתין לצד א׳" },
  { value: "PENDING_SECOND_PARTY", label: "ממתין לצד ב׳" },
  { value: "FIRST_PARTY_APPROVED", label: "צד א׳ אישר" },
  { value: "SECOND_PARTY_APPROVED", label: "צד ב׳ אישר" },
  { value: "CONTACT_DETAILS_SHARED", label: "פרטי קשר שותפו" },
  { value: "DATING", label: "בתהליך היכרות" },
];

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  isLoading = false,
  onAction,
  className,
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort suggestions
  const filteredSuggestions = useMemo(() => {
    let result = [...suggestions];

    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter((s) => statusFilter.includes(s.status));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.firstParty.firstName.toLowerCase().includes(query) ||
          s.firstParty.lastName.toLowerCase().includes(query) ||
          s.secondParty.firstName.toLowerCase().includes(query) ||
          s.secondParty.lastName.toLowerCase().includes(query) ||
          s.firstParty.profile.city?.toLowerCase().includes(query) ||
          s.secondParty.profile.city?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "latest":
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
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );
        break;
    }

    return result;
  }, [suggestions, searchQuery, sortBy, statusFilter]);

  return (
    <div className={className}>
      {/* Filters Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="חיפוש לפי שם או עיר..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-right"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SortDesc className="w-4 h-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 ml-2" />
            סינון
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-4">
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status.value}
                variant={
                  statusFilter.includes(status.value) ? "default" : "outline"
                }
                onClick={() => {
                  setStatusFilter((prev) =>
                    prev.includes(status.value)
                      ? prev.filter((s) => s !== status.value)
                      : [...prev, status.value]
                  );
                }}
                className="text-sm"
              >
                {status.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Suggestions Grid */}
      {isLoading ? (
        <LoadingContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </LoadingContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion as unknown as Suggestion}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SuggestionsList;
