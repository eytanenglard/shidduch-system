// /Filters/FilterPanel.tsx
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  User,
  GraduationCap,
  MapPin,
  Scroll,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Ruler,
  Heart,
  Briefcase,
  Star,
  RefreshCw,
  Bookmark,
  Check,
  Filter as FilterIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { CandidatesFilter } from "../types/candidates";
import SavedFilters from "./SavedFilters";
import {
  AGE_RANGE,
  HEIGHT_RANGE,
  RELIGIOUS_LEVELS,
  EDUCATION_LEVELS,
  OCCUPATION_CATEGORIES,
  POPULAR_CITIES,
  AVAILABILITY_STATUS_OPTIONS,
  MARITAL_STATUS,
} from "../constants/filterOptions";

interface PopularFilterOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  filter: Partial<CandidatesFilter>;
}

interface FilterPanelProps {
  filters: CandidatesFilter;
  onFiltersChange: (filters: CandidatesFilter) => void;
  onSavePreset?: (name: string) => void;
  onReset: () => void;
  onApplySavedFilter?: (id: string) => void;
  savedFilters?: Array<{
    id: string;
    name: string;
    isDefault?: boolean;
  }>;
  popularFilters?: string[];
  className?: string;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
}

const POPULAR_FILTERS: PopularFilterOption[] = [
  {
    id: "active-recently",
    label: "פעילים לאחרונה",
    icon: <Clock className="w-4 h-4 text-blue-600" />,
    filter: {
      lastActiveDays: 7,
    },
  },
  {
    id: "verified-only",
    label: "מאומתים בלבד",
    icon: <Check className="w-4 h-4 text-blue-600" />,
    filter: {
      isVerified: true,
    },
  },
  {
    id: "has-recommendations",
    label: "עם המלצות",
    icon: <Star className="w-4 h-4 text-blue-600" />,
    filter: {
      hasReferences: true,
    },
  },
  {
    id: "available-only",
    label: "פנויים בלבד",
    icon: <Heart className="w-4 h-4 text-blue-600" />,
    filter: {
      availabilityStatus: "AVAILABLE",
    },
  },
  {
    id: "complete-profiles",
    label: "פרופילים מלאים",
    icon: <User className="w-4 h-4 text-blue-600" />,
    filter: {
      isProfileComplete: true,
    },
  },
];

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-lg mb-3 overflow-hidden bg-white"
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-50/30 transition-colors">
          <div className="flex items-center gap-2">
            <div className="bg-blue-50 p-2 rounded-md text-blue-600">
              {icon}
            </div>
            <span className="font-medium">{title}</span>
            {badge !== undefined && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 text-xs mr-2"
              >
                {badge}
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp size={16} className="text-gray-500" />
          ) : (
            <ChevronDown size={16} className="text-gray-500" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 pt-1 border-t">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onSavePreset,
  onReset,
  onApplySavedFilter,
  savedFilters = [],
  popularFilters = [],
  className,
}) => {
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [activeTab, setActiveTab] = useState<string>("basic");

  const handleSavePreset = () => {
    if (presetName && onSavePreset) {
      onSavePreset(presetName);
      setPresetName("");
      setShowSavePreset(false);
    }
  };

  const handleAgeRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      ageRange: { min: value[0], max: value[1] },
    });
  };

  const handleHeightRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      heightRange: { min: value[0], max: value[1] },
    });
  };

  const handleApplyPopularFilter = (filter: Partial<CandidatesFilter>) => {
    onFiltersChange({
      ...filters,
      ...filter,
    });
  };

  const countActiveFilters = (category: string): number => {
    let count = 0;

    switch (category) {
      case "basic":
        // Count basic filters
        if (filters.gender) count++;
        if (
          filters.ageRange &&
          (filters.ageRange.min !== AGE_RANGE.default.min ||
            filters.ageRange.max !== AGE_RANGE.default.max)
        )
          count++;
        if (filters.cities?.length) count++;
        if (filters.religiousLevel) count++;
        break;
      case "advanced":
        // Count advanced filters
        if (
          filters.heightRange &&
          (filters.heightRange.min !== HEIGHT_RANGE.default.min ||
            filters.heightRange.max !== HEIGHT_RANGE.default.max)
        )
          count++;
        if (filters.occupations?.length) count++;
        if (filters.educationLevel) count++;
        if (filters.maritalStatus) count++;
        break;
      case "status":
        // Count status filters
        if (filters.availabilityStatus) count++;
        if (filters.isVerified !== undefined) count++;
        if (filters.hasReferences !== undefined) count++;
        if (filters.lastActiveDays !== undefined) count++;
        if (filters.isProfileComplete !== undefined) count++;
        break;
      case "saved":
        // Count of saved filters is just the length
        return savedFilters.length;
    }

    return count;
  };

  return (
    <Card
      className={`space-y-4 p-4 border bg-white/80 backdrop-blur ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-lg">סינון מועמדים</h3>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>איפוס כל הפילטרים</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavePreset(!showSavePreset)}
                  className="h-8 w-8 p-0"
                >
                  <Bookmark className="w-4 h-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>שמירת הפילטר הנוכחי</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Popular Filters */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {POPULAR_FILTERS.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              size="sm"
              onClick={() => handleApplyPopularFilter(option.filter)}
              className="bg-white flex items-center gap-1.5 transition-all hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
            >
              {option.icon}
              <span>{option.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Save Preset Form */}
      {showSavePreset && (
        <div className="p-4 border rounded-lg bg-blue-50/50 mb-4">
          <Label>שם לשמירת הפילטר</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="פילטר מותאם אישית"
              className="h-9"
            />
            <Button size="sm" onClick={handleSavePreset}>
              <Save className="w-4 h-4 ml-1.5" />
              שמור
            </Button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full bg-muted/30 p-1 rounded-xl shadow-sm">
          <TabsTrigger
            value="basic"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            <div className="flex flex-col items-center relative">
              בסיסי
              {countActiveFilters("basic") > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-white">
                  {countActiveFilters("basic")}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            <div className="flex flex-col items-center relative">
              מתקדם
              {countActiveFilters("advanced") > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-white">
                  {countActiveFilters("advanced")}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="status"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            <div className="flex flex-col items-center relative">
              סטטוס
              {countActiveFilters("status") > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-white">
                  {countActiveFilters("status")}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger
            value="saved"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/90 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            <div className="flex flex-col items-center relative">
              שמורים
              {countActiveFilters("saved") > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-blue-600 text-white">
                  {countActiveFilters("saved")}
                </Badge>
              )}
            </div>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {/* Basic Filters Tab */}
          <TabsContent value="basic" className="space-y-4">
            {/* Gender Filter */}
            <FilterSection
              title="מגדר"
              icon={<User className="w-4 h-4" />}
              defaultOpen={true}
            >
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  type="button"
                  variant={filters.gender === "MALE" ? "default" : "outline"}
                  onClick={() =>
                    onFiltersChange({ ...filters, gender: "MALE" })
                  }
                  className={
                    filters.gender === "MALE" ? "bg-blue-600" : "bg-white"
                  }
                >
                  גברים
                </Button>
                <Button
                  type="button"
                  variant={filters.gender === "FEMALE" ? "default" : "outline"}
                  onClick={() =>
                    onFiltersChange({ ...filters, gender: "FEMALE" })
                  }
                  className={
                    filters.gender === "FEMALE" ? "bg-purple-600" : "bg-white"
                  }
                >
                  נשים
                </Button>
              </div>
              {filters.gender && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onFiltersChange({ ...filters, gender: undefined })
                  }
                  className="w-full mt-2 text-sm text-gray-500"
                >
                  הסר בחירה
                </Button>
              )}
            </FilterSection>

            {/* Age Range */}
            <FilterSection
              title="גיל"
              icon={<Calendar className="w-4 h-4" />}
              defaultOpen={true}
              badge={
                filters.ageRange &&
                (filters.ageRange.min !== AGE_RANGE.default.min ||
                  filters.ageRange.max !== AGE_RANGE.default.max)
                  ? 1
                  : undefined
              }
            >
              <div className="space-y-4 pt-2">
                <Slider
                  defaultValue={[AGE_RANGE.default.min, AGE_RANGE.default.max]}
                  min={AGE_RANGE.min}
                  max={AGE_RANGE.max}
                  step={1}
                  value={[
                    filters.ageRange?.min || AGE_RANGE.default.min,
                    filters.ageRange?.max || AGE_RANGE.default.max,
                  ]}
                  onValueChange={handleAgeRangeChange}
                  className="mt-6"
                />
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-white px-3 py-1 font-bold"
                    >
                      {filters.ageRange?.min || AGE_RANGE.default.min}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">מינימום</p>
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-white px-3 py-1 font-bold"
                    >
                      {filters.ageRange?.max || AGE_RANGE.default.max}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">מקסימום</p>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Cities Filter */}
            <FilterSection
              title="ערים"
              icon={<MapPin className="w-4 h-4" />}
              badge={filters.cities?.length}
            >
              <ScrollArea className="h-48 mt-2 rounded-md border overflow-hidden bg-white pr-4">
                <div className="p-2">
                  {POPULAR_CITIES.map((city) => (
                    <div
                      key={city}
                      className="flex items-center justify-between py-1.5 hover:bg-gray-50 px-2 rounded-md"
                    >
                      <span className="text-sm">{city}</span>
                      <Switch
                        checked={filters.cities?.includes(city) || false}
                        onCheckedChange={(checked) => {
                          const newCities = checked
                            ? [...(filters.cities || []), city]
                            : filters.cities?.filter((c) => c !== city);
                          onFiltersChange({ ...filters, cities: newCities });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
              {filters.cities?.length ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange({ ...filters, cities: [] })}
                  className="w-full mt-2 text-sm text-gray-500"
                >
                  הסר בחירה
                </Button>
              ) : null}
            </FilterSection>

            {/* Religious Level */}
            <FilterSection
              title="רמת דתיות"
              icon={<Scroll className="w-4 h-4" />}
              badge={filters.religiousLevel ? 1 : undefined}
            >
              <div className="pt-2">
                <Select
                  value={filters.religiousLevel || ""}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      religiousLevel: value || undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="בחר רמת דתיות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">הכל</SelectItem>
                    {RELIGIOUS_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterSection>
          </TabsContent>

          {/* Advanced Filters Tab */}
          <TabsContent value="advanced" className="space-y-4">
            {/* Height Range */}
            <FilterSection
              title="גובה (ס״מ)"
              icon={<Ruler className="w-4 h-4" />}
              badge={
                filters.heightRange &&
                (filters.heightRange.min !== HEIGHT_RANGE.default.min ||
                  filters.heightRange.max !== HEIGHT_RANGE.default.max)
                  ? 1
                  : undefined
              }
            >
              <div className="space-y-4 pt-2">
                <Slider
                  defaultValue={[
                    HEIGHT_RANGE.default.min,
                    HEIGHT_RANGE.default.max,
                  ]}
                  min={HEIGHT_RANGE.min}
                  max={HEIGHT_RANGE.max}
                  step={1}
                  value={[
                    filters.heightRange?.min || HEIGHT_RANGE.default.min,
                    filters.heightRange?.max || HEIGHT_RANGE.default.max,
                  ]}
                  onValueChange={handleHeightRangeChange}
                  className="mt-6"
                />
                <div className="flex justify-between items-center">
                  <div className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-white px-3 py-1 font-bold"
                    >
                      {filters.heightRange?.min || HEIGHT_RANGE.default.min}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">מינימום</p>
                  </div>
                  <span className="text-gray-400">-</span>
                  <div className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-white px-3 py-1 font-bold"
                    >
                      {filters.heightRange?.max || HEIGHT_RANGE.default.max}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">מקסימום</p>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Occupation */}
            <FilterSection
              title="תחום עיסוק"
              icon={<Briefcase className="w-4 h-4" />}
              badge={filters.occupations?.length}
            >
              <ScrollArea className="h-48 rounded-md mt-2 border p-2 bg-white pr-4">
                {OCCUPATION_CATEGORIES.map((occupation) => (
                  <div
                    key={occupation.value}
                    className="flex items-center justify-between py-1.5 hover:bg-gray-50 px-2 rounded-md"
                  >
                    <span className="text-sm">{occupation.label}</span>
                    <Switch
                      checked={
                        filters.occupations?.includes(occupation.value) || false
                      }
                      onCheckedChange={(checked) => {
                        const newOccupations = checked
                          ? [...(filters.occupations || []), occupation.value]
                          : filters.occupations?.filter(
                              (o) => o !== occupation.value
                            );
                        onFiltersChange({
                          ...filters,
                          occupations: newOccupations,
                        });
                      }}
                    />
                  </div>
                ))}
              </ScrollArea>
              {filters.occupations?.length ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onFiltersChange({ ...filters, occupations: [] })
                  }
                  className="w-full mt-2 text-sm text-gray-500"
                >
                  הסר בחירה
                </Button>
              ) : null}
            </FilterSection>

            {/* Education Level */}
            <FilterSection
              title="השכלה"
              icon={<GraduationCap className="w-4 h-4" />}
              badge={filters.educationLevel ? 1 : undefined}
            >
              <div className="pt-2">
                <Select
                  value={filters.educationLevel || ""}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      educationLevel: value || undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="רמת השכלה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">הכל</SelectItem>
                    {EDUCATION_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterSection>

            {/* Marital Status */}
            <FilterSection
              title="מצב משפחתי"
              icon={<Heart className="w-4 h-4" />}
              badge={filters.maritalStatus ? 1 : undefined}
            >
              <div className="pt-2">
                <Select
                  value={filters.maritalStatus || ""}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      maritalStatus: value || undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="מצב משפחתי" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">הכל</SelectItem>
                    {MARITAL_STATUS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </FilterSection>
          </TabsContent>

          {/* Status & Availability Filters Tab */}
          <TabsContent value="status" className="space-y-4">
            {/* Availability Status */}
            <FilterSection
              title="סטטוס זמינות"
              icon={<Clock className="w-4 h-4" />}
              defaultOpen={true}
              badge={filters.availabilityStatus ? 1 : undefined}
            >
              <div className="pt-2">
                <Select
                  value={filters.availabilityStatus || ""}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      availabilityStatus: value || undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="סטטוס זמינות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">הכל</SelectItem>
                    {AVAILABILITY_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              option.value === "AVAILABLE"
                                ? "bg-emerald-500"
                                : option.value === "DATING"
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filters.availabilityStatus && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        availabilityStatus: undefined,
                      })
                    }
                    className="w-full mt-2 text-sm text-gray-500"
                  >
                    הסר בחירה
                  </Button>
                )}
              </div>
            </FilterSection>

            {/* Verification Switches */}
            <FilterSection
              title="אימות ואיכות פרופיל"
              icon={<Check className="w-4 h-4" />}
              defaultOpen={true}
              badge={
                (filters.isVerified !== undefined ? 1 : 0) +
                (filters.hasReferences !== undefined ? 1 : 0) +
                (filters.isProfileComplete !== undefined ? 1 : 0)
              }
            >
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded-md">
                  <span className="text-sm">מועמדים מאומתים בלבד</span>
                  <Switch
                    checked={filters.isVerified || false}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        isVerified: checked || undefined,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded-md">
                  <span className="text-sm">עם המלצות בלבד</span>
                  <Switch
                    checked={filters.hasReferences || false}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        hasReferences: checked || undefined,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded-md">
                  <span className="text-sm">פרופילים מלאים בלבד</span>
                  <Switch
                    checked={filters.isProfileComplete || false}
                    onCheckedChange={(checked) =>
                      onFiltersChange({
                        ...filters,
                        isProfileComplete: checked || undefined,
                      })
                    }
                  />
                </div>
              </div>
            </FilterSection>

            {/* Activity Filter */}
            <FilterSection
              title="פעילות אחרונה"
              icon={<Clock className="w-4 h-4" />}
              badge={filters.lastActiveDays ? 1 : undefined}
            >
              <div className="pt-2">
                <Select
                  value={filters.lastActiveDays?.toString() || ""}
                  onValueChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      lastActiveDays: value ? parseInt(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="פעילות אחרונה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">הכל</SelectItem>
                    <SelectItem value="1">היום</SelectItem>
                    <SelectItem value="3">3 ימים אחרונים</SelectItem>
                    <SelectItem value="7">שבוע אחרון</SelectItem>
                    <SelectItem value="30">חודש אחרון</SelectItem>
                  </SelectContent>
                </Select>
                {filters.lastActiveDays && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onFiltersChange({ ...filters, lastActiveDays: undefined })
                    }
                    className="w-full mt-2 text-sm text-gray-500"
                  >
                    הסר בחירה
                  </Button>
                )}
              </div>
            </FilterSection>
          </TabsContent>

          {/* Saved Filters Tab */}
          <TabsContent value="saved" className="space-y-4">
            {savedFilters.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-white rounded-lg border p-4">
                <Bookmark className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <h3 className="mb-1 font-medium">אין פילטרים שמורים</h3>
                <p className="text-sm">
                  שמור את הפילטר הנוכחי ע״י לחיצה על כפתור השמירה
                </p>
              </div>
            ) : (
              <SavedFilters
                filters={savedFilters.map((filter) => ({
                  id: filter.id,
                  name: filter.name,
                  filter: {},
                  isDefault: filter.isDefault,
                  createdAt: new Date(),
                }))}
                activeFilterId={filters.savedFilterId}
                onSelect={(filter) => onApplySavedFilter?.(filter.id)}
                onDelete={() => {}}
                onEdit={() => {}}
                onSetDefault={() => {}}
              />
            )}

            {popularFilters.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">חיפושים פופולריים</h4>
                <div className="flex flex-wrap gap-2">
                  {popularFilters.map((term, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors"
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          searchQuery: term,
                        })
                      }
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Action buttons */}
      <div className="pt-4 border-t flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="bg-white"
        >
          איפוס
        </Button>
        <Button onClick={() => setShowSavePreset(true)} size="sm">
          <Save className="w-4 h-4 ml-1.5" />
          שמירת פילטר
        </Button>
      </div>
    </Card>
  );
};

export default FilterPanel;
