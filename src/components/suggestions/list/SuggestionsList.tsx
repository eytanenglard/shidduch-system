// src/app/components/suggestions/list/SuggestionsList.tsx

'use client';
import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Grid3X3,
  List as ListIcon,
  Check,
  XCircle,
  Sparkles,
  Heart,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import MinimalSuggestionCard from '../cards/MinimalSuggestionCard';
import SuggestionDetailsModal from '../modals/SuggestionDetailsModal';
import AskMatchmakerDialog from '../dialogs/AskMatchmakerDialog';
import { cn } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../types';
import type { SuggestionsDictionary } from '@/types/dictionary'; // ✨ Import dictionary type

interface SuggestionsListProps {
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  isHistory?: boolean;
  viewMode: 'grid' | 'list';
  isLoading?: boolean;
  className?: string;
  onStatusChange?: (
    suggestionId: string,
    newStatus: string,
    notes?: string
  ) => Promise<void>;
  onRefresh?: () => void;
  isUserInActiveProcess?: boolean;
  onActionRequest: (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline'
  ) => void;
  dict: SuggestionsDictionary; // ✨ Add dict prop
}

type SortOption = 'newest' | 'oldest' | 'deadline' | 'priority';
type FilterOption =
  | 'all'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'contact_shared';

const EmptyState: React.FC<{
  isFiltered: boolean;
  isHistory: boolean;
  onClearFilters: () => void;
  dict: SuggestionsDictionary['list']['emptyState'];
}> = ({ isFiltered, isHistory, onClearFilters, dict }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
    <div className="relative mb-8">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center shadow-lg">
        {isFiltered ? (
          <Search className="w-16 h-16 text-purple-400" />
        ) : isHistory ? (
          <Clock className="w-16 h-16 text-gray-400" />
        ) : (
          <Heart className="w-16 h-16 text-pink-400" />
        )}
      </div>
      {!isFiltered && !isHistory && (
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3">
      {isFiltered
        ? dict.noResultsTitle
        : isHistory
          ? dict.noHistoryTitle
          : dict.noActiveTitle}
    </h3>
    <p className="text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
      {isFiltered
        ? dict.noResultsDescription
        : isHistory
          ? dict.noHistoryDescription
          : dict.noActiveDescription}
    </p>
    {isFiltered && (
      <Button
        onClick={onClearFilters}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
      >
        <XCircle className="w-4 h-4 ml-2" />
        {dict.clearFilters}
      </Button>
    )}
  </div>
);

const StatsBar: React.FC<{
  total: number;
  filtered: number;
  pending: number;
  isHistory: boolean;
  dict: SuggestionsDictionary['list']['stats'];
}> = ({ total, filtered, pending, isHistory, dict }) => (
  <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-white via-purple-50/50 to-pink-50/50">
    <CardContent className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span className="text-2xl font-bold text-blue-600">{filtered}</span>
          </div>
          <p className="text-xs text-gray-600 font-medium">{dict.showing}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-2xl font-bold text-purple-600">{total}</span>
          </div>
          <p className="text-xs text-gray-600 font-medium">{dict.total}</p>
        </div>
        {!isHistory && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">
                {pending}
              </span>
            </div>
            <p className="text-xs text-gray-600 font-medium">{dict.pending}</p>
          </div>
        )}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-2xl font-bold text-green-600">
              {total > 0 ? Math.round(((total - pending) / total) * 100) : 0}%
            </span>
          </div>
          <p className="text-xs text-gray-600 font-medium">{dict.progress}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SuggestionsList: React.FC<SuggestionsListProps> = ({
  suggestions: initialSuggestions,
  isHistory = false,
  viewMode: initialViewMode,
  isLoading = false,
  userId,
  className,
  onActionRequest,
  isUserInActiveProcess,
  dict, // ✨ Destructure dict
}) => {
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<ExtendedMatchSuggestion | null>(null);
  const [showAskDialog, setShowAskDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [filteredSuggestions, setFilteredSuggestions] =
    useState<ExtendedMatchSuggestion[]>(initialSuggestions);

  const pendingCount = initialSuggestions.filter(
    (s) =>
      s.status === 'PENDING_FIRST_PARTY' || s.status === 'PENDING_SECOND_PARTY'
  ).length;

  useEffect(() => {
    // Filtering and sorting logic remains the same
    let result = [...initialSuggestions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((suggestion) => {
        const targetParty =
          suggestion.firstPartyId === userId
            ? suggestion.secondParty
            : suggestion.firstParty;
        return (
          targetParty.firstName.toLowerCase().includes(query) ||
          targetParty.lastName.toLowerCase().includes(query) ||
          targetParty.profile?.city?.toLowerCase().includes(query) ||
          targetParty.profile?.occupation?.toLowerCase().includes(query) ||
          targetParty.profile?.religiousLevel?.toLowerCase().includes(query)
        );
      });
    }

    if (filterOption !== 'all') {
      switch (filterOption) {
        case 'pending':
          result = result.filter(
            (s) =>
              s.status === 'PENDING_FIRST_PARTY' ||
              s.status === 'PENDING_SECOND_PARTY'
          );
          break;
        case 'accepted':
          result = result.filter(
            (s) =>
              s.status === 'FIRST_PARTY_APPROVED' ||
              s.status === 'SECOND_PARTY_APPROVED'
          );
          break;
        case 'declined':
          result = result.filter(
            (s) =>
              s.status === 'FIRST_PARTY_DECLINED' ||
              s.status === 'SECOND_PARTY_DECLINED'
          );
          break;
        case 'contact_shared':
          result = result.filter((s) => s.status === 'CONTACT_DETAILS_SHARED');
          break;
      }
    }

    switch (sortOption) {
      case 'newest':
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'oldest':
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case 'deadline':
        result.sort((a, b) => {
          if (!a.decisionDeadline) return 1;
          if (!b.decisionDeadline) return -1;
          return (
            new Date(a.decisionDeadline).getTime() -
            new Date(b.decisionDeadline).getTime()
          );
        });
        break;
      case 'priority':
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        result.sort(
          (a, b) =>
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
        );
        break;
    }
    setFilteredSuggestions(result);
  }, [initialSuggestions, searchQuery, sortOption, filterOption, userId]);

  const handleOpenDetails = (suggestion: ExtendedMatchSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleInquiry = (suggestion: ExtendedMatchSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowAskDialog(true);
  };

  const handleStatusAction = (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline'
  ) => {
    onActionRequest(suggestion, action);
  };

  const handleSendQuestion = async (questionText: string) => {
    if (!selectedSuggestion) return;
    try {
      // API call logic remains the same
      const response = await fetch(
        `/api/suggestions/${selectedSuggestion.id}/inquiries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: questionText }),
        }
      );
      if (!response.ok) throw new Error('Failed to send inquiry');
      toast.success('השאלה נשלחה בהצלחה לשדכן', {
        description: 'השדכן יחזור אליך עם תשובה בהקדם',
      });
      setShowAskDialog(false);
    } catch (error) {
      toast.error('אירעה שגיאה בשליחת השאלה');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterOption('all');
  };

  if (isLoading) {
    // Skeleton loading state remains the same
    return (
      <div className={cn('space-y-6', className)}>
        {/* Skeleton content... */}
      </div>
    );
  }

  return (
    <>
      <div className={cn('space-y-6', className)}>
        <StatsBar
          total={initialSuggestions.length}
          filtered={filteredSuggestions.length}
          pending={pendingCount}
          isHistory={isHistory}
          dict={dict.list.stats}
        />

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder={dict.list.controls.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-12 text-right border-gray-200 focus:border-purple-300 focus:ring-purple-200 rounded-xl h-12"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 border-gray-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl transition-colors"
                    >
                      <Filter className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-right">
                      {dict.list.controls.filterLabel}
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setFilterOption('all')}>
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filterOption === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {dict.list.controls.filterAll}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFilterOption('pending')}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filterOption === 'pending'
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {dict.list.controls.filterPending}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFilterOption('accepted')}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filterOption === 'accepted'
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {dict.list.controls.filterAccepted}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFilterOption('declined')}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filterOption === 'declined'
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {dict.list.controls.filterDeclined}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFilterOption('contact_shared')}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filterOption === 'contact_shared'
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        {dict.list.controls.filterContactShared}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Select
                  value={sortOption}
                  onValueChange={(value) => setSortOption(value as SortOption)}
                >
                  <SelectTrigger className="w-48 h-12 border-gray-200 focus:border-purple-300 rounded-xl">
                    <SelectValue
                      placeholder={dict.list.controls.sortPlaceholder}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">
                      <div className="flex items-center gap-2">
                        <SortDesc className="h-4 w-4" />
                        {dict.list.controls.sortNewest}
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest">
                      <div className="flex items-center gap-2">
                        <SortAsc className="h-4 w-4" />
                        {dict.list.controls.sortOldest}
                      </div>
                    </SelectItem>
                    <SelectItem value="deadline">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {dict.list.controls.sortDeadline}
                      </div>
                    </SelectItem>
                    <SelectItem value="priority">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {dict.list.controls.sortPriority}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {/* View mode toggle remains the same */}
              </div>
              {(searchQuery || filterOption !== 'all') && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">
                    {dict.list.activeFilters.title}
                  </span>
                  {searchQuery && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200"
                    >
                      {dict.list.activeFilters.search} {searchQuery}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSearchQuery('')}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  {filterOption !== 'all' && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-pink-50 text-pink-700 border-pink-200"
                    >
                      {filterOption === 'pending' &&
                        dict.list.controls.filterPending}
                      {filterOption === 'accepted' &&
                        dict.list.controls.filterAccepted}
                      {filterOption === 'declined' &&
                        dict.list.controls.filterDeclined}
                      {filterOption === 'contact_shared' &&
                        dict.list.controls.filterContactShared}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setFilterOption('all')}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={clearFilters}
                  >
                    {dict.list.activeFilters.clearAll}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {filteredSuggestions.length === 1
              ? dict.list.resultsCount.showingSingle
                  .replace('{{count}}', '1')
                  .replace('{{total}}', initialSuggestions.length.toString())
              : dict.list.resultsCount.showingMultiple
                  .replace('{{count}}', filteredSuggestions.length.toString())
                  .replace('{{total}}', initialSuggestions.length.toString())}
          </span>
          {filteredSuggestions.length > 0 && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-medium">
                {dict.list.resultsCount.qualityMatches}
              </span>
            </div>
          )}
        </div>

        {filteredSuggestions.length === 0 ? (
          <EmptyState
            isFiltered={searchQuery !== '' || filterOption !== 'all'}
            isHistory={isHistory}
            onClearFilters={clearFilters}
            dict={dict.list.emptyState}
          />
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-6',
              'animate-fade-in-up'
            )}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="animate-scale-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both',
                }}
              >
                <MinimalSuggestionCard
                  suggestion={suggestion}
                  userId={userId}
                  onClick={() => handleOpenDetails(suggestion)}
                  onInquiry={() => handleInquiry(suggestion)}
                  onApprove={() => handleStatusAction(suggestion, 'approve')}
                  onDecline={() => handleStatusAction(suggestion, 'decline')}
                  isHistory={isHistory}
                  isApprovalDisabled={isUserInActiveProcess}
                  className={cn(
                    'card-hover-elegant',
                    viewMode === 'list' ? 'flex' : ''
                  )}
                  dict={dict.card} // ✨ Pass card dict down
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <SuggestionDetailsModal
        suggestion={selectedSuggestion}
        userId={userId}
        isOpen={!!selectedSuggestion && !showAskDialog}
        onClose={() => setSelectedSuggestion(null)}
        onActionRequest={onActionRequest}
        questionnaire={
          selectedSuggestion?.secondParty?.questionnaireResponses?.[0] || null
        }
        dict={dict} // ✨ Pass full suggestions dict to modal
      />

      <AskMatchmakerDialog
        isOpen={showAskDialog}
        onClose={() => setShowAskDialog(false)}
        onSubmit={handleSendQuestion}
        matchmakerName={selectedSuggestion?.matchmaker.firstName}
        dict={dict.askMatchmaker} // הנחה שסוג המילון יועבר בצורה תקינה
      />
    </>
  );
};

export default SuggestionsList;
