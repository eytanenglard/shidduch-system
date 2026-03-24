// src/components/matchmaker/new/PotentialMatches/match-card/PartyInfo.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  MapPin,
  EyeOff,
  Sparkles,
  UserCheck,
  MessageCircle,
  Mail,
  Briefcase,
  Ruler,
  Languages,
  Search,
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { CandidateToHide } from '../HideCandidateDialog';
import {
  getReligiousLevelLabel,
  formatLanguages,
  getMaritalStatusLabel,
} from './types';

// =============================================================================
// CANDIDATE PREVIEW - male/female candidate info display with photos
// =============================================================================

interface CandidatePreviewProps {
  candidate: any;
  gender: 'male' | 'female';
  activeSuggestion: any;
  onViewProfile: () => void;
  onAnalyze: () => void;
  onFeedback: () => void;
  onHide: (candidate: CandidateToHide) => void;
  onFilterByName: () => void;
  isCompact?: boolean;
}

const CandidatePreview: React.FC<CandidatePreviewProps> = ({
  candidate,
  gender,
  activeSuggestion,
  onViewProfile,
  onAnalyze,
  onFeedback,
  onHide,
  onFilterByName,
  isCompact = false,
}) => {
  const genderIcon = gender === 'male' ? '👨' : '👩';
  const borderColor = gender === 'male' ? 'border-blue-200' : 'border-pink-200';
  const bgGradient =
    gender === 'male' ? 'from-blue-50 to-cyan-50' : 'from-pink-50 to-rose-50';

  const languagesStr = formatLanguages(
    candidate.nativeLanguage,
    candidate.additionalLanguages
  );

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();

    let cleanPhone = candidate.phone?.replace(/\D/g, '') || '';
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '972' + cleanPhone.substring(1);
    }

    if (cleanPhone) {
      const message = `היי ${candidate.firstName} זה איתן מנשמהטק. אני מאוד שמח שנרשמת למערכת שלנו ואני מקווה מאוד לעזור לך למצוא את הזוגיות שתמיד חלמת עליה`;
      const encodedMessage = encodeURIComponent(message);
      window.open(
        `https://wa.me/${cleanPhone}?text=${encodedMessage}`,
        '_blank'
      );
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();

    const subject = `היי ${candidate.firstName} מנשמהטק 💜`;
    const body = `היי ${candidate.firstName},
זה איתן מנשמהטק.

אני מאוד שמח שנרשמת למערכת שלנו ואני מקווה מאוד לעזור לך למצוא את הזוגיות שתמיד חלמת עליה.

איתן
נשמהטק`;

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    window.open(
      `mailto:${candidate.email || ''}?subject=${encodedSubject}&body=${encodedBody}`,
      '_blank'
    );
  };

  // Compact mode: horizontal layout with minimal info
  if (isCompact) {
    return (
      <div
        className={cn(
          'relative flex-1 min-w-0 overflow-hidden p-2 rounded-lg border-2 transition-all duration-300 hover:shadow-md cursor-pointer',
          borderColor,
          `bg-gradient-to-br ${bgGradient}`
        )}
        onClick={onViewProfile}
      >
        <div className="flex items-center gap-2 min-w-0">
          {/* Photo */}
          <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden border-2 border-white shadow-sm">
            {candidate.mainImage ? (
              <Image
                src={getRelativeCloudinaryPath(candidate.mainImage)}
                alt={`${candidate.firstName} ${candidate.lastName}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm">
                {genderIcon}
              </div>
            )}
          </div>
          {/* Basic info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-800 text-xs truncate">
              {candidate.firstName} {candidate.lastName}
            </h4>
            <p className="text-[10px] text-gray-600 truncate">
              {candidate.age} {candidate.city && `· ${candidate.city}`}
            </p>
          </div>
        </div>

        {activeSuggestion && (
          <div className="mt-1">
            <Badge
              variant="outline"
              className="text-[9px] bg-amber-50 text-amber-700 border-amber-200 px-1 py-0 h-4"
            >
              <AlertTriangle className="w-2 h-2 mr-0.5" />
              פעילה
            </Badge>
          </div>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div
      className={cn(
        'relative flex-1 min-w-0 overflow-hidden p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-md flex flex-col',
        borderColor,
        `bg-gradient-to-br ${bgGradient}`
      )}
      onClick={onViewProfile}
    >
      <div className="flex-1 cursor-pointer min-w-0 w-full">
        {/* Photo & status */}
        <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 rounded-full overflow-hidden border-2 border-white shadow-md">
          {candidate.mainImage ? (
            <Image
              src={getRelativeCloudinaryPath(candidate.mainImage)}
              alt={`${candidate.firstName} ${candidate.lastName}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xl">
              {genderIcon}
            </div>
          )}

          {candidate.isVerified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
              <UserCheck className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Name */}
        <h4
          className="text-center font-bold text-gray-800 text-xs sm:text-sm mb-1 truncate px-1"
          title={`${candidate.firstName} ${candidate.lastName}`}
        >
          {candidate.firstName} {candidate.lastName}
        </h4>

        {/* Info area */}
        <div className="flex flex-col gap-1 sm:gap-1.5 mb-2 w-full overflow-hidden">
          {/* Row 1: age | status | height */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-700 flex-wrap">
            <span className="font-medium">{candidate.age}</span>

            {candidate.maritalStatus && (
              <>
                <span className="text-gray-300">|</span>
                <span
                  className="truncate max-w-[70px] sm:max-w-[80px]"
                  title={getMaritalStatusLabel(candidate.maritalStatus)}
                >
                  {getMaritalStatusLabel(candidate.maritalStatus)}
                </span>
              </>
            )}

            {candidate.height && (
              <>
                <span className="text-gray-300">|</span>
                <span
                  className="flex items-center gap-0.5 shrink-0"
                  title="גובה"
                >
                  {candidate.height} <Ruler className="w-3 h-3 text-gray-400" />
                </span>
              </>
            )}
          </div>

          {/* Row 2: city */}
          {candidate.city && (
            <div className="flex items-center justify-center gap-1 text-[11px] sm:text-xs text-gray-600 w-full min-w-0 px-1 sm:px-2">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate" title={candidate.city}>
                {candidate.city}
              </span>
            </div>
          )}

          {/* Row 3: occupation */}
          {candidate.occupation && (
            <div className="flex items-center justify-center gap-1 text-[11px] sm:text-xs text-gray-600 w-full min-w-0 px-1 sm:px-2">
              <Briefcase className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate" title={candidate.occupation}>
                {candidate.occupation}
              </span>
            </div>
          )}

          {/* Row 4: languages - hidden on very small screens */}
          {languagesStr && (
            <div className="hidden sm:flex items-center justify-center gap-1 text-[10px] text-gray-500 w-full min-w-0 px-2">
              <Languages className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate" title={languagesStr}>
                {languagesStr}
              </span>
            </div>
          )}
        </div>

        {/* Religious level */}
        <div className="flex justify-center w-full px-1 sm:px-2">
          <div
            className="text-center text-[10px] text-purple-600 font-medium bg-purple-50 rounded-full py-0.5 px-2 max-w-full truncate"
            title={getReligiousLevelLabel(candidate.religiousLevel)}
          >
            {getReligiousLevelLabel(candidate.religiousLevel)}
          </div>
        </div>
      </div>

      {/* Actions - larger touch targets on mobile */}
      <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
        {/* Filter by name button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-white/60 hover:bg-indigo-100 hover:text-indigo-600 shadow-sm border border-transparent hover:border-indigo-200 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterByName();
                }}
              >
                <Search className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>סנן לפי שם מועמד</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {candidate.phone && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-white/60 hover:bg-green-100 hover:text-green-600 shadow-sm border border-transparent hover:border-green-200 transition-all"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>שלח וואטסאפ</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-white/60 hover:bg-purple-100 hover:text-purple-600 shadow-sm border border-transparent hover:border-purple-200 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onAnalyze();
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>ניתוח פרופיל AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-white/60 hover:bg-blue-100 hover:text-blue-600 shadow-sm border border-transparent hover:border-blue-200 transition-all"
                onClick={handleEmail}
              >
                <Mail className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>שלח מייל</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-7 sm:w-7 rounded-full bg-white/60 hover:bg-amber-100 hover:text-amber-600 shadow-sm border border-transparent hover:border-amber-200 transition-all absolute top-1.5 right-1.5 sm:top-2 sm:right-2"
              onClick={(e) => {
                e.stopPropagation();
                onHide({
                  id: candidate.id,
                  firstName: candidate.firstName,
                  lastName: candidate.lastName,
                  mainImage: candidate.mainImage,
                  gender: gender === 'male' ? 'MALE' : 'FEMALE',
                });
              }}
            >
              <EyeOff className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>הסתר זמנית</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {activeSuggestion && (
        <div className="mt-2 text-center">
          <Badge
            variant="outline"
            className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 px-1 py-0 h-5"
          >
            <AlertTriangle className="w-2.5 h-2.5 mr-1" />
            בהצעה פעילה
          </Badge>
        </div>
      )}
    </div>
  );
};

export default CandidatePreview;
