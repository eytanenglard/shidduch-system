"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Mail,
  Clock,
  Eye,
  Scroll,
  GraduationCap,
  Briefcase,
  MapPin,
  User,
  FileText,
} from "lucide-react";

import type { Candidate } from "../types/candidates";

interface QuickViewProps {
  candidate: Candidate;
  onAction: (
    action: "view" | "invite" | "suggest" | "contact" | "favorite"
  ) => void;
}

const QuickView: React.FC<QuickViewProps> = ({ candidate, onAction }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const profile = candidate.profile;

  return (
    <div
      className="bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg flex flex-col"
      onClick={handleClick}
    >
      {/* Main Content Container */}
      <div className="flex-1 space-y-4 text-right overflow-y-auto max-h-96">
        {/* Basic Stats Grid */}
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

        {/* About Section */}
        {profile.about && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {profile.about}
            </p>
          </div>
        )}

        {/* Location & Occupation */}
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
      </div>

      {/* Action Buttons */}
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
          variant="outline"
          className="w-full"
          onClick={() => onAction("invite")}
        >
          <Mail className="w-4 h-4 ml-2" />
          שליחת הזמנה
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => onAction("suggest")}
        >
          <FileText className="w-4 h-4 ml-2" />
          הצעת שידוך
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => onAction("contact")}
        >
          <Clock className="w-4 h-4 ml-2" />
          בדיקת זמינות
        </Button>

        <Button
          variant="ghost"
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onAction("favorite")}
        >
          <Heart className="w-4 h-4 ml-2" />
          הוספה למועדפים
        </Button>
      </div>
    </div>
  );
};

export default QuickView;
