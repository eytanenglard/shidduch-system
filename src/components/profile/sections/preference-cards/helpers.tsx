import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Heart,
  Briefcase,
  Smile,
  Users,
  GraduationCap,
  Palette,
  MapPin,
  Shield,
  Sparkles,
} from 'lucide-react';

// --- Map icons to values for dynamic options ---
export const iconMap: { [key: string]: React.ElementType } = {
  empathetic: Heart,
  driven: Briefcase,
  optimistic: Smile,
  family_oriented: Users,
  intellectual: GraduationCap,
  organized: Palette,
  calm: Heart,
  humorous: Smile,
  sociable: Users,
  sensitive: Heart,
  independent: MapPin,
  creative: Palette,
  honest: Shield,
  responsible: Shield,
  easy_going: Smile,
  no_strong_preference: Sparkles,
  travel: MapPin,
  sports: Briefcase,
  reading: GraduationCap,
  cooking_baking: Palette,
  music_playing_instrument: Palette,
  art_crafts: Palette,
  volunteering: Heart,
  learning_courses: GraduationCap,
  board_games_puzzles: Smile,
  movies_theater: Smile,
  dancing: Users,
  writing: GraduationCap,
  nature_hiking: MapPin,
  photography: Palette,
};

// --- Generate options from dictionary ---
export const generateOptions = (
  optionsDict: { [key: string]: string },
  withIcon?: boolean
): { value: string; label: string; icon?: React.ElementType }[] => {
  return Object.entries(optionsDict).map(([value, label]) => ({
    value,
    label,
    ...(withIcon && { icon: iconMap[value] }),
  }));
};

// --- Render multi-select badges for display mode ---
export const renderMultiSelectBadges = (
  fieldValues: string[] | undefined | null,
  options: { value: string; label: string; icon?: React.ElementType }[],
  badgeClass: string = 'bg-teal-100 text-teal-700',
  emptyPlaceholder: string
) => {
  if (!fieldValues || fieldValues.length === 0) {
    return <p className="text-sm text-gray-500 italic">{emptyPlaceholder}</p>;
  }
  return fieldValues.map((value) => {
    const option = options.find((opt) => opt.value === value);
    const label = option ? option.label : value;
    const Icon = option?.icon;

    return (
      <Badge
        key={value}
        variant="secondary"
        className={cn(
          'ltr:mr-1 rtl:ml-1 mb-1 text-xs px-2 py-0.5 rounded-full flex items-center',
          badgeClass
        )}
      >
        {Icon && <Icon className="w-3 h-3 ltr:mr-1 rtl:ml-1" />}
        {label}
      </Badge>
    );
  });
};

// --- Get display value for a select field ---
export const getSelectDisplayValue = (
  value: string | undefined | null,
  options: { value: string; label: string }[],
  placeholder: string
) => {
  if (!value)
    return <span className="text-gray-500 italic">{placeholder}</span>;
  const option = options.find((opt) => opt.value === value);
  return option ? (
    option.label
  ) : (
    <span className="text-gray-500">{value}</span>
  );
};
