// src/app/components/matchmaker/suggestions/cards/SuggestionCard.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import {
  Clock,
  User,
  MessageCircle,
  Eye,
  AlertCircle,
  MoreHorizontal,
  Send,
  RefreshCw,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  CalendarClock,
  Heart,
  MapPin,
  Calendar,
  Star,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Crown,
  Zap,
  Award,
  Target,
  Users,
  Quote,
  Briefcase,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Phone,
  Mail,
  Gift,
  Flame,
  TrendingUp,
  Shield,
  Gem,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { MatchSuggestionStatus, Priority } from '@prisma/client';
import type { Suggestion, ActionAdditionalData } from '@/types/suggestions';
import { Progress } from '@/components/ui/progress';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Media query hook
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
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

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAction: (
    type:
      | 'view'
      | 'contact'
      | 'message'
      | 'edit'
      | 'delete'
      | 'resend'
      | 'changeStatus'
      | 'reminder',
    suggestion: Suggestion,
    additionalData?: ActionAdditionalData
  ) => void;
  className?: string;
  variant?: 'full' | 'compact';
}

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const getEnhancedStatusInfo = (status: MatchSuggestionStatus) => {
  switch (status) {
    case 'PENDING_FIRST_PARTY':
      return {
        label: 'ממתין לצד א׳',
        shortLabel: 'ממתין א׳',
        className:
          'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200 shadow-lg',
        color: 'text-yellow-600',
        bgColor: 'from-yellow-50 to-amber-50',
        icon: Clock,
        progress: 25,
        description: 'ההצעה נשלחה לצד הראשון וממתינה לתשובה',
        pulse: true,
      };
    case 'PENDING_SECOND_PARTY':
      return {
        label: 'ממתין לצד ב׳',
        shortLabel: 'ממתין ב׳',
        className:
          'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200 shadow-lg',
        color: 'text-blue-600',
        bgColor: 'from-blue-50 to-cyan-50',
        icon: Clock,
        progress: 50,
        description: 'הצד הראשון אישר וההצעה נשלחה לצד השני',
        pulse: true,
      };
    case 'FIRST_PARTY_APPROVED':
      return {
        label: 'צד א׳ אישר',
        shortLabel: 'א׳ אישר',
        className:
          'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 shadow-lg',
        color: 'text-green-600',
        bgColor: 'from-green-50 to-emerald-50',
        icon: CheckCircle,
        progress: 40,
        description: 'הצד הראשון אישר את ההצעה',
      };
    case 'SECOND_PARTY_APPROVED':
      return {
        label: 'צד ב׳ אישר',
        shortLabel: 'ב׳ אישר',
        className:
          'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200 shadow-lg',
        color: 'text-green-600',
        bgColor: 'from-green-50 to-emerald-50',
        icon: CheckCircle,
        progress: 60,
        description: 'שני הצדדים אישרו את ההצעה',
      };
    case 'FIRST_PARTY_DECLINED':
      return {
        label: 'צד א׳ דחה',
        shortLabel: 'א׳ דחה',
        className:
          'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200 shadow-lg',
        color: 'text-red-600',
        bgColor: 'from-red-50 to-pink-50',
        icon: XCircle,
        progress: 100,
        description: 'הצד הראשון דחה את ההצעה',
      };
    case 'SECOND_PARTY_DECLINED':
      return {
        label: 'צד ב׳ דחה',
        shortLabel: 'ב׳ דחה',
        className:
          'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200 shadow-lg',
        color: 'text-red-600',
        bgColor: 'from-red-50 to-pink-50',
        icon: XCircle,
        progress: 100,
        description: 'הצד השני דחה את ההצעה',
      };
    case 'CONTACT_DETAILS_SHARED':
      return {
        label: 'פרטי קשר שותפו',
        shortLabel: 'פרטים שותפו',
        className:
          'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 shadow-lg',
        color: 'text-purple-600',
        bgColor: 'from-purple-50 to-pink-50',
        icon: Send,
        progress: 70,
        description: 'פרטי הקשר של שני הצדדים שותפו',
      };
    case 'DATING':
      return {
        label: 'בתהליך היכרות',
        shortLabel: 'מכירים',
        className:
          'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border-pink-200 shadow-lg',
        color: 'text-pink-600',
        bgColor: 'from-pink-50 to-rose-50',
        icon: Heart,
        progress: 80,
        description: 'הזוג בתהליך היכרות פעיל',
      };
    case 'ENGAGED':
      return {
        label: 'מאורסים',
        shortLabel: 'מאורסים',
        className:
          'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200 shadow-lg',
        color: 'text-yellow-600',
        bgColor: 'from-yellow-50 to-orange-50',
        icon: Gem,
        progress: 95,
        description: 'הזוג התארס - הצלחה גדולה!',
      };
    case 'MARRIED':
      return {
        label: 'נישאו',
        shortLabel: 'נישאו',
        className:
          'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200 shadow-lg',
        color: 'text-emerald-600',
        bgColor: 'from-emerald-50 to-green-50',
        icon: Crown,
        progress: 100,
        description: 'הזוג התחתן - התאמה מושלמת!',
      };
    case 'AWAITING_FIRST_DATE_FEEDBACK':
      return {
        label: 'ממתין למשוב פגישה',
        shortLabel: 'משוב פגישה',
        className:
          'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-200 shadow-lg',
        color: 'text-orange-600',
        bgColor: 'from-orange-50 to-amber-50',
        icon: AlertCircle,
        progress: 75,
        description: 'הפגישה התקיימה וממתינים למשוב',
        pulse: true,
      };
    case 'EXPIRED':
      return {
        label: 'פג תוקף',
        shortLabel: 'פג תוקף',
        className:
          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 shadow-lg',
        color: 'text-gray-600',
        bgColor: 'from-gray-50 to-slate-50',
        icon: Clock,
        progress: 100,
        description: 'זמן התגובה עבר ולא הוענתה תשובה',
      };
    default:
      return {
        label: 'בטיפול',
        shortLabel: 'בטיפול',
        className:
          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200 shadow-lg',
        color: 'text-gray-600',
        bgColor: 'from-gray-50 to-slate-50',
        icon: RefreshCw,
        progress: 30,
        description: 'ההצעה בטיפול השדכן',
      };
  }
};

const getEnhancedPriorityInfo = (priority: Priority) => {
  switch (priority) {
    case 'URGENT':
      return {
        label: 'דחוף',
        className:
          'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-xl animate-pulse',
        icon: Flame,
        color: 'text-red-600',
        borderColor: 'border-red-500',
        bgGradient: 'from-red-50 to-pink-50',
      };
    case 'HIGH':
      return {
        label: 'גבוה',
        className:
          'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg',
        icon: Star,
        color: 'text-orange-600',
        borderColor: 'border-orange-500',
        bgGradient: 'from-orange-50 to-amber-50',
      };
    case 'MEDIUM':
      return {
        label: 'רגיל',
        className:
          'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg',
        icon: Target,
        color: 'text-blue-600',
        borderColor: 'border-blue-500',
        bgGradient: 'from-blue-50 to-cyan-50',
      };
    case 'LOW':
      return {
        label: 'נמוך',
        className:
          'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg',
        icon: Shield,
        color: 'text-gray-600',
        borderColor: 'border-gray-400',
        bgGradient: 'from-gray-50 to-slate-50',
      };
    default:
      return {
        label: 'רגיל',
        className:
          'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg',
        icon: Target,
        color: 'text-blue-600',
        borderColor: 'border-blue-500',
        bgGradient: 'from-blue-50 to-cyan-50',
      };
  }
};

const getDaysLeft = (decisionDeadline?: Date | string | null) => {
  if (!decisionDeadline) return null;
  const deadline = new Date(decisionDeadline);
  const today = new Date();
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Enhanced highlight component
const HighlightPill: React.FC<{
  icon: React.ElementType;
  text: string;
  color?: string;
}> = ({ icon: Icon, text, color = 'from-blue-500 to-cyan-500' }) => (
  <div
    className={cn(
      'flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border-2 px-3 py-1.5 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105',
      'border-transparent bg-gradient-to-r text-white',
      color
    )}
  >
    <Icon className="w-3 h-3" />
    <span>{text}</span>
  </div>
);

// Enhanced matchmaker info component
const MatchmakerInfo: React.FC<{
  matchmaker: { firstName: string; lastName: string } | undefined;
  className?: string;
}> = ({ matchmaker, className }) => {
  if (!matchmaker) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100 shadow-sm',
          className
        )}
      >
        <div className="text-center text-gray-500">
          <p className="text-sm">אין מידע על השדכן</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 shadow-sm',
        className
      )}
    >
      <Avatar className="w-10 h-10 border-2 border-white shadow-lg">
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
          {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-xs font-medium text-purple-600">השדכן/ית</p>
        <p className="text-sm font-bold text-gray-800">
          {matchmaker.firstName} {matchmaker.lastName}
        </p>
      </div>
    </div>
  );
};

// Enhanced party display component
const PartyDisplay: React.FC<{
  party: any;
  isCompact?: boolean;
}> = ({ party, isCompact = false }) => {
  const imageUrl =
    party.images.find((img: any) => img.isMain)?.url ||
    '/placeholders/user.png';

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          'relative rounded-full overflow-hidden shadow-xl border-3 border-white',
          isCompact ? 'h-12 w-12' : 'h-16 w-16'
        )}
      >
        <Image
          src={getRelativeCloudinaryPath(imageUrl)}
          alt={party.firstName}
          fill
          className="object-cover"
          sizes={isCompact ? '3rem' : '4rem'}
        />
      </div>

      <div className="text-center">
        <h4
          className={cn(
            'font-bold text-gray-800',
            isCompact ? 'text-sm' : 'text-base'
          )}
        >
          {party.firstName} {party.lastName}
        </h4>
        {party.profile?.city && (
          <div
            className={cn(
              'flex items-center justify-center gap-1 text-gray-600',
              isCompact ? 'text-xs' : 'text-sm'
            )}
          >
            <MapPin className="w-3 h-3 text-green-500" />
            <span>{party.profile.city}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAction,
  className,
  variant = 'full',
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isExpanded, setIsExpanded] = useState(false);

  // Common data
  const { firstParty, secondParty, matchmaker } = suggestion;
  const statusInfo = getEnhancedStatusInfo(suggestion.status);
  const priorityInfo = getEnhancedPriorityInfo(suggestion.priority);
  const daysLeft = getDaysLeft(suggestion.decisionDeadline);

  const firstPartyAge = calculateAge(firstParty.profile.birthDate);
  const secondPartyAge = calculateAge(secondParty.profile.birthDate);

  // Generate highlights based on suggestion data
  const highlights = [
    {
      icon: Heart,
      text: 'ערכים משפחתיים דומים',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Sparkles,
      text: 'השקפה דתית תואמת',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: MapPin,
      text: 'קרבה גיאוגרפית',
      color: 'from-green-500 to-emerald-500',
    },
  ].slice(0, 3);

  // ######################################################################
  // #                        MOBILE - KANBAN VIEW                        #
  // ######################################################################
  if (isMobile && variant === 'compact') {
    const StatusIcon = statusInfo.icon;
    return (
      <Card
        className={cn(
          'w-full cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden',
          'border-l-4 bg-gradient-to-br from-white to-gray-50/50',
          priorityInfo.borderColor,
          className
        )}
        onClick={() => onAction('view', suggestion)}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h4 className="font-bold text-gray-800 mb-2 text-sm leading-tight">
                {firstParty.firstName} ו{secondParty.firstName}
              </h4>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex -space-x-2">
                  <Image
                    src={getRelativeCloudinaryPath(
                      firstParty.images.find((img) => img.isMain)?.url ||
                        '/placeholders/user.png'
                    )}
                    alt={firstParty.firstName}
                    width={24}
                    height={24}
                    className="rounded-full border-2 border-white shadow-md"
                  />
                  <Image
                    src={getRelativeCloudinaryPath(
                      secondParty.images.find((img) => img.isMain)?.url ||
                        '/placeholders/user.png'
                    )}
                    alt={secondParty.firstName}
                    width={24}
                    height={24}
                    className="rounded-full border-2 border-white shadow-md"
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {firstPartyAge}, {secondPartyAge}
                </span>
              </div>
            </div>

            <div
              className={cn(
                'p-2 rounded-full shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-r',
                statusInfo.bgColor
              )}
            >
              <StatusIcon className={cn('w-4 h-4', statusInfo.color)} />
            </div>
          </div>

          <Badge className={cn('text-xs font-bold', statusInfo.className)}>
            {statusInfo.shortLabel}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  // ######################################################################
  // #               MOBILE - "STORY CARD" LIST VIEW                      #
  // ######################################################################
  if (isMobile && variant === 'full') {
    return (
      <Card
        className={cn(
          'overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 hover:shadow-2xl transition-all duration-500 group',
          className
        )}
      >
        <CardContent className="p-6 space-y-6">
          {/* Header with floating elements */}
          <div className="relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-lg"></div>

            <div className="relative z-10 flex justify-between items-center">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                הצעה חדשה עבורך
              </h3>
              <Badge
                className={cn(
                  'text-sm font-bold shadow-xl',
                  statusInfo.className
                )}
              >
                <statusInfo.icon className="w-4 h-4 ml-2" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Priority indicator for urgent items */}
          {suggestion.priority === 'URGENT' && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-red-100 to-pink-100 border border-red-200 rounded-xl shadow-lg">
              <Flame className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="text-red-700 font-bold text-sm">
                דחוף - דורש טיפול מיידי!
              </span>
            </div>
          )}

          {/* Matchmaker's Touch */}
          <MatchmakerInfo matchmaker={matchmaker} />

          {/* Connection Highlights */}
          <div>
            <h4 className="font-bold text-lg mb-3 text-center text-gray-700 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              נקודות חיבור מרכזיות
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {highlights.map((highlight, index) => (
                <HighlightPill
                  key={index}
                  icon={highlight.icon}
                  text={highlight.text}
                  color={highlight.color}
                />
              ))}
            </div>
          </div>

          {/* The People - Enhanced */}
          <div className="space-y-6">
            <PartyDisplay party={firstParty} />

            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl">
                <Heart className="w-6 h-6" />
              </div>
            </div>

            <PartyDisplay party={secondParty} />
          </div>

          {/* Matching Reason */}
          {suggestion.matchingReason && (
            <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl shadow-inner">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-cyan-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-cyan-800 mb-2">
                    למה זה מתאים דווקא לכם:
                  </h4>
                  <p className="text-cyan-900 leading-relaxed italic font-medium text-sm">
                    "{suggestion.matchingReason}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{statusInfo.description}</span>
              <span>{statusInfo.progress}%</span>
            </div>
            <Progress
              value={statusInfo.progress}
              className="h-2 bg-gray-100 shadow-inner"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-purple-100 space-y-4">
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-14 font-bold text-lg transform hover:scale-105"
              onClick={() => onAction('view', suggestion)}
            >
              <Eye className="w-6 h-6 ml-3" />
              לפרטים המלאים ולסיפור המלא
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 font-medium">
                נשלח{' '}
                {formatDistanceToNow(new Date(suggestion.createdAt), {
                  addSuffix: true,
                  locale: he,
                })}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-gray-500 hover:bg-purple-50 rounded-full"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onAction('edit', suggestion)}
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    <span>ערוך הצעה</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onAction('message', suggestion)}
                  >
                    <MessageCircle className="w-4 h-4 ml-2" />
                    <span>שלח הודעה</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onAction('delete', suggestion)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    <span>מחק הצעה</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ######################################################################
  // #                              DESKTOP VIEW                          #
  // ######################################################################
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;
  const canBeResent = [
    'EXPIRED',
    'FIRST_PARTY_DECLINED',
    'SECOND_PARTY_DECLINED',
  ].includes(suggestion.status);

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 bg-gradient-to-br from-white via-gray-50/30 to-purple-50/20',
          className
        )}
      >
        {/* Enhanced Header with gradient and animations */}
        <div
          className={cn(
            'p-6 border-b relative overflow-hidden bg-gradient-to-r shadow-lg',
            statusInfo.bgColor
          )}
        >
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform bg-white/20 backdrop-blur-sm'
                  )}
                >
                  <StatusIcon className={cn('w-6 h-6', statusInfo.color)} />
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-lg">
                    {statusInfo.label}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {statusInfo.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={priorityInfo.className}>
                  <PriorityIcon className="w-4 h-4 ml-2" />
                  {priorityInfo.label}
                </Badge>

                {daysLeft !== null &&
                  daysLeft <= 3 &&
                  suggestion.status !== 'EXPIRED' && (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-xl animate-pulse">
                      <Clock className="w-3 h-3 ml-1" />
                      {daysLeft === 0
                        ? 'היום אחרון!'
                        : `${daysLeft} ימים נותרו`}
                    </Badge>
                  )}
              </div>
            </div>

            <Progress
              value={statusInfo.progress}
              className="h-3 bg-white/30 shadow-inner"
            />
          </div>
        </div>

        {/* Enhanced Main content */}
        <div className="p-6 space-y-6">
          {/* Matchmaker info */}
          <MatchmakerInfo matchmaker={matchmaker} />

          {/* Parties info - Side by side with modern design */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <PartyDisplay party={firstParty} />

              {/* Additional party details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {firstParty.profile?.occupation && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg shadow-sm cursor-pointer">
                        <Briefcase className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-gray-700 truncate">
                          {firstParty.profile.occupation}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{firstParty.profile.occupation}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {firstParty.profile?.education && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg shadow-sm cursor-pointer">
                        <GraduationCap className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-700 truncate">
                          {firstParty.profile.education}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{firstParty.profile.education}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Status for this party */}
              {(suggestion.status === 'FIRST_PARTY_APPROVED' ||
                suggestion.status === 'FIRST_PARTY_DECLINED') && (
                <Badge
                  className={
                    suggestion.status === 'FIRST_PARTY_APPROVED'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg'
                  }
                >
                  {suggestion.status === 'FIRST_PARTY_APPROVED' ? (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      אישר את ההצעה
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 ml-2" />
                      דחה את ההצעה
                    </>
                  )}
                </Badge>
              )}
            </div>

            <div className="space-y-4 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <PartyDisplay party={secondParty} />

              {/* Additional party details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {secondParty.profile?.occupation && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg shadow-sm cursor-pointer">
                        <Briefcase className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-700 truncate">
                          {secondParty.profile.occupation}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{secondParty.profile.occupation}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {secondParty.profile?.education && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-2 bg-white/70 rounded-lg shadow-sm cursor-pointer">
                        <GraduationCap className="w-4 h-4 text-pink-500" />
                        <span className="font-medium text-gray-700 truncate">
                          {secondParty.profile.education}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{secondParty.profile.education}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>

              {/* Status for this party */}
              {(suggestion.status === 'SECOND_PARTY_APPROVED' ||
                suggestion.status === 'SECOND_PARTY_DECLINED') && (
                <Badge
                  className={
                    suggestion.status === 'SECOND_PARTY_APPROVED'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg'
                  }
                >
                  {suggestion.status === 'SECOND_PARTY_APPROVED' ? (
                    <>
                      <CheckCircle className="w-4 h-4 ml-2" />
                      אישר את ההצעה
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 ml-2" />
                      דחה את ההצעה
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>

          {/* Connection highlights */}
          <div className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-100 shadow-lg">
            <h4 className="font-bold text-lg mb-3 text-cyan-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-500" />
              נקודות חיבור מרכזיות
            </h4>
            <div className="flex flex-wrap gap-2">
              {highlights.map((highlight, index) => (
                <HighlightPill
                  key={index}
                  icon={highlight.icon}
                  text={highlight.text}
                  color={highlight.color}
                />
              ))}
            </div>
          </div>

          {/* Matching reason */}
          {suggestion.matchingReason && (
            <div className="p-5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 shadow-lg">
              <h5 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                <Quote className="w-4 h-4" />
                סיבת ההתאמה:
              </h5>
              <p className="text-emerald-800 leading-relaxed font-medium">
                {suggestion.matchingReason}
              </p>
            </div>
          )}

          {/* Timeline info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl shadow-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <p className="font-medium text-gray-600">נוצר</p>
                <p className="text-gray-800">
                  {formatDistanceToNow(new Date(suggestion.createdAt), {
                    addSuffix: true,
                    locale: he,
                  })}
                </p>
              </div>
            </div>

            {suggestion.decisionDeadline && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl shadow-sm">
                <CalendarClock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="font-medium text-orange-600">מועד יעד</p>
                  <p className="text-orange-800">
                    {daysLeft !== null
                      ? daysLeft === 0
                        ? 'היום!'
                        : `${daysLeft} ימים להחלטה`
                      : 'אין מועד אחרון'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl shadow-sm">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <div>
                <p className="font-medium text-blue-600">התקדמות</p>
                <p className="text-blue-800">{statusInfo.progress}% הושלמו</p>
              </div>
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAction('message', suggestion)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl font-medium"
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                הודעה
              </Button>

              {canBeResent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction('resend', suggestion)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl font-medium"
                >
                  <RefreshCw className="w-4 h-4 ml-2" />
                  שלח מחדש
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onAction('view', suggestion)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
              >
                <Eye className="w-4 h-4 ml-2" />
                פרטים
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="px-2 hover:bg-gray-100 rounded-xl"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onAction('edit', suggestion)}
                  >
                    <Edit className="w-4 h-4 ml-2" />
                    <span>ערוך הצעה</span>
                  </DropdownMenuItem>

                  {canBeResent && (
                    <DropdownMenuItem
                      onClick={() => onAction('resend', suggestion)}
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      <span>שלח מחדש</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => onAction('delete', suggestion)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    <span>מחק הצעה</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default SuggestionCard;
