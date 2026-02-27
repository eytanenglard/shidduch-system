// src/app/components/matchmaker/suggestions/details/SuggestionDetailsDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';
import SuggestionChatTab from './SuggestionChatTab';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProfileCard } from '@/components/profile';
import { Timeline } from '@/components/ui/timeline';
import {
    Bookmark,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  RefreshCw,
  Edit,
  Calendar,
  Clock,
  ArrowLeft,
  Edit2,
  AlarmClock,
  Trash2,
  User,
  Crown,
  Heart,
  Gem,
  Eye,
  Settings,
  Archive,
  Maximize,
  Minimize,
  X as CloseIcon,
  LucideIcon,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  statusTransitionService,
  type SuggestionWithParties,
} from '../services/suggestions/StatusTransitionService';

import { MatchSuggestionStatus } from '@prisma/client';
import type {
  ExtendedMatchSuggestion,
  ActionAdditionalData,
} from '@/types/suggestions';
import type { QuestionnaireResponse } from '@/types/next-auth';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type {
  MatchmakerPageDictionary,
  SuggestionsDictionary,
  ProfilePageDictionary,
} from '@/types/dictionary';

type SuggestionDetailsActionType =
  | 'view'
  | 'contact'
  | 'message'
  | 'edit'
  | 'delete'
  | 'resend'
  | 'changeStatus'
  | 'reminder'
  | 'sendReminder'
  | 'shareContacts'
  | 'scheduleMeeting'
  | 'viewMeetings'
  | 'exportHistory'
  | 'export'
  | 'resendToAll';

interface DialogActionData extends ActionAdditionalData {
  suggestionId?: string;
  newStatus?: MatchSuggestionStatus;
  notes?: string;
  suggestion?: ExtendedMatchSuggestion;
  partyId?: string;
  type?: string;
  partyType?: 'first' | 'second' | 'both';
}

interface SuggestionDetailsDialogProps {
  suggestion: ExtendedMatchSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (
    action: SuggestionDetailsActionType,
    data?: DialogActionData
  ) => void;
  userId: string;
  matchmakerDict: MatchmakerPageDictionary;
  suggestionsDict: SuggestionsDictionary;
  profileDict: ProfilePageDictionary;
  locale: 'he' | 'en';
}

interface StatusInfo {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  badgeColor: string;
  progress: number;
}

const getEnhancedStatusInfo = (status: MatchSuggestionStatus): StatusInfo => {
  const statusInfoMap: Record<
    string,
    Omit<StatusInfo, 'label' | 'description'>
  > = {
    DRAFT: {
      icon: Edit,
      color: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      progress: 10,
    },
    PENDING_FIRST_PARTY: {
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'from-yellow-50 to-amber-50',
      badgeColor: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
      progress: 25,
    },
    FIRST_PARTY_APPROVED: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      progress: 40,
    },
    FIRST_PARTY_DECLINED: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      progress: 0,
    },
        FIRST_PARTY_INTERESTED: {
      icon: Bookmark,
      color: 'text-amber-600',
      bgColor: 'from-amber-50 to-orange-50',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
      progress: 30,
    },

    PENDING_SECOND_PARTY: {
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-cyan-50',
      badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      progress: 50,
    },
    SECOND_PARTY_APPROVED: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      progress: 60,
    },
    SECOND_PARTY_DECLINED: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      progress: 0,
    },
    CONTACT_DETAILS_SHARED: {
      icon: Send,
      color: 'text-purple-600',
      bgColor: 'from-purple-50 to-pink-50',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      progress: 70,
    },
    AWAITING_FIRST_DATE_FEEDBACK: {
      icon: MessageCircle,
      color: 'text-orange-600',
      bgColor: 'from-orange-50 to-amber-50',
      badgeColor: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
      progress: 75,
    },
    DATING: {
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'from-pink-50 to-rose-50',
      badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
      progress: 80,
    },
    ENGAGED: {
      icon: Gem,
      color: 'text-yellow-600',
      bgColor: 'from-yellow-50 to-orange-50',
      badgeColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      progress: 95,
    },
    MARRIED: {
      icon: Crown,
      color: 'text-emerald-600',
      bgColor: 'from-emerald-50 to-green-50',
      badgeColor: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
      progress: 100,
    },
    EXPIRED: {
      icon: AlarmClock,
      color: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      progress: 0,
    },
    CLOSED: {
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      progress: 0,
    },
    CANCELLED: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      progress: 0,
    },
    AWAITING_MATCHMAKER_APPROVAL: {
      icon: User,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-cyan-50',
      badgeColor: 'bg-blue-500',
      progress: 65,
    },
    THINKING_AFTER_DATE: {
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'from-indigo-50 to-violet-50',
      badgeColor: 'bg-indigo-500',
      progress: 77,
    },
    PROCEEDING_TO_SECOND_DATE: {
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'from-teal-50 to-cyan-50',
      badgeColor: 'bg-teal-500',
      progress: 78,
    },
    ENDED_AFTER_FIRST_DATE: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-red-500',
      progress: 0,
    },
    MEETING_PENDING: {
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'from-purple-50 to-pink-50',
      badgeColor: 'bg-purple-500',
      progress: 72,
    },
    MEETING_SCHEDULED: {
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      badgeColor: 'bg-green-500',
      progress: 74,
    },
    MATCH_APPROVED: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      badgeColor: 'bg-green-500',
      progress: 60,
    },
    MATCH_DECLINED: {
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-red-500',
      progress: 0,
    },
  };
  return (
    statusInfoMap[status] || {
      icon: RefreshCw,
      color: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      badgeColor: 'bg-gray-500',
      progress: 10,
    }
  );
};

// Tab configuration with icons
const TAB_ICONS: Record<string, LucideIcon> = {
  overview: Eye,
  party1: User,
  party2: User,
  timeline: Calendar,
  chat: MessageCircle,
  actions: Settings,
};

const SuggestionDetailsDialog: React.FC<SuggestionDetailsDialogProps> = ({
  suggestion,
  isOpen,
  onClose,
  onAction,
  userId,
  matchmakerDict,
  suggestionsDict,
  profileDict,
  locale,
}) => {
  const dict = matchmakerDict.suggestionDetailsDialog;
  const [activeTab, setActiveTab] = useState('overview');
  const [firstPartyQuestionnaire, setFirstPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [secondPartyQuestionnaire] = useState<QuestionnaireResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [newStatus, setNewStatus] = useState<MatchSuggestionStatus | null>(
    null
  );
  const [showStatusChange, setShowStatusChange] = useState(false);
  const { refreshNotifications } = useNotifications();

  useEffect(() => {
    if (isOpen && suggestion) {
      setActiveTab('overview');
      setShowStatusChange(false);
      setNewStatus(null);
      setStatusChangeNote('');

      const hasUnread = suggestion.inquiries?.some(
        (inq) => inq.toUserId === userId && inq.status === 'PENDING'
      );
      if (hasUnread) {
        const markAsRead = async () => {
          try {
            await fetch(
              `/api/suggestions/${suggestion.id}/inquiries/mark-as-read`,
              { method: 'POST' }
            );
            refreshNotifications();
          } catch (error) {
            console.error('Failed to mark inquiries as read:', error);
          }
        };
        markAsRead();
      }
    }
  }, [isOpen, suggestion, userId, refreshNotifications]);

  const handleStatusChange = async () => {
    if (!newStatus || !suggestion) return;
    setIsLoading(true);
    try {
      onAction('changeStatus', {
        suggestionId: suggestion.id,
        newStatus,
        notes: statusChangeNote,
      });
      setShowStatusChange(false);
      setStatusChangeNote('');
      setNewStatus(null);
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error(
        `${dict.toasts.statusUpdateError}: ${error instanceof Error ? error.message : ''}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!suggestion) return null;

  const statusInfo = getEnhancedStatusInfo(suggestion.status);
  const statusLabel = dict.statusLabels[suggestion.status] || suggestion.status;

  // Build tabs list from dictionary (chat is now included in dict.tabs)
  const tabEntries: [string, string][] = Object.entries(dict.tabs);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'p-0 shadow-2xl border-0 bg-white overflow-hidden z-[50] flex flex-col transition-all duration-300 ease-in-out',
          isFullscreen
            ? '!w-screen !h-screen !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0'
            : 'md:max-w-7xl md:w-[95vw] md:h-[95vh] md:rounded-3xl'
        )}
        dir={locale === 'he' ? 'rtl' : 'ltr'}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* כותרת נגישות - מוסתרת ויזואלית אך נגישה לקוראי מסך */}
        <DialogTitle className="sr-only">
          {dict.header.title.replace(
            '{{id}}',
            suggestion?.id?.toString().split('-')[0] || ''
          )}
        </DialogTitle>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Header and Tabs Component */}
          <div
            className={cn(
              'relative bg-gradient-to-br',
              statusInfo.bgColor,
              'border-b border-gray-100/80 flex-shrink-0'
            )}
          >
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl opacity-40"></div>
            </div>
            <div className="relative z-10 p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                    <statusInfo.icon
                      className={cn('w-7 h-7', statusInfo.color)}
                    />
                  </div>
                  <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
                      {dict.header.title.replace(
                        '{{id}}',
                        suggestion.id.toString().split('-')[0]
                      )}
                    </h1>
                    <p className="text-md text-gray-600 mt-1">
                      {dict.header.subtitle
                        .replace('{{party1}}', suggestion.firstParty.firstName)
                        .replace(
                          '{{party2}}',
                          suggestion.secondParty.firstName
                        )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      'text-sm font-bold shadow-md',
                      statusInfo.badgeColor
                    )}
                  >
                    <statusInfo.icon className="w-4 h-4 ml-2" />
                    {statusLabel}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-white/40 text-gray-700"
                    onClick={() => setShowStatusChange(true)}
                    title="שינוי סטטוס"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFullscreen(!isFullscreen)}
                          className="rounded-full h-10 w-10 text-gray-500 hover:text-gray-700 hover:bg-white/50 backdrop-blur-sm"
                        >
                          {isFullscreen ? (
                            <Minimize className="w-5 h-5" />
                          ) : (
                            <Maximize className="w-5 h-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {isFullscreen
                            ? dict.header.minimizeTooltip
                            : dict.header.fullscreenTooltip}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full h-10 w-10 text-gray-500 hover:text-gray-700 hover:bg-white/50 backdrop-blur-sm"
                  >
                    <CloseIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <TabsList
                className={cn(
                  'grid w-full bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 h-auto shadow-lg border border-white/50',
                  `grid-cols-3 sm:grid-cols-${tabEntries.length}`
                )}
                style={{
                  gridTemplateColumns: `repeat(${tabEntries.length}, minmax(0, 1fr))`,
                }}
              >
                {tabEntries.map(([key, label]) => {
                  const IconComponent = TAB_ICONS[key] || Eye;
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      onClick={() => setActiveTab(key)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all duration-300 py-2 hover:scale-105 relative overflow-hidden group',
                        activeTab === key
                          ? 'bg-white text-primary shadow-md'
                          : 'text-gray-600 hover:bg-white/50'
                      )}
                    >
                      <IconComponent className="w-5 h-5 relative z-10" />
                      <span className="relative z-10 hidden sm:inline">
                        {label}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-50">
            <TabsContent value="overview" className="m-0 h-full">
              {/* OverviewTabContent Component would be here */}
            </TabsContent>
            <TabsContent value="firstParty" className="m-0 h-full">
              <div className="p-6">
                <ProfileCard
                  profile={suggestion.firstParty.profile}
                  images={suggestion.firstParty.images}
                  questionnaire={firstPartyQuestionnaire}
                  viewMode="matchmaker"
                  isProfileComplete={suggestion.firstParty.isProfileComplete}
                  dict={profileDict.profileCard}
                  locale={locale}
                />
              </div>
            </TabsContent>
            <TabsContent value="secondParty" className="m-0 h-full">
              <div className="p-6">
                <ProfileCard
                  profile={suggestion.secondParty.profile}
                  images={suggestion.secondParty.images}
                  questionnaire={secondPartyQuestionnaire}
                  viewMode="matchmaker"
                  isProfileComplete={suggestion.secondParty.isProfileComplete}
                  dict={profileDict.profileCard}
                  locale={locale}
                />
              </div>
            </TabsContent>
            <TabsContent value="timeline" className="m-0 h-full">
              <div className="p-6">
                <div className="bg-white rounded-2xl shadow-xl border-0 p-6">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
                      <Calendar className="w-6 h-6" />
                    </div>
                    {dict.timeline.title}
                  </h3>
                  <Timeline
                    items={(suggestion?.statusHistory || []).map((history) => {
                      const historyStatusInfo = getEnhancedStatusInfo(
                        history.status as MatchSuggestionStatus
                      );
                      return {
                        title:
                          dict.statusLabels[history.status] || history.status,
                        description: history.notes || dict.timeline.noNotes,
                        date:
                          typeof history.createdAt === 'string'
                            ? new Date(history.createdAt)
                            : history.createdAt,
                        icon: historyStatusInfo.icon,
                      };
                    })}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="m-0 h-full">
              <SuggestionChatTab
                suggestionId={suggestion.id}
                locale={locale}
                dict={dict.chatTab}
              />
            </TabsContent>

            <TabsContent value="actions" className="m-0 h-full">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="p-3 rounded-full bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg">
                    <Settings className="w-6 h-6" />
                  </div>
                  {dict.actions.title}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg w-fit mb-4">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-3">
                      {dict.actions.statusChange.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {dict.actions.statusChange.description}
                    </p>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
                      onClick={() => setShowStatusChange(true)}
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      {dict.actions.statusChange.button}
                    </Button>
                  </div>
                  <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
                    <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg w-fit mb-4">
                      <Edit className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-3">
                      {dict.actions.edit.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {dict.actions.edit.description}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => onAction('edit', { suggestion })}
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      {dict.actions.edit.button}
                    </Button>
                  </div>
                  <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
                    <div className="p-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg w-fit mb-4">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-3">
                      {dict.actions.delete.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {dict.actions.delete.description}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() =>
                        onAction('delete', { suggestionId: suggestion.id })
                      }
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      {dict.actions.delete.button}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {showStatusChange && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
            dir={locale === 'he' ? 'rtl' : 'ltr'}
          >
            <div className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center text-gray-800">
                  <RefreshCw className="w-5 h-5 ml-2 text-blue-600" />
                  {dict.statusChangeModal.title}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStatusChange(false)}
                >
                  <CloseIcon className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* תצוגת סטטוס נוכחי */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    {dict.statusChangeModal.currentStatusLabel}
                  </label>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2 rounded-full text-white',
                        statusInfo.badgeColor
                      )}
                    >
                      <statusInfo.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-lg text-gray-800">
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* פעולות מומלצות - Recommended Actions */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                    פעולות מומלצות
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {statusTransitionService
                      .getAvailableActions(
                        suggestion as unknown as SuggestionWithParties,
                        userId
                      )
                      .map((action) => (
                        <Button
                          key={action.id}
                          variant="outline"
                          className="justify-between h-auto py-3 px-4 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-right group"
                          onClick={() => {
                            setNewStatus(action.nextStatus);
                          }}
                        >
                          <span className="font-medium text-gray-700 group-hover:text-blue-700">
                            {action.label}
                          </span>
                          {newStatus === action.nextStatus ? (
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Button>
                      ))}

                    {statusTransitionService.getAvailableActions(
                      suggestion as unknown as SuggestionWithParties,
                      userId
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 italic">
                        אין פעולות מומלצות לסטטוס זה.
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 my-4"></div>

                {/* בחירה ידנית */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    {dict.statusChangeModal.newStatusLabel} (בחירה ידנית)
                  </label>
                  <Select
                    value={newStatus || undefined}
                    onValueChange={(value) =>
                      setNewStatus(value as MatchSuggestionStatus)
                    }
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue
                        placeholder={
                          dict.statusChangeModal.newStatusPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Object.entries(dict.statusLabels).map(
                        ([status, label]) => (
                          <SelectItem key={status} value={status}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* הערות */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    {dict.statusChangeModal.notesLabel}
                  </label>
                  <Textarea
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder={dict.statusChangeModal.notesPlaceholder}
                    className="min-h-[80px] resize-none focus:ring-blue-500"
                  />
                </div>

                {/* כפתורי פעולה */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowStatusChange(false)}
                  >
                    {dict.statusChangeModal.cancelButton}
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    disabled={!newStatus || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg px-6"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                        {dict.statusChangeModal.savingButton}
                      </>
                    ) : (
                      dict.statusChangeModal.saveButton
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDetailsDialog;
