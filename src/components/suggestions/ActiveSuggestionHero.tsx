// src/components/suggestions/ActiveSuggestionHero.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
  User,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getRelativeCloudinaryPath, calculateAge } from '@/lib/utils';
import { getStatusTheme } from './constants';
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
  progress: number;
  step: number;
  isCelebration?: boolean;
}

const TOTAL_STEPS = 6;

const STATUS_CONFIG: Record<string, StatusConfig> = {
  FIRST_PARTY_APPROVED: {
    labelHe: 'ממתין לשדכן',
    labelEn: 'Waiting for matchmaker',
    descriptionHe: 'אישרת את ההצעה. השדכן/ית יעביר/ו לצד השני.',
    descriptionEn: 'You approved. The matchmaker will forward to the other party.',
    icon: Clock,
    progress: 30,
    step: 1,
  },
  PENDING_SECOND_PARTY: {
    labelHe: 'ממתין לצד השני',
    labelEn: 'Waiting for other party',
    descriptionHe: 'ההצעה נשלחה לצד השני. ממתינים לתשובה.',
    descriptionEn: 'Sent to the other party. Waiting for their response.',
    icon: Clock,
    progress: 45,
    step: 2,
  },
  SECOND_PARTY_APPROVED: {
    labelHe: 'שני הצדדים אישרו!',
    labelEn: 'Both parties approved!',
    descriptionHe: 'שניכם אישרתם! השדכן/ית ישתפו פרטי קשר בקרוב.',
    descriptionEn: 'You both approved! Contact details coming soon.',
    icon: CheckCircle2,
    progress: 60,
    step: 3,
    isCelebration: true,
  },
  CONTACT_DETAILS_SHARED: {
    labelHe: 'פרטי קשר שותפו!',
    labelEn: 'Contact details shared!',
    descriptionHe: 'הגיע הזמן ליצור קשר ולקבוע פגישה.',
    descriptionEn: 'Time to reach out and schedule a meeting.',
    icon: Phone,
    progress: 70,
    step: 4,
    isCelebration: true,
  },
  AWAITING_FIRST_DATE_FEEDBACK: {
    labelHe: 'ממתין למשוב פגישה',
    labelEn: 'Waiting for date feedback',
    descriptionHe: 'איך הלכה הפגישה? השדכן/ית ישמחו לשמוע.',
    descriptionEn: 'How did it go? Your matchmaker would love to hear.',
    icon: MessageCircle,
    progress: 75,
    step: 5,
  },
  THINKING_AFTER_DATE: {
    labelHe: 'בחשיבה לאחר פגישה',
    labelEn: 'Thinking after date',
    descriptionHe: 'קח/י את הזמן. עדכנו את השדכן/ית כשתהיו מוכנים.',
    descriptionEn: 'Take your time. Update your matchmaker when ready.',
    icon: Lightbulb,
    progress: 78,
    step: 5,
  },
  PROCEEDING_TO_SECOND_DATE: {
    labelHe: 'בדרך לפגישה שנייה',
    labelEn: 'Heading to second date',
    descriptionHe: 'מתקדמים! בהצלחה בפגישה הבאה.',
    descriptionEn: 'Making progress! Good luck on the next date.',
    icon: TrendingUp,
    progress: 82,
    step: 5,
  },
  MEETING_SCHEDULED: {
    labelHe: 'פגישה קבועה!',
    labelEn: 'Meeting scheduled!',
    descriptionHe: 'יש לך פגישה קבועה. בהצלחה!',
    descriptionEn: 'You have a scheduled meeting. Good luck!',
    icon: Calendar,
    progress: 74,
    step: 5,
  },
  DATING: {
    labelHe: 'בתהליך היכרות',
    labelEn: 'Getting to know each other',
    descriptionHe: 'מאחלים לכם הצלחה!',
    descriptionEn: 'Wishing you the best!',
    icon: Heart,
    progress: 85,
    step: 5,
  },
  ENGAGED: {
    labelHe: 'מאורסים!',
    labelEn: 'Engaged!',
    descriptionHe: 'מזל טוב!! שמחים איתכם!',
    descriptionEn: 'Congratulations!!',
    icon: Gem,
    progress: 95,
    step: 6,
    isCelebration: true,
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  labelHe: 'הצעה פעילה',
  labelEn: 'Active suggestion',
  descriptionHe: '',
  descriptionEn: '',
  icon: Heart,
  progress: 50,
  step: 1,
};

const formatDisplayName = (
  firstName?: string | null,
  lastName?: string | null
): string => {
  if (!firstName) return '';
  const lastInitial = lastName ? ` ${lastName.charAt(0)}.` : '';
  return `${firstName}${lastInitial}`;
};

// Celebration particles for milestone statuses
const CelebrationParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          background: ['#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f97316'][i],
          left: `${15 + i * 14}%`,
          top: '20%',
        }}
        initial={{ opacity: 0, y: 0, scale: 0 }}
        animate={{
          opacity: [0, 1, 0],
          y: [-5, -25, -40],
          scale: [0, 1, 0.5],
        }}
        transition={{
          duration: 2,
          delay: 0.5 + i * 0.15,
          ease: 'easeOut',
        }}
      />
    ))}
  </div>
);

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
  const theme = getStatusTheme(suggestion.status);

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

  const displayName = formatDisplayName(
    otherParty?.firstName,
    otherParty?.lastName
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group rounded-2xl',
          theme.border,
          className
        )}
        onClick={() => onViewDetails(suggestion)}
      >
        {/* Gradient background */}
        <div className={cn('absolute inset-0 bg-gradient-to-br', theme.heroBg)} />

        {/* Floating orbs for depth */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            'absolute -top-8 -end-8 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br',
            theme.gradient,
          )} />
          <div className={cn(
            'absolute -bottom-6 -start-6 w-24 h-24 rounded-full blur-2xl opacity-15 bg-gradient-to-tr',
            theme.gradient,
          )} />
        </div>

        {/* Celebration particles */}
        {config.isCelebration && <CelebrationParticles />}

        <div className="relative p-4">
          {/* Top Row: Label */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm',
                  theme.iconBg
                )}
              >
                <Star className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-gray-800 truncate">
                {locale === 'he' ? 'ההצעה הפעילה שלי' : 'My Active Suggestion'}
              </span>
            </div>
            <Badge
              variant="outline"
              className={cn('text-xs font-semibold flex-shrink-0 rounded-lg px-2.5', theme.badgeClass)}
            >
              <StatusIcon className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
              {statusLabel}
            </Badge>
          </div>

          {/* Main Row: Avatar + Info + CTA */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Avatar — larger with status-colored ring */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden ring-[3px] shadow-md group-hover:shadow-lg transition-all duration-300',
                theme.ringColor,
              )}>
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={otherParty?.firstName || ''}
                    width={72}
                    height={72}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <User className="w-7 h-7 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Status indicator dot */}
              <div
                className={cn(
                  'absolute -bottom-0.5 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm',
                  isRtl ? '-left-0.5' : '-right-0.5',
                  theme.iconBg
                )}
              >
                <StatusIcon className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">
                  {displayName}
                </h3>
                {age && (
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    ({age})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                {otherParty?.profile?.city && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-gray-500 truncate max-w-[90px] flex-shrink-0">
                    <MapPinInline /> {otherParty.profile.city}
                  </span>
                )}
                {otherParty?.profile?.city && otherParty?.profile?.occupation && (
                  <span className="text-gray-300 flex-shrink-0">•</span>
                )}
                {otherParty?.profile?.occupation && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-gray-500 truncate">
                    <BriefcaseInline /> {otherParty.profile.occupation}
                  </span>
                )}
              </div>
              {statusDescription && (
                <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-snug">
                  {statusDescription}
                </p>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-600 hover:text-teal-700 transition-all duration-200 h-9 px-3 hover:scale-105 active:scale-95 backdrop-blur-sm bg-white/70"
                onClick={(e) => {
                  e.stopPropagation();
                  onContactMatchmaker(suggestion);
                }}
              >
                <Send className={cn('w-3.5 h-3.5', isRtl ? 'ml-1.5' : 'mr-1.5')} />
                <span className="hidden sm:inline text-xs font-medium">
                  {locale === 'he' ? 'שדכן/ית' : 'Matchmaker'}
                </span>
              </Button>

              <div className="w-9 h-9 rounded-full bg-white/60 backdrop-blur-sm group-hover:bg-teal-50 flex items-center justify-center transition-all duration-300 shadow-sm">
                <ChevronIcon className="w-4 h-4 text-gray-400 group-hover:text-teal-600 transition-all duration-300 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>

          {/* Progress Bar — status-themed gradient */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-medium">
                {locale === 'he'
                  ? `שלב ${config.step} מתוך ${TOTAL_STEPS}`
                  : `Step ${config.step} of ${TOTAL_STEPS}`}
              </span>
              <span className={cn('text-[10px] font-bold', theme.text)}>
                {config.progress}%
              </span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className={cn('h-full rounded-full bg-gradient-to-r shadow-sm', theme.progressGradient)}
                initial={{ width: 0 }}
                animate={{ width: `${config.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Inline SVG icons for city/occupation (smaller than lucide)
const MapPinInline = () => (
  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BriefcaseInline = () => (
  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

export default ActiveSuggestionHero;
