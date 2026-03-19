// src/components/profile/utils/formatters.ts

import React from 'react';
import {
  Telescope,
  CheckCircle,
  X,
  Heart,
  Clock,
  Coffee,
  Moon,
  Star,
  Sparkles,
} from 'lucide-react';
import type { UserProfile } from '@/types/next-auth';
import type { ProfileCardDisplayDict } from '@/types/dictionary';
import type { EnumMap } from '../types/profileCard';

export const formatEnumValue = (
  value: string | null | undefined,
  map: EnumMap,
  placeholder: string,
  useMobile: boolean = false
): {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  color: string;
  mobileClasses?: string;
} => {
  if (!value || !map[value]) {
    return {
      label: placeholder,
      shortLabel:
        useMobile && placeholder.length > 10
          ? placeholder.substring(0, 10) + '...'
          : placeholder,
      icon: Telescope,
      color: 'text-gray-500',
      mobileClasses: 'text-xs sm:text-sm',
    };
  }

  const result = map[value];
  return {
    ...result,
    shortLabel:
      result.shortLabel ||
      (useMobile && result.label.length > 10
        ? result.label.substring(0, 10) + '...'
        : result.label),
  };
};

export const getInitials = (
  firstName?: string,
  lastName?: string,
  maxLength: number = 2
): string => {
  let initials = '';
  if (firstName && firstName.length > 0) initials += firstName[0];
  if (lastName && lastName.length > 0) initials += lastName[0];

  if (initials.length === 0 && firstName && firstName.length > 0) {
    initials =
      firstName.length > 1
        ? firstName.substring(0, Math.min(maxLength, firstName.length))
        : firstName[0];
  }

  return initials.toUpperCase() || '♥';
};

export const calculateProfileAge = (
  birthDate: Date | string | null | undefined
): number => {
  if (!birthDate) return 0;
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 0;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age > 0 ? age : 0;
  } catch {
    return 0;
  }
};

export const formatAvailabilityStatus = (
  status: UserProfile['availabilityStatus'] | undefined,
  dict: ProfileCardDisplayDict['availability'] & { mysterious: string },
  badgeDict: ProfileCardDisplayDict['header']['availabilityBadge']
) => {
  const statusMap = {
    AVAILABLE: {
      text: dict.AVAILABLE,
      shortText: badgeDict.available_short,
      icon: Heart,
      dotColor: 'bg-green-500',
      textColor: 'text-green-600',
    },
    UNAVAILABLE: {
      text: dict.UNAVAILABLE,
      shortText: badgeDict.unavailable_short,
      icon: Clock,
      dotColor: 'bg-gray-400',
      textColor: 'text-gray-500',
    },
    DATING: {
      text: dict.DATING,
      shortText: badgeDict.dating_short,
      icon: Coffee,
      dotColor: 'bg-amber-500',
      textColor: 'text-amber-600',
    },
    PAUSED: {
      text: dict.PAUSED,
      shortText: badgeDict.paused_short,
      icon: Moon,
      dotColor: 'bg-amber-400',
      textColor: 'text-amber-500',
    },
    ENGAGED: {
      text: dict.ENGAGED,
      shortText: badgeDict.engaged_short,
      icon: Star,
      dotColor: 'bg-pink-500',
      textColor: 'text-pink-600',
    },
    MARRIED: {
      text: dict.MARRIED,
      shortText: badgeDict.married_short,
      icon: Heart,
      dotColor: 'bg-rose-500',
      textColor: 'text-rose-600',
    },
  };

  return (
    statusMap[status as keyof typeof statusMap] || {
      text: dict.mysterious,
      shortText: badgeDict.mysterious_short,
      icon: Sparkles,
      dotColor: 'bg-gray-400',
      textColor: 'text-gray-500',
    }
  );
};

export const formatBooleanPreference = (
  value: boolean | null | undefined,
  dict: ProfileCardDisplayDict['booleanPrefs'] & { willDiscover: string },
  useYesShomer: boolean = false,
  useMobile: boolean = false
): {
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  color: string;
  mobileClasses?: string;
} => {
  const yesLabel = useYesShomer ? dict.shomerYes : dict.yes;
  const noLabel = dict.no;
  const notSpecifiedLabel = dict.willDiscover;
  const baseResponse = { mobileClasses: 'text-xs sm:text-sm' };

  if (value === true) {
    return {
      label: yesLabel,
      shortLabel:
        useMobile && yesLabel.length > 8
          ? yesLabel.substring(0, 8) + '...'
          : yesLabel,
      icon: CheckCircle,
      color: 'text-green-600',
      ...baseResponse,
    };
  }

  if (value === false) {
    return {
      label: noLabel,
      shortLabel:
        useMobile && noLabel.length > 8
          ? noLabel.substring(0, 8) + '...'
          : noLabel,
      icon: X,
      color: 'text-red-500',
      ...baseResponse,
    };
  }

  return {
    label: notSpecifiedLabel,
    shortLabel:
      useMobile && notSpecifiedLabel.length > 8
        ? notSpecifiedLabel.substring(0, 8) + '...'
        : notSpecifiedLabel,
    icon: Telescope,
    color: 'text-gray-500',
    ...baseResponse,
  };
};
