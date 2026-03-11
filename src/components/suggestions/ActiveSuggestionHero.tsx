// src/components/suggestions/ActiveSuggestionHero.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import {
  Heart,
  Clock,
  CheckCircle2,
  Phone,
  MessageCircle,
  Calendar,
  TrendingUp,
  Star,
  Lightbulb,
  Gem,
  Crown,
  User,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../types/suggestions';

// ============================================================
// Status config
// ============================================================
interface StatusConfig {
  labelHe: string;
  labelEn: string;
  descriptionHe: string;
  descriptionEn: string;
  icon: React.ElementType;
  accentColor: string;
  iconBg: string;
  badgeClass: string;
  progress: number;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  FIRST_PARTY_APPROVED: {
    labelHe: 'ממתין לשדכן',
    labelEn: 'Waiting for matchmaker',
    descriptionHe: 'אישרת את ההצעה. השדכן/ית יעביר/ו לצד השני.',
    descriptionEn:
      'You approved. The matchmaker will forward to the other party.',
    icon: Clock,
    accentColor: 'border-emerald-200',
    iconBg: 'bg-emerald-50 text-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    progress: 30,
  },
  PENDING_SECOND_PARTY: {
    labelHe: 'ממתין לצד השני',
    labelEn: 'Waiting for other party',
    descriptionHe: 'ההצעה נשלחה לצד השני. ממתינים לתשובה.',
    descriptionEn: 'Sent to the other party. Waiting for their response.',
    icon: Clock,
    accentColor: 'border-blue-200',
    iconBg: 'bg-blue-50 text-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    progress: 45,
  },
  SECOND_PARTY_APPROVED: {
    labelHe: 'שני הצדדים אישרו!',
    labelEn: 'Both parties approved!',
    descriptionHe: 'שניכם אישרתם! השדכן/ית ישתפו פרטי קשר בקרוב.',
    descriptionEn: 'You both approved! Contact details coming soon.',
    icon: CheckCircle2,
    accentColor: 'border-violet-200',
    iconBg: 'bg-violet-50 text-violet-600',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
    progress: 60,
  },
  CONTACT_DETAILS_SHARED: {
    labelHe: 'פרטי קשר שותפו! 🎉',
    labelEn: 'Contact details shared! 🎉',
    descriptionHe: 'הגיע הזמן ליצור קשר ולקבוע פגישה.',
    descriptionEn: 'Time to reach out and schedule a meeting.',
    icon: Phone,
    accentColor: 'border-pink-200',
    iconBg: 'bg-pink-50 text-pink-600',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
    progress: 70,
  },
  AWAITING_FIRST_DATE_FEEDBACK: {
    labelHe: 'ממתין למשוב פגישה',
    labelEn: 'Waiting for date feedback',
    descriptionHe: 'איך הלכה הפגישה? השדכן/ית ישמחו לשמוע.',
    descriptionEn: 'How did it go? Your matchmaker would love to hear.',
    icon: MessageCircle,
    accentColor: 'border-amber-200',
    iconBg: 'bg-amber-50 text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    progress: 75,
  },
  THINKING_AFTER_DATE: {
    labelHe: 'בחשיבה לאחר פגישה',
    labelEn: 'Thinking after date',
    descriptionHe: 'קח/י את הזמן. עדכנו את השדכן/ית כשתהיו מוכנים.',
    descriptionEn: 'Take your time. Update your matchmaker when ready.',
    icon: Lightbulb,
    accentColor: 'border-indigo-200',
    iconBg: 'bg-indigo-50 text-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    progress: 78,
  },
  PROCEEDING_TO_SECOND_DATE: {
    labelHe: 'בדרך לפגישה שנייה ✨',
    labelEn: 'Heading to second date ✨',
    descriptionHe: 'מתקדמים! בהצלחה בפגישה הבאה.',
    descriptionEn: 'Making progress! Good luck on the next date.',
    icon: TrendingUp,
    accentColor: 'border-teal-200',
    iconBg: 'bg-teal-50 text-teal-600',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    progress: 82,
  },
  MEETING_SCHEDULED: {
    labelHe: 'פגישה קבועה! 📅',
    labelEn: 'Meeting scheduled! 📅',
    descriptionHe: 'יש לך פגישה קבועה. בהצלחה!',
    descriptionEn: 'You have a scheduled meeting. Good luck!',
    icon: Calendar,
    accentColor: 'border-emerald-200',
    iconBg: 'bg-emerald-50 text-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    progress: 74,
  },
  DATING: {
    labelHe: 'בתהליך היכרות 💕',
    labelEn: 'Getting to know each other 💕',
    descriptionHe: 'מאחלים לכם הצלחה!',
    descriptionEn: 'Wishing you the best!',
    icon: Heart,
    accentColor: 'border-rose-200',
    iconBg: 'bg-rose-50 text-rose-600',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    progress: 85,
  },
  ENGAGED: {
    labelHe: 'מאורסים! 💍',
    labelEn: 'Engaged! 💍',
    descriptionHe: 'מזל טוב!! שמחים איתכם!',
    descriptionEn: 'Congratulations!!',
    icon: Gem,
    accentColor: 'border-amber-300',
    iconBg: 'bg-amber-50 text-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    progress: 95,
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  labelHe: 'הצעה פעילה',
  labelEn: 'Active suggestion',
  descriptionHe: '',
  descriptionEn: '',
  icon: Heart,
  accentColor: 'border-indigo-200',
  iconBg: 'bg-indigo-50 text-indigo-600',
  badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  progress: 50,
};

// ============================================================
// Helper
// ============================================================
const calculateAge = (dateOfBirth?: Date | string | null): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

/**
 * Format display name: show full firstName + last initial with dot.
 * E.g. "בת-חן מ." or "Sarah L."
 */
const formatDisplayName = (
  firstName?: string | null,
  lastName?: string | null
): string => {
  if (!firstName) return '';
  const lastInitial = lastName ? ` ${lastName.charAt(0)}.` : '';
  return `${firstName}${lastInitial}`;
};

// ============================================================
// Component
// ============================================================
interface ActiveSuggestionHeroProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  locale: 'he' | 'en';
  onViewDetails: (suggestion: ExtendedMatchSuggestion) => void;
  onContactMatchmaker: (suggestion: ExtendedMatchSuggestion) => void;
  className?: string;
}

const ActiveSuggestionHero: React.FC<ActiveSuggestionHeroProps> = ({
  suggestion,
  userId,
  locale,
  onViewDetails,
  onContactMatchmaker,
  className,
}) => {
  const config = STATUS_CONFIG[suggestion.status] || DEFAULT_CONFIG;
  const StatusIcon = config.icon;
  const isRtl = locale === 'he';

  const isFirstParty = suggestion.firstPartyId === userId;
  const otherParty = isFirstParty
    ? suggestion.secondParty
    : suggestion.firstParty;
  const otherPartyImage = otherParty?.images?.find((img) => img.isMain);
  const imageSrc = otherPartyImage
    ? getRelativeCloudinaryPath(otherPartyImage.url)
    : null;

  const statusLabel = locale === 'he' ? config.labelHe : config.labelEn;
  const statusDescription =
    locale === 'he' ? config.descriptionHe : config.descriptionEn;
  const age = calculateAge(otherParty?.profile?.birthDate);
  const ChevronIcon = locale === 'he' ? ChevronLeft : ChevronRight;

  // *** FIX: Use formatted display name instead of raw truncated name ***
  const displayName = formatDisplayName(
    otherParty?.firstName,
    otherParty?.lastName
  );

  return (
    <Card
      className={cn(
        'overflow-hidden border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer group bg-white rounded-2xl',
        config.accentColor,
        className
      )}
      onClick={() => onViewDetails(suggestion)}
    >
      <div className="p-4">
        {/* Top Row: Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                config.iconBg
              )}
            >
              <Star className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-gray-700">
              {locale === 'he' ? 'ההצעה הפעילה שלי' : 'My Active Suggestion'}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs font-medium', config.badgeClass)}
          >
            <StatusIcon className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
            {statusLabel}
          </Badge>
        </div>

        {/* Main Row: Avatar + Info + CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-gray-100 shadow-sm group-hover:ring-teal-200 transition-all">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={otherParty?.firstName || ''}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            {/* Online-style indicator dot */}
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center',
                config.iconBg
              )}
            >
              <StatusIcon className="w-2.5 h-2.5" />
            </div>
          </div>

          {/* Info - FIXED: removed truncate, name now wraps properly */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {displayName}
              </h3>
              {age && (
                <span className="text-sm text-gray-500 flex-shrink-0">
                  ({age})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {otherParty?.profile?.city && (
                <span className="text-xs text-gray-500">
                  📍 {otherParty.profile.city}
                </span>
              )}
              {otherParty?.profile?.city && otherParty?.profile?.occupation && (
                <span className="text-gray-300">•</span>
              )}
              {otherParty?.profile?.occupation && (
                <span className="text-xs text-gray-500 truncate max-w-[140px]">
                  💼 {otherParty.profile.occupation}
                </span>
              )}
            </div>
            {statusDescription && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                {statusDescription}
              </p>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Contact Matchmaker */}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-600 hover:text-teal-700 transition-all h-9 px-3"
              onClick={(e) => {
                e.stopPropagation();
                onContactMatchmaker(suggestion);
              }}
            >
              <Send
                className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')}
              />
              <span className="hidden sm:inline text-xs font-medium">
                {locale === 'he' ? 'שדכן/ית' : 'Matchmaker'}
              </span>
            </Button>

            {/* View Details Arrow */}
            <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-teal-50 flex items-center justify-center transition-colors">
              <ChevronIcon className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-colors" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${config.progress}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 font-medium w-7 text-center">
            {config.progress}%
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ActiveSuggestionHero;
