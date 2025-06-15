// File: src/app/components/matchmaker/new/CandidateCard/QuickView.tsx

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
  CalendarClock,
  Edit,
  Info,
  Star, // הוספת ייבוא לכוכב
} from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Candidate } from "../types/candidates";
import { UserSource } from "@prisma/client";
import { cn } from "@/lib/utils"; // הוספת ייבוא עבור cn

// פונקציה לחישוב גיל
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

interface QuickViewProps {
  candidate: Candidate;
  onAction: (
    action: "view" | "invite" | "suggest" | "contact" | "favorite" | "edit"
  ) => void;
  // --- Props חדשים עבור AI ---
  onSetAiTarget?: (candidate: Candidate, e: React.MouseEvent) => void;
  isAiTarget?: boolean;
}

const QuickView: React.FC<QuickViewProps> = ({ 
  candidate, 
  onAction,
  onSetAiTarget,
  isAiTarget = false 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const profile = candidate.profile;
  const isManualEntry = candidate.source === UserSource.MANUAL_ENTRY;

  return (
    <div
      className="bg-white shadow-xl flex flex-col border border-gray-200 overflow-hidden max-w-md sm:max-w-lg w-full rounded-lg"
      onClick={handleClick}
    >
      {/* Header with name and avatar */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 border-b text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-white text-blue-700 border-0 font-medium shadow-sm px-3 py-1">
              {profile.availabilityStatus === "AVAILABLE"
                ? "פנוי/ה"
                : profile.availabilityStatus === "DATING"
                ? "בתהליך הכרות"
                : profile.availabilityStatus === "UNAVAILABLE"
                ? "לא פנוי/ה"
                : "לא ידוע"}
            </Badge>
            {isManualEntry && (
              <Badge className="bg-purple-200 text-purple-800 border-0 font-medium shadow-sm px-3 py-1">
                מועמד ידני
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onSetAiTarget && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={(e) => onSetAiTarget(candidate, e)}
                title={isAiTarget ? "בטל בחירת מטרה" : "בחר כמטרה לחיפוש AI"}
              >
                <Star className={cn("h-5 w-5", isAiTarget ? "fill-current text-yellow-300" : "text-white/80")} />
              </Button>
            )}
            <h3 className="text-lg font-bold">
              {candidate.firstName} {candidate.lastName}
            </h3>
          </div>
        </div>
      </div>

      {/* Main content container */}
      <div className="flex-1 p-6 space-y-6 text-right overflow-y-auto max-h-[calc(80vh-200px)] sm:max-h-96 bg-white">
        {/* Key information section */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
          {profile.birthDate && (
            <div className="flex items-center justify-end gap-3 text-sm">
              <span className="font-medium">
                {calculateAge(new Date(profile.birthDate))} שנים
              </span>
              <CalendarClock className="w-5 h-5 text-blue-500" />
            </div>
          )}

          {profile.height && (
            <div className="flex items-center justify-end gap-3 text-sm">
              <span className="font-medium">{profile.height} ס״מ</span>
              <User className="w-5 h-5 text-blue-500" />
            </div>
          )}

          {profile.maritalStatus && (
            <div className="flex items-center justify-end gap-3 text-sm">
              <span className="font-medium">{profile.maritalStatus}</span>
              <Heart className="w-5 h-5 text-blue-500" />
            </div>
          )}

          {profile.religiousLevel && (
            <div className="flex items-center justify-end gap-3 text-sm">
              <span className="font-medium">{profile.religiousLevel}</span>
              <Scroll className="w-5 h-5 text-blue-500" />
            </div>
          )}
        </div>

        <Separator className="my-4 bg-gray-200" />

        {/* Manual Entry Text (if applicable) */}
        {isManualEntry && profile.manualEntryText && (
          <div className="space-y-3">
            <div className="flex items-center justify-end gap-2">
              <h4 className="text-sm font-bold text-gray-600">
                תיאור ידני מהשדכן
              </h4>
              <Info className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-sm leading-relaxed py-3 px-4 bg-purple-50 rounded-md border border-purple-200 shadow-sm whitespace-pre-wrap">
              {profile.manualEntryText}
            </p>
          </div>
        )}

        {/* Education & Occupation (if not manual entry, or if manual entry but these fields are filled) */}
        {(!isManualEntry ||
          (isManualEntry &&
            (profile.education || profile.occupation || profile.city))) && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-600 mb-3">מידע נוסף</h4>
            {profile.education && (
              <div className="flex items-center justify-end gap-3 text-sm bg-blue-50 p-3 rounded-md">
                <span className="font-medium">{profile.education}</span>
                <GraduationCap className="w-5 h-5 text-blue-500" />
              </div>
            )}

            {profile.occupation && (
              <div className="flex items-center justify-end gap-3 text-sm bg-blue-50 p-3 rounded-md mt-2">
                <span className="font-medium">{profile.occupation}</span>
                <Briefcase className="w-5 h-5 text-blue-500" />
              </div>
            )}

            {profile.city && (
              <div className="flex items-center justify-end gap-3 text-sm bg-blue-50 p-3 rounded-md mt-2">
                <span className="font-medium">{profile.city}</span>
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
        )}

        {/* About section (if not manual entry with text, or if manual entry but 'about' is also filled) */}
        {(!isManualEntry || !profile.manualEntryText) && profile.about && (
          <>
            <Separator className="my-4 bg-gray-200" />
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-600">אודות</h4>
              <p className="text-sm leading-relaxed py-3 px-4 bg-gray-50 rounded-md border border-gray-200 shadow-sm whitespace-pre-wrap">
                {profile.about}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons with improved layout */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Button
            variant="default"
            className="w-full bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
            onClick={() => onAction("view")}
          >
            <Eye className="w-4 h-4 ml-1.5" />
            <span className="text-sm">צפייה בפרופיל</span>
          </Button>

          <Button
            variant="outline"
            className="w-full border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
            onClick={() => onAction("suggest")}
          >
            <FileText className="w-4 h-4 ml-1.5" />
            <span className="text-sm">הצעת שידוך</span>
          </Button>

          <Button
            variant="outline"
            className="w-full border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
            onClick={() => onAction("invite")}
          >
            <Mail className="w-4 h-4 ml-1.5" />
            <span className="text-sm">שליחת הזמנה</span>
          </Button>

          <Button
            variant="outline"
            className="w-full sm:col-span-2 border-blue-200 hover:bg-blue-50 transition-colors shadow-sm"
            onClick={() => onAction("contact")}
          >
            <Clock className="w-4 h-4 ml-1.5" />
            <span className="text-sm">בדיקת זמינות</span>
          </Button>

          <Button
            variant="ghost"
            className="w-full hover:bg-blue-50 transition-colors bg-blue-50/50"
            onClick={() => onAction("edit")}
          >
            <Edit className="w-4 h-4 ml-1.5" />
            <span className="text-sm">עריכת פרופיל</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickView;