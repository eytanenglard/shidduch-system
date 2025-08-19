// src/app/components/matchmaker/new/CandidateCard/MinimalCard.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  User,
  MapPin,
  Briefcase,
  Calendar,
  Edit2,
  Sparkles,
  Star,
  Heart,
  Eye,
  Clock,
  Shield,
  Crown,
  Zap,
  Award,
} from 'lucide-react';
import type { Candidate } from '../types/candidates';
import { UserSource } from '@prisma/client';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  highlightTerm = '',
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
  const [isHovered, setIsHovered] = useState(false);

  const highlightText = (text: string | undefined | null): React.ReactNode => {
    if (!highlightTerm || !text) return text;
    const parts = text.split(new RegExp(`(${highlightTerm})`, 'gi'));
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
      case 'AVAILABLE':
        return {
          label: 'פנוי/ה',
          className:
            'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg',
          icon: <Sparkles className="w-3 h-3" />,
        };
      case 'DATING':
        return {
          label: 'בתהליך היכרות',
          className:
            'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg',
          icon: <Heart className="w-3 h-3" />,
        };
      case 'UNAVAILABLE':
        return {
          label: 'לא פנוי/ה',
          className:
            'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg',
          icon: <Clock className="w-3 h-3" />,
        };
      default:
        return {
          label: 'לא ידוע',
          className:
            'bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0 shadow-lg',
          icon: <User className="w-3 h-3" />,
        };
    }
  };

  const getQualityScore = () => {
    let score = 0;
    if (candidate.images.length > 0) score += 25;
    if (candidate.profile.about) score += 25;
    if (candidate.profile.education) score += 25;
    if (candidate.profile.occupation) score += 25;
    return score;
  };

  const availabilityBadge = getAvailabilityBadge();
  const isManualEntry = candidate.source === UserSource.MANUAL_ENTRY;
  const qualityScore = getQualityScore();

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          'relative overflow-hidden cursor-pointer transition-all hover:shadow-2xl duration-500 group border-0 shadow-xl',
          isAiTarget
            ? 'ring-4 ring-green-400 ring-opacity-60 shadow-green-200'
            : isSelectedForComparison
              ? 'ring-4 ring-blue-400 ring-opacity-60 shadow-blue-200'
              : typeof aiScore === 'number'
                ? 'ring-2 ring-teal-300 ring-opacity-50 shadow-teal-100'
                : isHighlighted
                  ? 'ring-2 ring-yellow-400 ring-opacity-60 shadow-yellow-100'
                  : 'shadow-gray-200',
          'bg-gradient-to-br from-white via-gray-50/30 to-white',
          className || ''
        )}
        onClick={() => onClick(candidate)}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-transparent opacity-60"></div>

        {/* Top-left AI Score Badge */}
        {typeof aiScore === 'number' && (
          <div className="absolute top-3 left-3 z-30">
            <Badge className="bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 text-white border-0 shadow-xl px-3 py-1.5 text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {aiScore}% התאמה
              <Zap className="w-3 h-3" />
            </Badge>
          </div>
        )}

        {/* Top-right Badges Area */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 items-end">
          <Badge
            className={cn(
              'px-3 py-1.5 text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all duration-300 hover:scale-105',
              availabilityBadge.className
            )}
          >
            {availabilityBadge.icon}
            {availabilityBadge.label}
          </Badge>

          {isManualEntry && (
            <Badge className="px-3 py-1.5 text-xs font-bold shadow-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 flex items-center gap-1.5">
              <Edit2 className="w-3 h-3" />
              מועמד ידני
            </Badge>
          )}

        
        </div>

        {/* Main Image */}
        <div className="relative h-52 sm:h-60 bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
          {mainImage && !imageError ? (
            <>
              {!imageLoaded && (
                <Skeleton className="absolute inset-0 h-full w-full" />
              )}
              <Image
                src={getRelativeCloudinaryPath(mainImage.url)}
                alt={`${candidate.firstName} ${candidate.lastName}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
                className={`object-cover transition-all duration-500 ${
                  imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                } ${isHovered ? 'scale-110' : 'scale-100'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />

              {/* Image Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">אין תמונה</p>
              </div>
            </div>
          )}

          {/* Name and Age Overlay */}
          <div className="absolute bottom-0 w-full p-4 text-right">
            <h3 className="font-bold mb-1 text-white drop-shadow-lg text-xl tracking-wide">
              {highlightText(`${candidate.firstName} ${candidate.lastName}`)}
            </h3>
            <div className="flex items-center justify-end gap-3 text-white/95 text-sm">
              <span className="bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm font-medium">
                {age} שנים
              </span>
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 relative z-10">
          <div className="space-y-3 text-gray-700">
            {isManualEntry && candidate.profile.manualEntryText ? (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-xl border border-purple-100">
                <p className="line-clamp-3 text-sm leading-relaxed text-purple-800">
                  {highlightText(candidate.profile.manualEntryText)}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {candidate.profile.city && (
                  <div className="flex items-center justify-end gap-2 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
                    <span className="font-medium text-blue-800">
                      {highlightText(candidate.profile.city)}
                    </span>
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                {candidate.profile.occupation && (
                  <div className="flex items-center justify-end gap-2 p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
                    <span className="text-green-800 text-sm">
                      {highlightText(candidate.profile.occupation)}
                    </span>
                    <Briefcase className="w-4 h-4 text-green-600" />
                  </div>
                )}
              </div>
            )}

            {/* Last Activity */}
            {candidate.profile.lastActive && (
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {`פעיל/ה ${formatDistanceToNow(new Date(candidate.profile.lastActive), { addSuffix: true, locale: he })}`}
                </span>
                <Clock className="w-3 h-3 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          {onEdit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 bg-white/90 backdrop-blur-sm shadow-xl border-0 hover:bg-white hover:scale-110 transition-all duration-300"
                    onClick={(e) => onEdit(candidate, e)}
                  >
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>עריכת פרופיל</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {onSetAiTarget && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      'h-9 w-9 backdrop-blur-sm shadow-xl border-0 hover:scale-110 transition-all duration-300',
                      isAiTarget
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                        : 'bg-white/90 hover:bg-white text-gray-600'
                    )}
                    onClick={(e) => onSetAiTarget(candidate, e)}
                  >
                    <Star
                      className={cn(
                        'h-4 w-4 transition-all duration-300',
                        isAiTarget ? 'fill-current rotate-12' : ''
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isAiTarget ? 'בטל בחירת מטרה' : 'בחר כמטרה לחיפוש AI'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Quality Score Indicator */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="flex items-center gap-1 bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm text-xs font-bold">
            <Award className="w-3 h-3" />
            <span>איכות: {qualityScore}%</span>
          </div>
        </div>

        {/* Comparison Checkbox */}
        {isSelectableForComparison && onToggleComparison && (
          <div
            className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComparison(candidate, e);
            }}
          >
            <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-xl cursor-pointer hover:bg-white hover:scale-105 transition-all duration-300 border-0">
              <Checkbox
                id={`compare-${candidate.id}`}
                checked={isSelectedForComparison}
                className="pointer-events-none border-2 border-blue-400 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-cyan-500 data-[state=checked]:border-blue-500"
              />
              <label
                htmlFor={`compare-${candidate.id}`}
                className="text-xs font-bold leading-none text-gray-700 cursor-pointer"
              >
                השוואה
              </label>
            </div>
          </div>
        )}

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-pink-400/0 group-hover:from-blue-400/10 group-hover:via-purple-400/10 group-hover:to-pink-400/10 transition-all duration-500 pointer-events-none rounded-lg"></div>
      </Card>
    </motion.div>
  );
};

export default MinimalCandidateCard;
