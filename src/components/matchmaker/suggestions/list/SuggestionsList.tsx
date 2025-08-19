import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter, 
  SortDesc, 
  LayoutGrid, 
  List, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Heart,
  Star,
  TrendingUp,
  Activity,
  BarChart3,
  Eye,
  Sparkles,
  Target,
  Flame,
  Shield,
  Award,
  Crown,
  Zap,
  RefreshCw,
  Calendar,
  MapPin,
} from "lucide-react";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";
import SuggestionCard from "../cards/SuggestionCard";
import { LoadingContainer } from "../../new/shared/LoadingStates";
import type {
  Suggestion,
  ActionAdditionalData,
  SuggestionStatusHistory,
} from "@/types/suggestions";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface PartyInfo {
  id: string;
  firstName: string;
  lastName: string;
  profile: UserProfile;
  images: UserImage[];
}

interface ExtendedMatchSuggestion extends MatchSuggestion {
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  statusHistory: SuggestionStatusHistory[];
}

interface SuggestionsListProps {
  suggestions: ExtendedMatchSuggestion[];
  isLoading?: boolean;
  onAction: (
    type:
      | "view"
      | "contact"
      | "message"
      | "edit"
      | "delete"
      | "resend"
      | "changeStatus"
      | "reminder",
    suggestion: Suggestion,
    additionalData?: ActionAdditionalData
  ) => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: "latest", label: "החדשים ביותר", icon: TrendingUp },
  { value: "oldest", label: "הישנים ביותר", icon: Calendar },
  { value: "deadline", label: "לפי תאריך יעד", icon: Clock },
  { value: "priority", label: "לפי דחיפות", icon: Flame },
];

const STATUS_OPTIONS = [
  { 
    value: "PENDING_FIRST_PARTY", 
    label: "ממתין לצד א׳", 
    color: "from-yellow-500 to-amber-500",
    icon: Clock
  },
  { 
    value: "PENDING_SECOND_PARTY", 
    label: "ממתין לצד ב׳", 
    color: "from-blue-500 to-cyan-500",
    icon: Clock
  },
  { 
    value: "FIRST_PARTY_APPROVED", 
    label: "צד א׳ אישר", 
    color: "from-green-500 to-emerald-500",
    icon: CheckCircle
  },
  { 
    value: "SECOND_PARTY_APPROVED", 
    label: "צד ב׳ אישר", 
    color: "from-green-500 to-emerald-500",
    icon: CheckCircle
  },
  { 
    value: "CONTACT_DETAILS_SHARED", 
    label: "פרטי קשר שותפו", 
    color: "from-purple-500 to-pink-500",
    icon: Heart
  },
  { 
    value: "DATING", 
    label: "בתהליך היכרות", 
    color: "from-pink-500 to-rose-500",
    icon: Heart
  },
];

// Enhanced Stats Component
const EnhancedListStats: React.FC<{
  total: number;
  pending: number;
  approved: number;
  declined: number;
  urgent: number;
}> = ({ total, pending, approved, declined, urgent }) => (
  <Card className="border-0 shadow-xl bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 mb-6">
    <CardContent className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total */}
        <div className="text-center group">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold text-blue-600">{total}</span>
          </div>
          <p className="text-xs text-gray-600 font-medium">סך הכל</p>
        </div>

        {/* Pending */}
        <div className="text-center group">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold text-yellow-600">{pending}</span>
          </div>
          <p className="text-xs text-gray-600 font-medium">ממתינות</p>
        </div>

        {/* Approved */}
        <div className="text-center group">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold text-green-600">{approved}</span>
          </div>
          <p className="text-xs text-gray-600 font-medium">מאושרות</p>
        </div>

        {/* Declined */}
        <div className="text-center group">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold text-red-600">{declined}</span>
          </div>
          <p className="text-xs text-gray-600 font-medium">נדחו</p>
        </div>

        {/* Urgent */}
        <div className="text-center group">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg group-hover:scale-110 transition-transform animate-pulse">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-2xl font-bold text-orange-600">{urgent}</span>
          </div>
          <p className="text-xs text-gray-600 font-medium">דחופות</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Enhanced Filter Bar
const EnhancedFilterSection: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (status: string[]) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}> = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  statusFilter,
  onStatusFilterChange,
  showFilters,
  onToggleFilters,
  viewMode,
  onViewModeChange,
}) => (
  <Card className="border-0 shadow-xl bg-gradient-to-r from-white via-cyan-50/30 to-blue-50/30 mb-6">
    <CardContent className="p-6 space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="חיפוש לפי שם או עיר..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pr-12 text-right bg-white/80 backdrop-blur-sm border-cyan-200 focus:border-cyan-400 focus:ring-cyan-200 rounded-xl h-12 shadow-sm"
          />
        </div>

        {/* Sort Select */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48 h-12 bg-white/80 backdrop-blur-sm border-cyan-200 focus:border-cyan-400 rounded-xl shadow-sm">
            <SortDesc className="w-4 h-4 ml-2" />
            <SelectValue placeholder="מיון לפי..." />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className={cn(
            "h-12 border-cyan-200 hover:bg-cyan-50 text-cyan-600 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm",
            showFilters && "bg-cyan-100 border-cyan-300"
          )}
        >
          <Filter className="w-4 h-4 ml-2" />
          סינון
        </Button>

        {/* View Mode Toggle */}
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value: 'grid' | 'list') => value && onViewModeChange(value)}
          className="bg-white/80 backdrop-blur-sm shadow-sm rounded-xl border border-cyan-200"
        >
          <ToggleGroupItem 
            value="grid" 
            aria-label="Grid view"
            className="data-[state=on]:bg-cyan-500 data-[state=on]:text-white"
          >
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="list" 
            aria-label="List view"
            className="data-[state=on]:bg-cyan-500 data-[state=on]:text-white"
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="pt-4 border-t border-cyan-100 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              סינון לפי סטטוס
            </h4>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => {
                const IconComponent = status.icon;
                return (
                  <Button
                    key={status.value}
                    variant={statusFilter.includes(status.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newFilter = statusFilter.includes(status.value)
                        ? statusFilter.filter((s) => s !== status.value)
                        : [...statusFilter, status.value];
                      onStatusFilterChange(newFilter);
                    }}
                    className={cn(
                      "text-xs rounded-xl transition-all duration-300",
                      statusFilter.includes(status.value)
                        ? `bg-gradient-to-r ${status.color} text-white shadow-lg border-0`
                        : "border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <IconComponent className="w-3 h-3 ml-1" />
                    {status.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusFilterChange([])}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="w-3 h-3 ml-1" />
              נקה סינונים
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

// Enhanced Empty State
const EnhancedEmptyState: React.FC<{
  isFiltered: boolean;
  onClearFilters: () => void;
}> = ({ isFiltered, onClearFilters }) => (
  <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-12">
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center shadow-xl mb-8">
      {isFiltered ? (
        <Search className="w-16 h-16 text-purple-400" />
      ) : (
        <Users className="w-16 h-16 text-purple-400" />
      )}
    </div>
    
    <h3 className="text-2xl font-bold text-gray-800 mb-4">
      {isFiltered ? 'לא נמצאו תוצאות' : 'אין הצעות כרגע'}
    </h3>
    
    <p className="text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
      {isFiltered 
        ? 'נסה לשנות את קריטריוני החיפוש או הסינון כדי למצוא את מה שאתה מחפש'
        : 'כשיהיו הצעות זמינות, הן יופיעו כאן'
      }
    </p>

    {isFiltered && (
      <Button
        onClick={onClearFilters}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
      >
        <RefreshCw className="w-4 h-4 ml-2" />
        נקה סינון
      </Button>
    )}
  </div>
);

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions,
  isLoading = false,
  onAction,
  className,
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Calculate stats
  const stats = useMemo(() => {
    const total = suggestions.length;
    const pending = suggestions.filter(s => 
      s.status === 'PENDING_FIRST_PARTY' || s.status === 'PENDING_SECOND_PARTY'
    ).length;
    const approved = suggestions.filter(s => 
      s.status === 'FIRST_PARTY_APPROVED' || s.status === 'SECOND_PARTY_APPROVED'
    ).length;
    const declined = suggestions.filter(s => 
      s.status === 'FIRST_PARTY_DECLINED' || s.status === 'SECOND_PARTY_DECLINED'
    ).length;
    const urgent = suggestions.filter(s => s.priority === 'URGENT').length;

    return { total, pending, approved, declined, urgent };
  }, [suggestions]);

  // Filter and sort suggestions
  const filteredSuggestions = useMemo(() => {
    let result = [...suggestions];

    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter((s) => statusFilter.includes(s.status));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const searchText = `${s.firstParty.firstName} ${s.firstParty.lastName} ${s.secondParty.firstName} ${s.secondParty.lastName} ${s.firstParty.profile?.city || ''} ${s.secondParty.profile?.city || ''}`.toLowerCase();
        return searchText.includes(query);
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "latest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "deadline":
        result.sort((a, b) => {
          if (!a.decisionDeadline) return 1;
          if (!b.decisionDeadline) return -1;
          return (
            new Date(a.decisionDeadline).getTime() -
            new Date(b.decisionDeadline).getTime()
          );
        });
        break;
      case "priority":
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        result.sort(
          (a, b) => 
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
        );
        break;
    }

    return result;
  }, [suggestions, searchQuery, sortBy, statusFilter]);

  const isFiltered = searchQuery !== '' || statusFilter.length > 0;

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Enhanced Stats */}
      <EnhancedListStats {...stats} />

      {/* Enhanced Filter Section */}
      <EnhancedFilterSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600 px-2">
        <span className="font-medium">
          מציג {filteredSuggestions.length} {filteredSuggestions.length === 1 ? 'הצעה' : 'הצעות'} מתוך {suggestions.length}
        </span>
        {filteredSuggestions.length > 0 && (
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-purple-600">התאמות איכותיות</span>
          </div>
        )}
      </div>

      {/* Suggestions Grid/List */}
      {isLoading ? (
        <LoadingContainer>
          <div className="space-y-6">
            {/* Loading Stats */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="text-center space-y-2">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Loading Cards */}
            <div className={cn(
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            )}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse shadow-lg"
                />
              ))}
            </div>
          </div>
        </LoadingContainer>
      ) : filteredSuggestions.length === 0 ? (
        <EnhancedEmptyState
          isFiltered={isFiltered}
          onClearFilters={clearAllFilters}
        />
      ) : (
        <div className={cn(
          "animate-fade-in-up",
          viewMode === 'grid'
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-6"
        )}>
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className="animate-scale-in"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'both',
              }}
            >
              <SuggestionCard
                suggestion={suggestion as unknown as Suggestion}
                onAction={onAction}
                variant={viewMode === 'list' ? 'full' : 'full'}
                className={cn(
                  "card-hover-elegant shadow-lg hover:shadow-xl transition-all duration-300",
                  viewMode === 'list' && "flex"
                )}
              />
            </div>
          ))}
        </div>
      )}

      {/* Filter Summary */}
      {(searchQuery || statusFilter.length > 0) && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-purple-700">סינון פעיל:</span>
                
                {searchQuery && (
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-sm">
                    חיפוש: {searchQuery}
                  </Badge>
                )}
                
                {statusFilter.map((status) => {
                  const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
                  if (!statusOption) return null;
                  const IconComponent = statusOption.icon;
                  
                  return (
                    <Badge 
                      key={status}
                      className={cn(
                        `bg-gradient-to-r ${statusOption.color} text-white border-0 shadow-sm`
                      )}
                    >
                      <IconComponent className="w-3 h-3 ml-1" />
                      {statusOption.label}
                    </Badge>
                  );
                })}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-xl"
              >
                <RefreshCw className="w-3 h-3 ml-1" />
                נקה הכל
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Insights */}
      {filteredSuggestions.length > 0 && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">תובנות ביצועים</h4>
                  <p className="text-sm text-emerald-600">
                    {Math.round((stats.approved / stats.total) * 100)}% אחוז אישור •{' '}
                    {stats.urgent > 0 && `${stats.urgent} דחופות •`}{' '}
                    {stats.pending} ממתינות לטיפול
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right text-xs text-emerald-600">
                  <div className="font-bold">{Math.round((stats.approved / Math.max(stats.total, 1)) * 100)}%</div>
                  <div>הצלחה</div>
                </div>
                <div className="w-16 h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                    style={{ width: `${Math.round((stats.approved / Math.max(stats.total, 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuggestionsList;