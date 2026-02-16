// src/components/suggestions/list/SuggestionsList.tsx

'use client';
import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Check,
  XCircle,
  Sparkles,
  Heart,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { LoadingContainer } from '@/components/matchmaker/new//shared/LoadingStates';
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
import type {
  SuggestionsDictionary,
  ProfileCardDict,
} from '@/types/dictionary';

// --- Helper to ensure Questionnaire Data Structure Matches Demo ---
// פונקציית עזר זו נועדה לוודא שהשאלון מכיל את המבנה ש-ProfileCard מצפה לו (formattedAnswers).
// במערכת אמיתית, הטרנספורמציה הזו צריכה לקרות בשרת או ב-hook נפרד, אך כאן אנו מבטיחים
// שלא נקבל קריסה או תצוגה ריקה.
const enhanceQuestionnaireData = (
  suggestion: ExtendedMatchSuggestion | null
) => {
  const rawQuestionnaire = suggestion?.secondParty?.questionnaireResponses?.[0];

  if (!rawQuestionnaire) return null;

  // אם כבר יש formattedAnswers, נחזיר כמו שהוא
  if (rawQuestionnaire.formattedAnswers) {
    return rawQuestionnaire;
  }

  // TODO: כאן המקום להוסיף לוגיקה שממירה את התשובות הגולמיות (rawQuestionnaire.valuesAnswers וכו')
  // למבנה של formattedAnswers כפי שקיים ב-demo-data.ts.
  // כרגע נחזיר את האובייקט כמו שהוא, אך שים לב שזהו המקור להבדל בתצוגה.
  return rawQuestionnaire;
};

interface SuggestionsListProps {
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  locale: 'he' | 'en';
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
  suggestionsDict: SuggestionsDictionary;
  profileCardDict: ProfileCardDict;
}

type SortOption = 'newest' | 'oldest' | 'deadline' | 'priority';
type FilterOption =
  | 'all'
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'contact_shared';

// ... (EmptyState component remains the same)
const EmptyState: React.FC<{
  isFiltered: boolean;
  isHistory: boolean;
  onClearFilters: () => void;
  dict: SuggestionsDictionary['list']['emptyState'];
}> = ({ isFiltered, isHistory, onClearFilters, dict }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
    <div className="relative mb-8">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-teal-100 to-orange-100 flex items-center justify-center shadow-lg">
        {isFiltered ? (
          <Search className="w-16 h-16 text-teal-500" />
        ) : isHistory ? (
          <Clock className="w-16 h-16 text-gray-400" />
        ) : (
          <Heart className="w-16 h-16 text-rose-400" />
        )}
      </div>
      {!isFiltered && !isHistory && (
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
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
        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
      >
        <XCircle className="w-4 h-4 ml-2" />
        {dict.clearFilters}
      </Button>
    )}
  </div>
);

// ... (StatsBar component remains the same)
const StatsBar: React.FC<{
  total: number;
  filtered: number;
  pending: number;
  isHistory: boolean;
  dict: SuggestionsDictionary['list']['stats'];
}> = ({ total, filtered, pending, isHistory, dict }) => (
  <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-white via-teal-50/50 to-orange-50/50">
    <CardContent className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <span className="text-2xl font-bold text-teal-600">{filtered}</span>
          </div>
          <p className="text-xs text-gray-600 font-medium">{dict.showing}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Users className="w-4 h-4 text-rose-500" />
            <span className="text-2xl font-bold text-rose-600">{total}</span>
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
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-2xl font-bold text-emerald-600">
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
  locale,
  className,
  onActionRequest,
  isUserInActiveProcess,
  suggestionsDict,
  profileCardDict,
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
      case 'priority': {
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        result.sort(
          (a, b) =>
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) -
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 4)
        );
        break;
      }
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
      const response = await fetch(
        `/api/suggestions/${selectedSuggestion.id}/inquiries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: questionText }),
        }
      );
      if (!response.ok) throw new Error('Failed to send inquiry');
    toast.success(suggestionsDict.inquiryThread.toasts.sendSuccessTitle, {
  description: suggestionsDict.inquiryThread.toasts.sendSuccessDescription
});
      setShowAskDialog(false);
    } catch (error) {
      toast.error(suggestionsDict.inquiryThread.toasts.sendError);

    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterOption('all');
  };

  // --- Calculating the enhanced questionnaire data for the modal ---
  const selectedQuestionnaireData = useMemo(() => {
    return enhanceQuestionnaireData(selectedSuggestion);
  }, [selectedSuggestion]);

  if (isLoading) {
    return (
      <LoadingContainer className="mt-6">
        {/* ... Loading Skeleton code ... */}
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-6'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'relative overflow-hidden rounded-3xl bg-white shadow-lg border border-gray-100',
                viewMode === 'list' ? 'h-48 flex' : 'h-[450px] flex flex-col'
              )}
            >
              <div className="h-24 bg-gradient-to-r from-teal-50/50 to-orange-50/50 p-6 border-b border-gray-50">
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-24 h-6 rounded-full bg-teal-50 animate-pulse" />
                </div>
              </div>
              <div className="p-6 flex-1 space-y-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-1/2 h-4 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-gray-50 rounded animate-pulse" />
                  <div className="w-5/6 h-3 bg-gray-50 rounded animate-pulse" />
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-teal-50/30 to-orange-50/30 border-t border-gray-100 flex justify-between gap-4">
                <div className="h-10 flex-1 bg-white rounded-xl border border-gray-200 animate-pulse" />
                <div className="h-10 flex-1 bg-teal-50 rounded-xl animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </LoadingContainer>
    );
  }

  return (
    <>
      <div className={cn('space-y-6', className)}>
        {/* ... StatsBar and Controls code (unchanged) ... */}
        <StatsBar
          total={initialSuggestions.length}
          filtered={filteredSuggestions.length}
          pending={pendingCount}
          isHistory={isHistory}
          dict={suggestionsDict.list.stats}
        />

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder={
                      suggestionsDict.list.controls.searchPlaceholder
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-12 text-right border-gray-200 focus:border-teal-300 focus:ring-teal-200 rounded-xl h-12"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 border-gray-200 hover:border-teal-300 hover:bg-teal-50 rounded-xl transition-colors"
                    >
                      <Filter className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-right">
                      {suggestionsDict.list.controls.filterLabel}
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setFilterOption('all')}>
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            filterOption === 'all' ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {suggestionsDict.list.controls.filterAll}
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
                        {suggestionsDict.list.controls.filterPending}
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
                        {suggestionsDict.list.controls.filterAccepted}
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
                        {suggestionsDict.list.controls.filterDeclined}
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
                        {suggestionsDict.list.controls.filterContactShared}
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Select
                  value={sortOption}
                  onValueChange={(value) => setSortOption(value as SortOption)}
                >
                  <SelectTrigger className="w-48 h-12 border-gray-200 focus:border-teal-300 rounded-xl">
                    <SelectValue
                      placeholder={
                        suggestionsDict.list.controls.sortPlaceholder
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">
                      <div className="flex items-center gap-2">
                        <SortDesc className="h-4 w-4" />
                        {suggestionsDict.list.controls.sortNewest}
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest">
                      <div className="flex items-center gap-2">
                        <SortAsc className="h-4 w-4" />
                        {suggestionsDict.list.controls.sortOldest}
                      </div>
                    </SelectItem>
                    <SelectItem value="deadline">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {suggestionsDict.list.controls.sortDeadline}
                      </div>
                    </SelectItem>
                    <SelectItem value="priority">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {suggestionsDict.list.controls.sortPriority}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(searchQuery || filterOption !== 'all') && (
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">
                    {suggestionsDict.list.activeFilters.title}
                  </span>
                  {searchQuery && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 bg-teal-50 text-teal-700 border-teal-200"
                    >
                      {suggestionsDict.list.activeFilters.search} {searchQuery}
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
                      className="flex items-center gap-1 bg-orange-50 text-orange-700 border-orange-200"
                    >
                      {filterOption === 'pending' &&
                        suggestionsDict.list.controls.filterPending}
                      {filterOption === 'accepted' &&
                        suggestionsDict.list.controls.filterAccepted}
                      {filterOption === 'declined' &&
                        suggestionsDict.list.controls.filterDeclined}
                      {filterOption === 'contact_shared' &&
                        suggestionsDict.list.controls.filterContactShared}
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
                    {suggestionsDict.list.activeFilters.clearAll}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ... Results count ... */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {filteredSuggestions.length === 1
              ? suggestionsDict.list.resultsCount.showingSingle
                  .replace('{{count}}', '1')
                  .replace('{{total}}', initialSuggestions.length.toString())
              : suggestionsDict.list.resultsCount.showingMultiple
                  .replace('{{count}}', filteredSuggestions.length.toString())
                  .replace('{{total}}', initialSuggestions.length.toString())}
          </span>
          {filteredSuggestions.length > 0 && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span className="font-medium">
                {suggestionsDict.list.resultsCount.qualityMatches}
              </span>
            </div>
          )}
        </div>

        {filteredSuggestions.length === 0 ? (
          <EmptyState
            isFiltered={searchQuery !== '' || filterOption !== 'all'}
            isHistory={isHistory}
            onClearFilters={clearFilters}
            dict={suggestionsDict.list.emptyState}
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
                  locale={locale}
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
                  dict={suggestionsDict.card}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <SuggestionDetailsModal
        suggestion={selectedSuggestion}
        userId={userId}
        locale={locale}
        isOpen={!!selectedSuggestion && !showAskDialog}
        onClose={() => setSelectedSuggestion(null)}
        onActionRequest={onActionRequest}
        // השינוי העיקרי כאן: שימוש בנתונים המעובדים
        questionnaire={selectedQuestionnaireData}
        isDemo={false} // במערכת האמיתית זה False
        // demoAnalysisData={...} // לא מעבירים כאן, המודאל ינסה למשוך מה-API
        dict={{
          suggestions: suggestionsDict,
          profileCard: profileCardDict,
        }}
      />

      <AskMatchmakerDialog
        isOpen={showAskDialog}
        onClose={() => setShowAskDialog(false)}
        onSubmit={handleSendQuestion}
        matchmakerName={selectedSuggestion?.matchmaker.firstName}
        dict={suggestionsDict.askMatchmaker}
      />
    </>
  );
};

export default SuggestionsList;
