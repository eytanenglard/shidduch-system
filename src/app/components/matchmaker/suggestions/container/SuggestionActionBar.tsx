import React, { useState } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Search,
  Filter,
  X,
  Calendar,
  User,
  Clock,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Priority, MatchSuggestionStatus } from "@prisma/client";
import type { SuggestionFilters, SortByOption } from "@/types/suggestions";

interface SuggestionActionBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: SuggestionFilters;
  onFiltersChange: (filters: SuggestionFilters) => void;
  totalCount: number;
  activeCount: number;
  pendingCount: number;
  historyCount: number;
}

const SuggestionActionBar: React.FC<SuggestionActionBarProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  totalCount,
  activeCount,
  pendingCount,
  historyCount,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const activeFilters = Object.keys(filters).length;
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: filters.dateRange?.start,
    to: filters.dateRange?.end,
  });

  const handleRemoveFilter = (key: keyof SuggestionFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setDateRange(range);
    if (range.from) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: range.from,
          end: range.to || new Date(),
        },
      });
    } else {
      const newFilters = { ...filters };
      delete newFilters.dateRange;
      onFiltersChange(newFilters);
    }
  };

  const handleStatusChange = (status: MatchSuggestionStatus | undefined) => {
    if (status) {
      onFiltersChange({
        ...filters,
        status: [status],
      });
    } else {
      const newFilters = { ...filters };
      delete newFilters.status;
      onFiltersChange(newFilters);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING_FIRST_PARTY":
      case "PENDING_SECOND_PARTY":
        return <Clock className="h-4 w-4 ml-1" />;
      case "FIRST_PARTY_APPROVED":
      case "SECOND_PARTY_APPROVED":
        return <CheckCircle className="h-4 w-4 ml-1" />;
      case "FIRST_PARTY_DECLINED":
      case "SECOND_PARTY_DECLINED":
        return <XCircle className="h-4 w-4 ml-1" />;
      default:
        return <AlertCircle className="h-4 w-4 ml-1" />;
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Main filters and search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חיפוש הצעות לפי שם, עיר או כל מידע אחר..."
            className="pl-10 text-right pr-10"
          />
        </div>

        <Select
          value={filters.priority?.[0] || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              priority: value === "all" ? undefined : [value as Priority],
            })
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="עדיפות" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל העדיפויות</SelectItem>
            <SelectItem value={Priority.URGENT}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                דחוף
              </div>
            </SelectItem>
            <SelectItem value={Priority.HIGH}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                גבוהה
              </div>
            </SelectItem>
            <SelectItem value={Priority.MEDIUM}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                רגילה
              </div>
            </SelectItem>
            <SelectItem value={Priority.LOW}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                נמוכה
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <Calendar className="h-4 w-4 ml-2" />
              <span>טווח זמן</span>
              <ChevronDown className="h-4 w-4 mr-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-2">
              <h4 className="font-medium">בחר טווח תאריכים</h4>
              <DatePicker
                onChange={handleDateRangeChange}
                value={dateRange}
                isRange={true}
              />
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleDateRangeChange({ from: undefined, to: undefined })
                  }
                >
                  נקה
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant={showAdvancedFilters ? "default" : "outline"}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        >
          <Filter className="w-4 h-4 ml-2" />
          מסננים מתקדמים
        </Button>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between bg-slate-50 rounded-md p-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <Badge variant="outline" className="rounded-full px-2 py-0 mr-2">
              {totalCount}
            </Badge>
            <span className="text-sm font-medium">סה״כ הצעות</span>
          </div>
          <div className="flex items-center">
            <Badge variant="default" className="rounded-full px-2 py-0 mr-2">
              {activeCount}
            </Badge>
            <span className="text-sm font-medium">פעילות</span>
          </div>
          <div className="flex items-center">
            <Badge variant="warning" className="rounded-full px-2 py-0 mr-2">
              {pendingCount}
            </Badge>
            <span className="text-sm font-medium">ממתינות</span>
          </div>
          <div className="flex items-center">
            <Badge variant="secondary" className="rounded-full px-2 py-0 mr-2">
              {historyCount}
            </Badge>
            <span className="text-sm font-medium">היסטוריה</span>
          </div>
        </div>

        {activeFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({})}
            className="text-gray-500 hover:text-gray-700"
          >
            נקה את כל המסננים ({activeFilters})
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-slate-50 p-4 rounded-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">מסננים מתקדמים</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setShowAdvancedFilters(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <h4 className="text-sm font-medium mb-2">סטטוס</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Checkbox
                    id="status-pending-first"
                    checked={filters.status?.includes("PENDING_FIRST_PARTY")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newStatus = [
                          ...(filters.status || []),
                          "PENDING_FIRST_PARTY",
                        ];
                        onFiltersChange({
                          ...filters,
                          status: newStatus as MatchSuggestionStatus[],
                        });
                      } else {
                        onFiltersChange({
                          ...filters,
                          status: filters.status?.filter(
                            (s) => s !== "PENDING_FIRST_PARTY"
                          ) as MatchSuggestionStatus[],
                        });
                      }
                    }}
                  />
                  <label
                    htmlFor="status-pending-first"
                    className="text-sm mr-2 flex items-center"
                  >
                    <Clock className="h-3 w-3 ml-1 text-yellow-600" />
                    ממתין לתשובת צד א׳
                  </label>
                </div>

                <div className="flex items-center">
                  <Checkbox
                    id="status-pending-second"
                    checked={filters.status?.includes("PENDING_SECOND_PARTY")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newStatus = [
                          ...(filters.status || []),
                          "PENDING_SECOND_PARTY",
                        ];
                        onFiltersChange({
                          ...filters,
                          status: newStatus as MatchSuggestionStatus[],
                        });
                      } else {
                        onFiltersChange({
                          ...filters,
                          status: filters.status?.filter(
                            (s) => s !== "PENDING_SECOND_PARTY"
                          ) as MatchSuggestionStatus[],
                        });
                      }
                    }}
                  />
                  <label
                    htmlFor="status-pending-second"
                    className="text-sm mr-2 flex items-center"
                  >
                    <Clock className="h-3 w-3 ml-1 text-blue-600" />
                    ממתין לתשובת צד ב׳
                  </label>
                </div>

                <div className="flex items-center">
                  <Checkbox
                    id="status-approved"
                    checked={
                      filters.status?.includes("FIRST_PARTY_APPROVED") ||
                      filters.status?.includes("SECOND_PARTY_APPROVED")
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newStatus = [
                          ...(filters.status || []),
                          "FIRST_PARTY_APPROVED",
                          "SECOND_PARTY_APPROVED",
                        ];
                        onFiltersChange({
                          ...filters,
                          status: newStatus as MatchSuggestionStatus[],
                        });
                      } else {
                        onFiltersChange({
                          ...filters,
                          status: filters.status?.filter(
                            (s) =>
                              s !== "FIRST_PARTY_APPROVED" &&
                              s !== "SECOND_PARTY_APPROVED"
                          ) as MatchSuggestionStatus[],
                        });
                      }
                    }}
                  />
                  <label
                    htmlFor="status-approved"
                    className="text-sm mr-2 flex items-center"
                  >
                    <CheckCircle className="h-3 w-3 ml-1 text-green-600" />
                    אושר ע״י אחד הצדדים
                  </label>
                </div>

                <div className="flex items-center">
                  <Checkbox
                    id="status-dating"
                    checked={filters.status?.includes("DATING")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const newStatus = [...(filters.status || []), "DATING"];
                        onFiltersChange({
                          ...filters,
                          status: newStatus as MatchSuggestionStatus[],
                        });
                      } else {
                        onFiltersChange({
                          ...filters,
                          status: filters.status?.filter(
                            (s) => s !== "DATING"
                          ) as MatchSuggestionStatus[],
                        });
                      }
                    }}
                  />
                  <label
                    htmlFor="status-dating"
                    className="text-sm mr-2 flex items-center"
                  >
                    <Calendar className="h-3 w-3 ml-1 text-pink-600" />
                    בתהליך היכרות
                  </label>
                </div>
              </div>
            </div>

            {/* User Filter */}
            <div>
              <h4 className="text-sm font-medium mb-2">משתתפים</h4>
              <Select
                value={filters.userId || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    userId: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <User className="h-4 w-4 ml-1" />
                  <SelectValue placeholder="בחר משתתף" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל המשתתפים</SelectItem>
                  {/* Replace with dynamic user data */}
                  <SelectItem value="user1">ישראל ישראלי</SelectItem>
                  <SelectItem value="user2">שרה כהן</SelectItem>
                  <SelectItem value="user3">דוד לוי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div>
              <h4 className="text-sm font-medium mb-2">מיון לפי</h4>
              <Select
                value={filters.sortBy || "lastActivity"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    sortBy: value as SortByOption, // Cast to SortByOption
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="מיון לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastActivity">פעילות אחרונה</SelectItem>
                  <SelectItem value="createdAt">תאריך יצירה</SelectItem>
                  <SelectItem value="priority">עדיפות</SelectItem>
                  <SelectItem value="decisionDeadline">תאריך יעד</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {activeFilters > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.priority && (
            <Badge variant="secondary" className="px-3 py-1 bg-white">
              <span>
                עדיפות:{" "}
                {filters.priority[0] === "URGENT"
                  ? "דחוף"
                  : filters.priority[0] === "HIGH"
                  ? "גבוהה"
                  : filters.priority[0] === "MEDIUM"
                  ? "רגילה"
                  : "נמוכה"}
              </span>
              <button
                onClick={() => handleRemoveFilter("priority")}
                className="ml-2 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.dateRange && (
            <Badge variant="secondary" className="px-3 py-1 bg-white">
              <span>
                תאריך:{" "}
                {new Date(filters.dateRange.start).toLocaleDateString("he-IL")}
                {filters.dateRange.end &&
                  ` - ${new Date(filters.dateRange.end).toLocaleDateString(
                    "he-IL"
                  )}`}
              </span>
              <button
                onClick={() => handleRemoveFilter("dateRange")}
                className="ml-2 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.status && filters.status.length > 0 && (
            <Badge variant="secondary" className="px-3 py-1 bg-white">
              <span>
                סטטוס:{" "}
                {filters.status.length === 1
                  ? ""
                  : `(${filters.status.length})`}
                {filters.status.length === 1 && (
                  <span className="flex items-center">
                    {getStatusIcon(filters.status[0])}
                    {filters.status[0] === "PENDING_FIRST_PARTY"
                      ? "ממתין לצד א׳"
                      : filters.status[0] === "PENDING_SECOND_PARTY"
                      ? "ממתין לצד ב׳"
                      : filters.status[0]}
                  </span>
                )}
              </span>
              <button
                onClick={() => handleRemoveFilter("status")}
                className="ml-2 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.userId && (
            <Badge variant="secondary" className="px-3 py-1 bg-white">
              <span>משתתף מסוים</span>
              <button
                onClick={() => handleRemoveFilter("userId")}
                className="ml-2 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SuggestionActionBar;
