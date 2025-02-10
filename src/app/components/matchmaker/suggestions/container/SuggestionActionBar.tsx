import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { Priority } from "@prisma/client";
import type { SuggestionFilters } from "@/types/suggestions";

interface SuggestionActionBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: SuggestionFilters;
  onFiltersChange: (filters: SuggestionFilters) => void;
}

const SuggestionActionBar: React.FC<SuggestionActionBarProps> = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
}) => {
  const activeFilters = Object.keys(filters).length;

  const handleRemoveFilter = (key: keyof SuggestionFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="חיפוש הצעות..."
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
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value={Priority.URGENT}>דחוף</SelectItem>
            <SelectItem value={Priority.HIGH}>גבוהה</SelectItem>
            <SelectItem value={Priority.MEDIUM}>רגילה</SelectItem>
            <SelectItem value={Priority.LOW}>נמוכה</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.dateRange ? "custom" : "all"}
          onValueChange={(value) => {
            const now = new Date();
            let dateRange;

            switch (value) {
              case "today":
                dateRange = {
                  start: new Date(now.setHours(0, 0, 0, 0)),
                  end: new Date(now.setHours(23, 59, 59, 999)),
                };
                break;
              case "week":
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - 7);
                dateRange = { start: weekStart, end: now };
                break;
              case "month":
                const monthStart = new Date(now);
                monthStart.setMonth(now.getMonth() - 1);
                dateRange = { start: monthStart, end: now };
                break;
              default:
                dateRange = undefined;
            }

            onFiltersChange({ ...filters, dateRange });
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="טווח זמן" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            <SelectItem value="today">היום</SelectItem>
            <SelectItem value="week">שבוע אחרון</SelectItem>
            <SelectItem value="month">חודש אחרון</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Filter className="w-4 h-4 ml-2" />
          מסננים מתקדמים
        </Button>
      </div>

      {activeFilters > 0 && (
        <div className="flex items-center gap-2">
          {Object.entries(filters).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="px-3 py-1 bg-white">
              <span>{`${key}: ${JSON.stringify(value)}`}</span>
              <button
                onClick={() =>
                  handleRemoveFilter(key as keyof SuggestionFilters)
                }
                className="ml-2 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFiltersChange({})}
            className="text-gray-500 hover:text-gray-700"
          >
            נקה הכל
          </Button>
        </div>
      )}
    </div>
  );
};

export default SuggestionActionBar;
