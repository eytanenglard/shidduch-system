'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import type {
  SuggestionsDictionary,
  MatchmakerPageDictionary,
  ProfilePageDictionary,
} from '@/types/dictionary';
import {
  Plus,
  RefreshCw,
  BarChart,
  Loader2,
  List,
  Archive,
  LayoutGrid,
  Filter,
  Search,
  TrendingUp,
  Users,
  Clock,
  Heart,
  Sparkles,
  Target,
  Crown,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MatchSuggestionStatus, Priority } from '@prisma/client';
import { cn } from '@/lib/utils';

// Type imports
import type {
  Suggestion,
  SuggestionFilters,
  ActionAdditionalData,
} from '@/types/suggestions';
import type { NewSuggestionFormData } from '../../suggestions/NewSuggestionForm/schema';

// Hooks
import { useCandidates } from '../../new/hooks/useCandidates';

// Components
import NewSuggestionForm from '../../suggestions/NewSuggestionForm';
import SuggestionActionBar from './SuggestionActionBar';
import SuggestionDetailsDialog from '../details/SuggestionDetailsDialog';
import SuggestionCard from '../cards/SuggestionCard';
import EditSuggestionForm from '../EditSuggestionForm';
import MessageForm from '../MessageForm';
import MonthlyTrendModal from './MonthlyTrendModal';
import { ScrollArea } from '@/components/ui/scroll-area';

// Media query hook
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);
  return matches;
};

// ═══════════════════════════════════════════════════════════════
// COLLAPSIBLE HERO SECTION
// ═══════════════════════════════════════════════════════════════

const MatchmakerHeroSection: React.FC<{
  dict: MatchmakerPageDictionary['suggestionsDashboard']['heroSection'];
  onNewSuggestion: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  stats: {
    total: number;
    pending: number;
    active: number;
    success: number;
    thisMonth: number;
    successRate: number;
  };
}> = ({ dict, onNewSuggestion, onRefresh, isRefreshing, stats }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative bg-gradient-to-br from-purple-50 via-cyan-50/30 to-emerald-50/20 overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl mb-6 sm:mb-8">
      {/* ── Background decorations (only when open) ── */}
      {isOpen && (
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-float" />
          <div
            className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-2xl animate-float"
            style={{ animationDelay: '2s' }}
          />
        </div>
      )}

      <div className="relative z-10">
        {/* ── Collapsed Bar – תמיד נראה ── */}
        <div className="flex items-center justify-between p-4 sm:p-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {dict.title}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                {dict.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle stats button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl text-xs sm:text-sm"
            >
              <BarChart className="w-4 h-4 ml-1.5" />
              <span className="hidden sm:inline">
                {dict.statsButton || 'סטטיסטיקות'}
              </span>
              {isOpen ? (
                <ChevronUp className="w-3.5 h-3.5 mr-1" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 mr-1" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl text-xs sm:text-sm"
            >
              <RefreshCw
                className={cn('w-4 h-4 ml-1', isRefreshing && 'animate-spin')}
              />
              <span className="hidden sm:inline">
                {isRefreshing ? dict.refreshingButton : dict.refreshButton}
              </span>
            </Button>

            <Button
              onClick={onNewSuggestion}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg rounded-xl text-xs sm:text-sm font-bold"
            >
              <Plus className="w-4 h-4 ml-1" />
              {dict.newSuggestionButton}
              <Sparkles className="w-3.5 h-3.5 mr-1 hidden sm:block" />
            </Button>
          </div>
        </div>

        {/* ── Expanded Stats – נפתח בלחיצה ── */}
        {isOpen && (
          <div className="px-4 sm:px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-blue-600">
                      {stats.total}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {dict.totalSuggestions}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-orange-600">
                      {stats.pending}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {dict.pendingResponse}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">
                      {stats.success}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {dict.successfulMatches}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-3 sm:p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-purple-600">
                      {stats.successRate}%
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    {dict.successRate}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAYLOAD TYPES
// ═══════════════════════════════════════════════════════════════

interface SuggestionUpdatePayload {
  suggestionId: string;
  updates: {
    priority?: Priority;
    status?: MatchSuggestionStatus;
    statusNotes?: string;
    matchingReason?: string;
    firstPartyNotes?: string;
    secondPartyNotes?: string;
    internalNotes?: string;
    decisionDeadline?: Date;
  };
}

interface SendMessagePayload {
  suggestionId: string;
  partyType: 'first' | 'second' | 'both';
  messageType: 'message' | 'reminder' | 'update';
  messageContent: string;
}

type DialogActionData = {
  suggestionId?: string;
  newStatus?: MatchSuggestionStatus;
  notes?: string;
  suggestion?: Suggestion;
  partyType?: 'first' | 'second' | 'both';
  type?: string;
};

type ConfirmActionData = {
  suggestionId: string;
  partyType?: 'first' | 'second' | 'both';
  type?: string;
};

type SuggestionCardActionType =
  | 'view'
  | 'contact'
  | 'message'
  | 'edit'
  | 'delete'
  | 'resend'
  | 'changeStatus'
  | 'reminder';

type SuggestionDetailsActionType =
  | SuggestionCardActionType
  | 'sendReminder'
  | 'shareContacts'
  | 'scheduleMeeting'
  | 'viewMeetings'
  | 'exportHistory'
  | 'export'
  | 'resendToAll';

interface MatchmakerDashboardProps {
  suggestionsDict: SuggestionsDictionary;
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD – unified responsive view
// ═══════════════════════════════════════════════════════════════

export default function MatchmakerDashboard({
  suggestionsDict,
  matchmakerDict,
  profileDict,
}: MatchmakerDashboardProps) {
  const params = useParams();
  const locale = (
    Array.isArray(params.lang) ? params.lang[0] : params.lang || 'en'
  ) as 'he' | 'en';

  const dashboardDict = matchmakerDict.suggestionsDashboard;
  const toastsDict = dashboardDict.toasts;

  const isMobile = useMediaQuery('(max-width: 768px)');
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState('pending');
  const [showNewSuggestion, setShowNewSuggestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SuggestionFilters>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: string;
    data: ConfirmActionData;
  } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showMonthlyTrendDialog, setShowMonthlyTrendDialog] = useState(false);

  const { candidates: allCandidates } = useCandidates();

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/matchmaker/suggestions');
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setSuggestions(data);
    } catch (error: unknown) {
      console.error('Error fetching suggestions:', error);
      toast.error(toastsDict.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [toastsDict.loadError]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match =
          (s.firstParty.firstName + ' ' + s.firstParty.lastName)
            .toLowerCase()
            .includes(query) ||
          (s.secondParty.firstName + ' ' + s.secondParty.lastName)
            .toLowerCase()
            .includes(query) ||
          (s.firstParty.profile?.city &&
            s.firstParty.profile.city.toLowerCase().includes(query)) ||
          (s.secondParty.profile?.city &&
            s.secondParty.profile.city.toLowerCase().includes(query));
        if (!match) return false;
      }
      if (filters.priority?.length && !filters.priority.includes(s.priority))
        return false;
      if (filters.status?.length && !filters.status.includes(s.status))
        return false;
      if (filters.dateRange) {
        const createdAt = new Date(s.createdAt);
        if (
          createdAt < filters.dateRange.start ||
          (filters.dateRange.end && createdAt > filters.dateRange.end)
        )
          return false;
      }
      return true;
    });
  }, [suggestions, searchQuery, filters]);

  const pendingSuggestions = useMemo(
    () => filteredSuggestions.filter((s) => s.category === 'PENDING'),
    [filteredSuggestions]
  );
  const activeSuggestions = useMemo(
    () => filteredSuggestions.filter((s) => s.category === 'ACTIVE'),
    [filteredSuggestions]
  );
  const historySuggestions = useMemo(
    () => filteredSuggestions.filter((s) => s.category === 'HISTORY'),
    [filteredSuggestions]
  );

  const pendingCount = pendingSuggestions.length;
  const activeCount = activeSuggestions.length;
  const historyCount = historySuggestions.length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSuggestions();
    setIsRefreshing(false);
    toast.success(toastsDict.refreshSuccess);
  };

  const handleNewSuggestion = async (data: NewSuggestionFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions?locale=${locale}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok)
        throw new Error(
          (await response.json()).error || 'Failed to create suggestion'
        );
      setShowNewSuggestion(false);
      toast.success(toastsDict.createSuccess);
      await fetchSuggestions();
    } catch (error: unknown) {
      console.error('Error creating suggestion:', error);
      toast.error(
        `${toastsDict.createError}: ${error instanceof Error ? error.message : ''}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionDeleted = useCallback(
    (deletedId: string) => {
      setSuggestions((prev) => prev.filter((s) => s.id !== deletedId));
      if (selectedSuggestion?.id === deletedId) setSelectedSuggestion(null);
    },
    [selectedSuggestion]
  );

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'delete') {
        const response = await fetch(
          `/api/matchmaker/suggestions/${confirmAction.data.suggestionId}/delete`,
          { method: 'DELETE' }
        );
        if (!response.ok) throw new Error('Failed to delete suggestion');
        handleSuggestionDeleted(confirmAction.data.suggestionId);
        toast.success(toastsDict.deleteSuccess);
      }
    } catch (error: unknown) {
      console.error('Error: ', error);
      toast.error(toastsDict.deleteError);
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleStatusChange = async (
    suggestionId: string,
    newStatus: MatchSuggestionStatus,
    notes?: string
  ) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            notes: notes || `סטטוס שונה מממשק ניהול`,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      toast.success(toastsDict.statusUpdateSuccess);
      fetchSuggestions();

      if (selectedSuggestion && selectedSuggestion.id === suggestionId) {
        setSelectedSuggestion((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            status: newStatus,
            lastActivity: new Date(),
          };
        });
      }
    } catch (error: unknown) {
      console.error('Error updating suggestion status:', error);
      toast.error(
        `${toastsDict.statusUpdateError}: ${error instanceof Error ? error.message : ''}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSuggestion = async ({
    suggestionId,
    updates,
  }: SuggestionUpdatePayload) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update suggestion');
      }

      toast.success(toastsDict.updateSuccess);
      setShowEditForm(false);
      await fetchSuggestions();
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast.error(
        `${toastsDict.updateError}: ${
          error instanceof Error ? error.message : 'שגיאה לא ידועה'
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (data: SendMessagePayload) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${data.suggestionId}/message?locale=${locale}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partyType: data.partyType,
            customMessage: data.messageContent,
            channels: ['email', 'whatsapp'],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      toast.success(toastsDict.messageSentSuccess);
      setShowMessageForm(false);
    } catch (error: unknown) {
      console.error('Error sending message:', error);
      toast.error(
        `${toastsDict.messageSentError}: ${
          error instanceof Error ? error.message : 'שגיאה לא ידועה'
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogAction = (
    action: SuggestionDetailsActionType,
    data?: DialogActionData
  ) => {
    setSelectedSuggestion(data?.suggestion || null);
    if (action === 'view' && data?.suggestion) {
      setSelectedSuggestion(data.suggestion);
    } else if (action === 'delete' && data?.suggestionId) {
      setConfirmAction({
        type: 'delete',
        data: { suggestionId: data.suggestionId },
      });
      setShowConfirmDialog(true);
    } else if (action === 'edit' && data?.suggestion) {
      setShowEditForm(true);
    } else if (action === 'message' && data?.suggestion) {
      setShowMessageForm(true);
    } else if (
      action === 'changeStatus' &&
      data?.suggestionId &&
      data.newStatus
    ) {
      handleStatusChange(data.suggestionId, data.newStatus, data.notes);
    }
  };

  const handleSuggestionAction = (
    type: SuggestionCardActionType,
    suggestion: Suggestion,
    additionalData?: ActionAdditionalData
  ) => {
    handleDialogAction(type, {
      ...additionalData,
      suggestionId: suggestion.id,
      suggestion,
    });
  };

  const heroStats = useMemo(() => {
    const total = suggestions.length;
    const pending = suggestions.filter(
      (s) =>
        s.status === 'PENDING_FIRST_PARTY' ||
        s.status === 'PENDING_SECOND_PARTY'
    ).length;
    const active = suggestions.filter(
      (s) =>
        !['CLOSED', 'CANCELLED', 'EXPIRED', 'MARRIED', 'ENGAGED'].includes(
          s.status
        )
    ).length;
    const success = suggestions.filter((s) =>
      ['MARRIED', 'ENGAGED', 'DATING'].includes(s.status)
    ).length;
    const thisMonth = suggestions.filter((s) => {
      const created = new Date(s.createdAt);
      const now = new Date();
      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    return { total, pending, active, success, thisMonth, successRate };
  }, [suggestions]);

  // ═══════════════════════════════════════════════════════════
  // Render helper for suggestion grid
  // ═══════════════════════════════════════════════════════════

  const renderSuggestionGrid = (items: Suggestion[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((suggestion) => (
        <div key={suggestion.id} className="animate-fade-in-up">
          <SuggestionCard
            suggestion={suggestion}
            onAction={handleSuggestionAction}
            className="shadow-lg hover:shadow-xl transition-all duration-300"
            dict={dashboardDict.suggestionCard}
            isMobile={isMobile}
          />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = (
    icon: React.ElementType,
    gradientFrom: string,
    gradientTo: string,
    title: string,
    description: string
  ) => {
    const IconComponent = icon;
    return (
      <div className="text-center p-8 sm:p-12">
        <div
          className={cn(
            'w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6',
            `bg-gradient-to-br ${gradientFrom} ${gradientTo}`
          )}
        >
          <IconComponent className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600">{description}</p>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // UNIFIED RESPONSIVE VIEW
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-emerald-50/20">
      <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Hero Section – סגור בדיפולט */}
        <MatchmakerHeroSection
          dict={dashboardDict.heroSection}
          onNewSuggestion={() => setShowNewSuggestion(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          stats={heroStats}
        />

        {/* Main Content Card */}
        <Card className="shadow-xl sm:shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 border-b border-purple-100 p-4 sm:p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMonthlyTrendDialog(true)}
                  className="border-purple-200 hover:bg-purple-50 text-purple-600 text-xs sm:text-sm"
                >
                  <BarChart className="w-4 h-4 ml-1 sm:ml-2" />
                  <span className="hidden sm:inline">
                    {dashboardDict.mainContent.monthlyTrendButton}
                  </span>
                  <span className="sm:hidden">
                    {dashboardDict.mainContent.monthlyTrendButton
                      ?.split(' ')
                      .slice(0, 2)
                      .join(' ') || 'מגמות'}
                  </span>
                </Button>

                {/* Tabs */}
                <TabsList className="bg-purple-50/50 rounded-xl sm:rounded-2xl p-1 h-auto flex-wrap">
                  <TabsTrigger
                    value="pending"
                    className="flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-xs sm:text-base"
                  >
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                    <span className="hidden sm:inline">
                      {dashboardDict.mainContent.tabs.pending}
                    </span>
                    {pendingCount > 0 && (
                      <Badge className="bg-orange-500 text-white border-0 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full min-w-[20px] sm:min-w-[24px] h-5 sm:h-6">
                        {pendingCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-xs sm:text-base"
                  >
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="hidden sm:inline">
                      {dashboardDict.mainContent.tabs.active}
                    </span>
                    {activeCount > 0 && (
                      <Badge className="bg-green-500 text-white border-0 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full min-w-[20px] sm:min-w-[24px] h-5 sm:h-6">
                        {activeCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-xs sm:text-base"
                  >
                    <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <span className="hidden sm:inline">
                      {dashboardDict.mainContent.tabs.history}
                    </span>
                    {historyCount > 0 && (
                      <Badge className="bg-gray-500 text-white border-0 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-full min-w-[20px] sm:min-w-[24px] h-5 sm:h-6">
                        {historyCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Action bar */}
              <SuggestionActionBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={suggestions.length}
                activeCount={activeCount}
                pendingCount={pendingCount}
                historyCount={historyCount}
                dict={dashboardDict.actionBar}
              />

              {/* Content */}
              {isLoading ? (
                <div className="flex items-center justify-center h-48 sm:h-64">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-purple-600 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-lg font-semibold text-gray-700">
                      {dashboardDict.mainContent.loadingText}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <TabsContent value="pending" className="mt-4 sm:mt-6">
                    {pendingSuggestions.length > 0
                      ? renderSuggestionGrid(pendingSuggestions)
                      : renderEmptyState(
                          Clock,
                          'from-orange-100',
                          'to-amber-100',
                          dashboardDict.mainContent.emptyStates.pending.title,
                          dashboardDict.mainContent.emptyStates.pending
                            .description
                        )}
                  </TabsContent>
                  <TabsContent value="active" className="mt-4 sm:mt-6">
                    {activeSuggestions.length > 0
                      ? renderSuggestionGrid(activeSuggestions)
                      : renderEmptyState(
                          Target,
                          'from-green-100',
                          'to-emerald-100',
                          dashboardDict.mainContent.emptyStates.active.title,
                          dashboardDict.mainContent.emptyStates.active
                            .description
                        )}
                  </TabsContent>
                  <TabsContent value="history" className="mt-4 sm:mt-6">
                    {historySuggestions.length > 0
                      ? renderSuggestionGrid(historySuggestions)
                      : renderEmptyState(
                          Archive,
                          'from-gray-100',
                          'to-slate-100',
                          dashboardDict.mainContent.emptyStates.history.title,
                          dashboardDict.mainContent.emptyStates.history
                            .description
                        )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </Card>

        {/* Mobile sticky new suggestion button */}
        {isMobile && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <Button
              onClick={() => setShowNewSuggestion(true)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl text-base py-5 rounded-2xl"
            >
              <Plus className="w-5 h-5 ml-2" />
              {dashboardDict.heroSection.newSuggestionButton}
              <Sparkles className="w-4 h-4 mr-2" />
            </Button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          DIALOGS & FORMS
          ═══════════════════════════════════════════════════════ */}

      <NewSuggestionForm
        isOpen={showNewSuggestion}
        onClose={() => setShowNewSuggestion(false)}
        candidates={allCandidates}
        onSubmit={handleNewSuggestion}
        locale={locale}
        dict={matchmakerDict}
      />

      <SuggestionDetailsDialog
        suggestion={selectedSuggestion}
        isOpen={!!selectedSuggestion}
        onClose={() => setSelectedSuggestion(null)}
        onAction={handleDialogAction}
        userId={session?.user?.id || ''}
        matchmakerDict={matchmakerDict}
        suggestionsDict={suggestionsDict}
        profileDict={profileDict}
        locale={locale}
      />

      <Dialog
        open={showMonthlyTrendDialog}
        onOpenChange={setShowMonthlyTrendDialog}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dashboardDict.dialogs.monthlyTrend.title}
            </DialogTitle>
          </DialogHeader>
          <MonthlyTrendModal
            dict={dashboardDict.monthlyTrendModal}
            suggestions={suggestions}
          />
        </DialogContent>
      </Dialog>

      <EditSuggestionForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        suggestion={selectedSuggestion}
        onSave={handleUpdateSuggestion}
        dict={dashboardDict.editSuggestionForm}
      />

      <MessageForm
        isOpen={showMessageForm}
        onClose={() => setShowMessageForm(false)}
        suggestion={selectedSuggestion}
        onSend={handleSendMessage}
        dict={dashboardDict.messageForm}
      />

      {confirmAction && (
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent className="border-0 shadow-2xl rounded-2xl max-w-[90vw] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl font-bold text-center">
                {dashboardDict.dialogs.deleteConfirm.title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-gray-600 leading-relaxed text-sm sm:text-base">
                {dashboardDict.dialogs.deleteConfirm.description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="rounded-xl">
                {dashboardDict.dialogs.deleteConfirm.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
              >
                {dashboardDict.dialogs.deleteConfirm.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Bottom padding for mobile sticky button */}
      {isMobile && <div className="h-20" />}
    </div>
  );
}
