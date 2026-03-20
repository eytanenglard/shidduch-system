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
