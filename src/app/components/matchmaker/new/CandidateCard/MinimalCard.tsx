// src/app/components/matchmaker/new/CandidateCard/MinimalCard.tsx

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User, MapPin, Briefcase, Calendar, Edit2, Sparkles, Star } from "lucide-react";
import type { Candidate } from "../types/candidates";
import { UserSource } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface MinimalCandidateCardProps {
  candidate: Candidate;
  onClick: (candidate: Candidate) => void;
  onEdit?: (candidate: Candidate, e: React.MouseEvent) => void;
  isHighlighted?: boolean;
  highlightTerm?: string;
  className?: string;
  
  // --- AI-Related Props ---
  aiScore?: number;
  isAiTarget?: boolean;
  onSetAiTarget?: (candidate: Candidate, e: React.MouseEvent) => void;
  isSelectableForComparison?: boolean;
  isSelectedForComparison?: boolean;
  onToggleComparison?: (candidate: Candidate, e: React.MouseEvent) => void;
}

const calculateAge = (birthDate: Date | string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const MinimalCandidateCard: React.FC<MinimalCandidateCardProps> = ({
  candidate,
  onClick,
  onEdit,
  isHighlighted = false,
  highlightTerm = "",
  className,
  aiScore,
  isAiTarget = false,
  onSetAiTarget,
  isSelectableForComparison = false,
  isSelectedForComparison = false,
  onToggleComparison,
}) => {
  const mainImage = candidate.images.find((img) => img.isMain);
  const age = calculateAge(candidate.profile.birthDate);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const highlightText = (text: string | undefined | null): React.ReactNode => {
    if (!highlightTerm || !text) return text;
    const parts = text.split(new RegExp(`(${highlightTerm})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlightTerm.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 px-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getAvailabilityBadge = () => {
    switch (candidate.profile.availabilityStatus) {
      case "AVAILABLE": return { label: "פנוי/ה", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "DATING": return { label: "בתהליך הכרות", className: "bg-amber-100 text-amber-800 border-amber-200" };
      case "UNAVAILABLE": return { label: "לא פנוי/ה", className: "bg-red-100 text-red-800 border-red-200" };
      default: return { label: "לא ידוע", className: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const availabilityBadge = getAvailabilityBadge();
  const isManualEntry = candidate.source === UserSource.MANUAL_ENTRY;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden cursor-pointer transition-all hover:shadow-lg duration-300 group border-2",
          isAiTarget ? "border-green-500 shadow-lg" : 
          isSelectedForComparison ? "border-blue-500 shadow-md" :
          typeof aiScore === 'number' ? "border-teal-400/50" :
          isHighlighted ? "border-yellow-400" :
          "border-gray-200",
          className || ""
        )}
        onClick={() => onClick(candidate)}
      >
        {/* --- Top-left Badges Area --- */}
        <div className="absolute top-2 left-2 z-20 flex flex-col items-start gap-1.5">
          {typeof aiScore === 'number' && (
            <Badge className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white border-0 shadow-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 animate-pulse-slow">
              <Sparkles className="w-3.5 h-3.5" />
              {aiScore}% התאמה
            </Badge>
          )}
        </div>

        {/* --- Top-right Badges Area --- */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
          <Badge variant="outline" className={`px-2 py-0.5 text-xs font-medium shadow-sm ${availabilityBadge.className}`}>
            {availabilityBadge.label}
          </Badge>
          {isManualEntry && (
            <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium shadow-sm bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1">
              <Edit2 className="w-2.5 h-2.5" /> מועמד ידני
            </Badge>
          )}
        </div>

        <div className="relative h-48 sm:h-56 bg-gradient-to-b from-blue-50 to-blue-100">
          {mainImage && !imageError ? (
            <>
              {!imageLoaded && <Skeleton className="absolute inset-0 h-full w-full" />}
              <Image
                src={mainImage.url}
                alt={`${candidate.firstName} ${candidate.lastName}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                className={`object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-50">
              <User className="w-20 h-20 text-gray-400" />
            </div>
          )}

          <div className="absolute bottom-0 w-full p-3 text-right">
            <h3 className="font-bold mb-0.5 text-white drop-shadow-md text-lg">
              {highlightText(`${candidate.firstName} ${candidate.lastName}`)}
            </h3>
            <div className="flex items-center justify-end gap-2 text-white/90 text-sm">
              <span>{age}</span>
              <Calendar className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-1.5 text-gray-700 text-sm">
            {isManualEntry && candidate.profile.manualEntryText ? (
              <p className="line-clamp-3 text-gray-600 text-sm leading-relaxed">
                {highlightText(candidate.profile.manualEntryText)}
              </p>
            ) : (
              <>
                {candidate.profile.city && (
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-medium">{highlightText(candidate.profile.city)}</span>
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                {candidate.profile.occupation && (
                  <div className="flex items-center justify-end gap-1">
                    <span>{highlightText(candidate.profile.occupation)}</span>
                    <Briefcase className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </>
            )}
            {candidate.profile.lastActive && (
              <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-400">
                <span>{`פעיל/ה ${formatDistanceToNow(new Date(candidate.profile.lastActive), { addSuffix: true, locale: he })}`}</span>
                <Edit2 className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        {/* --- Bottom Action Buttons --- */}
        <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <Button variant="outline" size="icon" className="h-8 w-8 bg-white/80 backdrop-blur-sm shadow-md" onClick={(e) => onEdit(candidate, e)} title="ערוך פרופיל">
              <Edit2 className="h-4 w-4 text-blue-600" />
            </Button>
          )}
          {onSetAiTarget && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button variant="outline" size="icon" className={cn("h-8 w-8 bg-white/80 backdrop-blur-sm shadow-md", isAiTarget && "bg-green-200")} onClick={(e) => onSetAiTarget(candidate, e)}>
                      <Star className={cn("h-4 w-4", isAiTarget ? "text-green-600 fill-current" : "text-gray-500")} />
                   </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isAiTarget ? "בטל בחירת מטרה" : "בחר כמטרה לחיפוש AI"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
      {/* --- Comparison Checkbox --- */}
      {isSelectableForComparison && onToggleComparison && (
          <div 
              className="absolute bottom-2 right-2 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              // --- START OF FIX ---
              // מניעת קליק על הכרטיס כולו, והפעלת הפונקציה הנכונה
              onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  onToggleComparison(candidate, e);
              }}
              // --- END OF FIX ---
          >
              <div 
                  className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm p-1.5 rounded-md shadow-md cursor-pointer"
              >
                  <Checkbox
                      id={`compare-${candidate.id}`}
                      checked={isSelectedForComparison}
                      // אין צורך ב-onCheckedChange, ה-div החיצוני מטפל בקליק
                  />
                  <label
                      htmlFor={`compare-${candidate.id}`}
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 cursor-pointer"
                  >
                      השווה
                  </label>
              </div>
          </div>
      )}
      </Card>
    </motion.div>
  );
};

export default MinimalCandidateCard;