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
} from "lucide-react";

import type { CandidatesFilter } from "../types/candidates";
import {
  AGE_RANGE,
  HEIGHT_RANGE,
  RELIGIOUS_LEVELS,
  EDUCATION_LEVELS,
  OCCUPATION_CATEGORIES,
  POPULAR_CITIES,
  AVAILABILITY_STATUS_OPTIONS,
} from "../constants/filterOptions";

interface FilterPanelProps {
  filters: CandidatesFilter;
  onFiltersChange: (filters: CandidatesFilter) => void;
  onSavePreset?: (name: string) => void;
  onReset: () => void;
  className?: string;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-lg p-4"
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
          </div>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">{children}</CollapsibleContent>
    </Collapsible>
  );
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onSavePreset,
  onReset,
  className,
}) => {
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");

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

  return (
    <Card className={`space-y-6 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">סינון מועמדים</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onReset}>
            איפוס
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSavePreset(!showSavePreset)}
          >
            <Save className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Save Preset Form */}
      {showSavePreset && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <Label>שם לשמירת הפילטר</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="פילטר מותאם אישית"
              className="h-9" // או כל class אחר שמתאים לגודל הרצוי
            />
            <Button size="sm" onClick={handleSavePreset}>
              שמור
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Basic Filters */}
        <FilterSection
          title="מידע בסיסי"
          icon={<User className="w-4 h-4 text-blue-600" />}
          defaultOpen={true}
        >
          {/* Age Range */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                גיל
              </Label>
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
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>{filters.ageRange?.min || AGE_RANGE.default.min}</span>
                <span>{filters.ageRange?.max || AGE_RANGE.default.max}</span>
              </div>
            </div>

            {/* Height Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                גובה (ס&quot;מ)
              </Label>
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
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  {filters.heightRange?.min || HEIGHT_RANGE.default.min}{" "}
                  ס&quot;מ
                </span>
                <span>
                  {filters.heightRange?.max || HEIGHT_RANGE.default.max}{" "}
                  ס&quot;מ
                </span>
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Religious Level */}
        <FilterSection
          title="רמת דתיות"
          icon={<Scroll className="w-4 h-4 text-blue-600" />}
        >
          <div className="space-y-2">
            <Select
              value={filters.religiousLevel}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, religiousLevel: value })
              }
            >
              <SelectTrigger>
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

        {/* Location */}
        <FilterSection
          title="מיקום"
          icon={<MapPin className="w-4 h-4 text-blue-600" />}
        >
          <ScrollArea className="h-48 rounded-md border p-2">
            {POPULAR_CITIES.map((city) => (
              <div key={city} className="flex items-center space-x-2 py-1">
                <Switch
                  checked={filters.cities?.includes(city)}
                  onCheckedChange={(checked) => {
                    const newCities = checked
                      ? [...(filters.cities || []), city]
                      : filters.cities?.filter((c) => c !== city);
                    onFiltersChange({ ...filters, cities: newCities });
                  }}
                />
                <Label>{city}</Label>
              </div>
            ))}
          </ScrollArea>
        </FilterSection>

        {/* Occupation & Education */}
        <FilterSection
          title="תעסוקה והשכלה"
          icon={<GraduationCap className="w-4 h-4 text-blue-600" />}
        >
          <div className="space-y-4">
            <Select
              value={filters.educationLevel}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, educationLevel: value })
              }
            >
              <SelectTrigger>
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

            <ScrollArea className="h-48 rounded-md border p-2">
              {OCCUPATION_CATEGORIES.map((occupation) => (
                <div
                  key={occupation.value}
                  className="flex items-center space-x-2 py-1"
                >
                  <Switch
                    checked={filters.occupations?.includes(occupation.value)}
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
                  <Label>{occupation.label}</Label>
                </div>
              ))}
            </ScrollArea>
          </div>
        </FilterSection>

        {/* Availability & Status */}
        <FilterSection
          title="זמינות ומצב"
          icon={<Clock className="w-4 h-4 text-blue-600" />}
        >
          <div className="space-y-4">
            <Select
              value={filters.availabilityStatus}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, availabilityStatus: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="סטטוס זמינות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">הכל</SelectItem>
                {AVAILABILITY_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.isVerified}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, isVerified: checked })
                }
              />
              <Label>מועמדים מאומתים בלבד</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.hasReferences}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, hasReferences: checked })
                }
              />
              <Label>עם המלצות בלבד</Label>
            </div>
          </div>
        </FilterSection>
      </div>
    </Card>
  );
};

export default FilterPanel;
