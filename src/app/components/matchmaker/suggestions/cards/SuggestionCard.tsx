import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Clock,
  User,
  MessageCircle,
  Eye,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import type { MatchSuggestion, MatchSuggestionStatus } from "@prisma/client";
import type { UserProfile, UserImage } from "@/types/next-auth";

interface PartyInfo {
  id: string;
  firstName: string;
  lastName: string;
  profile: UserProfile;
  images: UserImage[];
}

interface ExtendedMatchSuggestion extends MatchSuggestion {
  firstParty: PartyInfo;
  secondParty: PartyInfo;
}

interface SuggestionCardProps {
  suggestion: ExtendedMatchSuggestion;
  onAction: (
    type: "view" | "contact" | "message",
    suggestion: ExtendedMatchSuggestion
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
      };
    case "PENDING_SECOND_PARTY":
      return {
        label: "ממתין לתשובת צד ב׳",
        className: "bg-blue-100 text-blue-800 border-blue-200",
      };
    case "FIRST_PARTY_APPROVED":
      return {
        label: "צד א׳ אישר",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    case "SECOND_PARTY_APPROVED":
      return {
        label: "צד ב׳ אישר",
        className: "bg-green-100 text-green-800 border-green-200",
      };
    case "CONTACT_DETAILS_SHARED":
      return {
        label: "פרטי קשר שותפו",
        className: "bg-purple-100 text-purple-800 border-purple-200",
      };
    case "DATING":
      return {
        label: "בתהליך היכרות",
        className: "bg-pink-100 text-pink-800 border-pink-200",
      };
    default:
      return {
        label: "בטיפול",
        className: "bg-gray-100 text-gray-800 border-gray-200",
      };
  }
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onAction,
  className,
}) => {
  const { firstParty, secondParty } = suggestion;
  const statusInfo = getStatusInfo(suggestion.status);

  const PartyPreview: React.FC<{ party: PartyInfo }> = ({ party }) => {
    const mainImage = party.images.find((img) => img.isMain);
    const age = calculateAge(party.profile.birthDate);

    return (
      <div className="flex-1">
        <div className="relative h-32 bg-gradient-to-b from-blue-50 to-blue-100">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={`${party.firstName} ${party.lastName}`}
              className="w-full h-full object-cover rounded-t-lg"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="p-3">
          <h4 className="font-medium">
            {party.firstName} {party.lastName}
          </h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{age} שנים</p>
            {party.profile.city && <p>{party.profile.city}</p>}
            {party.profile.religiousLevel && (
              <p>{party.profile.religiousLevel}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`${className} hover:shadow-md transition-shadow`}>
      <div className="p-4">
        {/* Status & Time */}
        <div className="flex items-center justify-between mb-4">
          <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 ml-1" />
            {formatDistanceToNow(new Date(suggestion.createdAt), {
              addSuffix: true,
              locale: he,
            })}
          </div>
        </div>

        {/* Parties Preview */}
        <div className="flex gap-4 items-stretch border-t border-b py-4">
          <PartyPreview party={firstParty} />
          <div className="flex items-center">
            <ChevronLeft className="w-6 h-6 text-gray-400" />
          </div>
          <PartyPreview party={secondParty} />
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction("message", suggestion)}
          >
            <MessageCircle className="w-4 h-4 ml-2" />
            הודעה חדשה
          </Button>

          <div className="flex gap-2">
            {suggestion.status === "PENDING_FIRST_PARTY" && (
              <Button
                variant="outline"
                size="sm"
                className="text-yellow-600"
                onClick={() => onAction("contact", suggestion)}
              >
                <AlertCircle className="w-4 h-4 ml-2" />
                תזכורת
              </Button>
            )}

            <Button
              variant="default"
              size="sm"
              onClick={() => onAction("view", suggestion)}
            >
              <Eye className="w-4 h-4 ml-2" />
              פרטים מלאים
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SuggestionCard;
