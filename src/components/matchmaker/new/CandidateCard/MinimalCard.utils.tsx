// MinimalCard.utils.tsx — Pure utility functions

import React from 'react';
import { RELIGIOUS_LEVELS } from '../constants/filterOptions';
import { LANGUAGE_MAP } from './MinimalCard.constants';

// ── Age calculation ─────────────────────────────────────────────────────────

export const calculateAge = (birthDate: Date | string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// ── Highlight search term in text ───────────────────────────────────────────

export const highlightText = (
  text: string | undefined | null,
  highlightTerm: string
): React.ReactNode => {
  if (!highlightTerm || !text) return text;
  const parts = text.split(new RegExp(`(${highlightTerm})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlightTerm.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 px-0.5 rounded-sm">{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// ── Religious level label ───────────────────────────────────────────────────

export const getReligiousLabel = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const option = RELIGIOUS_LEVELS.find((opt) => opt.value === value);
  return option ? option.label : value;
};

// ── Waiting time calculation ────────────────────────────────────────────────

import type { WaitingConfig } from './MinimalCard.types';

export const getWaitingConfig = (
  lastSuggestedAt: Date | string | null | undefined,
  suggestionsReceived: number,
  createdAt: Date | string
): WaitingConfig => {
  const sinceDate = lastSuggestedAt
    ? new Date(lastSuggestedAt)
    : new Date(createdAt);
  const days = Math.floor((Date.now() - sinceDate.getTime()) / (1000 * 60 * 60 * 24));
  const neverSuggested = suggestionsReceived === 0;

  if (days <= 7) {
    return { label: '', className: '', textColor: '', show: false, showOnPhoto: false, days, neverSuggested };
  }
  if (days <= 14) {
    return {
      label: neverSuggested ? `חדש/ה · ${days} ימים` : `${days} ימים`,
      className: 'bg-emerald-500/90 text-white',
      textColor: 'text-emerald-600',
      show: true,
      showOnPhoto: false,
      days,
      neverSuggested,
    };
  }
  if (days <= 30) {
    return {
      label: neverSuggested ? `חדש/ה · ${days} ימים` : `⏰ ${days} ימים`,
      className: 'bg-amber-500/90 text-white',
      textColor: 'text-amber-600',
      show: true,
      showOnPhoto: true,
      days,
      neverSuggested,
    };
  }
  if (days <= 60) {
    return {
      label: neverSuggested ? `חדש/ה · ${days} ימים` : `⚠️ ${days} ימים`,
      className: 'bg-orange-500/90 text-white',
      textColor: 'text-orange-600',
      show: true,
      showOnPhoto: true,
      days,
      neverSuggested,
    };
  }
  return {
    label: neverSuggested ? `חדש/ה · ${days} ימים` : `🔴 ${days} ימים`,
    className: 'bg-red-500/90 text-white',
    textColor: 'text-red-600',
    show: true,
    showOnPhoto: true,
    days,
    neverSuggested,
  };
};

// ── Format spoken languages ─────────────────────────────────────────────────

export const formatLanguages = (
  nativeLanguage: string | null | undefined,
  additionalLanguages: string[] | null | undefined,
  isHebrew: boolean
): string => {
  const rawLangs = [
    nativeLanguage,
    ...(additionalLanguages || []),
  ].filter((l): l is string => !!l);

  return rawLangs
    .map((lang) =>
      isHebrew
        ? LANGUAGE_MAP[lang.toLowerCase()] || lang
        : lang.charAt(0).toUpperCase() + lang.slice(1)
    )
    .join(', ');
};
