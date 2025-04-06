// Full path: src/app/components/suggestions/cards/MinimalSuggestionCard.tsx

import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  MapPin,
  Briefcase,
  Clock,
  UserCircle,
  Eye,
  CheckCircle,
  XCircle,
  MessageCircle,
  Heart,
  BookOpen,
  Scroll,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { format, formatDistanceToNow, isAfter, subDays } from "date-fns";
import { he } from "date-fns/locale";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";
import { cn } from "@/lib/utils";

interface ExtendedUserProfile extends UserProfile {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface PartyInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile: ExtendedUserProfile;
  images: UserImage[];
}

interface ExtendedMatchSuggestion extends MatchSuggestion {
  matchmaker: {
    firstName: string;
    lastName: string;
  };
  firstParty: PartyInfo;
  secondParty: PartyInfo;
}

interface MinimalSuggestionCardProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  onClick: (suggestion: ExtendedMatchSuggestion) => void;
  onQuickAction?: (suggestion: ExtendedMatchSuggestion) => void;
  onApprove?: (suggestion: ExtendedMatchSuggestion) => void;
  onInquiry?: (suggestion: ExtendedMatchSuggestion) => void;
  onDecline?: (suggestion: ExtendedMatchSuggestion) => void;
  className?: string;
  isHistory?: boolean;
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

const getStatusInfo = (status: string) => {
  switch (status) {
    case "PENDING_FIRST_PARTY":
      return {
        label: "ממתין לתשובתך",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="w-3 h-3 ml-1" />,
      };
    case "PENDING_SECOND_PARTY":
      return {
        label: "ממתין לתשובת הצד השני",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Clock className="w-3 h-3 ml-1" />,
      };
    case "FIRST_PARTY_APPROVED":
      return {
        label: "אישרת את ההצעה",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-3 h-3 ml-1" />,
      };
    case "SECOND_PARTY_APPROVED":
      return {
        label: "הצד השני אישר את ההצעה",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="w-3 h-3 ml-1" />,
      };
    case "CONTACT_DETAILS_SHARED":
      return {
        label: "פרטי קשר שותפו",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: <MessageCircle className="w-3 h-3 ml-1" />,
      };
    case "FIRST_PARTY_DECLINED":
    case "SECOND_PARTY_DECLINED":
      return {
        label: "ההצעה נדחתה",
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle className="w-3 h-3 ml-1" />,
      };
    case "CANCELLED":
      return {
        label: "ההצעה בוטלה",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <XCircle className="w-3 h-3 ml-1" />,
      };
    case "DATING":
      return {
        label: "בתהליך היכרות",
        className: "bg-pink-100 text-pink-800 border-pink-200",
        icon: <Heart className="w-3 h-3 ml-1" />,
      };
    case "ENGAGED":
      return {
        label: "אירוסין",
        className: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: <Heart className="w-3 h-3 ml-1" fill="currentColor" />,
      };
    case "MARRIED":
      return {
        label: "נישואין",
        className: "bg-indigo-100 text-indigo-800 border-indigo-200",
        icon: <Heart className="w-3 h-3 ml-1" fill="currentColor" />,
      };
    default:
      return {
        label: "בטיפול",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Clock className="w-3 h-3 ml-1" />,
      };
  }
};

const isDeadlineApproaching = (deadline: Date): boolean => {
  return (
    isAfter(deadline, new Date()) && isAfter(subDays(deadline, 2), new Date())
  );
};

const isDeadlineUrgent = (deadline: Date): boolean => {
  return (
    isAfter(deadline, new Date()) && !isAfter(subDays(deadline, 2), new Date())
  );
};

const MinimalSuggestionCard: React.FC<MinimalSuggestionCardProps> = ({
  suggestion,
  userId,
  onClick,
  onQuickAction,
  onApprove,
  onInquiry,
  onDecline,
  className,
  isHistory = false,
}) => {
  const targetParty =
    suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty;

  const isFirstParty = suggestion.firstPartyId === userId;

  if (!targetParty || !targetParty.profile) {
    return null;
  }

  const mainImage = targetParty.images?.find((img) => img.isMain);
  const age = targetParty.profile?.birthDate
    ? calculateAge(new Date(targetParty.profile.birthDate))
    : null;
  const statusInfo = getStatusInfo(suggestion.status);

  const hasDeadline = suggestion.decisionDeadline !== null;
  const deadlineClass = hasDeadline
    ? isDeadlineUrgent(new Date(suggestion.decisionDeadline!))
      ? "bg-red-50 border-red-100"
      : isDeadlineApproaching(new Date(suggestion.decisionDeadline!))
      ? "bg-amber-50 border-amber-100"
      : ""
    : "";

  // Extract compatibility reasons from matching reason (if available)
  const getCompatibilityHighlights = () => {
    if (!suggestion.matchingReason) return [];

    // Explicitly define the type of highlights
    const highlights: { icon: React.ReactNode; text: string }[] = [];
    const reason = suggestion.matchingReason.toLowerCase();

    if (reason.includes("ערכים") || reason.includes("value"))
      highlights.push({
        icon: <Scroll className="w-4 h-4" />,
        text: "ערכים משותפים",
      });

    if (reason.includes("השכלה") || reason.includes("education"))
      highlights.push({
        icon: <BookOpen className="w-4 h-4" />,
        text: "רקע השכלתי דומה",
      });

    if (reason.includes("אופי") || reason.includes("personality"))
      highlights.push({
        icon: <User className="w-4 h-4" />,
        text: "התאמה אישיותית",
      });

    if (reason.includes("רמה דתית") || reason.includes("religious"))
      highlights.push({
        icon: <Scroll className="w-4 h-4" />,
        text: "רמה דתית מתאימה",
      });

    return highlights.slice(0, 2); // Limit to 2 highlights
  };

  const compatibilityHighlights = getCompatibilityHighlights();

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:shadow-lg",
        deadlineClass,
        className
      )}
      onClick={(e) => {
        if (!(e.target as Element).closest("button")) {
          onClick(suggestion);
        }
      }}
    >
      <div className="relative h-48 bg-gradient-to-b from-blue-50 to-blue-100">
        {mainImage?.url ? (
          <Image
            src={mainImage.url}
            alt={`${targetParty.firstName} ${targetParty.lastName}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        )}

        <div className="absolute top-3 right-3">
          <Badge className={cn("flex items-center", statusInfo.className)}>
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </Badge>
        </div>

        <div className="absolute top-3 left-3">
          <Badge variant="outline" className="bg-white/90 flex items-center">
            <UserCircle className="w-3 h-3 ml-1" />
            {suggestion.matchmaker.firstName} {suggestion.matchmaker.lastName}
          </Badge>
        </div>

        {hasDeadline && (
          <div
            className={cn(
              "absolute bottom-3 right-3 max-w-[70%]",
              isDeadlineUrgent(new Date(suggestion.decisionDeadline!)) &&
                "animate-pulse"
            )}
          >
            <Badge
              variant="outline"
              className={cn(
                "bg-white/90 flex items-center",
                isDeadlineUrgent(new Date(suggestion.decisionDeadline!)) &&
                  "bg-red-50 text-red-700"
              )}
            >
              {isDeadlineUrgent(new Date(suggestion.decisionDeadline!)) ? (
                <AlertTriangle className="w-3 h-3 ml-1" />
              ) : (
                <Calendar className="w-3 h-3 ml-1" />
              )}
              <span className="text-xs truncate">
                נדרשת החלטה עד{" "}
                {format(new Date(suggestion.decisionDeadline!), "dd/MM/yyyy", {
                  locale: he,
                })}
              </span>
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-right flex justify-between items-center">
          <span>
            {targetParty.firstName} {targetParty.lastName}
          </span>
          {age && (
            <Badge variant="outline" className="text-xs font-normal">
              גיל {age}
            </Badge>
          )}
        </h3>

        <div className="space-y-3 text-gray-600 text-sm">
          <div className="grid grid-cols-2 gap-2">
            {targetParty.profile.city && (
              <div className="flex items-center justify-end gap-2">
                <span>{targetParty.profile.city}</span>
                <MapPin className="w-4 h-4" />
              </div>
            )}

            {targetParty.profile.occupation && (
              <div className="flex items-center justify-end gap-2">
                <span>{targetParty.profile.occupation}</span>
                <Briefcase className="w-4 h-4" />
              </div>
            )}

            {targetParty.profile.religiousLevel && (
              <div className="flex items-center justify-end gap-2">
                <span>{targetParty.profile.religiousLevel}</span>
                <Scroll className="w-4 h-4" />
              </div>
            )}

            {targetParty.profile.education && (
              <div className="flex items-center justify-end gap-2">
                <span className="truncate">
                  {targetParty.profile.education}
                </span>
                <BookOpen className="w-4 h-4 flex-shrink-0" />
              </div>
            )}
          </div>

          {compatibilityHighlights.length > 0 && (
            <div className="border-t border-gray-100 pt-2">
              <p className="text-xs mb-1 text-right text-gray-500">
                התאמה מיוחדת:
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                {compatibilityHighlights.map((highlight, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1 bg-green-50"
                  >
                    {highlight.icon}
                    <span className="text-xs">{highlight.text}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
            <span>
              {`הוצע ${formatDistanceToNow(new Date(suggestion.createdAt), {
                addSuffix: true,
                locale: he,
              })}`}
            </span>
            <Clock className="w-3 h-3" />
          </div>
        </div>
      </CardContent>

      {!isHistory && (
        <CardFooter className="grid grid-cols-2 gap-2 px-4 pb-4 pt-0 border-t border-gray-100">
          <Button
            size="sm"
            variant="default"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onClick(suggestion);
            }}
          >
            <Eye className="w-4 h-4 ml-2" />
            פרטים מלאים
          </Button>

          {suggestion.status === "PENDING_FIRST_PARTY" && isFirstParty && (
            <Button
              size="sm"
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.(suggestion);
              }}
            >
              <CheckCircle className="w-4 h-4 ml-2" />
              אישור הצעה
            </Button>
          )}

          {suggestion.status === "PENDING_SECOND_PARTY" && !isFirstParty && (
            <Button
              size="sm"
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.(suggestion);
              }}
            >
              <CheckCircle className="w-4 h-4 ml-2" />
              אישור הצעה
            </Button>
          )}

          {((suggestion.status === "PENDING_FIRST_PARTY" && isFirstParty) ||
            (suggestion.status === "PENDING_SECOND_PARTY" &&
              !isFirstParty)) && (
            <Button
              size="sm"
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDecline?.(suggestion);
              }}
            >
              <XCircle className="w-4 h-4 ml-2" />
              דחיית הצעה
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onInquiry?.(suggestion);
            }}
          >
            <MessageCircle className="w-4 h-4 ml-2" />
            שאלה לשדכן
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default MinimalSuggestionCard;
