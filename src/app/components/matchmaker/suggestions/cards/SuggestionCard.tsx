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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { MatchSuggestionStatus, Priority } from '@prisma/client';
import type { Suggestion, ActionAdditionalData } from '@/types/suggestions';
import { Progress } from '@/components/ui/progress';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';


// A simple media query hook
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

const getStatusInfo = (status: MatchSuggestionStatus) => {
  // ... (no changes to this function)
  switch (status) {
    case 'PENDING_FIRST_PARTY':
      return {
        label: 'ממתין לצד א׳',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: Clock,
        progress: 25,
      };
    case 'PENDING_SECOND_PARTY':
      return {
        label: 'ממתין לצד ב׳',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: Clock,
        progress: 50,
      };
    case 'FIRST_PARTY_APPROVED':
      return {
        label: 'צד א׳ אישר',
        className: 'bg-green-100 text-green-800 border-green-200',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: CheckCircle,
        progress: 40,
      };
    case 'SECOND_PARTY_APPROVED':
      return {
        label: 'צד ב׳ אישר',
        className: 'bg-green-100 text-green-800 border-green-200',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: CheckCircle,
        progress: 60,
      };
    case 'FIRST_PARTY_DECLINED':
      return {
        label: 'צד א׳ דחה',
        className: 'bg-red-100 text-red-800 border-red-200',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: XCircle,
        progress: 100,
      };
    case 'SECOND_PARTY_DECLINED':
      return {
        label: 'צד ב׳ דחה',
        className: 'bg-red-100 text-red-800 border-red-200',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: XCircle,
        progress: 100,
      };
    case 'CONTACT_DETAILS_SHARED':
      return {
        label: 'פרטי קשר שותפו',
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        icon: Send,
        progress: 70,
      };
    case 'DATING':
      return {
        label: 'בתהליך היכרות',
        className: 'bg-pink-100 text-pink-800 border-pink-200',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        icon: Heart,
        progress: 80,
      };
    case 'AWAITING_FIRST_DATE_FEEDBACK':
      return {
        label: 'ממתין למשוב פגישה',
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: AlertCircle,
        progress: 75,
      };
    case 'EXPIRED':
      return {
        label: 'פג תוקף',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        icon: Clock,
        progress: 100,
      };
    default:
      return {
        label: 'בטיפול',
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        icon: RefreshCw,
        progress: 30,
      };
  }
};

const getPriorityInfo = (priority: Priority) => {
  // ... (no changes to this function)
   switch (priority) {
    case "URGENT":
      return {
        label: "דחוף",
        className: "bg-red-100 text-red-800 border-red-200",
        icon: AlertCircle,
        color: "text-red-600",
        borderColor: "border-red-500",
      };
    case "HIGH":
      return {
        label: "גבוה",
        className: "bg-orange-100 text-orange-800 border-orange-200",
        icon: Star,
        color: "text-orange-600",
        borderColor: "border-orange-500",
      };
    case "MEDIUM":
      return {
        label: "רגיל",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Star,
        color: "text-blue-600",
        borderColor: "border-blue-500",
      };
    case "LOW":
      return {
        label: "נמוך",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Star,
        color: "text-gray-600",
        borderColor: "border-gray-400",
      };
    default:
      return {
        label: "רגיל",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Star,
        color: "text-blue-600",
        borderColor: "border-blue-500",
      };
  }
};

const getDaysLeft = (decisionDeadline?: Date | string | null) => {
  // ... (no changes to this function)
  if (!decisionDeadline) return null;

  const deadline = new Date(decisionDeadline);
  const today = new Date();
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

// --- START OF NEW COMPONENT ---
// Helper component for highlight pills in the new mobile card
const HighlightPill: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
    <div className="flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs text-blue-800 font-medium">
        <Icon className="w-4 h-4 text-blue-500" />
        <span>{text}</span>
    </div>
);
// --- END OF NEW COMPONENT ---


const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAction,
  className,
  variant = "full",
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Common data
  const { firstParty, secondParty, matchmaker } = suggestion;
  const statusInfo = getStatusInfo(suggestion.status);
  const priorityInfo = getPriorityInfo(suggestion.priority);
  const daysLeft = getDaysLeft(suggestion.decisionDeadline);
  const firstPartyAge = calculateAge(firstParty.profile.birthDate);
  const secondPartyAge = calculateAge(secondParty.profile.birthDate);
  const firstPartyImageUrl = firstParty.images.find((img) => img.isMain)?.url || '/placeholders/user.png';
  const secondPartyImageUrl = secondParty.images.find((img) => img.isMain)?.url || '/placeholders/user.png';

  // --- START: Hardcoded highlights for demonstration. In a real scenario, this would be dynamically generated. ---
  // This logic can be moved to a helper function `extractHighlights(suggestion)`
  const highlights = [
    { icon: Heart, text: "ערכים משפחתיים דומים" },
    { icon: Sparkles, text: "השקפה דתית תואמת" },
    { icon: MapPin, text: "קרבה גאוגרפית" },
  ].slice(0, 3); // Show up to 3 highlights
  // --- END: Hardcoded highlights ---

  // ######################################################################
  // #                        MOBILE - KANBAN VIEW                        #
  // ######################################################################
  if (isMobile && variant === "compact") {
    const StatusIcon = statusInfo.icon;
    return (
      <Card
        className={cn(
          "p-3 w-full cursor-pointer hover:bg-gray-50",
          "border-l-4",
          priorityInfo.borderColor,
          className
        )}
        onClick={() => onAction("view", suggestion)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 space-y-1">
            <h4 className="font-semibold text-sm leading-tight">
              {firstParty.firstName} ו{secondParty.firstName}
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <Image
                  src={getRelativeCloudinaryPath(firstPartyImageUrl)}
                  alt={firstParty.firstName}
                  width={24}
                  height={24}
                  className="rounded-full border-2 border-white"
                />
                <Image
                  src={getRelativeCloudinaryPath(secondPartyImageUrl)}
                  alt={secondParty.firstName}
                  width={24}
                  height={24}
                  className="rounded-full border-2 border-white"
                />
              </div>
              <p className="text-xs text-gray-500">
                {firstPartyAge}, {secondPartyAge}
              </p>
            </div>
          </div>
          <div className={cn("p-1 rounded-full", statusInfo.bgColor)}>
            <StatusIcon className={cn("w-4 h-4", statusInfo.color)} />
          </div>
        </div>
      </Card>
    );
  }

  // ######################################################################
  // #               NEW MOBILE - "STORY CARD" LIST VIEW                  #
  // ######################################################################
  if (isMobile && variant === "full") {
    return (
        <Card className={cn("overflow-hidden shadow-sm border border-gray-200/80 bg-white", className)}>
            <CardContent className="p-4 space-y-5">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">הצעה חדשה עבורך</h3>
                    <Badge className={cn("text-xs", statusInfo.className)}>{statusInfo.label}</Badge>
                </div>

             {/* Matchmaker's Touch */}
{matchmaker && (
    <div className="text-center bg-slate-50 border border-slate-200 rounded-lg p-3">
        <p className="text-sm text-gray-700">
            השדכן/ית <span className="font-semibold text-blue-600">{matchmaker.firstName} {matchmaker.lastName}</span> חשב/ה שעשויה להיות פה התאמה מיוחדת.
        </p>
        {suggestion.matchingReason && (
            <p className="text-xs text-gray-500 mt-1 italic line-clamp-2">
                {suggestion.matchingReason}
            </p>
        )}
    </div>
)}

                {/* Connection Highlights */}
                <div>
                    <h4 className="font-semibold text-sm mb-3 text-center text-gray-600">נקודות חיבור מרכזיות</h4>
                    <div className="flex flex-wrap justify-center gap-2">
                        {highlights.map((highlight, index) => (
                           <HighlightPill key={index} icon={highlight.icon} text={highlight.text} />
                        ))}
                    </div>
                </div>

                {/* The People */}
                <div className="space-y-4">
                    {/* First Party */}
                    <div className="flex items-center gap-4">
                        <Image
                          src={getRelativeCloudinaryPath(firstPartyImageUrl)}
                          alt={firstParty.firstName}
                          width={60}
                          height={60}
                          className="rounded-full border-2 border-white shadow-md"
                        />
                        <div className="flex-1">
                            <h5 className="font-bold">{firstParty.firstName}, {firstPartyAge}</h5>
                            <p className="text-sm text-gray-500">{firstParty.profile.city}</p>
                        </div>
                    </div>
                    {/* Second Party */}
                     <div className="flex items-center gap-4">
                        <Image
                          src={getRelativeCloudinaryPath(secondPartyImageUrl)}
                          alt={secondParty.firstName}
                          width={60}
                          height={60}
                          className="rounded-full border-2 border-white shadow-md"
                        />
                        <div className="flex-1">
                            <h5 className="font-bold">{secondParty.firstName}, {secondPartyAge}</h5>
                            <p className="text-sm text-gray-500">{secondParty.profile.city}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-100 space-y-3">
                    <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onAction("view", suggestion)}>
                        <Eye className="w-4 h-4 ml-2" />
                        לפרטים המלאים ולסיפור המלא
                    </Button>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                           נשלח {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true, locale: he })}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-gray-500">
                                    <MoreHorizontal className="w-5 h-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onAction("edit", suggestion)}>
                                    <Edit className="w-4 h-4 ml-2" />
                                    <span>ערוך הצעה</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAction("message", suggestion)}>
                                    <MessageCircle className="w-4 h-4 ml-2" />
                                    <span>שלח הודעה</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onAction("delete", suggestion)} className="text-red-600">
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
  const canBeResent = ["EXPIRED", "FIRST_PARTY_DECLINED", "SECOND_PARTY_DECLINED"].includes(suggestion.status);
  
  return (
    <Card className={cn("overflow-hidden hover:shadow-md transition-shadow", className)}>
      {/* Header with status and progress */}
      <div className={cn("p-4 border-b relative", statusInfo.bgColor)}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={cn("w-5 h-5", statusInfo.color)} />
            <span className="font-medium text-gray-900">{statusInfo.label}</span>
          </div>
          <Badge className={priorityInfo.className}>
            <PriorityIcon className="w-3 h-3 ml-1" />
            {priorityInfo.label}
          </Badge>
        </div>
        <Progress value={statusInfo.progress} className="h-1.5" />
        {daysLeft !== null && daysLeft <= 3 && suggestion.status !== "EXPIRED" && (
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold py-0.5 px-2 rounded-full whitespace-nowrap z-10">
            <Clock className="w-3 h-3 inline-block ml-1" />
            {daysLeft === 0 ? "היום אחרון!" : `${daysLeft} ימים נותרו`}
          </div>
        )}
      </div>

      {/* Main content - a copy of the original desktop view */}
      <div className="p-4">
        {/* Parties info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2 border-l pl-4 order-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-blue-50">צד א׳</Badge>
              {suggestion.status === "FIRST_PARTY_APPROVED" && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />אישר</Badge>}
              {suggestion.status === "FIRST_PARTY_DECLINED" && <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 ml-1" />דחה</Badge>}
            </div>
            <div className="flex gap-3">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 border">
                <Image src={getRelativeCloudinaryPath(firstPartyImageUrl)} alt={firstParty.firstName} className="object-cover" fill sizes="4rem" />
              </div>
              <div>
                <h4 className="font-semibold">{firstParty.firstName} {firstParty.lastName}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center"><Calendar className="w-3 h-3 ml-1 text-gray-400" /><span>{firstPartyAge} שנים</span></div>
                  {firstParty.profile.city && <div className="flex items-center"><MapPin className="w-3 h-3 ml-1 text-gray-400" /><span>{firstParty.profile.city}</span></div>}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2 order-0">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-purple-50">צד ב׳</Badge>
              {suggestion.status === "SECOND_PARTY_APPROVED" && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />אישר</Badge>}
              {suggestion.status === "SECOND_PARTY_DECLINED" && <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 ml-1" />דחה</Badge>}
            </div>
            <div className="flex gap-3">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 border">
                <Image src={getRelativeCloudinaryPath(secondPartyImageUrl)} alt={secondParty.firstName} className="object-cover" fill sizes="4rem" />
              </div>
              <div>
                <h4 className="font-semibold">{secondParty.firstName} {secondParty.lastName}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center"><Calendar className="w-3 h-3 ml-1 text-gray-400" /><span>{secondPartyAge} שנים</span></div>
                  {secondParty.profile.city && <div className="flex items-center"><MapPin className="w-3 h-3 ml-1 text-gray-400" /><span>{secondParty.profile.city}</span></div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {suggestion.matchingReason && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border text-sm">
            <h5 className="text-xs font-semibold text-gray-600 mb-1">סיבת ההתאמה:</h5>
            <p className="text-gray-800 line-clamp-2">{suggestion.matchingReason}</p>
          </div>
        )}

        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center"><Clock className="w-3.5 h-3.5 ml-1" />{formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true, locale: he })}</div>
          {suggestion.decisionDeadline && <div className="flex items-center"><CalendarClock className="w-3.5 h-3.5 ml-1" />{daysLeft !== null ? (daysLeft === 0 ? "היום!" : `${daysLeft} ימים להחלטה`) : "אין מועד אחרון"}</div>}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => onAction("message", suggestion)} className="text-gray-600 hover:text-primary"><MessageCircle className="w-4 h-4 ml-1" />הודעה</Button>
          <div className="flex items-center gap-1">
            <Button variant="default" size="sm" onClick={() => onAction("view", suggestion)}><Eye className="w-4 h-4 ml-1" />פרטים</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="px-1"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction("edit", suggestion)}><Edit className="w-4 h-4 ml-2" /><span>ערוך הצעה</span></DropdownMenuItem>
                {canBeResent && <DropdownMenuItem onClick={() => onAction("resend", suggestion)}><RefreshCw className="w-4 h-4 ml-2" /><span>שלח מחדש</span></DropdownMenuItem>}
                <DropdownMenuItem onClick={() => onAction("delete", suggestion)} className="text-red-600"><Trash2 className="w-4 h-4 ml-2" /><span>מחק הצעה</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SuggestionCard;