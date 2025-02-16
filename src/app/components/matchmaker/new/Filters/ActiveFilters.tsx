"use client";

import React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CandidatesFilter } from "../types/candidates";

interface ActiveFiltersProps {
  filters: CandidatesFilter;
  onRemoveFilter: (key: keyof CandidatesFilter, value?: string) => void;
  onResetAll: () => void;
}

interface ActiveFilter {
  key: keyof CandidatesFilter;
  label: string;
  value?: string;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemoveFilter,
  onResetAll,
}) => {
  const getActiveFilters = (): ActiveFilter[] => {
    const activeFilters: ActiveFilter[] = [];

    // Age Range
    if (filters.ageRange) {
      activeFilters.push({
        key: "ageRange",
        label: `גיל: ${filters.ageRange.min}-${filters.ageRange.max}`,
      });
    }

    // Height Range
    if (filters.heightRange) {
      activeFilters.push({
        key: "heightRange",
        label: `גובה: ${filters.heightRange.min}-${filters.heightRange.max} ס"מ`,
      });
    }

    // Religious Level
    if (filters.religiousLevel) {
      activeFilters.push({
        key: "religiousLevel",
        label: `רמת דתיות: ${filters.religiousLevel}`,
      });
    }

    // Education Level
    if (filters.educationLevel) {
      activeFilters.push({
        key: "educationLevel",
        label: `השכלה: ${filters.educationLevel}`,
      });
    }

    // Cities
    filters.cities?.forEach((city) => {
      activeFilters.push({
        key: "cities",
        value: city,
        label: `עיר: ${city}`,
      });
    });

    // Occupations
    filters.occupations?.forEach((occupation) => {
      activeFilters.push({
        key: "occupations",
        value: occupation,
        label: `תחום עיסוק: ${occupation}`,
      });
    });

    // Availability Status
    if (filters.availabilityStatus) {
      activeFilters.push({
        key: "availabilityStatus",
        label: `סטטוס: ${
          filters.availabilityStatus === "AVAILABLE"
            ? "פנוי/ה"
            : filters.availabilityStatus === "DATING"
            ? "בתהליך הכרות"
            : "לא פנוי/ה"
        }`,
      });
    }

    // Search Query
    if (filters.searchQuery) {
      activeFilters.push({
        key: "searchQuery",
        label: `חיפוש: ${filters.searchQuery}`,
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-gray-500">סינון פעיל</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetAll}
          className="text-gray-500 hover:text-gray-700"
        >
          נקה הכל
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter, index) => (
          <Badge
            key={`${filter.key}-${index}`}
            variant="secondary"
            className="px-3 py-1 bg-white"
          >
            <span>{filter.label}</span>
            <button
              className="ml-2 hover:text-red-500 focus:outline-none"
              onClick={() => onRemoveFilter(filter.key, filter.value)}
              aria-label={`הסר פילטר ${filter.label}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default ActiveFilters;
