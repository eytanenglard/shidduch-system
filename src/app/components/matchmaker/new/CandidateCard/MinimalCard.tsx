// MinimalCard.tsx - עם תמיכה בהדגשת מונח חיפוש
"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  BookOpen, // For educationLevel
  Users, // For children
  Edit2, // Icon for manual entry
} from "lucide-react";
import type { Candidate } from "../types/candidates"; // Make sure this type is updated
import { UserSource } from "@prisma/client"; // Import UserSource
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface MinimalCandidateCardProps {
  candidate: Candidate;
  onClick: (candidate: Candidate) => void;
  onEdit?: (candidate: Candidate) => void;
  isHighlighted?: boolean;
  highlightTerm?: string;
  className?: string;
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
}) => {
  const mainImage = candidate.images.find((img) => img.isMain);
  const age = calculateAge(candidate.profile.birthDate);
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
      case "AVAILABLE":
        return {
          label: "פנוי/ה",
          className: "bg-emerald-100 text-emerald-800 border-emerald-200",
        };
      case "DATING":
        return {
          label: "בתהליך הכרות",
          className: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "UNAVAILABLE":
        return {
          label: "לא פנוי/ה",
          className: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          label: "לא ידוע",
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const availabilityBadge = getAvailabilityBadge();

  const iconSizeClass = isMobile ? "w-3 h-3" : "w-4 h-4";
  const textSizeClass = isMobile ? "text-xs" : "text-sm";
  const badgeTextSizeClass = isMobile ? "text-xs py-0" : "";

  const isManualEntry = candidate.source === UserSource.MANUAL_ENTRY;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <Card
        ref={cardRef}
        className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-md duration-300 group ${
          isHighlighted ? "ring-2 ring-blue-400 shadow-lg" : ""
        } ${className || ""}`}
        onClick={() => onClick(candidate)}
      >
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          <Badge
            variant="outline"
            className={`px-2 py-0.5 text-xs font-medium shadow-sm ${availabilityBadge.className}`}
          >
            {availabilityBadge.label}
          </Badge>
          {isManualEntry && (
            <Badge
              variant="outline"
              className={`px-2 py-0.5 text-xs font-medium shadow-sm bg-purple-100 text-purple-800 border-purple-200 flex items-center gap-1`}
            >
              <Edit2 className="w-2.5 h-2.5" />
              מועמד ידני
            </Badge>
          )}
        </div>

        <div
          className={`relative ${
            isMobile ? "h-32" : "h-48 sm:h-56"
          } bg-gradient-to-b from-blue-50 to-blue-100`}
        >
          {mainImage && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Skeleton className="h-full w-full" />
                </div>
              )}
              <Image
                src={mainImage.url}
                alt={`${candidate.firstName} ${candidate.lastName}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                className={`object-cover transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
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

          <div className={`absolute bottom-0 w-full p-3 text-right`}>
            <h3
              className={`${
                isMobile ? "text-base" : "text-lg"
              } font-bold mb-0.5 text-white drop-shadow-md`}
            >
              {highlightText(`${candidate.firstName} ${candidate.lastName}`)}
            </h3>
            <div className="flex items-center justify-end gap-2 text-white/90 text-sm">
              <span>{age}</span>
              <Calendar className="w-3 h-3" />
            </div>
          </div>
        </div>

        <div className={`p-3 ${isMobile ? "py-2" : "p-4"}`}>
          <div className={`space-y-1.5 text-gray-700 ${textSizeClass}`}>
            {isManualEntry && candidate.profile.manualEntryText ? (
              <p
                className={`truncate-3-lines text-gray-600 ${textSizeClass} leading-relaxed`}
              >
                {highlightText(candidate.profile.manualEntryText)}
              </p>
            ) : (
              <>
                {candidate.profile.city && (
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-medium">
                      {highlightText(candidate.profile.city)}
                    </span>
                    <MapPin className={`${iconSizeClass} text-blue-600`} />
                  </div>
                )}

                {candidate.profile.occupation && (
                  <div className="flex items-center justify-end gap-1">
                    <span>{highlightText(candidate.profile.occupation)}</span>
                    <Briefcase className={`${iconSizeClass} text-blue-600`} />
                  </div>
                )}

                {candidate.profile.educationLevel && (
                  <div className="flex items-center justify-end gap-1">
                    <span>
                      {highlightText(candidate.profile.educationLevel)}
                    </span>
                    <BookOpen className={`${iconSizeClass} text-blue-600`} />
                  </div>
                )}

                <div className="mt-1.5 space-y-1">
                  {candidate.profile.religiousLevel && (
                    <Badge
                      variant="outline"
                      className={`w-full justify-center ${badgeTextSizeClass} bg-amber-50 text-amber-700 border-amber-200`}
                    >
                      {highlightText(candidate.profile.religiousLevel)}
                    </Badge>
                  )}
                  {candidate.profile.shomerNegiah !== undefined &&
                    candidate.profile.shomerNegiah !== null && (
                      <Badge
                        variant="outline"
                        className={`w-full justify-center ${badgeTextSizeClass} ${
                          candidate.profile.shomerNegiah
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {candidate.profile.shomerNegiah
                          ? "שומר/ת נגיעה"
                          : "לא שומר/ת נגיעה"}
                      </Badge>
                    )}
                  {candidate.profile.gender === "MALE" &&
                    candidate.profile.kippahType && (
                      <Badge
                        variant="outline"
                        className={`w-full justify-center ${badgeTextSizeClass} bg-sky-50 text-sky-700 border-sky-200`}
                      >
                        {highlightText(candidate.profile.kippahType)}
                      </Badge>
                    )}
                  {candidate.profile.gender === "FEMALE" &&
                    candidate.profile.headCovering && (
                      <Badge
                        variant="outline"
                        className={`w-full justify-center ${badgeTextSizeClass} bg-pink-50 text-pink-700 border-pink-200`}
                      >
                        {highlightText(candidate.profile.headCovering)}
                      </Badge>
                    )}
                </div>

                {candidate.profile.hasChildrenFromPrevious !== undefined &&
                  candidate.profile.hasChildrenFromPrevious !== null && (
                    <div className="flex items-center justify-end gap-1 mt-1.5">
                      <span
                        className={
                          candidate.profile.hasChildrenFromPrevious
                            ? "text-rose-600 font-medium"
                            : "text-gray-500"
                        }
                      >
                        {candidate.profile.hasChildrenFromPrevious
                          ? "עם ילדים מקשר קודם"
                          : "ללא ילדים מקשר קודם"}
                      </span>
                      <Users
                        className={`${iconSizeClass} ${
                          candidate.profile.hasChildrenFromPrevious
                            ? "text-rose-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                  )}
              </>
            )}

            {candidate.profile.lastActive && !isMobile && (
              <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-400">
                <span>{`פעיל/ה ${formatDistanceToNow(
                  new Date(candidate.profile.lastActive),
                  { addSuffix: true, locale: he }
                )}`}</span>
                <Clock className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
          {candidate.isVerified && (
            <Badge
              variant="secondary"
              className={`bg-blue-100 text-blue-800 border-blue-200 ${
                isMobile ? "text-xs px-1.5 py-0.5" : "px-2 py-0.5"
              }`}
            >
              <CheckCircle
                className={`${
                  isMobile ? "w-2.5 h-2.5 mr-0.5" : "w-3 h-3 mr-1"
                }`}
              />
              מאומת
            </Badge>
          )}
        </div>

        {onEdit && (
          <div
            className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(candidate);
            }}
          >
            <button
              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
              aria-label="ערוך פרופיל"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                <path d="m15 5 4 4"></path>
              </svg>
            </button>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default MinimalCandidateCard;
