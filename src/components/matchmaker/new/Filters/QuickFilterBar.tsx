// src/components/matchmaker/new/Filters/QuickFilterBar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Filter,
  MapPin,
  Scroll,
  Sparkles,
  Star,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  Clock,
  FileQuestion,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AGE_RANGE, POPULAR_CITIES } from '../constants/filterOptions';
import { RELIGIOUS_OPTIONS } from './sections/filterConstants';
import type { FilterState } from '../types/filters';

// ─── Types ────────────────────────────────────────────────────

interface QuickFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onToggleFiltersPanel: () => void;
  showFiltersPanel: boolean;
  totalCount: number;
  filteredCount: number;
  activeFilterCount: number;
  // Smart segment counts
  smartSegments?: {
    newThisWeek: number;
    waitingForSuggestion: number;
    incompleteProfile: number;
    activeToday: number;
  };
  onSmartSegmentClick?: (segment: string) => void;
  activeSmartSegment?: string | null;
  dict: QuickFilterBarDict;
}

export interface QuickFilterBarDict {
  showingResults: string; // "מציג {{filtered}} מתוך {{total}}"
  filtersActive: string;  // "{{count}} פילטרים"
  clearAll: string;
  moreFilters: string;
  gender: string;
  age: string;
  city: string;
  religiousLevel: string;
  status: string;
  all: string;
  male: string;
  female: string;
  available: string;
  active7Days: string;
  verified: string;
  selectCity: string;
  segments: {
    newThisWeek: string;
    waitingForSuggestion: string;
    incompleteProfile: string;
    activeToday: string;
  };
}

// ─── Mini Dropdown Component ──────────────────────────────────

const QuickDropdown: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClear?: () => void;
  children: React.ReactNode;
  activeLabel?: string;
}> = ({ label, icon, isActive, onClear, children, activeLabel }) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap border',
            isActive
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
          )}
        >
          {icon}
          <span>{activeLabel || label}</span>
          {isActive && onClear ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-0.5 rounded-full hover:bg-indigo-200 transition-colors"
            >
              <X className="w-3 h-3" />
            </span>
          ) : (
            <ChevronDown className="w-3 h-3 opacity-50" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-auto min-w-[200px] shadow-xl border-0 rounded-xl"
        align="start"
        sideOffset={6}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
};

// ─── Smart Segment Chip ───────────────────────────────────────

const SegmentChip: React.FC<{
  label: string;
  count: number;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  color: string;
}> = ({ label, count, icon, isActive, onClick, color }) => {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap',
        isActive
          ? `${color} shadow-sm scale-105`
          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
      )}
    >
      {icon}
      <span>{label}</span>
      <Badge
        className={cn(
          'h-4 px-1.5 text-[10px] rounded-full',
          isActive ? 'bg-white/30 text-current' : 'bg-gray-100 text-gray-600'
        )}
      >
        {count}
      </Badge>
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────

const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  filters,
  onFiltersChange,
  onResetFilters,
  onToggleFiltersPanel,
  showFiltersPanel,
  totalCount,
  filteredCount,
  activeFilterCount,
  smartSegments,
  onSmartSegmentClick,
  activeSmartSegment,
  dict,
}) => {
  // ── Gender Quick Filter ──
  const genderActive = !!filters.gender;
  const genderLabel = filters.gender === 'MALE'
    ? dict.male
    : filters.gender === 'FEMALE'
      ? dict.female
      : dict.gender;

  // ── Age Quick Filter ──
  const ageActive = !!(
    filters.ageRange &&
    (filters.ageRange.min !== AGE_RANGE.default.min ||
      filters.ageRange.max !== AGE_RANGE.default.max)
  );
  const ageLabel = ageActive
    ? `${filters.ageRange!.min}-${filters.ageRange!.max}`
    : dict.age;

  // ── City Quick Filter ──
  const cityActive = !!(filters.cities && filters.cities.length > 0);
  const cityLabel = cityActive
    ? filters.cities!.length === 1
      ? filters.cities![0]
      : `${filters.cities!.length} ${dict.city}`
    : dict.city;

  // ── Religious Level Quick Filter ──
  const religiousActive = !!(filters.religiousLevel && filters.religiousLevel.length > 0);
  const religiousLabel = religiousActive
    ? filters.religiousLevel!.length === 1
      ? RELIGIOUS_OPTIONS.find((o) => o.value === filters.religiousLevel![0])?.label || filters.religiousLevel![0]
      : `${filters.religiousLevel!.length} ${dict.religiousLevel}`
    : dict.religiousLevel;

  // ── Status Quick Filter ──
  const statusActive = !!(
    filters.availabilityStatus ||
    filters.lastActiveDays ||
    filters.isVerified
  );

  // ── Advanced filter count (beyond quick filters) ──
  const advancedCount = Math.max(0, activeFilterCount - [genderActive, ageActive, cityActive, religiousActive, statusActive].filter(Boolean).length);

  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-4">
        {/* Row 1: Quick Filters + Result Count */}
        <div className="flex items-center gap-2 py-2 overflow-x-auto scrollbar-hide">
          {/* Gender */}
          <QuickDropdown
            label={dict.gender}
            icon={<Users className="w-3.5 h-3.5" />}
            isActive={genderActive}
            activeLabel={genderLabel}
            onClear={() => onFiltersChange({ gender: undefined })}
          >
            <div className="p-2 space-y-1">
              {[
                { value: undefined, label: dict.all, icon: <Users className="w-4 h-4" /> },
                { value: 'MALE' as const, label: dict.male, icon: <User className="w-4 h-4 text-blue-600" /> },
                { value: 'FEMALE' as const, label: dict.female, icon: <User className="w-4 h-4 text-purple-600" /> },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => onFiltersChange({ gender: opt.value })}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    filters.gender === opt.value
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </QuickDropdown>

          {/* Age */}
          <QuickDropdown
            label={dict.age}
            icon={<Calendar className="w-3.5 h-3.5" />}
            isActive={ageActive}
            activeLabel={ageLabel}
            onClear={() => onFiltersChange({ ageRange: undefined })}
          >
            <div className="p-4 w-64 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-600">
                  {filters.ageRange?.min || AGE_RANGE.default.min}
                </span>
                <span className="text-gray-400">—</span>
                <span className="font-medium text-gray-600">
                  {filters.ageRange?.max || AGE_RANGE.default.max}
                </span>
              </div>
              <Slider
                value={[
                  filters.ageRange?.min || AGE_RANGE.default.min,
                  filters.ageRange?.max || AGE_RANGE.default.max,
                ]}
                min={AGE_RANGE.min}
                max={70}
                step={1}
                onValueChange={(v) =>
                  onFiltersChange({ ageRange: { min: v[0], max: v[1] } })
                }
                className="h-5"
                dir="rtl"
              />
            </div>
          </QuickDropdown>

          {/* City */}
          <QuickDropdown
            label={dict.city}
            icon={<MapPin className="w-3.5 h-3.5" />}
            isActive={cityActive}
            activeLabel={cityLabel}
            onClear={() => onFiltersChange({ cities: [] })}
          >
            <ScrollArea className="h-56 p-2">
              <div className="space-y-0.5">
                {POPULAR_CITIES.map((city) => {
                  const selected = filters.cities?.includes(city);
                  return (
                    <button
                      key={city}
                      onClick={() => {
                        const current = filters.cities || [];
                        const updated = selected
                          ? current.filter((c) => c !== city)
                          : [...current, city];
                        onFiltersChange({ cities: updated });
                      }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-sm transition-colors',
                        selected
                          ? 'bg-teal-50 text-teal-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      )}
                    >
                      <Checkbox checked={selected} className="pointer-events-none h-3.5 w-3.5" />
                      {city}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </QuickDropdown>

          {/* Religious Level */}
          <QuickDropdown
            label={dict.religiousLevel}
            icon={<Scroll className="w-3.5 h-3.5" />}
            isActive={religiousActive}
            activeLabel={religiousLabel}
            onClear={() => onFiltersChange({ religiousLevel: [] })}
          >
            <ScrollArea className="h-64 p-2">
              <div className="space-y-0.5">
                {RELIGIOUS_OPTIONS.map((opt) => {
                  const selected = filters.religiousLevel?.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const current = filters.religiousLevel || [];
                        const updated = selected
                          ? current.filter((v) => v !== opt.value)
                          : [...current, opt.value];
                        onFiltersChange({ religiousLevel: updated });
                      }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-sm transition-colors',
                        selected
                          ? 'bg-amber-50 text-amber-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      )}
                    >
                      <Checkbox checked={selected} className="pointer-events-none h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </QuickDropdown>

          {/* Status */}
          <QuickDropdown
            label={dict.status}
            icon={<UserCheck className="w-3.5 h-3.5" />}
            isActive={statusActive}
            onClear={() =>
              onFiltersChange({
                availabilityStatus: undefined,
                lastActiveDays: undefined,
                isVerified: undefined,
              })
            }
          >
            <div className="p-2 space-y-1 w-52">
              {[
                {
                  key: 'availabilityStatus',
                  label: dict.available,
                  checked: filters.availabilityStatus === 'AVAILABLE',
                  toggle: () =>
                    onFiltersChange({
                      availabilityStatus:
                        filters.availabilityStatus === 'AVAILABLE'
                          ? undefined
                          : 'AVAILABLE',
                    }),
                },
                {
                  key: 'lastActiveDays',
                  label: dict.active7Days,
                  checked: filters.lastActiveDays === 7,
                  toggle: () =>
                    onFiltersChange({
                      lastActiveDays: filters.lastActiveDays === 7 ? undefined : 7,
                    }),
                },
                {
                  key: 'isVerified',
                  label: dict.verified,
                  checked: !!filters.isVerified,
                  toggle: () =>
                    onFiltersChange({
                      isVerified: filters.isVerified ? undefined : true,
                    }),
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={opt.toggle}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors',
                    opt.checked
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  <Checkbox checked={opt.checked} className="pointer-events-none h-3.5 w-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </QuickDropdown>

          {/* Separator */}
          <div className="h-5 w-px bg-gray-200 mx-1 flex-shrink-0" />

          {/* More Filters button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFiltersPanel}
            className={cn(
              'text-xs gap-1.5 rounded-lg whitespace-nowrap',
              showFiltersPanel && 'bg-indigo-50 border-indigo-200 text-indigo-700'
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            {dict.moreFilters}
            {advancedCount > 0 && (
              <Badge className="h-4 px-1.5 text-[10px] bg-indigo-500 text-white rounded-full">
                {advancedCount}
              </Badge>
            )}
          </Button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Result Count */}
          <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
            <span>
              {dict.showingResults
                .replace('{{filtered}}', String(filteredCount))
                .replace('{{total}}', String(totalCount))}
            </span>
            {activeFilterCount > 0 && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-indigo-600 font-medium">
                  {dict.filtersActive.replace('{{count}}', String(activeFilterCount))}
                </span>
                <button
                  onClick={onResetFilters}
                  className="text-red-500 hover:text-red-700 underline transition-colors"
                >
                  {dict.clearAll}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Smart Segments */}
        {smartSegments && onSmartSegmentClick && (
          <div className="flex items-center gap-1.5 pb-2 overflow-x-auto scrollbar-hide">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <SegmentChip
              label={dict.segments.newThisWeek}
              count={smartSegments.newThisWeek}
              icon={<UserPlus className="w-3 h-3" />}
              isActive={activeSmartSegment === 'newThisWeek'}
              onClick={() => onSmartSegmentClick('newThisWeek')}
              color="bg-emerald-50 border-emerald-200 text-emerald-700"
            />
            <SegmentChip
              label={dict.segments.waitingForSuggestion}
              count={smartSegments.waitingForSuggestion}
              icon={<Clock className="w-3 h-3" />}
              isActive={activeSmartSegment === 'waitingForSuggestion'}
              onClick={() => onSmartSegmentClick('waitingForSuggestion')}
              color="bg-orange-50 border-orange-200 text-orange-700"
            />
            <SegmentChip
              label={dict.segments.incompleteProfile}
              count={smartSegments.incompleteProfile}
              icon={<FileQuestion className="w-3 h-3" />}
              isActive={activeSmartSegment === 'incompleteProfile'}
              onClick={() => onSmartSegmentClick('incompleteProfile')}
              color="bg-rose-50 border-rose-200 text-rose-700"
            />
            <SegmentChip
              label={dict.segments.activeToday}
              count={smartSegments.activeToday}
              icon={<Star className="w-3 h-3" />}
              isActive={activeSmartSegment === 'activeToday'}
              onClick={() => onSmartSegmentClick('activeToday')}
              color="bg-blue-50 border-blue-200 text-blue-700"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(QuickFilterBar);
