// /components/matchmaker/Filters/SavedFilters.tsx
"use client";
import React from "react";
import { Save, Star, MoreVertical, Edit, Trash, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CandidatesFilter } from "../types/candidates";

interface SavedFilter {
  id: string;
  name: string;
  filter: CandidatesFilter;
  isDefault?: boolean;
  createdAt: Date;
}

interface SavedFiltersProps {
  filters: SavedFilter[];
  activeFilterId?: string;
  onSelect: (filter: SavedFilter) => void;
  onDelete: (filterId: string) => void;
  onEdit: (filter: SavedFilter) => void;
  onSetDefault: (filterId: string) => void;
  className?: string;
}

const SavedFilters: React.FC<SavedFiltersProps> = ({
  filters,
  activeFilterId,
  onSelect,
  onDelete,
  onEdit,
  onSetDefault,
  className,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">פילטרים שמורים</h3>
        <Badge variant="secondary" className="text-xs">
          {filters.length}
        </Badge>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className={`
                flex items-center justify-between p-2 rounded-lg
                ${
                  activeFilterId === filter.id
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-white hover:bg-gray-50"
                }
                transition-colors cursor-pointer
              `}
              onClick={() => onSelect(filter)}
            >
              <div className="flex items-center gap-2">
                {filter.isDefault && (
                  <Star className="w-4 h-4 text-yellow-400" />
                )}
                <div>
                  <p className="font-medium text-sm">{filter.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFilterSummary(filter.filter)}
                  </p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(filter)}>
                    <Edit className="ml-2 h-4 w-4" />
                    עריכה
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onSetDefault(filter.id)}
                    disabled={filter.isDefault}
                  >
                    <Star className="ml-2 h-4 w-4" />
                    הגדר כברירת מחדל
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(filter.id)}>
                    <Trash className="ml-2 h-4 w-4" />
                    מחיקה
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// פונקציית עזר להצגת סיכום הפילטר
const formatFilterSummary = (filter: CandidatesFilter): string => {
  const parts: string[] = [];

  if (filter.ageRange) {
    parts.push(`גיל: ${filter.ageRange.min}-${filter.ageRange.max}`);
  }

  if (filter.cities?.length) {
    parts.push(`ערים: ${filter.cities.length}`);
  }

  if (filter.religiousLevel) {
    parts.push(`רמה דתית: ${filter.religiousLevel}`);
  }

  if (filter.occupations?.length) {
    parts.push(`תחומי עיסוק: ${filter.occupations.length}`);
  }

  return parts.join(" | ") || "פילטר ריק";
};

export default SavedFilters;
