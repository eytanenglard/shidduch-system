'use client';

import React from 'react';
import {
  MapPin,
  Phone as PhoneIcon,
  Heart,
  Camera,
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ThemeType } from '../../constants/theme';
import type { ProfileCardDisplayDict } from '@/types/dictionary';
import type { UserProfile, UserImage as UserImageType } from '@/types/next-auth';
import type { EnumMap } from '../../types/profileCard';
import { formatEnumValue, getInitials } from '../../utils/formatters';

interface AvailabilityInfo {
  text: string;
  shortText: string;
  icon: React.ElementType;
  dotColor: string;
  textColor: string;
}

const ProfileHeader: React.FC<{
  mode: 'desktop' | 'mobile';
  profile: UserProfile;
  age: number;
  mainImageToDisplay: UserImageType | null;
  availability: AvailabilityInfo;
  viewMode: 'matchmaker' | 'candidate';
  onSuggestClick: () => void;
  THEME: ThemeType;
  dict: ProfileCardDisplayDict;
  locale: string;
  totalImages: number;
  onAvatarClick: () => void;
  religiousLevelMap: EnumMap;
  educationLevelMap: EnumMap;
  // Legacy props (accepted but ignored)
  isMobile?: boolean;
  compact?: boolean;
  selectedPalette?: unknown;
  onPaletteChange?: unknown;
  characterTraitMap?: unknown;
  hobbiesMap?: unknown;
}> = ({
  mode,
  profile,
  age,
  mainImageToDisplay,
  availability,
  viewMode,
  onSuggestClick,
  THEME,
  dict,
  locale,
  totalImages,
  onAvatarClick,
  religiousLevelMap,
  educationLevelMap,
}) => {
  const direction = locale === 'he' ? 'rtl' : 'ltr';
  const fullName = profile.user?.firstName
    ? `${profile.user.firstName} ${profile.user.lastName || ''}`.trim()
    : '';

  const religiousLevelLabel = profile.religiousLevel
    ? formatEnumValue(profile.religiousLevel, religiousLevelMap, '').label
    : '';
  const educationLevelLabel = profile.educationLevel
    ? formatEnumValue(profile.educationLevel, educationLevelMap, '').label
    : '';

  // Desktop mode — text only, no photo
  if (mode === 'desktop') {
    const subtitleParts = [
      profile.city,
      religiousLevelLabel,
      educationLevelLabel,
      profile.occupation,
    ].filter(Boolean);

    return (
      <div className="px-6 py-5 border-b border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          {fullName}
          {age > 0 ? `, ${age}` : ''}
        </h1>

        {subtitleParts.length > 0 && (
          <p className="text-base text-gray-500 flex items-center gap-2 flex-wrap">
            {profile.city && (
              <MapPin className="w-4 h-4 flex-shrink-0" />
            )}
            {subtitleParts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-gray-300">·</span>}
                <span>{part}</span>
              </React.Fragment>
            ))}
          </p>
        )}

        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              'w-2 h-2 rounded-full flex-shrink-0',
              availability.dotColor
            )}
          />
          <span className={cn('text-sm', availability.textColor)}>
            {availability.text}
          </span>
        </div>

        {/* NeshamaTech summary inline */}
        {profile.isNeshamaTechSummaryVisible && profile.manualEntryText && (
          <p
            className={cn(
              'mt-3 text-sm text-gray-600 italic leading-relaxed',
              direction === 'rtl'
                ? 'border-r-2 border-gray-200 pr-3'
                : 'border-l-2 border-gray-200 pl-3'
            )}
          >
            {profile.manualEntryText}
          </p>
        )}

        {/* Phone for matchmakers */}
        {viewMode === 'matchmaker' && profile.user?.phone && (
          <div className="mt-2 flex items-center gap-1.5">
            <PhoneIcon className="w-4 h-4 text-teal-500 flex-shrink-0" />
            <a
              href={`tel:${profile.user.phone}`}
              className="text-sm text-teal-600 hover:underline"
              dir="ltr"
            >
              {profile.user.phone}
            </a>
          </div>
        )}

        {/* Suggest button */}
        {viewMode === 'matchmaker' && (
          <Button
            onClick={onSuggestClick}
            className={cn(
              'mt-4 text-white rounded-full px-6 py-2 transition-colors',
              THEME.accentBg,
              THEME.accentBgHover
            )}
          >
            <Heart
              className={cn(
                'w-4 h-4 flex-shrink-0',
                direction === 'rtl' ? 'ml-2' : 'mr-2'
              )}
            />
            {dict.header.suggestMatchButton}
          </Button>
        )}
      </div>
    );
  }

  // Mobile mode — hero photo with name overlay
  const mobileName = profile.user?.firstName || '';
  const mobileSubtitle = [profile.city, religiousLevelLabel]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="relative w-full cursor-pointer" onClick={onAvatarClick}>
      <div className="aspect-[3/4] relative bg-gray-200 overflow-hidden">
        {mainImageToDisplay?.url ? (
          <Image
            src={getRelativeCloudinaryPath(mainImageToDisplay.url)}
            alt={fullName}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <span className="text-6xl font-bold text-gray-300">
              {getInitials(profile.user?.firstName, profile.user?.lastName)}
            </span>
          </div>
        )}

        {/* Image count badge */}
        {totalImages > 1 && (
          <div className="absolute top-3 end-3 z-10">
            <Badge className="bg-black/60 text-white border-0 text-xs px-2 py-1 gap-1">
              <Camera className="w-3 h-3" />
              <span>{totalImages}</span>
            </Badge>
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-20">
          <h1 className="text-2xl font-bold text-white">
            {mobileName}
            {age > 0 ? `, ${age}` : ''}
          </h1>
          {mobileSubtitle && (
            <p className="text-sm text-white/80 mt-1">{mobileSubtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
