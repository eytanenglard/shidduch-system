"use client";

import React from "react";
import { X, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CandidatesFilter } from "../types/candidates";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActiveFiltersProps {
  filters: CandidatesFilter;
  onRemoveFilter: (key: keyof CandidatesFilter, value?: string) => void;
  onResetAll: () => void;
  onSuggestFilter?: () => void;
  className?: string;
}

interface ActiveFilter {
  key: keyof CandidatesFilter;
  label: string;
  value?: string;
  color?: string;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemoveFilter,
  onResetAll,
  onSuggestFilter,
  className,
}) => {
  const getActiveFilters = (): ActiveFilter[] => {
    const activeFilters: ActiveFilter[] = [];

    // חיפוש כללי (מופיע רק אם אין סינון נפרד)
    if (!filters.separateFiltering && filters.searchQuery) {
      activeFilters.push({
        key: "searchQuery",
        label: `חיפוש: ${filters.searchQuery}`,
        color: "bg-blue-100 text-blue-800 border-blue-200",
      });
    }

    // חיפוש נפרד לגברים (מופיע רק במצב סינון נפרד)
    if (filters.separateFiltering && filters.maleSearchQuery) {
      activeFilters.push({
        key: "maleSearchQuery",
        label: `חיפוש מועמדים: ${filters.maleSearchQuery}`,
        color: "bg-blue-100 text-blue-800 border-blue-200",
      });
    }

    // חיפוש נפרד לנשים (מופיע רק במצב סינון נפרד)
    if (filters.separateFiltering && filters.femaleSearchQuery) {
      activeFilters.push({
        key: "femaleSearchQuery",
        label: `חיפוש מועמדות: ${filters.femaleSearchQuery}`,
        color: "bg-purple-100 text-purple-800 border-purple-200",
      });
    }

    // מצב סינון נפרד
    if (filters.separateFiltering) {
      activeFilters.push({
        key: "separateFiltering",
        label: `סינון וחיפוש נפרד`,
        color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      });
    }

    // Gender
    if (filters.gender) {
      activeFilters.push({
        key: "gender",
        label: `מגדר: ${filters.gender === "MALE" ? "גברים" : "נשים"}`,
        color:
          filters.gender === "MALE"
            ? "bg-blue-100 text-blue-800 border-blue-200"
            : "bg-purple-100 text-purple-800 border-purple-200",
      });
    }

    // Age Range
    if (filters.ageRange) {
      const isDefaultMin = filters.ageRange.min === 18;
      const isDefaultMax = filters.ageRange.max === 99;

      if (!isDefaultMin || !isDefaultMax) {
        let label = `גיל: `;

        if (!isDefaultMin && !isDefaultMax) {
          label += `${filters.ageRange.min}-${filters.ageRange.max}`;
        } else if (!isDefaultMin) {
          label += `מעל ${filters.ageRange.min}`;
        } else if (!isDefaultMax) {
          label += `עד ${filters.ageRange.max}`;
        }

        activeFilters.push({
          key: "ageRange",
          label,
        });
      }
    }

    // Height Range
    if (filters.heightRange) {
      const isDefaultMin = filters.heightRange.min === 140;
      const isDefaultMax = filters.heightRange.max === 210;

      if (!isDefaultMin || !isDefaultMax) {
        let label = `גובה: `;

        if (!isDefaultMin && !isDefaultMax) {
          label += `${filters.heightRange.min}-${filters.heightRange.max} ס"מ`;
        } else if (!isDefaultMin) {
          label += `מעל ${filters.heightRange.min} ס"מ`;
        } else if (!isDefaultMax) {
          label += `עד ${filters.heightRange.max} ס"מ`;
        }

        activeFilters.push({
          key: "heightRange",
          label,
        });
      }
    }

    // Religious Level
    if (filters.religiousLevel) {
      activeFilters.push({
        key: "religiousLevel",
        label: `רמת דתיות: ${filters.religiousLevel}`,
        color: "bg-amber-100 text-amber-800 border-amber-200",
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
        color: "bg-green-100 text-green-800 border-green-200",
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
      const statusLabel =
        filters.availabilityStatus === "AVAILABLE"
          ? "פנוי/ה"
          : filters.availabilityStatus === "DATING"
          ? "בתהליך הכרות"
          : filters.availabilityStatus === "UNAVAILABLE"
          ? "לא פנוי/ה"
          : filters.availabilityStatus;

      activeFilters.push({
        key: "availabilityStatus",
        label: `סטטוס: ${statusLabel}`,
        color:
          filters.availabilityStatus === "AVAILABLE"
            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
            : "bg-amber-100 text-amber-800 border-amber-200",
      });
    }

    // Marital Status
    if (filters.maritalStatus) {
      activeFilters.push({
        key: "maritalStatus",
        label: `מצב משפחתי: ${filters.maritalStatus}`,
      });
    }

    // Verified Filter
    if (filters.isVerified !== undefined) {
      activeFilters.push({
        key: "isVerified",
        label: `מאומתים בלבד`,
        color: "bg-blue-100 text-blue-800 border-blue-200",
      });
    }

    // References Filter
    if (filters.hasReferences !== undefined) {
      activeFilters.push({
        key: "hasReferences",
        label: `עם המלצות`,
      });
    }

    // Profile Completeness
    if (filters.isProfileComplete !== undefined) {
      activeFilters.push({
        key: "isProfileComplete",
        label: `פרופיל מלא`,
      });
    }

    // Last Activity
    if (filters.lastActiveDays !== undefined) {
      let label: string;

      switch (filters.lastActiveDays) {
        case 1:
          label = "פעילים היום";
          break;
        case 3:
          label = "פעילים ב-3 ימים אחרונים";
          break;
        case 7:
          label = "פעילים בשבוע האחרון";
          break;
        case 30:
          label = "פעילים בחודש האחרון";
          break;
        default:
          label = `פעילים ב-${filters.lastActiveDays} ימים אחרונים`;
      }

      activeFilters.push({
        key: "lastActiveDays",
        label,
        color: "bg-cyan-100 text-cyan-800 border-cyan-200",
      });
    }

    return activeFilters;
  };

  const activeFilters = getActiveFilters();

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`${className || ""}`}>
      <div className="bg-white border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <span>סינון פעיל</span>
            <Badge variant="outline" className="bg-blue-50 text-xs">
              {activeFilters.length}
            </Badge>
          </h3>

          <div className="flex items-center gap-2">
            {onSuggestFilter && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSuggestFilter}
                      className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      הצע פילטרים נוספים
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>הצעת פילטרים נוספים המתאימים לתוצאות הנוכחיות</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onResetAll}
              className="h-7 text-xs text-gray-600 hover:text-gray-700"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              נקה הכל
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {activeFilters.map((filter, index) => (
              <motion.div
                key={`${filter.key}-${filter.value || index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                <Badge
                  variant="secondary"
                  className={`px-2 py-0.5 whitespace-nowrap border ${
                    filter.color || "bg-gray-100 text-gray-800 border-gray-200"
                  }`}
                >
                  <span className="max-w-[200px] truncate">{filter.label}</span>
                  <button
                    className="ml-1.5 hover:bg-gray-200/40 rounded-full p-0.5 transition-colors"
                    onClick={() => onRemoveFilter(filter.key, filter.value)}
                    aria-label={`הסר פילטר ${filter.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ActiveFilters;
