// /components/matchmaker/CandidateCard/Actions.tsx

"use client";

import React, { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Heart, Mail, FileText, Eye, Clock, AlertCircle } from "lucide-react";
import type { Candidate } from "../types/candidates";

interface ActionsProps {
  candidate: Candidate;
  onInvite: (candidate: Candidate) => void;
  onSuggest: (candidate: Candidate) => void;
  onCheckAvailability: (candidate: Candidate) => void;
  onViewProfile: (candidate: Candidate) => void;
  className?: string;
}

const Actions: React.FC<ActionsProps> = ({
  candidate,
  onInvite,
  onSuggest,
  onCheckAvailability,
  onViewProfile,
  className,
}) => {
  // מונע התפשטות הקליק לכרטיס המינימלי
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`} onClick={handleClick}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewProfile(candidate)}
      >
        <Eye className="w-4 h-4 ml-2" />
        צפייה בפרופיל
      </Button>

      <Button variant="outline" size="sm" onClick={() => onInvite(candidate)}>
        <Mail className="w-4 h-4 ml-2" />
        שליחת הזמנה
      </Button>

      <Button variant="outline" size="sm" onClick={() => onSuggest(candidate)}>
        <FileText className="w-4 h-4 ml-2" />
        הצעת שידוך
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onCheckAvailability(candidate)}
      >
        <Clock className="w-4 h-4 ml-2" />
        בדיקת זמינות
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Heart className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default Actions;
