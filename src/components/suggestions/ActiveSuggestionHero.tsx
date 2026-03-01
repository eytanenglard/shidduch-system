// src/components/suggestions/ActiveSuggestionHero.tsx
// ============================================================
// NeshamaTech Web - Active Suggestion Hero Card
// Shown at top of suggestions page when user has an active
// suggestion (FIRST_PARTY_APPROVED → DATING/ENGAGED)
// Shows: other party info, status progress, "contact matchmaker" CTA
// ============================================================

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
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../types/suggestions';
import type { MatchSuggestionStatus } from '@prisma/client';

// ============================================================
// Status config
// ============================================================
interface StatusConfig {
  labelHe: string;
  labelEn: string;
  descriptionHe: string;
  descriptionEn: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
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
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
    progress: 30,
  },
  PENDING_SECOND_PARTY: {
    labelHe: 'ממתין לצד השני',
    labelEn: 'Waiting for other party',
    descriptionHe: 'ההצעה נשלחה לצד השני. ממתינים לתשובה.',
    descriptionEn: 'Sent to the other party. Waiting for their response.',
    icon: Clock,
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-100 text-blue-600',
    progress: 45,
  },
  SECOND_PARTY_APPROVED: {
    labelHe: 'שני הצדדים אישרו!',
    labelEn: 'Both parties approved!',
    descriptionHe: 'שניכם אישרתם! השדכן/ית ישתפו פרטי קשר בקרוב.',
    descriptionEn: 'You both approved! Contact details coming soon.',
    icon: CheckCircle2,
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100 text-violet-600',
    progress: 60,
  },
  CONTACT_DETAILS_SHARED: {
    labelHe: 'פרטי קשר שותפו! 🎉',
    labelEn: 'Contact details shared! 🎉',
    descriptionHe: 'הגיע הזמן ליצור קשר ולקבוע פגישה.',
    descriptionEn: 'Time to reach out and schedule a meeting.',
    icon: Phone,
    gradient: 'from-pink-500 to-rose-600',
    iconBg: 'bg-pink-100 text-pink-600',
    progress: 70,
  },
  AWAITING_FIRST_DATE_FEEDBACK: {
    labelHe: 'ממתין למשוב פגישה',
    labelEn: 'Waiting for date feedback',
    descriptionHe: 'איך הלכה הפגישה? השדכן/ית ישמחו לשמוע.',
    descriptionEn: 'How did it go? Your matchmaker would love to hear.',
    icon: MessageCircle,
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100 text-amber-600',
    progress: 75,
  },
  THINKING_AFTER_DATE: {
    labelHe: 'בחשיבה לאחר פגישה',
    labelEn: 'Thinking after date',
    descriptionHe: 'קח/י את הזמן. עדכנו את השדכן/ית כשתהיו מוכנים.',
    descriptionEn: 'Take your time. Update your matchmaker when ready.',
    icon: Lightbulb,
    gradient: 'from-indigo-500 to-violet-600',
    iconBg: 'bg-indigo-100 text-indigo-600',
    progress: 78,
  },
  PROCEEDING_TO_SECOND_DATE: {
    labelHe: 'בדרך לפגישה שנייה ✨',
    labelEn: 'Heading to second date ✨',
    descriptionHe: 'מתקדמים! בהצלחה בפגישה הבאה.',
    descriptionEn: 'Making progress! Good luck on the next date.',
    icon: TrendingUp,
    gradient: 'from-teal-500 to-cyan-600',
    iconBg: 'bg-teal-100 text-teal-600',
    progress: 82,
  },
  MEETING_SCHEDULED: {
    labelHe: 'פגישה קבועה! 📅',
    labelEn: 'Meeting scheduled! 📅',
    descriptionHe: 'יש לך פגישה קבועה. בהצלחה!',
    descriptionEn: 'You have a scheduled meeting. Good luck!',
    icon: Calendar,
    gradient: 'from-emerald-500 to-green-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
    progress: 74,
  },
  DATING: {
    labelHe: 'בתהליך היכרות 💕',
    labelEn: 'Getting to know each other 💕',
    descriptionHe: 'מאחלים לכם הצלחה!',
    descriptionEn: 'Wishing you the best!',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100 text-rose-600',
    progress: 85,
  },
  ENGAGED: {
    labelHe: 'מאורסים! 💍',
    labelEn: 'Engaged! 💍',
    descriptionHe: 'מזל טוב!! שמחים איתכם!',
    descriptionEn: 'Congratulations!!',
    icon: Gem,
    gradient: 'from-amber-500 to-yellow-600',
    iconBg: 'bg-amber-100 text-amber-600',
    progress: 95,
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  labelHe: 'הצעה פעילה',
  labelEn: 'Active suggestion',
  descriptionHe: '',
  descriptionEn: '',
  icon: Heart,
  gradient: 'from-indigo-500 to-violet-600',
  iconBg: 'bg-indigo-100 text-indigo-600',
  progress: 50,
};

// ============================================================
// Component
// ============================================================
interface ActiveSuggestionHeroProps {
  suggestion: ExtendedMatchSuggestion;
  userId: string;
  locale: 'he' | 'en';
  onContactMatchmaker: (suggestion: ExtendedMatchSuggestion) => void;
  onViewDetails: (suggestion: ExtendedMatchSuggestion) => void;
  className?: string;
}
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
const ActiveSuggestionHero: React.FC<ActiveSuggestionHeroProps> = ({
  suggestion,
  userId,
  locale,
  onContactMatchmaker,
  onViewDetails,
  className,
}) => {
  const config = STATUS_CONFIG[suggestion.status] || DEFAULT_CONFIG;
  const StatusIcon = config.icon;

  const isFirstParty = suggestion.firstPartyId === userId;
  const otherParty = isFirstParty
    ? suggestion.secondParty
    : suggestion.firstParty;
  const otherPartyImage = otherParty?.images?.[0];
  const imageSrc = otherPartyImage
    ? getRelativeCloudinaryPath(otherPartyImage.url)
    : null;

  const statusLabel = locale === 'he' ? config.labelHe : config.labelEn;
  const statusDescription =
    locale === 'he' ? config.descriptionHe : config.descriptionEn;
  const ChevronIcon = locale === 'he' ? ChevronLeft : ChevronRight;

  return (
    <Card
      className={cn(
        'overflow-hidden border-0 shadow-xl cursor-pointer group',
        className
      )}
      onClick={() => onViewDetails(suggestion)}
    >
      <div
        className={cn(
          'bg-gradient-to-br p-6 relative overflow-hidden',
          config.gradient
        )}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />

        <div className="relative z-10">
          {/* Top: Label + Status badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-white/90 text-sm font-semibold tracking-wide">
                {locale === 'he' ? 'ההצעה הפעילה שלי' : 'My Active Suggestion'}
              </span>
            </div>
            <Badge className="bg-white/15 text-white border-white/20 text-xs">
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusLabel}
            </Badge>
          </div>

          {/* Main: Avatar + Info */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden ring-3 ring-white/30 shadow-xl">
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt={otherParty?.firstName || ''}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/20">
                    <User className="w-7 h-7 text-white/70" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg truncate">
                {otherParty?.firstName} {otherParty?.lastName}
                {(() => {
                  const age = calculateAge(otherParty?.profile?.birthDate);
                  return age ? `, ${age}` : '';
                })()}{' '}
              </h3>
              <div className="flex items-center flex-wrap gap-2 mt-1">
                {otherParty?.profile?.city && (
                  <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-md">
                    📍 {otherParty.profile.city}
                  </span>
                )}
                {otherParty?.profile?.occupation && (
                  <span className="text-white/70 text-xs bg-white/10 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                    💼 {otherParty.profile.occupation}
                  </span>
                )}
              </div>
              {statusDescription && (
                <p className="text-white/60 text-xs mt-2 leading-relaxed line-clamp-2">
                  {statusDescription}
                </p>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-4">
            <Progress
              value={config.progress}
              className="h-2 bg-white/15 flex-1"
            />
            <span className="text-white/50 text-xs font-bold w-8 text-center">
              {config.progress}%
            </span>
          </div>

          {/* CTA: Contact Matchmaker */}
          <Button
            variant="secondary"
            className="w-full bg-white hover:bg-white/95 text-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 h-11 font-semibold group/btn"
            onClick={(e) => {
              e.stopPropagation();
              onContactMatchmaker(suggestion);
            }}
          >
            <Send
              className={cn(
                'w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform',
                locale === 'he' ? 'ml-2' : 'mr-2'
              )}
            />
            {locale === 'he' ? 'צור/י קשר עם השדכן/ית' : 'Contact Matchmaker'}
            <ChevronIcon className="w-4 h-4 opacity-40 mr-auto" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ActiveSuggestionHero;
