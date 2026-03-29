// src/components/matchmaker/new/Filters/FilterPanel.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Award,
  Bookmark,
  Calendar,
  Crown,
  Filter as FilterIcon,
  Globe,
  Heart,
  MapPin,
  Palette,
  RefreshCw,
  Ruler,
  Save,
  Scroll,
  Shield,
  Sparkles,
  Star,
  Target,
  User,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import SavedFilters from './SavedFilters';
import {
  FilterSection,
  SafeNumberInput,
  ReligiousMultiSelect,
  LanguageMultiSelect,
  GenderFilterPanel,
  MARITAL_STATUS_OPTIONS,
} from './sections';
import {
  AGE_RANGE,
  HEIGHT_RANGE,
  POPULAR_CITIES,
  BODY_TYPE_OPTIONS,
  APPEARANCE_TONE_OPTIONS,
  ETHNIC_BACKGROUND_OPTIONS,
} from '../constants/filterOptions';
import type { CandidatesFilter } from '../types/candidates';
import type { FilterState } from '../types/filters';
import type { FilterPanelDict } from '@/types/dictionaries/matchmaker';
import { DEFAULT_FILTER_STATE } from '../types/filters';

// Interfaces
interface FilterPanelProps {
  filters: CandidatesFilter;
  onFiltersChange: (filters: CandidatesFilter) => void;
  onSavePreset?: (name: string) => void;
  onReset: () => void;
  onApplySavedFilter?: (id: string) => void;
  savedFilters?: Array<{ id: string; name: string; isDefault?: boolean }>;
  popularFilters?: string[];
  className?: string;
  compactMode?: boolean;
  separateFiltering?: boolean;
  onToggleSeparateFiltering?: () => void;
  onMaleFiltersChange?: (filters: Partial<FilterState>) => void;
  onFemaleFiltersChange?: (filters: Partial<FilterState>) => void;
  onCopyFilters?: (
    source: 'male' | 'female',
    target: 'male' | 'female'
  ) => void;
  dict: FilterPanelDict;
}

// Main Component
const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onSavePreset,
  onReset,
  onApplySavedFilter,
  savedFilters = [],
  className,
  compactMode = false,
  separateFiltering = false,
  onToggleSeparateFiltering,
  onMaleFiltersChange,
  onFemaleFiltersChange,
  onCopyFilters,
  dict,
}) => {
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [activeGenderFilter, setActiveGenderFilter] = useState<
    'male' | 'female'
  >('male');

  const handleSavePreset = () => {
    if (presetName && onSavePreset) {
      onSavePreset(presetName);
      setPresetName('');
      setShowSavePreset(false);
    }
  };
  const handleAgeRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, ageRange: { min: value[0], max: value[1] } });
  };
  const handleHeightRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      heightRange: { min: value[0], max: value[1] },
    });
  };

  const countActiveFilters = (category: string): number => {
    let count = 0;
    const defaultFilters = DEFAULT_FILTER_STATE;

    switch (category) {
      case 'basic':
        if (filters.gender) count++;
        if (
          filters.ageRange &&
          (filters.ageRange.min !== defaultFilters.ageRange?.min ||
            filters.ageRange.max !== defaultFilters.ageRange?.max)
        )
          count++;
        if (filters.cities && filters.cities.length > 0) count++;
        if (filters.religiousLevel && filters.religiousLevel.length > 0)
          count++;
        if (filters.languages && filters.languages.length > 0) count++;
        if (
          filters.heightRange &&
          (filters.heightRange.min !== defaultFilters.heightRange?.min ||
            filters.heightRange.max !== defaultFilters.heightRange?.max)
        )
          count++;
        if (filters.availabilityStatus) count++;
        if (filters.isVerified) count++;
        if (filters.hasReferences) count++;
        if (filters.lastActiveDays) count++;
        if (filters.isProfileComplete) count++;
        if (filters.maritalStatus) count++;
        if (filters.bodyType && filters.bodyType.length > 0) count++;
        if (filters.appearanceTone && filters.appearanceTone.length > 0) count++;
        if (filters.ethnicBackground && filters.ethnicBackground.length > 0) count++;
        break;
    }
    return count;
  };

  return (
    <Card
      className={cn(
        'shadow-2xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/10 backdrop-blur-sm rounded-3xl overflow-hidden',
        className
      )}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-2xl"></div>
      </div>
      <div className="relative">
        {/* Header */}
        {!compactMode && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                  <FilterIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {dict.header.title}
                  </h3>
                  <p className="text-white/80 mt-1">{dict.header.subtitle}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dict.header.resetTooltip}</p>
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
                        className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                      >
                        <Bookmark className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{dict.header.saveTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        )}

        {/* Save Preset Panel */}
        <AnimatePresence>
          {showSavePreset && !compactMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-purple-100"
            >
              <div className="p-6">
                <Label className="text-lg font-bold text-gray-800 mb-3 block">
                  {dict.savePreset.title}
                </Label>
                <div className="flex gap-3">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder={dict.savePreset.placeholder}
                    className="flex-1 border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl focus:ring-2 focus:ring-purple-300"
                  />
                  <Button
                    size="sm"
                    onClick={handleSavePreset}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg rounded-xl px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {dict.savePreset.button}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Separate Filtering Toggle */}
        <div className="p-6 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50 border-b border-purple-100/50">
          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {dict.separateFiltering.title}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mr-10">
                  {dict.separateFiltering.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={separateFiltering}
                  onCheckedChange={onToggleSeparateFiltering}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-500"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {separateFiltering ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-white via-gray-50/30 to-white rounded-2xl p-2 shadow-lg border border-gray-100/50">
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    type="button"
                    variant={
                      activeGenderFilter === 'male' ? 'default' : 'ghost'
                    }
                    onClick={() => setActiveGenderFilter('male')}
                    className={cn(
                      'rounded-xl py-3 transition-all duration-300',
                      activeGenderFilter === 'male'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-blue-50'
                    )}
                  >
                    <Target className="w-5 h-5 mr-2" />
                    {dict.genderFilterPanel.maleTitle}
                  </Button>
                  <Button
                    type="button"
                    variant={
                      activeGenderFilter === 'female' ? 'default' : 'ghost'
                    }
                    onClick={() => setActiveGenderFilter('female')}
                    className={cn(
                      'rounded-xl py-3 transition-all duration-300',
                      activeGenderFilter === 'female'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-purple-50'
                    )}
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    {dict.genderFilterPanel.femaleTitle}
                  </Button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {activeGenderFilter === 'male' ? (
                  <motion.div
                    key="male"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GenderFilterPanel
                      gender="male"
                      filters={filters.maleFilters || {}}
                      onFiltersChange={onMaleFiltersChange || (() => {})}
                      copyTarget="female"
                      onCopyFilters={onCopyFilters}
                      dict={dict.genderFilterPanel}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="female"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GenderFilterPanel
                      gender="female"
                      filters={filters.femaleFilters || {}}
                      onFiltersChange={onFemaleFiltersChange || (() => {})}
                      copyTarget="male"
                      onCopyFilters={onCopyFilters}
                      dict={dict.genderFilterPanel}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full bg-gradient-to-r from-indigo-50 to-purple-50 p-2 rounded-2xl shadow-lg border border-white/50 h-auto">
                {[
                  {
                    value: 'basic',
                    label: dict.tabs.basic,
                    icon: User,
                    gradient: 'from-blue-500 to-cyan-500',
                  },
                  {
                    value: 'saved',
                    label: dict.tabs.saved,
                    icon: Bookmark,
                    gradient: 'from-amber-500 to-orange-500',
                  },
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  const count = countActiveFilters(tab.value);
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 py-3 hover:scale-105 relative overflow-hidden group data-[state=active]:shadow-lg',
                        activeTab === tab.value
                          ? `bg-gradient-to-r ${tab.gradient} text-white`
                          : 'text-gray-600 hover:bg-white/50'
                      )}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <div className="mt-6 space-y-6">
                <TabsContent value="basic" className="space-y-6 m-0">
                  {/* Gender */}
                  <FilterSection
                    title={dict.sections.gender}
                    icon={<User className="w-5 h-5" />}
                    defaultOpen={true}
                    gradient="from-blue-500 to-cyan-500"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          value: 'MALE',
                          label: dict.buttons.male,
                          gradient: 'from-blue-500 to-cyan-500',
                        },
                        {
                          value: 'FEMALE',
                          label: dict.buttons.female,
                          gradient: 'from-purple-500 to-pink-500',
                        },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            filters.gender === option.value
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              gender: option.value as 'MALE' | 'FEMALE',
                            })
                          }
                          className={cn(
                            'h-12 rounded-xl font-bold transition-all duration-300 hover:scale-105',
                            filters.gender === option.value
                              ? `bg-gradient-to-r ${option.gradient} text-white shadow-lg hover:shadow-xl`
                              : 'bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    {filters.gender && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onFiltersChange({ ...filters, gender: undefined })
                        }
                        className="w-full mt-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        {dict.buttons.removeSelection}
                      </Button>
                    )}
                  </FilterSection>

                  {/* ── Category: Demographics ── */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dict.sections.demographics}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>

                  {/* Age */}
                  <FilterSection
                    title={dict.sections.age}
                    icon={<Calendar className="w-5 h-5" />}
                    gradient="from-emerald-500 to-green-500"
                    defaultOpen={true}
                    badge={
                      filters.ageRange &&
                      (filters.ageRange.min !== AGE_RANGE.default.min ||
                        filters.ageRange.max !== AGE_RANGE.default.max)
                        ? 1
                        : undefined
                    }
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl shadow-md p-3 min-w-[80px]">
                          <p className="text-xs text-emerald-600 mb-1 font-medium">
                            {dict.genderFilterPanel.minLabel}
                          </p>
                          <SafeNumberInput
                            min={AGE_RANGE.min}
                            max={AGE_RANGE.max}
                            value={
                              filters.ageRange?.min || AGE_RANGE.default.min
                            }
                            onCommit={(val) => {
                              const currentMax =
                                filters.ageRange?.max || AGE_RANGE.default.max;
                              onFiltersChange({
                                ...filters,
                                ageRange: {
                                  min: Math.min(val, currentMax),
                                  max: currentMax,
                                },
                              });
                            }}
                            className="w-16 text-center text-lg font-bold text-emerald-700 focus:outline-none bg-transparent"
                          />
                        </div>
                        <span className="text-xl font-bold text-gray-400">
                          -
                        </span>
                        <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl shadow-md p-3 min-w-[80px]">
                          <p className="text-xs text-emerald-600 mb-1 font-medium">
                            {dict.genderFilterPanel.maxLabel}
                          </p>
                          <SafeNumberInput
                            min={AGE_RANGE.min}
                            max={AGE_RANGE.max}
                            value={
                              filters.ageRange?.max || AGE_RANGE.default.max
                            }
                            onCommit={(val) => {
                              const currentMin =
                                filters.ageRange?.min || AGE_RANGE.default.min;
                              onFiltersChange({
                                ...filters,
                                ageRange: {
                                  min: currentMin,
                                  max: Math.max(val, currentMin),
                                },
                              });
                            }}
                            className="w-16 text-center text-lg font-bold text-emerald-700 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div className="px-3">
                        <Slider
                          value={[
                            filters.ageRange?.min || AGE_RANGE.default.min,
                            filters.ageRange?.max || AGE_RANGE.default.max,
                          ]}
                          min={AGE_RANGE.min}
                          max={AGE_RANGE.max}
                          step={1}
                          onValueChange={handleAgeRangeChange}
                          className="h-6 [&>span]:bg-gradient-to-r [&>span]:from-emerald-500 [&>span]:to-green-500"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </FilterSection>

                  {/* ── Category: Religion & Values ── */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dict.sections.religionValues}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>

                  {/* Religious Level */}
                  <FilterSection
                    title={dict.religiousLevelLabel}
                    icon={<Scroll className="w-5 h-5" />}
                    gradient="from-amber-500 to-orange-500"
                    defaultOpen={true}
                    badge={filters.religiousLevel?.length || undefined}
                  >
                    <ReligiousMultiSelect
                      selectedValues={filters.religiousLevel || []}
                      onChange={(values) =>
                        onFiltersChange({ ...filters, religiousLevel: values })
                      }
                      dict={dict}
                    />
                  </FilterSection>

                  {/* Height */}
                  <FilterSection
                    title={dict.sections.height}
                    icon={<Ruler className="w-5 h-5" />}
                    gradient="from-indigo-500 to-purple-500"
                    badge={
                      filters.heightRange &&
                      (filters.heightRange.min !== HEIGHT_RANGE.default.min ||
                        filters.heightRange.max !== HEIGHT_RANGE.default.max)
                        ? 1
                        : undefined
                    }
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-md p-3 min-w-[80px]">
                          <p className="text-xs text-indigo-600 mb-1 font-medium">
                            {dict.genderFilterPanel.minLabel}
                          </p>
                          <SafeNumberInput
                            min={HEIGHT_RANGE.min}
                            max={HEIGHT_RANGE.max}
                            value={
                              filters.heightRange?.min ||
                              HEIGHT_RANGE.default.min
                            }
                            onCommit={(val) => {
                              const currentMax =
                                filters.heightRange?.max ||
                                HEIGHT_RANGE.default.max;
                              onFiltersChange({
                                ...filters,
                                heightRange: {
                                  min: Math.min(val, currentMax),
                                  max: currentMax,
                                },
                              });
                            }}
                            className="w-16 text-center text-lg font-bold text-indigo-700 focus:outline-none bg-transparent"
                          />
                        </div>
                        <span className="text-xl font-bold text-gray-400">
                          -
                        </span>
                        <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-md p-3 min-w-[80px]">
                          <p className="text-xs text-indigo-600 mb-1 font-medium">
                            {dict.genderFilterPanel.maxLabel}
                          </p>
                          <SafeNumberInput
                            min={HEIGHT_RANGE.min}
                            max={HEIGHT_RANGE.max}
                            value={
                              filters.heightRange?.max ||
                              HEIGHT_RANGE.default.max
                            }
                            onCommit={(val) => {
                              const currentMin =
                                filters.heightRange?.min ||
                                HEIGHT_RANGE.default.min;
                              onFiltersChange({
                                ...filters,
                                heightRange: {
                                  min: currentMin,
                                  max: Math.max(val, currentMin),
                                },
                              });
                            }}
                            className="w-16 text-center text-lg font-bold text-indigo-700 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div className="px-3">
                        <Slider
                          value={[
                            filters.heightRange?.min ||
                              HEIGHT_RANGE.default.min,
                            filters.heightRange?.max ||
                              HEIGHT_RANGE.default.max,
                          ]}
                          min={HEIGHT_RANGE.min}
                          max={HEIGHT_RANGE.max}
                          step={1}
                          onValueChange={handleHeightRangeChange}
                          className="h-6 [&>span]:bg-gradient-to-r [&>span]:from-indigo-500 [&>span]:to-purple-500"
                          dir="rtl"
                        />
                      </div>
                    </div>
                  </FilterSection>

                  {/* City */}
                  <FilterSection
                    title={dict.cityLabel}
                    icon={<MapPin className="w-5 h-5" />}
                    gradient="from-cyan-500 to-teal-500"
                  >
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100/50">
                      <Select
                        value={filters.cities?.[0] || ''}
                        onValueChange={(value) => {
                          const newValue = value === 'all' ? undefined : value;
                          onFiltersChange({
                            ...filters,
                            cities: newValue ? [newValue] : [],
                          });
                        }}
                      >
                        <SelectTrigger className="w-full border-0 bg-transparent focus:ring-2 focus:ring-emerald-200 rounded-xl">
                          <SelectValue
                            placeholder={dict.placeholders.selectCity}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-xl">
                          <SelectItem
                            value="all"
                            className="hover:bg-emerald-50"
                          >
                            {dict.options.all}
                          </SelectItem>
                          {POPULAR_CITIES.map((c) => (
                            <SelectItem
                              key={c}
                              value={c}
                              className="hover:bg-emerald-50"
                            >
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </FilterSection>

                  {/* ── Category: Profile Status ── */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dict.sections.status}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>

                  {/* Status Toggles */}
                  <FilterSection
                    title={dict.sections.status}
                    icon={<Activity className="w-5 h-5" />}
                    gradient="from-pink-500 to-rose-500"
                    defaultOpen={true}
                  >
                    <div className="space-y-4">
                      {[
                        {
                          key: 'availabilityStatus',
                          label: dict.popularFilters.availableOnly,
                          icon: <Heart className="w-4 h-4" />,
                          gradient: 'from-pink-500 to-rose-500',
                          value: filters.availabilityStatus === 'AVAILABLE',
                          onChange: (checked: boolean) =>
                            onFiltersChange({
                              ...filters,
                              availabilityStatus: checked
                                ? 'AVAILABLE'
                                : undefined,
                            }),
                        },
                        {
                          key: 'lastActiveDays',
                          label: dict.popularFilters.activeRecently,
                          icon: <Activity className="w-4 h-4" />,
                          gradient: 'from-blue-500 to-cyan-500',
                          value: filters.lastActiveDays === 7,
                          onChange: (checked: boolean) =>
                            onFiltersChange({
                              ...filters,
                              lastActiveDays: checked ? 7 : undefined,
                            }),
                        },
                        {
                          key: 'isProfileComplete',
                          label: dict.fullProfileLabel,
                          icon: <Star className="w-4 h-4" />,
                          gradient: 'from-purple-500 to-indigo-500',
                        },
                        {
                          key: 'isVerified',
                          label: dict.verifiedOnlyLabel,
                          icon: <Shield className="w-4 h-4" />,
                          gradient: 'from-emerald-500 to-green-500',
                        },
                        {
                          key: 'hasReferences',
                          label: dict.withRecommendationsLabel,
                          icon: <Award className="w-4 h-4" />,
                          gradient: 'from-amber-500 to-orange-500',
                        },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100/50 hover:bg-white/80 transition-all duration-300"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'p-2 rounded-lg bg-gradient-to-r text-white',
                                item.gradient
                              )}
                            >
                              {item.icon}
                            </div>
                            <span className="font-medium text-gray-800 text-sm">
                              {item.label}
                            </span>
                          </div>
                          <Switch
                            checked={
                              item.value !== undefined
                                ? item.value
                                : (filters?.[
                                    item.key as keyof typeof filters
                                  ] as boolean) || false
                            }
                            onCheckedChange={
                              item.onChange
                                ? item.onChange
                                : (checked) =>
                                    onFiltersChange({
                                      ...filters,
                                      [item.key]: checked || undefined,
                                    })
                            }
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-500"
                          />
                        </div>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Marital Status */}
                  <FilterSection
                    title={dict.maritalStatusLabel}
                    icon={<User className="w-5 h-5" />}
                    gradient="from-violet-500 to-purple-500"
                    badge={filters.maritalStatus ? 1 : undefined}
                  >
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100/50">
                      <div className="grid grid-cols-2 gap-2">
                        {MARITAL_STATUS_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            variant={
                              filters.maritalStatus === option.value
                                ? 'default'
                                : 'outline'
                            }
                            onClick={() =>
                              onFiltersChange({
                                ...filters,
                                maritalStatus:
                                  filters.maritalStatus === option.value
                                    ? undefined
                                    : option.value,
                              })
                            }
                            className={cn(
                              'h-10 rounded-xl font-medium text-sm transition-all duration-300 hover:scale-105',
                              filters.maritalStatus === option.value
                                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                : 'bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-violet-300'
                            )}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      {filters.maritalStatus && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              maritalStatus: undefined,
                            })
                          }
                          className="w-full mt-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-xs"
                        >
                          {dict.buttons.removeSelection}
                        </Button>
                      )}
                    </div>
                  </FilterSection>

                  {/* Languages */}
                  <FilterSection
                    title={dict.languageLabel}
                    icon={<Zap className="w-5 h-5" />}
                    gradient="from-teal-500 to-cyan-500"
                    defaultOpen={false}
                    badge={filters.languages?.length || undefined}
                  >
                    <LanguageMultiSelect
                      selectedValues={filters.languages || []}
                      onChange={(values) =>
                        onFiltersChange({ ...filters, languages: values })
                      }
                      dict={dict}
                    />
                  </FilterSection>

                  {/* ── Category: Appearance ── */}
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dict.sections.appearance}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                  </div>

                  {/* Body Type */}
                  <FilterSection
                    title={dict.sections.bodyType}
                    icon={<Ruler className="w-5 h-5" />}
                    gradient="from-rose-500 to-pink-500"
                    badge={filters.bodyType?.length || undefined}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {BODY_TYPE_OPTIONS.map((opt) => {
                        const selected = (filters.bodyType || []).includes(opt.value);
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs rounded-full"
                            onClick={() => {
                              const current = filters.bodyType || [];
                              const updated = selected
                                ? current.filter((v: string) => v !== opt.value)
                                : [...current, opt.value];
                              onFiltersChange({ ...filters, bodyType: updated });
                            }}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* Appearance Tone */}
                  <FilterSection
                    title={dict.sections.appearanceTone}
                    icon={<Palette className="w-5 h-5" />}
                    gradient="from-purple-500 to-fuchsia-500"
                    badge={filters.appearanceTone?.length || undefined}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {APPEARANCE_TONE_OPTIONS.map((opt) => {
                        const selected = (filters.appearanceTone || []).includes(opt.value);
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs rounded-full"
                            onClick={() => {
                              const current = filters.appearanceTone || [];
                              const updated = selected
                                ? current.filter((v: string) => v !== opt.value)
                                : [...current, opt.value];
                              onFiltersChange({ ...filters, appearanceTone: updated });
                            }}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* Ethnic Background */}
                  <FilterSection
                    title={dict.sections.ethnicBackground}
                    icon={<Globe className="w-5 h-5" />}
                    gradient="from-amber-500 to-yellow-500"
                    badge={filters.ethnicBackground?.length || undefined}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {ETHNIC_BACKGROUND_OPTIONS.map((opt) => {
                        const selected = (filters.ethnicBackground || []).includes(opt.value);
                        return (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={selected ? 'default' : 'outline'}
                            size="sm"
                            className="text-xs rounded-full"
                            onClick={() => {
                              const current = filters.ethnicBackground || [];
                              const updated = selected
                                ? current.filter((v: string) => v !== opt.value)
                                : [...current, opt.value];
                              onFiltersChange({ ...filters, ethnicBackground: updated });
                            }}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  </FilterSection>
                </TabsContent>

                <TabsContent value="saved" className="space-y-6 m-0">
                  {savedFilters.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12 bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl shadow-xl border border-gray-100/50"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-6">
                        <Bookmark className="w-10 h-10 text-amber-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        {dict.savedFilters.emptyState.title}
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                        {dict.savedFilters.emptyState.description}
                      </p>
                      <Button
                        onClick={() => setShowSavePreset(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg rounded-xl px-6"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {dict.savedFilters.emptyState.saveCurrentButton}
                      </Button>
                    </motion.div>
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
                      dict={dict.savedFilters}
                    />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-6 pb-6">
          <div className="flex justify-between items-center pt-6 border-t border-gray-200/50">
            <Button
              variant="outline"
              size={compactMode ? 'sm' : 'default'}
              onClick={onReset}
              className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-600 hover:from-red-100 hover:to-pink-100 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {dict.buttons.reset}
            </Button>
            {!compactMode && (
              <Button
                onClick={() => setShowSavePreset(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg rounded-xl px-6 transition-all duration-300 hover:scale-105"
              >
                <Save className="w-4 h-4 mr-2" />
                {dict.buttons.save}
                <Sparkles className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
export default FilterPanel;
