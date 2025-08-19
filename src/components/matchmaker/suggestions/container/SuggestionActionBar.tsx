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
  Activity,
  BarChart3,
  Star,
  Flame,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Priority, MatchSuggestionStatus } from '@prisma/client';
import type { SuggestionFilters, SortByOption } from '@/types/suggestions';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SuggestionActionBarProps {
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
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  totalCount,
  activeCount,
  pendingCount,
  historyCount,
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
        dateRange: {
          start: range.from,
          end: range.to || new Date(),
        },
      });
    } else {
      const newFilters = { ...filters };
      delete newFilters.dateRange;
      onFiltersChange(newFilters);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING_FIRST_PARTY':
      case 'PENDING_SECOND_PARTY':
        return <Clock className="h-4 w-4 ml-1" />;
      case 'FIRST_PARTY_APPROVED':
      case 'SECOND_PARTY_APPROVED':
        return <CheckCircle className="h-4 w-4 ml-1" />;
      case 'FIRST_PARTY_DECLINED':
      case 'SECOND_PARTY_DECLINED':
        return <XCircle className="h-4 w-4 ml-1" />;
      default:
        return <AlertCircle className="h-4 w-4 ml-1" />;
    }
  };

  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return {
          icon: Flame,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
        };
      case 'HIGH':
        return {
          icon: Star,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
        };
      case 'MEDIUM':
        return {
          icon: Target,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'LOW':
        return {
          icon: Settings,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
        };
      default:
        return {
          icon: Target,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Modern Search and Quick Filters */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 overflow-hidden rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Enhanced Search */}
            <div className="relative flex-1 w-full lg:w-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl"></div>
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-400" />
              <Input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="חיפוש הצעות לפי שם, עיר או כל מידע אחר..."
                className="relative z-10 h-14 pr-14 text-right border-2 border-purple-200 hover:border-purple-300 focus:border-purple-500 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300 text-lg"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
            </div>

            {/* Priority Filter */}
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
                    <SelectValue placeholder="עדיפות" />
                  </div>
                </SelectTrigger>
                <SelectContent className="border-0 shadow-2xl rounded-xl">
                  <SelectItem value="all">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
                      כל העדיפויות
                    </div>
                  </SelectItem>
                  {Object.values(Priority).map((p) => {
                    const info = getPriorityInfo(p);
                    const Icon = info.icon;
                    return (
                      <SelectItem key={p} value={p}>
                        <div className="flex items-center gap-3">
                          <Icon className={cn('w-4 h-4', info.color)} />
                          {p === 'URGENT'
                            ? 'דחוף'
                            : p === 'HIGH'
                              ? 'גבוהה'
                              : p === 'MEDIUM'
                                ? 'רגילה'
                                : 'נמוכה'}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-14 px-6 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg transition-all duration-300"
                >
                  <Calendar className="h-5 w-5 ml-2 text-purple-500" />
                  <span className="font-medium">טווח זמן</span>
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
                      בחר טווח תאריכים
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
                      נקה
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Advanced Filters Toggle */}
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
              מסננים מתקדמים
              {activeFilters > 0 && (
                <Badge className="mr-2 bg-white/20 text-current border-white/30 px-2 py-1">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

 

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card className="border-0 shadow-xl bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  מסננים מתקדמים
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
              {/* Status Filter */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-800">סטטוס</h4>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {[
                    {
                      value: 'PENDING_FIRST_PARTY',
                      label: "ממתין לתשובת צד א'",
                      icon: Clock,
                      color: 'text-yellow-600',
                    },
                    {
                      value: 'PENDING_SECOND_PARTY',
                      label: "ממתין לתשובת צד ב'",
                      icon: Clock,
                      color: 'text-blue-600',
                    },
                    {
                      value: 'FIRST_PARTY_APPROVED',
                      label: "צד א' אישר",
                      icon: CheckCircle,
                      color: 'text-green-600',
                    },
                    {
                      value: 'SECOND_PARTY_APPROVED',
                      label: "צד ב' אישר",
                      icon: CheckCircle,
                      color: 'text-green-600',
                    },
                    {
                      value: 'DATING',
                      label: 'בתהליך היכרות',
                      icon: AlertCircle,
                      color: 'text-pink-600',
                    },
                  ].map((status) => {
                    const Icon = status.icon;
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
                            if (checked) {
                              const newStatus = [
                                ...(filters.status || []),
                                status.value,
                              ];
                              onFiltersChange({
                                ...filters,
                                status: newStatus as MatchSuggestionStatus[],
                              });
                            } else {
                              onFiltersChange({
                                ...filters,
                                status: filters.status?.filter(
                                  (s) => s !== status.value
                                ) as MatchSuggestionStatus[],
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`status-${status.value}`}
                          className="text-sm mr-2 flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <Icon className={cn('h-4 w-4', status.color)} />
                          {status.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* User Filter */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-800">משתתפים</h4>
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
                        <SelectValue placeholder="בחר משתתף" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל המשתתפים</SelectItem>
                      <SelectItem value="user1">ישראל ישראלי</SelectItem>
                      <SelectItem value="user2">שרה כהן</SelectItem>
                      <SelectItem value="user3">דוד לוי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-800">מיון לפי</h4>
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
                        <SelectValue placeholder="מיון לפי" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lastActivity">
                        פעילות אחרונה
                      </SelectItem>
                      <SelectItem value="createdAt">תאריך יצירה</SelectItem>
                      <SelectItem value="priority">עדיפות</SelectItem>
                      <SelectItem value="decisionDeadline">
                        תאריך יעד
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {activeFilters > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                  <Filter className="w-4 h-4" />
                </div>
                <span className="font-bold text-indigo-800">סינון פעיל:</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {filters.priority && (
                  <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg px-3 py-1 rounded-xl">
                    <Star className="w-3 h-3 ml-1" />
                    עדיפות:{' '}
                    {filters.priority[0] === 'URGENT'
                      ? 'דחוף'
                      : filters.priority[0] === 'HIGH'
                        ? 'גבוהה'
                        : filters.priority[0] === 'MEDIUM'
                          ? 'רגילה'
                          : 'נמוכה'}
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
                    תאריך:{' '}
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
                    סטטוס:{' '}
                    {filters.status.length === 1
                      ? '1 סטטוס'
                      : `${filters.status.length} סטטוסים`}
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
                    משתתף מסוים
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
                  נקה הכל
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
