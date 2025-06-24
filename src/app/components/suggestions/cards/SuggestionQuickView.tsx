// src/app/components/suggestions/cards/SuggestionQuickView.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Heart,
  User,
  Clock,
  Eye,
  Scroll,
  GraduationCap,
  Briefcase,
  MapPin,
  MessageCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { ExtendedMatchSuggestion } from "../types";

interface SuggestionQuickViewProps {
  suggestion: ExtendedMatchSuggestion;
  userId?: string;
  onAction: (action: "approve" | "reject" | "ask" | "view") => void;
}

const SuggestionQuickView: React.FC<SuggestionQuickViewProps> = ({
  suggestion,
  userId,
  onAction,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const profile = userId
    ? suggestion.firstPartyId === userId
      ? suggestion.secondParty.profile
      : suggestion.firstParty.profile
    : suggestion.secondParty.profile;

  return (
    <div
      className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg flex flex-col"
      onClick={handleClick}
    >
      <div className="flex-1 space-y-4 text-right overflow-y-auto max-h-96">
        <div className="grid grid-cols-2 gap-3">
          {profile.height && (
            <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
              <span>{profile.height} ס״מ</span>
              <User className="w-4 h-4" />
            </div>
          )}

          {profile.maritalStatus && (
            <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
              <span>{profile.maritalStatus}</span>
              <Heart className="w-4 h-4" />
            </div>
          )}

          {profile.religiousLevel && (
            <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
              <span>{profile.religiousLevel}</span>
              <Scroll className="w-4 h-4" />
            </div>
          )}

          {profile.education && (
            <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
              <span>{profile.education}</span>
              <GraduationCap className="w-4 h-4" />
            </div>
          )}
        </div>

        {profile.about && (
          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-sm font-medium mb-1">אודות:</h4>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {profile.about}
            </p>
          </div>
        )}

        {suggestion.matchingReason && (
          <div className="border-t border-gray-100 pt-3">
            <h4 className="text-sm font-medium mb-1">סיבת ההצעה:</h4>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {suggestion.matchingReason}
            </p>
          </div>
        )}

        <div className="border-t border-gray-100 pt-3 space-y-2">
          {profile.city && (
            <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
              <span>{profile.city}</span>
              <MapPin className="w-4 h-4" />
            </div>
          )}

          {profile.occupation && (
            <div className="flex items-center justify-end gap-2 text-sm text-gray-600">
              <span>{profile.occupation}</span>
              <Briefcase className="w-4 h-4" />
            </div>
          )}
        </div>

        {suggestion.decisionDeadline && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-end gap-2 text-sm text-yellow-600">
              <span>
                נדרשת תשובה עד{" "}
                {new Date(suggestion.decisionDeadline).toLocaleDateString(
                  "he-IL"
                )}
              </span>
              <Clock className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
        <Button
          variant="default"
          className="w-full"
          onClick={() => onAction("view")}
        >
          <Eye className="w-4 h-4 ml-2" />
          צפייה בפרופיל
        </Button>

        <Button
          variant="default"
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={() => onAction("approve")}
        >
          <CheckCircle className="w-4 h-4 ml-2" />
          אישור הצעה
        </Button>

        <Button
          variant="outline"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onAction("reject")}
        >
          <XCircle className="w-4 h-4 ml-2" />
          דחיית הצעה
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => onAction("ask")}
        >
          <MessageCircle className="w-4 h-4 ml-2" />
          שאלה לשדכן
        </Button>
      </div>
    </div>
  );
};

export default SuggestionQuickView;