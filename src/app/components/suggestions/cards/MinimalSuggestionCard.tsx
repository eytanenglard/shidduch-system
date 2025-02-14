import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  UserCircle,
  Eye,
  CheckCircle,
  XCircle,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import type { MatchSuggestion } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";

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
      };
    case "PENDING_SECOND_PARTY":
      return {
        label: "ממתין לתשובת הצד השני",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case "FIRST_PARTY_APPROVED":
    case "SECOND_PARTY_APPROVED":
      return {
        label: "אישרת את ההצעה",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    case "CONTACT_DETAILS_SHARED":
      return {
        label: "פרטי קשר שותפו",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      };
    default:
      return {
        label: "בטיפול",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
};

const MinimalSuggestionCard: React.FC<MinimalSuggestionCardProps> = ({
  suggestion,
  userId,
  onClick,
  onQuickAction,
  onApprove,
  className,
  isHistory = false,
}) => {
  const targetParty =
    suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty;

  if (!targetParty) {
    return null;
  }

  const mainImage = targetParty.images?.find((img) => img.isMain);
  const age = targetParty.profile?.birthDate
    ? calculateAge(new Date(targetParty.profile.birthDate))
    : null;
  const statusInfo = getStatusInfo(suggestion.status);

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
        className ?? ""
      }`}
      onClick={() => onClick(suggestion)}
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
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>

        <div className="absolute bottom-3 right-3">
          <Badge variant="outline" className="bg-white/90">
            <UserCircle className="w-3 h-3 ml-1" />
            {suggestion.matchmaker.firstName} {suggestion.matchmaker.lastName}
          </Badge>
        </div>

        {!isHistory && (
          <div className="absolute bottom-3 left-3">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/90"
              onClick={(e) => {
                e.stopPropagation();
                onQuickAction?.(suggestion);
              }}
            >
              פעולות מהירות
            </Button>
          </div>
        )}

        {suggestion.decisionDeadline && (
          <div className="absolute bottom-12 left-3">
            <Badge variant="outline" className="bg-white/90">
              <Clock className="w-3 h-3 ml-1" />
              {formatDistanceToNow(new Date(suggestion.decisionDeadline), {
                addSuffix: true,
                locale: he,
              })}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-right">
          {targetParty.firstName} {targetParty.lastName}
        </h3>

        <div className="space-y-2 text-gray-600 text-sm">
          {age && (
            <div className="flex items-center justify-end gap-2">
              <span>{age}</span>
              <Calendar className="w-4 h-4" />
            </div>
          )}

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

          <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
            <span>
              {`הוצע ${formatDistanceToNow(new Date(suggestion.createdAt), {
                addSuffix: true,
                locale: he,
              })}`}
            </span>
            <Clock className="w-3 h-3" />
          </div>

          {!isHistory && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
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
                צפייה בפרופיל
              </Button>

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

              <Button
                size="sm"
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction?.(suggestion);
                }}
              >
                <XCircle className="w-4 h-4 ml-2" />
                דחיית הצעה
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAction?.(suggestion);
                }}
              >
                <MessageCircle className="w-4 h-4 ml-2" />
                שאלה לשדכן
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MinimalSuggestionCard;
