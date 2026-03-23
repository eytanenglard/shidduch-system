import React from 'react';
import { ProfileSectionDict } from '@/types/dictionary';
import { Badge } from '@/components/ui/badge';

export const ensureDateObject = (
  value: string | number | Date | null | undefined
): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return undefined;
};

export const renderDisplayValue = (
  value: unknown,
  dict: ProfileSectionDict,
  placeholder?: string
): React.ReactNode => {
  const finalPlaceholder = placeholder || dict.placeholders.notSpecified;
  if (value === null || value === undefined || value === '') {
    return <span className="italic text-gray-500">{finalPlaceholder}</span>;
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Intl.DateTimeFormat('he-IL').format(value);
  }
  return String(value);
};

export const renderSelectDisplayValue = (
  value: string | undefined | null,
  options: { value: string; label: string }[],
  dict: ProfileSectionDict,
  placeholder?: string
) => {
  const finalPlaceholder = placeholder || dict.placeholders.notSpecified;
  if (!value) {
    return <span className="italic text-gray-500">{finalPlaceholder}</span>;
  }
  const option = options.find((opt) => opt.value === value);
  return option ? (
    option.label
  ) : (
    <span className="italic text-gray-500">{finalPlaceholder}</span>
  );
};

export const renderBooleanDisplayValue = (
  value: boolean | undefined | null,
  dict: ProfileSectionDict,
  trueLabel?: string,
  falseLabel?: string,
  placeholder?: string
) => {
  const finalPlaceholder = placeholder || dict.placeholders.notSpecified;
  const finalTrueLabel = trueLabel || dict.cards.family.hasChildrenYes;
  const finalFalseLabel = falseLabel || dict.cards.medical.display.no;

  if (value === undefined || value === null) {
    return <span className="italic text-gray-500">{finalPlaceholder}</span>;
  }
  return value ? finalTrueLabel : finalFalseLabel;
};

export const renderMultiSelectBadges = (
  fieldValues: string[] | undefined,
  options: { value: string; label: string; icon?: React.ElementType }[],
  emptyPlaceholder: string
) => {
  if (!fieldValues || fieldValues.length === 0) {
    return <p className="text-sm text-gray-500 italic">{emptyPlaceholder}</p>;
  }
  return fieldValues.map((value) => {
    const option = options.find((opt) => opt.value === value);
    return option ? (
      <Badge
        key={value}
        variant="secondary"
        className="me-1 mb-1 bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full"
      >
        {option.icon && <option.icon className="w-3 h-3 me-1" />}
        {option.label}
      </Badge>
    ) : null;
  });
};

export const getLanguageLabel = (
  lang: { value: string; label: { he: string; en: string } },
  locale: string
): string => {
  const normalizedLocale: 'he' | 'en' = locale.startsWith('he') ? 'he' : 'en';
  return lang.label[normalizedLocale] || lang.label.en || lang.value;
};
