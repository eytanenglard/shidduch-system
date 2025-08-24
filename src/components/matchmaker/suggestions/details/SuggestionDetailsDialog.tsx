// src/app/components/matchmaker/suggestions/details/SuggestionDetailsDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import InquiryThreadView from '@/components/suggestions/inquiries/InquiryThreadView';
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';

import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  RefreshCw,
  Edit,
  Calendar,
  Clock,
  Download,
  AlarmClock,
  Trash2,
  MapPin,
  Mail,
  Phone,
  User,
  ExternalLink,
  Crown,
  Heart,
  Gem,
  Eye,
  Settings,
  Briefcase,
  GraduationCap,
  Quote,
  Archive,
  Maximize,
  Minimize,
  X as CloseIcon,
  LucideIcon,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { MatchSuggestionStatus, UserImage } from '@prisma/client';
import type {
  ExtendedMatchSuggestion,
  ActionAdditionalData,
  SuggestionParty,
} from '@/types/suggestions';
import type { QuestionnaireResponse } from '@/types/next-auth';
import Image from 'next/image';
import { getRelativeCloudinaryPath, cn, getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
  profileDict: ProfilePageDictionary; // ✅ הוספת המילון החדש
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

const formatDateSafely = (
  dateInput: Date | string | null | undefined,
  placeholder: string
): string => {
  if (!dateInput) return placeholder;
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return 'Invalid Date';
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getDaysRemaining = (
  deadline: Date | string | null | undefined
): number | null => {
  if (!deadline) return null;
  const deadlineDate =
    typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (!(deadlineDate instanceof Date) || isNaN(deadlineDate.getTime()))
    return null;
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ... Internal Components updated to receive and use dict ...

const SuggestionDetailsDialog: React.FC<SuggestionDetailsDialogProps> = ({
  suggestion,
  isOpen,
  onClose,
  onAction,
  userId,
  matchmakerDict,
  suggestionsDict,
  profileDict,
}) => {
  const dict = matchmakerDict.suggestionDetailsDialog;
  const [activeTab, setActiveTab] = useState('overview');
  const [firstPartyQuestionnaire, setFirstPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
  const [secondPartyQuestionnaire, setSecondPartyQuestionnaire] =
    useState<QuestionnaireResponse | null>(null);
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
  const statusDescription = dict.statusLabels[suggestion.status] || '';
  const priorityLabel =
    dict.priorityLabels[suggestion.priority] || suggestion.priority;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          'p-0 shadow-2xl border-0 bg-white overflow-hidden z-[50] flex flex-col transition-all duration-300 ease-in-out',
          isFullscreen
            ? '!w-screen !h-screen !max-w-none !max-h-none !rounded-none !fixed !inset-0 !m-0'
            : 'md:max-w-7xl md:w-[95vw] md:h-[95vh] md:rounded-3xl'
        )}
        dir="rtl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
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
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 h-auto shadow-lg border border-white/50">
                {Object.entries(dict.tabs).map(([key, label]) => {
                  const IconComponent =
                    {
                      overview: Eye,
                      party1: User,
                      party2: User,
                      timeline: Calendar,
                      communication: MessageCircle,
                      actions: Settings,
                    }[key] || Eye;
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
              {/* OverviewTabContent Component would be here, but we'll inline it */}
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
            <TabsContent value="communication" className="m-0 h-full">
              <div className="p-6">
                <div className="bg-white rounded-2xl shadow-xl border-0 p-6">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    {dict.communication.title}
                  </h3>
                  <InquiryThreadView
                    suggestionId={suggestion.id}
                    userId={userId}
                    showComposer={true}
                    dict={suggestionsDict.inquiryThread}
                  />
                </div>
              </div>
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
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"
            dir="rtl"
          >
            <div className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl m-4">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <RefreshCw className="w-5 h-5 ml-2 text-blue-600" />
                {dict.statusChangeModal.title}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">
                    {dict.statusChangeModal.currentStatusLabel}
                  </label>
                  <div className="flex items-center p-3 bg-gray-100 rounded-lg border">
                    <statusInfo.icon
                      className={`w-5 h-5 ml-3 ${statusInfo.color}`}
                    />
                    <span className="font-bold">{statusLabel}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">
                    {dict.statusChangeModal.newStatusLabel}
                  </label>
                  <Select
                    value={newStatus || undefined}
                    onValueChange={(value) =>
                      setNewStatus(value as MatchSuggestionStatus)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          dict.statusChangeModal.newStatusPlaceholder
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
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
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">
                    {dict.statusChangeModal.notesLabel}
                  </label>
                  <Textarea
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder={dict.statusChangeModal.notesPlaceholder}
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusChange(false)}
                  >
                    {dict.statusChangeModal.cancelButton}
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    disabled={!newStatus || isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />{' '}
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
