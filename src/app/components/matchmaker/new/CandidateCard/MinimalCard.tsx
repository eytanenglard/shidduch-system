"use client";

import React, { useState, useCallback } from "react";

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

  return (
    <Card
      className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-lg ${className}`}
      onClick={() => onClick(candidate)}
    >
      {/* Background Image or Avatar */}
      <div className="relative h-48 bg-gradient-to-b from-blue-50 to-blue-100">
        {mainImage ? (
          <img
            src={mainImage.url}
            alt={`${candidate.firstName} ${candidate.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge
            className={
              candidate.profile.availabilityStatus === "AVAILABLE"
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }
          >
            {candidate.profile.availabilityStatus === "AVAILABLE"
              ? "פנוי/ה"
              : "בתהליך"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-right">
          {candidate.firstName} {candidate.lastName}
        </h3>

        <div className="space-y-2 text-gray-600 text-sm">
          {/* Basic Info */}
          <div className="flex items-center justify-end gap-2">
            <span>{age}</span>
            <Calendar className="w-4 h-4" />
          </div>

          {candidate.profile.city && (
            <div className="flex items-center justify-end gap-2">
              <span>{candidate.profile.city}</span>
              <MapPin className="w-4 h-4" />
            </div>
          )}

          {candidate.profile.occupation && (
            <div className="flex items-center justify-end gap-2">
              <span>{candidate.profile.occupation}</span>
              <Briefcase className="w-4 h-4" />
            </div>
          )}

          {/* Last Active */}
          {candidate.profile.lastActive && (
            <div className="flex items-center justify-end gap-2 text-xs text-gray-400">
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
    </Card>
  );
};

export default MinimalCandidateCard;
