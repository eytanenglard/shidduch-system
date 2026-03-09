// src/app/components/matchmaker/suggestions/SuggestionActionBar.tsx

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
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
  RefreshCw,
  SlidersHorizontal,
  Target,
  TrendingUp,
  Star,
  Flame,
  Shield,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Priority, MatchSuggestionStatus } from '@prisma/client';
import type { SuggestionFilters, SortByOption } from '@/types/suggestions';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionary';

interface SuggestionActionBarProps {
  dict: MatchmakerPageDictionary['suggestionsDashboard']['actionBar'];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: SuggestionFilters;
  onFiltersChange: (filters: SuggestionFilters) => void;
  totalCount: number;
  activeCount: number;
  pendingCount: number;
  historyCount: number;
}

const priorityInfoMap: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  URGENT: { icon: Flame, color: 'text-red-600' },
  HIGH: { icon: Star, color: 'text-orange-600' },
  MEDIUM: { icon: Target, color: 'text-blue-600' },
  LOW: { icon: Shield, color: 'text-gray-600' },
};

const statusOptions: {
  value: MatchSuggestionStatus;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'PENDING_FIRST_PARTY', icon: Clock, color: 'text-amber-600' },
  { value: 'PENDING_SECOND_PARTY', icon: Clock, color: 'text-blue-600' },
  { value: 'FIRST_PARTY_APPROVED', icon: CheckCircle, color: 'text-green-600' },
  {
    value: 'SECOND_PARTY_APPROVED',
    icon: CheckCircle,
    color: 'text-emerald-600',
  },
  { value: 'DATING', icon: AlertCircle, color: 'text-pink-600' },
];

const SuggestionActionBar: React.FC<SuggestionActionBarProps> = ({
  dict,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const activeFilterCount = [
    filters.priority?.length,
    filters.status?.length,
    filters.dateRange,
    filters.userId,
  ].filter(Boolean).length;

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
        dateRange: { start: range.from, end: range.to || new Date() },
      });
    } else {
      handleRemoveFilter('dateRange');
    }
  };

  return (
    <div className="space-y-3">
      {/* ── שורת חיפוש ראשית ── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch">
        {/* חיפוש */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={dict.searchPlaceholder}
            className="h-10 pr-10 text-right border-gray-200 focus:border-purple-400 rounded-xl bg-white text-sm"
          />
        </div>

        {/* עדיפות */}
        <Select
          value={filters.priority?.[0] || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              priority: value === 'all' ? undefined : [value as Priority],
            })
          }
        >
          <SelectTrigger className="h-10 w-full sm:w-40 border-gray-200 rounded-xl bg-white text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-gray-400" />
              <SelectValue placeholder={dict.priorityFilter.placeholder} />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-xl border-0">
            <SelectItem value="all">
              <span className="text-sm">{dict.priorityFilter.all}</span>
            </SelectItem>
            {Object.entries(dict.priorityFilter.options).map(([key, label]) => {
              const info = priorityInfoMap[key] || priorityInfoMap.MEDIUM;
              const Icon = info.icon;
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-3.5 h-3.5', info.color)} />
                    <span className="text-sm">{label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* תאריך */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-10 px-3 border-gray-200 rounded-xl bg-white text-sm font-normal"
            >
              <Calendar className="h-3.5 w-3.5 ml-1.5 text-gray-400" />
              {dict.buttons.dateRange}
              <ChevronDown className="h-3 w-3 mr-1 text-gray-300" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-4 rounded-xl shadow-xl border-0"
            align="end"
          >
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">
                {dict.buttons.dateRange}
              </h4>
              <DatePicker
                onChange={handleDateRangeChange}
                value={dateRange}
                isRange={true}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  handleDateRangeChange({ from: undefined, to: undefined })
                }
                className="w-full text-xs text-gray-500 hover:text-red-500"
              >
                {dict.buttons.clearDate}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* פילטרים מתקדמים */}
        <Button
          variant={showAdvancedFilters ? 'default' : 'outline'}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={cn(
            'h-10 px-3 rounded-xl text-sm font-medium transition-all',
            showAdvancedFilters
              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 ml-1.5" />
          {dict.buttons.advancedFilters}
          {activeFilterCount > 0 && (
            <Badge className="mr-1.5 bg-white/20 text-current text-[10px] px-1.5 py-0 h-5 min-w-[20px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* ── פילטרים מתקדמים (מתרחב) ── */}
      {showAdvancedFilters && (
        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-500" />
              {dict.advancedFilters.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => setShowAdvancedFilters(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* סטטוסים */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {dict.advancedFilters.statusTitle}
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  const label =
                    dict.advancedFilters.statusOptions[
                      status.value as keyof typeof dict.advancedFilters.statusOptions
                    ];
                  return (
                    <label
                      key={status.value}
                      className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filters.status?.includes(status.value)}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...(filters.status || []), status.value]
                            : filters.status?.filter((s) => s !== status.value);
                          onFiltersChange({
                            ...filters,
                            status: newStatus as MatchSuggestionStatus[],
                          });
                        }}
                      />
                      <Icon className={cn('h-3.5 w-3.5', status.color)} />
                      <span className="text-xs text-gray-700">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* משתתפים */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {dict.advancedFilters.participantsTitle}
              </h4>
              <Select
                value={filters.userId || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    userId: value === 'all' ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="border-gray-200 rounded-lg text-sm h-9">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400" />
                    <SelectValue
                      placeholder={dict.advancedFilters.participantsTitle}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {dict.advancedFilters.participantOptions.all}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* מיון */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {dict.advancedFilters.sortByTitle}
              </h4>
              <Select
                value={filters.sortBy || 'lastActivity'}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, sortBy: value as SortByOption })
                }
              >
                <SelectTrigger className="border-gray-200 rounded-lg text-sm h-9">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
                    <SelectValue
                      placeholder={dict.advancedFilters.sortByTitle}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dict.advancedFilters.sortOptions).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* ── פילטרים פעילים ── */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          {filters.priority && (
            <Badge
              variant="secondary"
              className="text-xs bg-orange-50 text-orange-700 border-orange-200 rounded-lg px-2 py-0.5 gap-1"
            >
              {dict.activeFilters.priorityLabel}:{' '}
              {dict.priorityFilter.options[filters.priority[0]]}
              <button
                onClick={() => handleRemoveFilter('priority')}
                className="hover:bg-orange-200 rounded-full p-0.5 ml-1"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          )}
          {filters.dateRange && (
            <Badge
              variant="secondary"
              className="text-xs bg-blue-50 text-blue-700 border-blue-200 rounded-lg px-2 py-0.5 gap-1"
            >
              {dict.activeFilters.dateLabel}
              <button
                onClick={() => handleRemoveFilter('dateRange')}
                className="hover:bg-blue-200 rounded-full p-0.5 ml-1"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          )}
          {filters.status && filters.status.length > 0 && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-50 text-green-700 border-green-200 rounded-lg px-2 py-0.5 gap-1"
            >
              {filters.status.length} {dict.activeFilters.statusLabel}
              <button
                onClick={() => handleRemoveFilter('status')}
                className="hover:bg-green-200 rounded-full p-0.5 ml-1"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          )}
          <button
            onClick={() => onFiltersChange({})}
            className="text-[11px] text-gray-400 hover:text-red-500 underline transition-colors"
          >
            {dict.buttons.clearAll}
          </button>
        </div>
      )}
    </div>
  );
};

export default SuggestionActionBar;
