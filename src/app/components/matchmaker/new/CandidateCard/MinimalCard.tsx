"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Briefcase, Calendar, Clock } from "lucide-react";
import type { Candidate } from "../types/candidates";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";

interface MinimalCandidateCardProps {
  candidate: Candidate;
  onClick: (candidate: Candidate) => void;
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

const MinimalCandidateCard: React.FC<MinimalCandidateCardProps> = ({
  candidate,
  onClick,
  className,
}) => {
  const mainImage = candidate.images.find((img) => img.isMain);
  const age = calculateAge(candidate.profile.birthDate);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
  }, []);

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-md hover:translate-y-[-2px] duration-300 ${className}`}
      onClick={() => onClick(candidate)}
    >
      {/* Status Badge - relocated to top left for better visibility */}
      <div className="absolute top-2 left-2 z-10">
        <Badge
          className={`px-2 py-0.5 text-xs font-medium shadow-sm ${
            candidate.profile.availabilityStatus === "AVAILABLE"
              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
              : "bg-amber-100 text-amber-800 border-amber-200"
          }`}
        >
          {candidate.profile.availabilityStatus === "AVAILABLE"
            ? "פנוי/ה"
            : "בתהליך"}
        </Badge>
      </div>

      {/* Background Image or Avatar with improved gradient overlay */}
      <div
        className={`relative ${
          isMobile ? "h-28" : "h-48 sm:h-56"
        } bg-gradient-to-b from-blue-50 to-blue-100`}
      >
        {mainImage ? (
          <>
            <Image
              src={mainImage.url}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={false}
              className="object-cover"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-blue-50">
            <User className="w-20 h-20 text-gray-400" />
          </div>
        )}

        {/* Name and basic info overlay at bottom of image for better visual hierarchy */}
        <div className={`absolute bottom-0 w-full p-3 text-right`}>
          <h3
            className={`${
              isMobile ? "text-base" : "text-lg"
            } font-bold mb-0.5 text-white drop-shadow-md`}
          >
            {candidate.firstName} {candidate.lastName}
          </h3>

          <div className="flex items-center justify-end gap-2 text-white/90 text-sm">
            <span>{age}</span>
            <Calendar className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Content section with improved spacing and organization */}
      <div className={`p-3 ${isMobile ? "py-2" : "p-4"}`}>
        <div
          className={`space-y-1 text-gray-700 ${
            isMobile ? "text-xs" : "text-sm"
          }`}
        >
          {candidate.profile.city && (
            <div className="flex items-center justify-end gap-1">
              <span className="font-medium">{candidate.profile.city}</span>
              <MapPin
                className={`${isMobile ? "w-3 h-3" : "w-4 h-4"} text-blue-600`}
              />
            </div>
          )}

          {candidate.profile.occupation && (
            <div className="flex items-center justify-end gap-1">
              <span>{candidate.profile.occupation}</span>
              <Briefcase
                className={`${isMobile ? "w-3 h-3" : "w-4 h-4"} text-blue-600`}
              />
            </div>
          )}

          {/* Religious level display */}
          {candidate.profile.religiousLevel && (
            <div className="mt-1">
              <Badge
                variant="outline"
                className={`w-full justify-center ${
                  isMobile ? "text-xs py-0" : ""
                }`}
              >
                {candidate.profile.religiousLevel}
              </Badge>
            </div>
          )}

          {/* Last Active - subtler design */}
          {candidate.profile.lastActive && !isMobile && (
            <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-400">
              <span>
                {`פעיל/ה ${formatDistanceToNow(
                  new Date(candidate.profile.lastActive),
                  {
                    addSuffix: true,
                    locale: he,
                  }
                )}`}
              </span>
              <Clock className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>

      {/* Verified indicator if applicable */}
      {candidate.isVerified && (
        <div className="absolute top-2 right-2 z-10">
          <Badge
            variant="secondary"
            className={`bg-blue-100 text-blue-800 border-blue-200 ${
              isMobile ? "text-xs px-1.5 py-0.5" : ""
            }`}
          >
            <svg
              className={`${isMobile ? "w-2 h-2 mr-0.5" : "w-3 h-3 mr-1"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              ></path>
            </svg>
            מאומת
          </Badge>
        </div>
      )}
    </Card>
  );
};

export default MinimalCandidateCard;
