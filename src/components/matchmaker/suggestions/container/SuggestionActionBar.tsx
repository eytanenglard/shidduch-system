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
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Target,
  Zap,
  Settings,
  TrendingUp,
  Star,
  Flame,
  Shield,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Priority, MatchSuggestionStatus } from '@prisma/client';
import type { SuggestionFilters, SortByOption } from '@/types/suggestions';
import { Card, CardContent } from '@/components/ui/card';
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

const SuggestionActionBar: React.FC<SuggestionActionBarProps> = ({
  dict,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
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
        dateRange: { start: range.from, end: range.to || new Date() },
      });
    } else {
      const newFilters = { ...filters };
      delete newFilters.dateRange;
      onFiltersChange(newFilters);
    }
  };

  // ✅ תיקון: יצירת אובייקט מיפוי לאייקונים במקום פונקציה חסרה
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
    { value: 'PENDING_FIRST_PARTY', icon: Clock, color: 'text-yellow-600' },
    { value: 'PENDING_SECOND_PARTY', icon: Clock, color: 'text-blue-600' },
    {
      value: 'FIRST_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      value: 'SECOND_PARTY_APPROVED',
      icon: CheckCircle,
      color: 'text-green-600',
    },
    { value: 'DATING', icon: AlertCircle, color: 'text-pink-600' },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 overflow-hidden rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full lg:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl"></div>
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="relative z-10 h-14 pr-14 text-right border-2 border-purple-200 hover:border-purple-300 focus:border-purple-500 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300 text-lg"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
            </div>
            <div className="w-full lg:w-auto">
              <Select
                value={filters.priority?.[0] || 'all'}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    priority: value === 'all' ? undefined : [value as Priority],
                  })
                }
              >
                <SelectTrigger className="h-14 w-full lg:w-48 border-2 border-purple-200 hover:border-purple-300 focus:border-purple-500 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg transition-all">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-purple-500" />
                    <SelectValue
                      placeholder={dict.priorityFilter.placeholder}
                    />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-0 shadow-2xl rounded-xl">
                  <SelectItem value="all">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                      {dict.priorityFilter.all}
                    </div>
                  </SelectItem>
                  {/* ✅ תיקון: הלולאה תוקנה להשתמש במפת האייקונים */}
                  {Object.entries(dict.priorityFilter.options).map(
                    ([key, label]: [string, string]) => {
                      const info =
                        priorityInfoMap[key] || priorityInfoMap.MEDIUM;
                      const Icon = info.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-3">
                            <Icon className={cn('w-4 h-4', info.color)} />
                            {label}
                          </div>
                        </SelectItem>
                      );
                    }
                  )}
                </SelectContent>
              </Select>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-14 px-6 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300"
                >
                  <Calendar className="h-5 w-5 ml-2 text-purple-500" />
                  <span className="font-medium">{dict.buttons.dateRange}</span>
                  <ChevronDown className="h-4 w-4 mr-2 text-purple-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-4 border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-sm"
                align="end"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <h4 className="font-bold text-gray-800">
                      {dict.buttons.dateRange}
                    </h4>
                  </div>
                  <DatePicker
                    onChange={handleDateRangeChange}
                    value={dateRange}
                    isRange={true}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleDateRangeChange({
                          from: undefined,
                          to: undefined,
                        })
                      }
                      className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      {dict.buttons.clearDate}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant={showAdvancedFilters ? 'default' : 'outline'}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                'h-14 px-6 rounded-xl transition-all duration-300 font-bold',
                showAdvancedFilters
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl hover:shadow-2xl'
                  : 'border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 bg-white/80 backdrop-blur-sm shadow-lg text-purple-600'
              )}
            >
              <SlidersHorizontal className="w-5 h-5 ml-2" />
              {dict.buttons.advancedFilters}
              {activeFilters > 0 && (
                <Badge className="mr-2 bg-white/20 text-current border-white/30 px-2 py-1">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      {showAdvancedFilters && (
        <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  {dict.advancedFilters.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-3 rounded-xl hover:bg-white/50"
                onClick={() => setShowAdvancedFilters(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-800">
                    {dict.advancedFilters.statusTitle}
                  </h4>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    const label =
                      dict.advancedFilters.statusOptions[
                        status.value as keyof typeof dict.advancedFilters.statusOptions
                      ];
                    return (
                      <div
                        key={status.value}
                        className="flex items-center space-x-2 p-3 bg-white/70 rounded-xl hover:bg-white/90 transition-all"
                      >
                        <Checkbox
                          id={`status-${status.value}`}
                          checked={filters.status?.includes(
                            status.value as MatchSuggestionStatus
                          )}
                          onCheckedChange={(checked) => {
                            const newStatus = checked
                              ? [...(filters.status || []), status.value]
                              : filters.status?.filter(
                                  (s) => s !== status.value
                                );
                            onFiltersChange({
                              ...filters,
                              status: newStatus as MatchSuggestionStatus[],
                            });
                          }}
                        />
                        <label
                          htmlFor={`status-${status.value}`}
                          className="text-sm mr-2 flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Icon className={cn('h-4 w-4', status.color)} />
                          {label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-800">
                    {dict.advancedFilters.participantsTitle}
                  </h4>
                </div>
                <div className="p-4 bg-white/70 rounded-xl">
                  <Select
                    value={filters.userId || 'all'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        userId: value === 'all' ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger className="border-2 border-green-200 focus:border-green-400 rounded-xl">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-500" />
                        <SelectValue
                          placeholder={dict.advancedFilters.participantsTitle}
                        />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {dict.advancedFilters.participantOptions.all}
                      </SelectItem>
                      <SelectItem value="user1">ישראל ישראלי</SelectItem>
                      <SelectItem value="user2">שרה כהן</SelectItem>
                      <SelectItem value="user3">דוד לוי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-800">
                    {dict.advancedFilters.sortByTitle}
                  </h4>
                </div>
                <div className="p-4 bg-white/70 rounded-xl">
                  <Select
                    value={filters.sortBy || 'lastActivity'}
                    onValueChange={(value) =>
                      onFiltersChange({
                        ...filters,
                        sortBy: value as SortByOption,
                      })
                    }
                  >
                    <SelectTrigger className="border-2 border-purple-200 focus:border-purple-400 rounded-xl">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
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
          </CardContent>
        </Card>
      )}
      {activeFilters > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                  <Filter className="w-4 h-4" />
                </div>
                <span className="font-bold text-indigo-800">
                  {dict.activeFilters.title}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {filters.priority && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg px-3 py-1 rounded-xl">
                    <Star className="w-3 h-3 ml-1" />
                    {dict.activeFilters.priorityLabel}:{' '}
                    {dict.priorityFilter.options[filters.priority[0]]}
                    <button
                      onClick={() => handleRemoveFilter('priority')}
                      className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.dateRange && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg px-3 py-1 rounded-xl">
                    <Calendar className="w-3 h-3 ml-1" />
                    {dict.activeFilters.dateLabel}:{' '}
                    {new Date(filters.dateRange.start).toLocaleDateString(
                      'he-IL'
                    )}
                    {filters.dateRange.end &&
                      ` - ${new Date(filters.dateRange.end).toLocaleDateString('he-IL')}`}
                    <button
                      onClick={() => handleRemoveFilter('dateRange')}
                      className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.status && filters.status.length > 0 && (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg px-3 py-1 rounded-xl">
                    <AlertCircle className="w-3 h-3 ml-1" />
                    {dict.activeFilters.statusLabel}:{' '}
                    {filters.status.length === 1
                      ? dict.activeFilters.statusValues.single
                      : dict.activeFilters.statusValues.multiple.replace(
                          '{{count}}',
                          filters.status.length.toString()
                        )}
                    <button
                      onClick={() => handleRemoveFilter('status')}
                      className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {filters.userId && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg px-3 py-1 rounded-xl">
                    <User className="w-3 h-3 ml-1" />
                    {dict.activeFilters.userLabel}:{' '}
                    {dict.activeFilters.userValue}
                    <button
                      onClick={() => handleRemoveFilter('userId')}
                      className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFiltersChange({})}
                  className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all font-medium"
                >
                  <RefreshCw className="w-3 h-3 ml-1" />
                  {dict.buttons.clearAll}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuggestionActionBar;
