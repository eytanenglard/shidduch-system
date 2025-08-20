// src/app/components/matchmaker/suggestions/details/SuggestionDetailsDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import InquiryThreadView from '@/components/suggestions/inquiries/InquiryThreadView';
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext'; // <-- 1. Import useNotifications

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
// --- CORRECTED --- Added SuggestionParty and UserImage to imports
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
import type { SuggestionsDictionary } from '@/types/dictionary';

// Define action types
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
  dict: SuggestionsDictionary;
}

// Define the return type for the status info object
interface StatusInfo {
  label: string;
  icon: LucideIcon; // Use the specific LucideIcon type
  color: string;
  bgColor: string;
  badgeColor: string;
  progress: number;
  description: string;
}

// Enhanced status info function
const getEnhancedStatusInfo = (status: MatchSuggestionStatus): StatusInfo => {
  const statusInfoMap: Record<string, StatusInfo> = {
    DRAFT: {
      label: 'טיוטה',
      icon: Edit,
      color: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      progress: 10,
      description: 'ההצעה עדיין בעריכה ולא נשלחה.',
    },
    PENDING_FIRST_PARTY: {
      label: 'ממתין לתשובת צד א׳',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'from-yellow-50 to-amber-50',
      badgeColor: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white',
      progress: 25,
      description: 'ההצעה נשלחה לצד הראשון וממתינה לתשובה.',
    },
    FIRST_PARTY_APPROVED: {
      label: 'צד א׳ אישר',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      progress: 40,
      description: 'הצד הראשון אישר את ההצעה.',
    },
    FIRST_PARTY_DECLINED: {
      label: 'צד א׳ דחה',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      progress: 0,
      description: 'הצד הראשון דחה את ההצעה.',
    },
    PENDING_SECOND_PARTY: {
      label: 'ממתין לתשובת צד ב׳',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-cyan-50',
      badgeColor: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      progress: 50,
      description: 'הצד הראשון אישר וההצעה נשלחה לצד השני.',
    },
    SECOND_PARTY_APPROVED: {
      label: 'צד ב׳ אישר',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      badgeColor: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
      progress: 60,
      description: 'שני הצדדים אישרו את ההצעה.',
    },
    SECOND_PARTY_DECLINED: {
      label: 'צד ב׳ דחה',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      progress: 0,
      description: 'הצד השני דחה את ההצעה.',
    },
    CONTACT_DETAILS_SHARED: {
      label: 'פרטי קשר שותפו',
      icon: Send,
      color: 'text-purple-600',
      bgColor: 'from-purple-50 to-pink-50',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      progress: 70,
      description: 'פרטי הקשר של שני הצדדים שותפו.',
    },
    AWAITING_FIRST_DATE_FEEDBACK: {
      label: 'ממתין למשוב פגישה',
      icon: MessageCircle,
      color: 'text-orange-600',
      bgColor: 'from-orange-50 to-amber-50',
      badgeColor: 'bg-gradient-to-r from-orange-500 to-amber-500 text-white',
      progress: 75,
      description: 'ממתינים לעדכון מהצדדים לאחר הפגישה הראשונה.',
    },
    DATING: {
      label: 'בתהליך היכרות',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'from-pink-50 to-rose-50',
      badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
      progress: 80,
      description: 'הזוג בתהליך היכרות פעיל.',
    },
    ENGAGED: {
      label: 'מאורסים',
      icon: Gem,
      color: 'text-yellow-600',
      bgColor: 'from-yellow-50 to-orange-50',
      badgeColor: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      progress: 95,
      description: 'הזוג התארס - הצלחה גדולה!',
    },
    MARRIED: {
      label: 'נישאו',
      icon: Crown,
      color: 'text-emerald-600',
      bgColor: 'from-emerald-50 to-green-50',
      badgeColor: 'bg-gradient-to-r from-emerald-500 to-green-500 text-white',
      progress: 100,
      description: 'הזוג התחתן - התאמה מושלמת!',
    },
    EXPIRED: {
      label: 'פג תוקף',
      icon: AlarmClock,
      color: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      progress: 0,
      description: 'ההצעה פגה תוקף מכיוון שלא התקבלה תגובה בזמן.',
    },
    CLOSED: {
      label: 'סגור',
      icon: Archive,
      color: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      progress: 0,
      description: 'ההצעה נסגרה על ידי השדכן.',
    },
    CANCELLED: {
      label: 'בוטל',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      progress: 0,
      description: 'ההצעה בוטלה.',
    },
    // Adding all other statuses to avoid crashes, with a default representation
    AWAITING_MATCHMAKER_APPROVAL: {
      label: 'ממתין לאישור שדכן',
      icon: User,
      color: 'text-blue-600',
      bgColor: 'from-blue-50 to-cyan-50',
      badgeColor: 'bg-blue-500',
      progress: 65,
      description: 'ממתין לאישור סופי מהשדכן.',
    },
    THINKING_AFTER_DATE: {
      label: 'בשלב מחשבה',
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'from-indigo-50 to-violet-50',
      badgeColor: 'bg-indigo-500',
      progress: 77,
      description: 'אחד הצדדים או שניהם חושבים על המשך התהליך.',
    },
    PROCEEDING_TO_SECOND_DATE: {
      label: 'ממשיכים לפגישה שניה',
      icon: CheckCircle,
      color: 'text-teal-600',
      bgColor: 'from-teal-50 to-cyan-50',
      badgeColor: 'bg-teal-500',
      progress: 78,
      description: 'הצדדים החליטו להמשיך לפגישה נוספת.',
    },
    ENDED_AFTER_FIRST_DATE: {
      label: 'הסתיים אחרי פגישה',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-red-500',
      progress: 0,
      description: 'ההיכרות הסתיימה לאחר הפגישה הראשונה.',
    },
    MEETING_PENDING: {
      label: 'ממתין לקביעת פגישה',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'from-purple-50 to-pink-50',
      badgeColor: 'bg-purple-500',
      progress: 72,
      description: 'פרטי הקשר שותפו, ממתינים לקביעת פגישה.',
    },
    MEETING_SCHEDULED: {
      label: 'פגישה נקבעה',
      icon: Calendar,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      badgeColor: 'bg-green-500',
      progress: 74,
      description: 'הצדדים קבעו פגישה.',
    },
    MATCH_APPROVED: {
      label: 'ההצעה אושרה',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'from-green-50 to-emerald-50',
      badgeColor: 'bg-green-500',
      progress: 60,
      description: 'ההצעה אושרה על ידי כל הגורמים.',
    },
    MATCH_DECLINED: {
      label: 'ההצעה נדחתה',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      badgeColor: 'bg-red-500',
      progress: 0,
      description: 'ההצעה נדחתה.',
    },
  };

  return (
    statusInfoMap[status] || {
      label: 'בטיפול',
      icon: RefreshCw,
      color: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      badgeColor: 'bg-gradient-to-r from-gray-500 to-slate-500 text-white',
      progress: 30,
      description: 'ההצעה בטיפול השדכן',
    }
  );
};

const getAllStatusLabels = (): Record<MatchSuggestionStatus, string> => {
  return {
    DRAFT: 'טיוטה',
    PENDING_FIRST_PARTY: 'ממתין לתשובת צד א׳',
    FIRST_PARTY_APPROVED: 'צד א׳ אישר',
    FIRST_PARTY_DECLINED: 'צד א׳ דחה',
    PENDING_SECOND_PARTY: 'ממתין לתשובת צד ב׳',
    SECOND_PARTY_APPROVED: 'צד ב׳ אישר',
    SECOND_PARTY_DECLINED: 'צד ב׳ דחה',
    AWAITING_MATCHMAKER_APPROVAL: 'ממתין לאישור שדכן',
    CONTACT_DETAILS_SHARED: 'פרטי קשר שותפו',
    AWAITING_FIRST_DATE_FEEDBACK: 'ממתין למשוב פגישה ראשונה',
    THINKING_AFTER_DATE: 'בשלב מחשבה אחרי פגישה',
    PROCEEDING_TO_SECOND_DATE: 'ממשיכים לפגישה שניה',
    ENDED_AFTER_FIRST_DATE: 'הסתיים אחרי פגישה ראשונה',
    MEETING_PENDING: 'ממתין לקביעת פגישה',
    MEETING_SCHEDULED: 'פגישה נקבעה',
    MATCH_APPROVED: 'ההצעה אושרה',
    MATCH_DECLINED: 'ההצעה נדחתה',
    DATING: 'בתהליך היכרות',
    ENGAGED: 'מאורסים',
    MARRIED: 'נישאו',
    EXPIRED: 'פג תוקף',
    CLOSED: 'סגור',
    CANCELLED: 'בוטל',
  };
};

const DialogHeaderAndTabs: React.FC<{
  suggestion: ExtendedMatchSuggestion;
  statusInfo: StatusInfo;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}> = ({
  suggestion,
  statusInfo,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  activeTab,
  onTabChange,
}) => {
  const StatusIcon = statusInfo.icon;
  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: Eye },
    { id: 'firstParty', label: 'צד ראשון', icon: User },
    { id: 'secondParty', label: 'צד שני', icon: User },
    { id: 'timeline', label: 'ציר זמן', icon: Calendar },
    { id: 'communication', label: 'תקשורת', icon: MessageCircle },
    { id: 'actions', label: 'פעולות', icon: Settings },
  ];

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br',
        statusInfo.bgColor,
        'border-b border-gray-100/80 flex-shrink-0'
      )}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl opacity-40"></div>
      </div>

      <div className="relative z-10 p-6 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
              <StatusIcon className={cn('w-7 h-7', statusInfo.color)} />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
                הצעה #{suggestion.id.toString().split('-')[0]}
              </h1>
              <p className="text-md text-gray-600 mt-1">
                {suggestion.firstParty.firstName} ו
                {suggestion.secondParty.firstName}
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
              <StatusIcon className="w-4 h-4 ml-2" />
              {statusInfo.label}
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleFullscreen}
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
                  <p>{isFullscreen ? 'צמצם חלון' : 'הגדל למסך מלא'}</p>
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

        {/* Tabs Navigation */}
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 h-auto shadow-lg border border-white/50">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl text-xs font-bold transition-all duration-300 py-2 hover:scale-105 relative overflow-hidden group',
                  activeTab === tab.id
                    ? `bg-white text-primary shadow-md`
                    : 'text-gray-600 hover:bg-white/50'
                )}
              >
                <IconComponent className="w-5 h-5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">
                  {tab.label}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>
    </div>
  );
};

const formatDateSafely = (
  dateInput: Date | string | null | undefined
): string => {
  if (!dateInput) return 'לא נקבע';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'תאריך לא תקין';
  }
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
  if (!(deadlineDate instanceof Date) || isNaN(deadlineDate.getTime())) {
    return null;
  }
  const today = new Date();
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// --- CORRECTED --- Changed party: any to party: SuggestionParty
const EnhancedPartyCard: React.FC<{
  party: SuggestionParty;
  label: string;
  color: string;
  status?: MatchSuggestionStatus;
  notes?: string;
  onContact: () => void;
  onReminder?: () => void;
  showReminder?: boolean;
}> = ({
  party,
  label,
  color,
  status,
  notes,
  onContact,
  onReminder,
  showReminder,
}) => {
  const age = party.profile?.birthDate
    ? new Date().getFullYear() - new Date(party.profile.birthDate).getFullYear()
    : null;

  // --- CORRECTED --- Changed (img: any) to (img: UserImage)
  const mainImage = party.images?.find((img: UserImage) => img.isMain)?.url;

  const getPartyStatusLabel = () => {
    if (!status) return null;
    if (label.includes('א׳')) {
      if (status === 'FIRST_PARTY_APPROVED')
        return {
          label: 'אישר',
          icon: CheckCircle,
          className: 'bg-gradient-to-r from-green-500 to-emerald-500',
        };
      if (status === 'FIRST_PARTY_DECLINED')
        return {
          label: 'דחה',
          icon: XCircle,
          className: 'bg-gradient-to-r from-red-500 to-pink-500',
        };
      if (status === 'PENDING_FIRST_PARTY')
        return {
          label: 'ממתין לתשובה',
          icon: Clock,
          className:
            'bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse',
        };
    } else {
      if (status === 'SECOND_PARTY_APPROVED')
        return {
          label: 'אישר',
          icon: CheckCircle,
          className: 'bg-gradient-to-r from-green-500 to-emerald-500',
        };
      if (status === 'SECOND_PARTY_DECLINED')
        return {
          label: 'דחה',
          icon: XCircle,
          className: 'bg-gradient-to-r from-red-500 to-pink-500',
        };
      if (status === 'PENDING_SECOND_PARTY')
        return {
          label: 'ממתין לתשובה',
          icon: Clock,
          className:
            'bg-gradient-to-r from-yellow-500 to-amber-500 animate-pulse',
        };
    }
    return null;
  };

  const partyStatus = getPartyStatusLabel();

  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-xl border-0 p-6 space-y-4 hover:shadow-2xl transition-all duration-300',
        'bg-gradient-to-br from-white to-gray-50/30'
      )}
    >
      <div className="flex items-center justify-between">
        <Badge className={cn('px-4 py-2 font-bold shadow-lg', color)}>
          {label}
        </Badge>
        {partyStatus && (
          <Badge className={cn('text-white shadow-lg', partyStatus.className)}>
            <partyStatus.icon className="w-4 h-4 ml-2" />
            {partyStatus.label}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 rounded-full overflow-hidden shadow-xl border-4 border-white">
          {mainImage ? (
            <Image
              src={getRelativeCloudinaryPath(mainImage)}
              alt={`${party.firstName} ${party.lastName}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
              <User className="w-10 h-10 text-purple-400" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {party.firstName} {party.lastName}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {age && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className="text-gray-700">{age} שנים</span>
              </div>
            )}
            {party.profile?.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">{party.profile.city}</span>
              </div>
            )}
            {party.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-500" />
                <span className="text-gray-700 truncate">{party.email}</span>
              </div>
            )}
            {party.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500" />
                <span className="text-gray-700">{party.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {party.profile?.occupation && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
            <Briefcase className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {party.profile.occupation}
            </span>
          </div>
        )}
        {party.profile?.education && (
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl">
            <GraduationCap className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700 truncate">
              {party.profile.education}
            </span>
          </div>
        )}
      </div>

      {notes && (
        <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
          <h4 className="text-sm font-bold text-cyan-800 mb-2 flex items-center gap-2">
            <Quote className="w-4 h-4" />
            הערות:
          </h4>
          <p className="text-cyan-900 text-sm leading-relaxed">{notes}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <Button
          onClick={onContact}
          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
        >
          <MessageCircle className="w-4 h-4 ml-2" />
          צור קשר
        </Button>
        {showReminder && onReminder && (
          <Button
            onClick={onReminder}
            className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
          >
            <Send className="w-4 h-4 ml-2" />
            שלח תזכורת
          </Button>
        )}
      </div>
    </div>
  );
};

const OverviewTabContent: React.FC<{
  suggestion: ExtendedMatchSuggestion;
  statusInfo: StatusInfo;
  onAction: (
    action: SuggestionDetailsActionType,
    data?: DialogActionData
  ) => void;
}> = ({ suggestion, statusInfo, onAction }) => {
  const lastActivityDate = suggestion.lastActivity;
  const decisionDeadlineDate = suggestion.decisionDeadline;
  const daysRemaining = getDaysRemaining(decisionDeadlineDate);

  return (
    <div className="p-6 space-y-8">
      {/* NEW: Status Summary moved here from the Hero section */}
      <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-800">סיכום סטטוס</h3>
            <div className="text-right text-sm text-gray-600">
              <p>{statusInfo.progress}% הושלמו</p>
            </div>
          </div>
          <div className="space-y-2">
            <Progress
              value={statusInfo.progress}
              className="h-2.5 bg-gray-100 shadow-inner"
            />
            <p className="text-sm text-gray-700 leading-relaxed">
              {statusInfo.description}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3 p-4 bg-purple-50/50 backdrop-blur-sm rounded-xl shadow-inner border border-purple-100">
            <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                {getInitials(
                  `${suggestion.matchmaker?.firstName} ${suggestion.matchmaker?.lastName}`
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-baseline gap-2">
              <p className="text-sm font-medium text-gray-600">השדכן/ית:</p>
              <p className="text-lg font-bold text-gray-800">
                {suggestion.matchmaker?.firstName}{' '}
                {suggestion.matchmaker?.lastName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
              <Calendar className="w-6 h-6" />
            </div>
            פרטי ההצעה
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div className="space-y-2">
            <span className="text-gray-500 font-medium">תאריך יצירה:</span>
            <p className="font-bold text-gray-800">
              {formatDateSafely(suggestion.createdAt)}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-gray-500 font-medium">עדכון אחרון:</span>
            <p className="font-bold text-gray-800">
              {formatDateSafely(lastActivityDate)}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-gray-500 font-medium">דחיפות:</span>
            <Badge
              className={
                suggestion.priority === 'URGENT'
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-pulse'
                  : suggestion.priority === 'HIGH'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                    : suggestion.priority === 'MEDIUM'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                      : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg'
              }
            >
              {suggestion.priority === 'URGENT'
                ? 'דחוף'
                : suggestion.priority === 'HIGH'
                  ? 'גבוה'
                  : suggestion.priority === 'MEDIUM'
                    ? 'רגיל'
                    : 'נמוך'}
            </Badge>
          </div>
          <div className="space-y-2">
            <span className="text-gray-500 font-medium">מועד תגובה:</span>
            <p className="font-bold text-gray-800">
              {suggestion.responseDeadline
                ? formatDateSafely(suggestion.responseDeadline)
                : 'לא נקבע'}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-gray-500 font-medium">מועד להחלטה:</span>
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'font-bold',
                  daysRemaining !== null &&
                    daysRemaining < 3 &&
                    suggestion.status !== 'EXPIRED'
                    ? 'text-red-600'
                    : 'text-gray-800'
                )}
              >
                {decisionDeadlineDate
                  ? formatDateSafely(decisionDeadlineDate)
                  : 'לא נקבע'}
              </p>
              {daysRemaining !== null &&
                daysRemaining < 3 &&
                suggestion.status !== 'EXPIRED' && (
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse">
                    {daysRemaining === 0 ? 'היום!' : `${daysRemaining} ימים`}
                  </Badge>
                )}
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant="outline"
            onClick={() =>
              onAction('edit', { suggestion, suggestionId: suggestion.id })
            }
            className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 rounded-xl"
          >
            <Edit className="w-4 h-4 ml-2" />
            ערוך פרטי הצעה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <EnhancedPartyCard
          party={suggestion.firstParty}
          label="צד א׳"
          color="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
          status={suggestion.status}
          notes={suggestion.firstPartyNotes ?? undefined}
          onContact={() =>
            onAction('contact', {
              suggestionId: suggestion.id,
              partyId: suggestion.firstParty.id,
              partyType: 'first',
            })
          }
          onReminder={() =>
            onAction('reminder', {
              suggestionId: suggestion.id,
              partyId: suggestion.firstParty.id,
              partyType: 'first',
            })
          }
          showReminder={suggestion.status === 'PENDING_FIRST_PARTY'}
        />

        <EnhancedPartyCard
          party={suggestion.secondParty}
          label="צד ב׳"
          color="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          status={suggestion.status}
          notes={suggestion.secondPartyNotes ?? undefined}
          onContact={() =>
            onAction('contact', {
              suggestionId: suggestion.id,
              partyId: suggestion.secondParty.id,
              partyType: 'second',
            })
          }
          onReminder={() =>
            onAction('reminder', {
              suggestionId: suggestion.id,
              partyId: suggestion.secondParty.id,
              partyType: 'second',
            })
          }
          showReminder={suggestion.status === 'PENDING_SECOND_PARTY'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {suggestion.matchingReason && (
          <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-bold flex items-center gap-3 text-emerald-800 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
                <Heart className="w-5 h-5" />
              </div>
              סיבת ההתאמה
            </h3>
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
              <p className="text-emerald-900 leading-relaxed">
                {suggestion.matchingReason}
              </p>
            </div>
          </div>
        )}

        {suggestion.internalNotes && (
          <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-bold flex items-center gap-3 text-amber-800 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              הערות פנימיות
            </h3>
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <p className="text-amber-900 leading-relaxed">
                {suggestion.internalNotes}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestionDetailsDialog: React.FC<SuggestionDetailsDialogProps> = ({
  suggestion,
  isOpen,
  onClose,
  onAction,
  userId,
  dict,
}) => {
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
  const { refreshNotifications } = useNotifications(); // <-- 2. Get the refresh function

  useEffect(() => {
    if (isOpen && suggestion) {
      setActiveTab('overview');
      setShowStatusChange(false);
      setNewStatus(null);
      setStatusChangeNote('');

      // --- START OF FIX 2 ---
      // Check if there are pending inquiries for this user and mark them as read
      const hasUnread = suggestion.inquiries?.some(
        (inq) => inq.toUserId === userId && inq.status === 'PENDING'
      );

      if (hasUnread) {
        const markAsRead = async () => {
          try {
            await fetch(
              `/api/suggestions/${suggestion.id}/inquiries/mark-as-read`,
              {
                method: 'POST',
              }
            );
            // After marking as read, refresh the global notification count
            refreshNotifications();
          } catch (error) {
            console.error('Failed to mark inquiries as read:', error);
          }
        };
        markAsRead();
      }
      // --- END OF FIX 2 ---
    }
  }, [isOpen, suggestion, userId, refreshNotifications]); // Add dependencies

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
        `שגיאה בעדכון הסטטוס: ${error instanceof Error ? error.message : 'שגיאה לא מזוהה'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!suggestion) return null;

  const statusInfo = getEnhancedStatusInfo(suggestion.status);

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
          <DialogHeaderAndTabs
            suggestion={suggestion}
            statusInfo={statusInfo}
            onClose={onClose}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          <div className="flex-1 overflow-y-auto bg-slate-50">
            <TabsContent value="overview" className="m-0 h-full">
              <OverviewTabContent
                suggestion={suggestion}
                statusInfo={statusInfo}
                onAction={onAction}
              />
            </TabsContent>

            <TabsContent value="firstParty" className="m-0 h-full">
              <div className="p-6">
                <ProfileCard
                  profile={suggestion.firstParty.profile}
                  images={suggestion.firstParty.images}
                  questionnaire={firstPartyQuestionnaire}
                  viewMode="matchmaker"
                  isProfileComplete={suggestion.firstParty.isProfileComplete}
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
                    התקדמות ההצעה
                  </h3>

                  <Timeline
                    items={(suggestion?.statusHistory || []).map((history) => {
                      const historyStatusInfo = getEnhancedStatusInfo(
                        history.status as MatchSuggestionStatus
                      );
                      return {
                        title: historyStatusInfo.label,
                        description: history.notes || 'אין הערות',
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
                    תקשורת
                  </h3>
                  <InquiryThreadView
                    suggestionId={suggestion.id}
                    userId={userId}
                    showComposer={true}
                    dict={dict.inquiryThread}
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
                  פעולות נוספות
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
                    <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg w-fit mb-4">
                      <RefreshCw className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-3">שינוי סטטוס</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      עדכון סטטוס ההצעה בהתאם להתקדמות התהליך.
                    </p>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
                      onClick={() => setShowStatusChange(true)}
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      שנה סטטוס
                    </Button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
                    <div className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg w-fit mb-4">
                      <Edit className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-3">עריכת הצעה</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      עריכת פרטי ההצעה, סיבת ההתאמה והערות.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() =>
                        onAction('edit', {
                          suggestionId: suggestion.id,
                          suggestion,
                        })
                      }
                    >
                      <Edit className="w-4 h-4 ml-2" />
                      ערוך פרטי הצעה
                    </Button>
                  </div>

                  <div className="bg-white rounded-2xl shadow-xl border-0 p-6 hover:shadow-2xl transition-all duration-300">
                    <div className="p-3 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg w-fit mb-4">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold mb-3">מחיקת הצעה</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      מחיקת ההצעה לצמיתות מהמערכת.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full border-2 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() =>
                        onAction('delete', { suggestionId: suggestion.id })
                      }
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      מחק הצעה
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
                שינוי סטטוס הצעה
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">
                    סטטוס נוכחי
                  </label>
                  <div className="flex items-center p-3 bg-gray-100 rounded-lg border">
                    <statusInfo.icon
                      className={`w-5 h-5 ml-3 ${statusInfo.color}`}
                    />
                    <span className="font-bold">{statusInfo.label}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">
                    סטטוס חדש
                  </label>
                  <Select
                    value={newStatus || undefined}
                    onValueChange={(value) =>
                      setNewStatus(value as MatchSuggestionStatus)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="בחר/י סטטוס חדש" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {Object.entries(getAllStatusLabels()).map(
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
                    הערות לשינוי סטטוס (אופציונלי)
                  </label>
                  <Textarea
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder="הוסף הערה..."
                    className="min-h-[100px] resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatusChange(false)}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={handleStatusChange}
                    disabled={!newStatus || isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 ml-2 animate-spin" />{' '}
                        מעדכן...
                      </>
                    ) : (
                      'שמור שינוי'
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
