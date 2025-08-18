'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSession } from 'next-auth/react';
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
  CheckCircle,
  XCircle,
  Heart,
  Sparkles,
  Calendar,
  Target,
  Crown,
  Zap,
  Eye,
  MessageCircle,
  Settings,
  Award,
  Activity,
  Star,
  ArrowUp,
  ArrowDown,
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
import type { Candidate } from '../../new/types/candidates';

// Hooks
import { useCandidates } from '../../new/hooks/useCandidates';

// Components
import NewSuggestionForm from '../../suggestions/NewSuggestionForm';
import SuggestionsStats from './SuggestionsStats';
import SuggestionActionBar from './SuggestionActionBar';
import SuggestionDetailsDialog from '../details/SuggestionDetailsDialog';
import SuggestionCard from '../cards/SuggestionCard';
import EditSuggestionForm from '../EditSuggestionForm';
import MessageForm from '../MessageForm';
import MonthlyTrendModal from './MonthlyTrendModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

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

// Enhanced Hero Section Component
const MatchmakerHeroSection: React.FC<{
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
}> = ({ onNewSuggestion, onRefresh, isRefreshing, stats }) => {
  return (
    <div className="relative min-h-[400px] bg-gradient-to-br from-purple-50 via-cyan-50/30 to-emerald-50/20 overflow-hidden rounded-3xl shadow-2xl mb-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-2xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-emerald-200/20 to-green-200/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      <div className="relative z-10 p-8 lg:p-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <Crown className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
            ברוכים הבאים למערכת השדכן
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            נהל את כל הצעות השידוך, עקוב אחר התקדמות הזוגות ויצור התאמות מושלמות
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">סך הכל הצעות</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-orange-600">
                  {stats.pending}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                ממתינות לתשובה
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {stats.success}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                התאמות מוצלחות
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {stats.successRate}%
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">אחוז הצלחה</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Button
            onClick={onNewSuggestion}
            size="lg"
            className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-8 py-4 font-bold text-lg transform hover:scale-105"
          >
            <Plus className="w-6 h-6 ml-3" />
            צור הצעת שידוך חדשה
            <Sparkles className="w-5 h-5 mr-2" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="border-2 border-purple-300 text-purple-600 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl px-6 py-4 font-bold text-lg transform hover:scale-105"
          >
            <RefreshCw
              className={cn('w-5 h-5 ml-2', isRefreshing && 'animate-spin')}
            />
            {isRefreshing ? 'מעדכן...' : 'רענן נתונים'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Stats Component
const EnhancedStats: React.FC<{
  suggestions: Suggestion[];
  onFilterChange: (filter: Partial<SuggestionFilters>) => void;
}> = ({ suggestions, onFilterChange }) => {
  const stats = useMemo(() => {
    const total = suggestions.length;
    const pending = suggestions.filter(
      (s) =>
        s.status === 'PENDING_FIRST_PARTY' ||
        s.status === 'PENDING_SECOND_PARTY'
    ).length;
    const active = suggestions.filter(
      (s) => !['CLOSED', 'CANCELLED', 'EXPIRED'].includes(s.status)
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Suggestions */}
      <Card
        className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        onClick={() => onFilterChange({})}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">
                סך הכל הצעות
              </p>
              <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  +{stats.thisMonth} החודש
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Suggestions */}
      <Card
        className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        onClick={() =>
          onFilterChange({
            status: ['PENDING_FIRST_PARTY', 'PENDING_SECOND_PARTY'],
          })
        }
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">
                ממתינות לתשובה
              </p>
              <p className="text-3xl font-bold text-orange-700">
                {stats.pending}
              </p>
              <div className="flex items-center mt-2">
                <Clock className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">דורש טיפול</span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Clock className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Suggestions */}
      <Card
        className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        onClick={() =>
          onFilterChange({ status: ['DATING', 'CONTACT_DETAILS_SHARED'] })
        }
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">
                פעילות כעת
              </p>
              <p className="text-3xl font-bold text-green-700">
                {stats.active}
              </p>
              <div className="flex items-center mt-2">
                <Activity className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">בתהליך</span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Target className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card
        className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        onClick={() => onFilterChange({ status: ['MARRIED', 'ENGAGED'] })}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">
                אחוז הצלחה
              </p>
              <p className="text-3xl font-bold text-purple-700">
                {stats.successRate}%
              </p>
              <div className="flex items-center mt-2">
                <Award className="w-4 h-4 text-purple-500 mr-1" />
                <span className="text-sm text-purple-600">
                  {stats.success} זוגות
                </span>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg group-hover:scale-110 transition-transform">
              <Heart className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Payload types
interface SuggestionUpdatePayload {
  priority?: Priority;
  status?: MatchSuggestionStatus;
  statusNotes?: string;
  matchingReason?: string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
  internalNotes?: string;
  decisionDeadline?: Date;
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

export default function MatchmakerDashboard() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mobileView, setMobileView] = useState<'list' | 'kanban'>('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { data: session } = useSession();

  // State management
  const [activeTab, setActiveTab] = useState('pending');
  const [showNewSuggestion, setShowNewSuggestion] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SuggestionFilters>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dialogs and selected items state
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

  // Fetch candidates list
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
      toast.error('שגיאה בטעינת ההצעות');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    toast.success('נתוני ההצעות עודכנו');
  };

  const handleNewSuggestion = async (data: NewSuggestionFormData) => {
    try {
      const response = await fetch('/api/matchmaker/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error || 'Failed to create suggestion'
        );
      setShowNewSuggestion(false);
      toast.success('ההצעה נוצרה בהצלחה');
      await fetchSuggestions();
    } catch (error: unknown) {
      console.error('Error creating suggestion:', error);
      toast.error(
        'שגיאה ביצירת ההצעה: ' + (error instanceof Error ? error.message : '')
      );
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
        toast.success('ההצעה נמחקה בהצלחה');
      }
    } catch (error: unknown) {
      toast.error('אירעה שגיאה בביצוע הפעולה');
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
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            notes: notes || `סטטוס שונה ממממשק ניהול`,
          }),
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json()).error || 'Failed to update status'
        );
      toast.success('סטטוס ההצעה עודכן בהצלחה');
      fetchSuggestions();
    } catch (error: unknown) {
      console.error('Error updating suggestion status:', error);
      toast.error(
        'שגיאה בעדכון סטטוס ההצעה: ' +
          (error instanceof Error ? error.message : '')
      );
    }
  };

  const handleUpdateSuggestion = async (data: {
    suggestionId: string;
    updates: SuggestionUpdatePayload;
  }) => {
    try {
      setIsSubmitting(true);

      if (
        data.updates.status &&
        data.updates.status !== selectedSuggestion?.status
      ) {
        const statusResponse = await fetch(
          `/api/matchmaker/suggestions/${data.suggestionId}/status`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: data.updates.status,
              notes:
                data.updates.statusNotes ||
                `סטטוס שונה ל-${data.updates.status}`,
            }),
          }
        );

        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.error || 'Failed to update status');
        }
      }

      // עדכון שאר הפרטים
      const updatePayload = {
        priority: data.updates.priority,
        matchingReason: data.updates.matchingReason,
        firstPartyNotes: data.updates.firstPartyNotes,
        secondPartyNotes: data.updates.secondPartyNotes,
        internalNotes: data.updates.internalNotes,
        decisionDeadline: data.updates.decisionDeadline?.toISOString(),
      };

      const response = await fetch(
        `/api/matchmaker/suggestions/${data.suggestionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update suggestion');
      }

      toast.success('פרטי ההצעה עודכנו בהצלחה');
      setShowEditForm(false);
      await fetchSuggestions();
    } catch (error) {
      console.error('Error updating suggestion:', error);
      toast.error(
        'שגיאה בעדכון פרטי ההצעה: ' +
          (error instanceof Error ? error.message : 'שגיאה לא ידועה')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (data: SendMessagePayload) => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${data.suggestionId}/message`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partyType: data.partyType,
            messageType: data.messageType,
            content: data.messageContent,
          }),
        }
      );
      if (!response.ok)
        throw new Error(
          (await response.json()).error || 'Failed to send message'
        );
      toast.success('ההודעה נשלחה בהצלחה');
      setShowMessageForm(false);
    } catch (error: unknown) {
      toast.error(
        'שגיאה בשליחת ההודעה: ' + (error instanceof Error ? error.message : '')
      );
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

  const kanbanColumns = useMemo(() => {
    const columns: {
      title: string;
      suggestions: Suggestion[];
      color: string;
      icon: React.ElementType;
    }[] = [
      {
        title: 'דורש טיפול',
        suggestions: [],
        color: 'from-red-500 to-orange-500',
        icon: Clock,
      },
      {
        title: 'ממתין לתגובה',
        suggestions: [],
        color: 'from-yellow-500 to-amber-500',
        icon: MessageCircle,
      },
      {
        title: 'פעילות',
        suggestions: [],
        color: 'from-green-500 to-emerald-500',
        icon: Target,
      },
      {
        title: 'היסטוריה',
        suggestions: [],
        color: 'from-gray-500 to-slate-500',
        icon: Archive,
      },
    ];

    filteredSuggestions.forEach((s) => {
      if (
        [
          'AWAITING_MATCHMAKER_APPROVAL',
          'AWAITING_FIRST_DATE_FEEDBACK',
        ].includes(s.status)
      ) {
        columns[0].suggestions.push(s);
      } else if (
        ['PENDING_FIRST_PARTY', 'PENDING_SECOND_PARTY'].includes(s.status)
      ) {
        columns[1].suggestions.push(s);
      } else if (
        ['CLOSED', 'CANCELLED', 'EXPIRED', 'MARRIED', 'ENGAGED'].includes(
          s.status
        )
      ) {
        columns[3].suggestions.push(s);
      } else {
        columns[2].suggestions.push(s);
      }
    });

    return columns;
  }, [filteredSuggestions]);

  // Calculate stats for hero section
  const heroStats = useMemo(() => {
    const total = suggestions.length;
    const pending = suggestions.filter(
      (s) =>
        s.status === 'PENDING_FIRST_PARTY' ||
        s.status === 'PENDING_SECOND_PARTY'
    ).length;
    const active = suggestions.filter(
      (s) => !['CLOSED', 'CANCELLED', 'EXPIRED'].includes(s.status)
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

  const renderMobileFilters = () => (
    <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/80 backdrop-blur-sm shadow-lg"
        >
          <Filter className="w-4 h-4 mr-2" />
          סינון
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full">
        <SheetHeader>
          <SheetTitle>סינון הצעות</SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <SuggestionActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            totalCount={suggestions.length}
            activeCount={activeCount}
            pendingCount={pendingCount}
            historyCount={historyCount}
          />
        </div>
      </SheetContent>
    </Sheet>
  );

  const renderMobileView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-emerald-50/20">
      {/* Mobile Hero Section */}
      <div className="p-4">
        <MatchmakerHeroSection
          onNewSuggestion={() => setShowNewSuggestion(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          stats={heroStats}
        />
      </div>

      {/* Mobile Controls */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10 shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-right pr-10 bg-white/90 shadow-sm border-purple-200 focus:border-purple-400"
          />
        </div>
        <div className="mr-2">{renderMobileFilters()}</div>
        <ToggleGroup
          type="single"
          value={mobileView}
          onValueChange={(value: 'list' | 'kanban') =>
            value && setMobileView(value)
          }
          className="mr-2"
        >
          <ToggleGroupItem
            value="list"
            aria-label="List view"
            className="data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700"
          >
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="kanban"
            aria-label="Kanban view"
            className="data-[state=on]:bg-purple-100 data-[state=on]:text-purple-700"
          >
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Mobile Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700">טוען הצעות...</p>
          </div>
        </div>
      ) : mobileView === 'kanban' ? (
        <ScrollArea className="w-full whitespace-nowrap flex-1">
          <div className="flex gap-4 p-4 h-full">
            {kanbanColumns.map((col, idx) => {
              const IconComponent = col.icon;
              return (
                <div
                  key={idx}
                  className="w-72 flex-shrink-0 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl flex flex-col border border-gray-200"
                >
                  <div
                    className={cn(
                      'p-4 font-semibold text-sm border-b sticky top-0 bg-gradient-to-r text-white rounded-t-2xl z-10 shadow-lg',
                      col.color
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-5 h-5" />
                        <span>{col.title}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30"
                      >
                        {col.suggestions.length}
                      </Badge>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {col.suggestions.length > 0 ? (
                        col.suggestions.map((s) => (
                          <SuggestionCard
                            key={s.id}
                            suggestion={s}
                            onAction={handleSuggestionAction}
                            variant="compact"
                            className="shadow-lg hover:shadow-xl transition-all duration-300"
                          />
                        ))
                      ) : (
                        <div className="p-6 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">
                          <IconComponent className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <p>אין הצעות</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {filteredSuggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onAction={handleSuggestionAction}
                variant="full"
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              />
            ))}
            {filteredSuggestions.length === 0 && (
              <div className="text-center p-12">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  אין הצעות תואמות
                </h3>
                <p className="text-gray-600">
                  נסה לשנות את קריטריוני החיפוש או הוסף הצעה חדשה
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Mobile Action Button */}
      <div className="p-4 bg-white/80 backdrop-blur-sm border-t sticky bottom-0">
        <Button
          onClick={() => setShowNewSuggestion(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl text-lg py-6 rounded-2xl"
        >
          <Plus className="w-6 h-6 mr-3" />
          הצעה חדשה
          <Sparkles className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderDesktopView = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-emerald-50/20">
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <MatchmakerHeroSection
          onNewSuggestion={() => setShowNewSuggestion(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          stats={heroStats}
        />

        {/* Enhanced Stats */}
        <EnhancedStats
          suggestions={suggestions}
          onFilterChange={(filter) =>
            setFilters((prev) => ({ ...prev, ...filter }))
          }
        />

        {/* Main Content */}
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden rounded-3xl">
          <div className="bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 border-b border-purple-100 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMonthlyTrendDialog(true)}
                    className="border-purple-200 hover:bg-purple-50 text-purple-600"
                  >
                    <BarChart className="w-4 h-4 mr-2" />
                    מגמה חודשית
                  </Button>
                </div>

                <TabsList className="bg-purple-50/50 rounded-2xl p-1 h-14">
                  <TabsTrigger
                    value="pending"
                    className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                  >
                    <Clock className="w-5 h-5 text-orange-500" />
                    <span>ממתין לאישור</span>
                    {pendingCount > 0 && (
                      <Badge className="bg-orange-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6">
                        {pendingCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="active"
                    className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                  >
                    <Target className="w-5 h-5 text-green-500" />
                    <span>פעילות</span>
                    {activeCount > 0 && (
                      <Badge className="bg-green-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6">
                        {activeCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-3 px-6 py-3 rounded-xl transition-all data-[state=active]:bg-white data-[state=active]:shadow-lg font-semibold text-base"
                  >
                    <Archive className="w-5 h-5 text-gray-500" />
                    <span>היסטוריה</span>
                    {historyCount > 0 && (
                      <Badge className="bg-gray-500 text-white border-0 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] h-6">
                        {historyCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>

              <SuggestionActionBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={filters}
                onFiltersChange={setFilters}
                totalCount={suggestions.length}
                activeCount={activeCount}
                pendingCount={pendingCount}
                historyCount={historyCount}
              />

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-700">
                      טוען הצעות...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <TabsContent value="pending" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pendingSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="animate-fade-in-up">
                          <SuggestionCard
                            suggestion={suggestion}
                            onAction={handleSuggestionAction}
                            className="shadow-lg hover:shadow-xl transition-all duration-300"
                          />
                        </div>
                      ))}
                    </div>
                    {pendingSuggestions.length === 0 && (
                      <div className="text-center p-12">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center mx-auto mb-6">
                          <Clock className="w-12 h-12 text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          אין הצעות ממתינות לאישור
                        </h3>
                        <p className="text-gray-600">כל ההצעות אושרו או נדחו</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="active" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeSuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="animate-fade-in-up">
                          <SuggestionCard
                            suggestion={suggestion}
                            onAction={handleSuggestionAction}
                            className="shadow-lg hover:shadow-xl transition-all duration-300"
                          />
                        </div>
                      ))}
                    </div>
                    {activeSuggestions.length === 0 && (
                      <div className="text-center p-12">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
                          <Target className="w-12 h-12 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          אין הצעות פעילות
                        </h3>
                        <p className="text-gray-600">
                          צור הצעה חדשה כדי להתחיל
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {historySuggestions.map((suggestion) => (
                        <div key={suggestion.id} className="animate-fade-in-up">
                          <SuggestionCard
                            suggestion={suggestion}
                            onAction={handleSuggestionAction}
                            className="shadow-lg hover:shadow-xl transition-all duration-300"
                          />
                        </div>
                      ))}
                    </div>
                    {historySuggestions.length === 0 && (
                      <div className="text-center p-12">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mx-auto mb-6">
                          <Archive className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          אין הצעות בהיסטוריה
                        </h3>
                        <p className="text-gray-600">
                          ההיסטוריה תמולא כשהצעות יושלמו
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={cn('min-h-screen', !isMobile && 'p-0', isMobile && 'p-0')}>
      {isMobile ? renderMobileView() : renderDesktopView()}

      {/* Dialogs and Forms */}
      <NewSuggestionForm
        isOpen={showNewSuggestion}
        onClose={() => setShowNewSuggestion(false)}
        candidates={allCandidates}
        onSubmit={handleNewSuggestion}
      />

      <SuggestionDetailsDialog
        suggestion={selectedSuggestion}
        isOpen={!!selectedSuggestion}
        onClose={() => setSelectedSuggestion(null)}
        onAction={handleDialogAction}
        userId={session?.user?.id || ''}
      />

      <Dialog
        open={showMonthlyTrendDialog}
        onOpenChange={setShowMonthlyTrendDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>מגמה חודשית</DialogTitle>
          </DialogHeader>
          <MonthlyTrendModal suggestions={suggestions} />
        </DialogContent>
      </Dialog>

      <EditSuggestionForm
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        suggestion={selectedSuggestion}
        onSave={handleUpdateSuggestion}
      />

      <MessageForm
        isOpen={showMessageForm}
        onClose={() => setShowMessageForm(false)}
        suggestion={selectedSuggestion}
        onSend={handleSendMessage}
      />

      {confirmAction && (
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent className="border-0 shadow-2xl rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-center">
                האם את/ה בטוח/ה?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-gray-600 leading-relaxed">
                {confirmAction.type === 'delete' &&
                  'פעולה זו תמחק את ההצעה לצמיתות ולא ניתן יהיה לשחזר אותה.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="rounded-xl">
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
              >
                אישור
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
