import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import type { MatchSuggestionStatus, Priority } from "@prisma/client";
import type { Suggestion, ActionAdditionalData } from "@/types/suggestions";
import { Progress } from "@/components/ui/progress";

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAction: (
    type:
      | "view"
      | "contact"
      | "message"
      | "edit"
      | "delete"
      | "resend"
      | "changeStatus"
      | "reminder",
    suggestion: Suggestion,
    additionalData?: ActionAdditionalData
  ) => void;
  className?: string;
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
  switch (status) {
    case "PENDING_FIRST_PARTY":
      return {
        label: "ממתין לתשובת צד א׳",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        icon: Clock,
        progress: 25,
      };
    case "PENDING_SECOND_PARTY":
      return {
        label: "ממתין לתשובת צד ב׳",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        icon: Clock,
        progress: 50,
      };
    case "FIRST_PARTY_APPROVED":
      return {
        label: "צד א׳ אישר",
        className: "bg-green-100 text-green-800 border-green-200",
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: CheckCircle,
        progress: 40,
      };
    case "SECOND_PARTY_APPROVED":
      return {
        label: "צד ב׳ אישר",
        className: "bg-green-100 text-green-800 border-green-200",
        color: "text-green-600",
        bgColor: "bg-green-50",
        icon: CheckCircle,
        progress: 60,
      };
    case "FIRST_PARTY_DECLINED":
      return {
        label: "צד א׳ דחה",
        className: "bg-red-100 text-red-800 border-red-200",
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: XCircle,
        progress: 100,
      };
    case "SECOND_PARTY_DECLINED":
      return {
        label: "צד ב׳ דחה",
        className: "bg-red-100 text-red-800 border-red-200",
        color: "text-red-600",
        bgColor: "bg-red-50",
        icon: XCircle,
        progress: 100,
      };
    case "CONTACT_DETAILS_SHARED":
      return {
        label: "פרטי קשר שותפו",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        icon: Send,
        progress: 70,
      };
    case "DATING":
      return {
        label: "בתהליך היכרות",
        className: "bg-pink-100 text-pink-800 border-pink-200",
        color: "text-pink-600",
        bgColor: "bg-pink-50",
        icon: Heart,
        progress: 80,
      };
    case "AWAITING_FIRST_DATE_FEEDBACK":
      return {
        label: "ממתין למשוב פגישה",
        className: "bg-orange-100 text-orange-800 border-orange-200",
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        icon: AlertCircle,
        progress: 75,
      };
    case "EXPIRED":
      return {
        label: "פג תוקף",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        icon: Clock,
        progress: 100,
      };
    default:
      return {
        label: "בטיפול",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        icon: RefreshCw,
        progress: 30,
      };
  }
};

const getPriorityInfo = (priority: Priority) => {
  switch (priority) {
    case "URGENT":
      return {
        label: "דחוף",
        className: "bg-red-100 text-red-800 border-red-200",
        icon: AlertCircle,
        color: "text-red-600",
      };
    case "HIGH":
      return {
        label: "גבוה",
        className: "bg-orange-100 text-orange-800 border-orange-200",
        icon: Star,
        color: "text-orange-600",
      };
    case "MEDIUM":
      return {
        label: "רגיל",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Star,
        color: "text-blue-600",
      };
    case "LOW":
      return {
        label: "נמוך",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Star,
        color: "text-gray-600",
      };
    default:
      return {
        label: "רגיל",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Star,
        color: "text-blue-600",
      };
  }
};

// Days left until deadline if applicable
const getDaysLeft = (decisionDeadline?: Date | string | null) => {
  if (!decisionDeadline) return null;

  const deadline = new Date(decisionDeadline);
  const today = new Date();
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAction,
  className,
}) => {
  const { firstParty, secondParty } = suggestion;
  const statusInfo = getStatusInfo(suggestion.status);
  const priorityInfo = getPriorityInfo(suggestion.priority);
  const StatusIcon = statusInfo.icon;
  const PriorityIcon = priorityInfo.icon;
  const daysLeft = getDaysLeft(suggestion.decisionDeadline);

  // Check if the suggestion is waiting for response
  const isWaitingForResponse =
    suggestion.status === "PENDING_FIRST_PARTY" ||
    suggestion.status === "PENDING_SECOND_PARTY";

  // Check if the suggestion has feedback requirement
  const needsFeedback = suggestion.status === "AWAITING_FIRST_DATE_FEEDBACK";

  // Check if the suggestion can be resent
  const canBeResent =
    suggestion.status === "EXPIRED" ||
    suggestion.status === "FIRST_PARTY_DECLINED" ||
    suggestion.status === "SECOND_PARTY_DECLINED";

  const firstPartyAge = calculateAge(firstParty.profile.birthDate);
  const secondPartyAge = calculateAge(secondParty.profile.birthDate);

  const firstPartyMainImage = firstParty.images.find((img) => img.isMain);
  const secondPartyMainImage = secondParty.images.find((img) => img.isMain);

  return (
    <Card
      className={`${className} overflow-hidden hover:shadow-md transition-shadow`}
    >
      {/* Header with status and progress */}
      <div className={`p-4 ${statusInfo.bgColor} border-b relative`}>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
            <span className="font-medium text-gray-900">
              {statusInfo.label}
            </span>
          </div>
          <Badge className={priorityInfo.className}>
            <PriorityIcon className="w-3 h-3 ml-1" />
            {priorityInfo.label}
          </Badge>
        </div>

        <Progress value={statusInfo.progress} className="h-1.5" />

        {/* Deadline warning if needed */}
        {daysLeft !== null &&
          daysLeft <= 3 &&
          suggestion.status !== "EXPIRED" && (
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-bold py-0.5 px-2 rounded-full whitespace-nowrap z-10">
              <Clock className="w-3 h-3 inline-block ml-1" />
              {daysLeft === 0 ? "היום אחרון!" : `${daysLeft} ימים נותרו`}
            </div>
          )}
      </div>

      {/* Main content */}
      <div className="p-4">
        {/* Parties info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* First party */}
          <div className="space-y-2 border-l pl-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-blue-50">
                צד א׳
              </Badge>
              {suggestion.status === "FIRST_PARTY_APPROVED" && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  אישר
                </Badge>
              )}
              {suggestion.status === "FIRST_PARTY_DECLINED" && (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 ml-1" />
                  דחה
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 border">
                {firstPartyMainImage ? (
                  <Image
                    src={firstPartyMainImage.url}
                    alt={`${firstParty.firstName}`}
                    className="object-cover"
                    fill
                    sizes="4rem"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold">
                  {firstParty.firstName} {firstParty.lastName}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 ml-1 text-gray-400" />
                    <span>{firstPartyAge} שנים</span>
                  </div>
                  {firstParty.profile.city && (
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 ml-1 text-gray-400" />
                      <span>{firstParty.profile.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Second party */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-purple-50">
                צד ב׳
              </Badge>
              {suggestion.status === "SECOND_PARTY_APPROVED" && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  אישר
                </Badge>
              )}
              {suggestion.status === "SECOND_PARTY_DECLINED" && (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 ml-1" />
                  דחה
                </Badge>
              )}
            </div>

            <div className="flex gap-3">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100 border">
                {secondPartyMainImage ? (
                  <Image
                    src={secondPartyMainImage.url}
                    alt={`${secondParty.firstName}`}
                    className="object-cover"
                    fill
                    sizes="4rem"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-semibold">
                  {secondParty.firstName} {secondParty.lastName}
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 ml-1 text-gray-400" />
                    <span>{secondPartyAge} שנים</span>
                  </div>
                  {secondParty.profile.city && (
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 ml-1 text-gray-400" />
                      <span>{secondParty.profile.city}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Matching reason snippet */}
        {suggestion.matchingReason && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border text-sm">
            <h5 className="text-xs font-semibold text-gray-600 mb-1">
              סיבת ההתאמה:
            </h5>
            <p className="text-gray-800 line-clamp-2">
              {suggestion.matchingReason.length > 120
                ? `${suggestion.matchingReason.substring(0, 120)}...`
                : suggestion.matchingReason}
            </p>
          </div>
        )}

        {/* Info and time */}
        <div className="flex justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 ml-1" />
            {formatDistanceToNow(new Date(suggestion.createdAt), {
              addSuffix: true,
              locale: he,
            })}
          </div>

          {suggestion.decisionDeadline && (
            <div className="flex items-center">
              <CalendarClock className="w-3.5 h-3.5 ml-1" />
              {daysLeft !== null
                ? daysLeft === 0
                  ? "היום!"
                  : `${daysLeft} ימים להחלטה`
                : "אין מועד אחרון"}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction("message", suggestion)}
            className="text-gray-600 hover:text-primary"
          >
            <MessageCircle className="w-4 h-4 ml-1" />
            הודעה
          </Button>

          {/* סקציית פעולות בקובץ SuggestionCard.tsx */}
          {isWaitingForResponse && (
            <Button
              variant="outline"
              size="sm"
              className="text-yellow-600"
              onClick={() =>
                onAction("reminder", suggestion, {
                  partyType:
                    suggestion.status === "PENDING_FIRST_PARTY"
                      ? "first"
                      : "second",
                })
              }
            >
              <Send className="w-4 h-4 ml-1" />
              {suggestion.status === "PENDING_FIRST_PARTY"
                ? "שלח תזכורת לצד ראשון"
                : suggestion.status === "PENDING_SECOND_PARTY"
                ? "שלח תזכורת לצד שני"
                : suggestion.status === "AWAITING_FIRST_DATE_FEEDBACK"
                ? "שלח בקשת עדכון מפגש"
                : "שלח תזכורת"}
            </Button>
          )}

          {needsFeedback && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600"
              onClick={() =>
                onAction("contact", suggestion, { type: "feedback" })
              }
            >
              <MessageCircle className="w-4 h-4 ml-1" />
              בקש משוב
            </Button>
          )}

          <div className="flex items-center gap-1">
            {canBeResent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAction("resend", suggestion)}
                className="px-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction("edit", suggestion)}
              className="px-2"
            >
              <Edit className="w-4 h-4" />
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={() => onAction("view", suggestion)}
            >
              <Eye className="w-4 h-4 ml-1" />
              פרטים
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="px-1">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction("edit", suggestion)}>
                  <Edit className="w-4 h-4 ml-2" />
                  <span>ערוך הצעה</span>
                </DropdownMenuItem>

                {canBeResent && (
                  <DropdownMenuItem
                    onClick={() => onAction("resend", suggestion)}
                  >
                    <RefreshCw className="w-4 h-4 ml-2" />
                    <span>שלח מחדש</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => onAction("delete", suggestion)}
                  className="text-red-600"
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
  );
};

export default SuggestionCard;
