// src/components/suggestions/compatibility/MatchCompatibilityView.tsx

import React from 'react';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Scroll,
  GraduationCap,
  MapPin,
  BookOpen,
  Home,
  Languages,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartyInfo } from '@/types/suggestions';
import type { SuggestionsCompatibilityDict } from '@/types/dictionary';

interface CompatibilityItem {
  criterion: string;
  icon: React.ReactNode;
  compatible: boolean;
  reason: string;
  first?: string | number | null;
  second?: string | number | null;
  importance: 'high' | 'medium' | 'low';
  category: 'basic' | 'lifestyle' | 'values' | 'preferences';
}

interface MatchCompatibilityProps {
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  className?: string;
  dict: SuggestionsCompatibilityDict;
  enumLabels?: Record<string, string>;
}

const calculateAge = (birthDate?: Date | string | null): number | null => {
  if (!birthDate) return null;
  try {
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age >= 0 ? age : null;
  } catch {
    return null;
  }
};

const importanceBadge = (importance: string, dict: SuggestionsCompatibilityDict) => {
  const styles: Record<string, string> = {
    high: 'bg-rose-100 text-rose-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-500',
  };
  const labels: Record<string, string> = {
    high: dict.importance.high,
    medium: dict.importance.medium,
    low: dict.importance.low,
  };
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', styles[importance] || styles.low)}>
      {labels[importance] || importance}
    </span>
  );
};

// Compact row for each compatibility criterion
const CompatibilityRow: React.FC<{
  item: CompatibilityItem;
  firstName: string;
  secondName: string;
  dict: SuggestionsCompatibilityDict;
}> = ({ item, firstName, secondName, dict }) => (
  <div
    className={cn(
      'px-3 py-2.5 rounded-lg transition-colors',
      item.compatible ? 'bg-white hover:bg-teal-50/40' : 'bg-rose-50/40 hover:bg-rose-50/70'
    )}
  >
    <div className="flex items-center gap-2">
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          item.compatible ? 'bg-teal-100 text-teal-600' : 'bg-rose-100 text-rose-500'
        )}
      >
        {item.icon}
      </div>

      {/* Criterion + reason */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-800">{item.criterion}</span>
          {importanceBadge(item.importance, dict)}
        </div>
        <p className={cn('text-xs leading-snug mt-0.5', item.compatible ? 'text-gray-500' : 'text-rose-600')}>
          {item.reason}
        </p>
      </div>

      {/* Status icon */}
      <div className="flex-shrink-0">
        {item.compatible ? (
          <CheckCircle className="w-4.5 h-4.5 text-teal-500" />
        ) : (
          <XCircle className="w-4.5 h-4.5 text-rose-400" />
        )}
      </div>
    </div>

    {/* Values comparison — stacked below on mobile for better fit */}
    {(item.first != null || item.second != null) && (
      <div className="flex items-center gap-1.5 text-xs mt-2 ms-10">
        <div className="text-center bg-gray-50 rounded-md px-2 py-1 flex-1 min-w-0">
          <div className="text-[10px] text-gray-400 font-medium truncate">{firstName}</div>
          <div className="font-semibold text-gray-700 truncate">{item.first ?? dict.card.notSpecified}</div>
        </div>
        <span className="text-gray-300 flex-shrink-0">|</span>
        <div className="text-center bg-gray-50 rounded-md px-2 py-1 flex-1 min-w-0">
          <div className="text-[10px] text-gray-400 font-medium truncate">{secondName}</div>
          <div className="font-semibold text-gray-700 truncate">{item.second ?? dict.card.notSpecified}</div>
        </div>
      </div>
    )}
  </div>
);

// Category group header - thin inline
const CategoryHeader: React.FC<{
  title: string;
  compatibleCount: number;
  totalCount: number;
  dict: SuggestionsCompatibilityDict;
}> = ({ title, compatibleCount, totalCount, dict }) => {
  if (totalCount === 0) return null;
  const rate = Math.round((compatibleCount / totalCount) * 100);
  return (
    <div className="flex items-center justify-between px-3 pt-3 pb-1">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
      <span className={cn(
        'text-xs font-bold',
        rate >= 70 ? 'text-teal-600' : rate >= 50 ? 'text-amber-600' : 'text-rose-600'
      )}>
        {dict.categorySubtitle
          .replace('{{compatibleCount}}', compatibleCount.toString())
          .replace('{{totalCount}}', totalCount.toString())}
      </span>
    </div>
  );
};

const MatchCompatibilityView: React.FC<MatchCompatibilityProps> = ({
  firstParty,
  secondParty,
  className,
  dict,
  enumLabels = {},
}) => {
  if (!firstParty.profile || !secondParty.profile) {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-6', className)}>
        <div className="text-center py-8">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-600 mb-1">{dict.errorTitle}</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">{dict.errorDescription}</p>
        </div>
      </div>
    );
  }

  const firstProfile = firstParty.profile;
  const secondProfile = secondParty.profile;
  const firstPartyAge = calculateAge(firstProfile.birthDate);
  const secondPartyAge = calculateAge(secondProfile.birthDate);

  const isWithinRange = (
    value: number | null | undefined,
    min: number | null | undefined,
    max: number | null | undefined
  ): boolean => {
    if (value == null) return false;
    const minOk = min == null || value >= min;
    const maxOk = max == null || value <= max;
    return minOk && maxOk;
  };

  const isInPreferredList = (
    value: string | null | undefined,
    preferredList: string[] | null | undefined
  ): boolean => {
    if (value == null) return false;
    if (preferredList == null || preferredList.length === 0) return true;
    return preferredList.includes(value);
  };

  const translateEnum = (value: string | null | undefined): string | null => {
    if (!value) return null;
    return enumLabels[value] || value;
  };

  const calculateCompatibilityItems = (): CompatibilityItem[] => {
    const items: CompatibilityItem[] = [];

    // Age
    if (firstPartyAge != null && secondPartyAge != null) {
      const compatible =
        isWithinRange(secondPartyAge, firstProfile.preferredAgeMin, firstProfile.preferredAgeMax) &&
        isWithinRange(firstPartyAge, secondProfile.preferredAgeMin, secondProfile.preferredAgeMax);
      items.push({
        criterion: dict.criteria.age,
        icon: <User className="w-4 h-4" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace('{{criterion}}', dict.criteria.age)
          : dict.reasons.mismatch.replace('{{criterion}}', dict.criteria.age),
        first: firstPartyAge,
        second: secondPartyAge,
        importance: 'high',
        category: 'basic',
      });
    }

    // Height
    if (firstProfile.height != null && secondProfile.height != null) {
      const compatible =
        isWithinRange(secondProfile.height, firstProfile.preferredHeightMin, firstProfile.preferredHeightMax) &&
        isWithinRange(firstProfile.height, secondProfile.preferredHeightMin, secondProfile.preferredHeightMax);
      items.push({
        criterion: dict.criteria.height,
        icon: <TrendingUp className="w-4 h-4" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace('{{criterion}}', dict.criteria.height)
          : dict.reasons.mismatch.replace('{{criterion}}', dict.criteria.height),
        first: `${firstProfile.height} ${dict.unitCm}`,
        second: `${secondProfile.height} ${dict.unitCm}`,
        importance: 'medium',
        category: 'basic',
      });
    }

    // Location
    if (firstProfile.city != null && secondProfile.city != null) {
      const compatible =
        isInPreferredList(secondProfile.city, firstProfile.preferredLocations) &&
        isInPreferredList(firstProfile.city, secondProfile.preferredLocations);
      items.push({
        criterion: dict.criteria.location,
        icon: <MapPin className="w-4 h-4" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace('{{criterion}}', dict.criteria.location)
          : dict.reasons.mismatch.replace('{{criterion}}', dict.criteria.location),
        first: firstProfile.city,
        second: secondProfile.city,
        importance: 'high',
        category: 'lifestyle',
      });
    }

    // Religious Level
    if (firstProfile.religiousLevel != null && secondProfile.religiousLevel != null) {
      const compatible =
        isInPreferredList(secondProfile.religiousLevel, firstProfile.preferredReligiousLevels) &&
        isInPreferredList(firstProfile.religiousLevel, secondProfile.preferredReligiousLevels);
      items.push({
        criterion: dict.criteria.religiousLevel,
        icon: <Scroll className="w-4 h-4" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace('{{criterion}}', dict.criteria.religiousLevel)
          : dict.reasons.mismatch.replace('{{criterion}}', dict.criteria.religiousLevel),
        first: translateEnum(firstProfile.religiousLevel),
        second: translateEnum(secondProfile.religiousLevel),
        importance: 'high',
        category: 'values',
      });
    }

    // Education
    if (firstProfile.education != null && secondProfile.education != null) {
      const compatible =
        isInPreferredList(secondProfile.education, firstProfile.preferredEducation) &&
        isInPreferredList(firstProfile.education, secondProfile.preferredEducation);
      items.push({
        criterion: dict.criteria.education,
        icon: <GraduationCap className="w-4 h-4" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace('{{criterion}}', dict.criteria.education)
          : dict.reasons.mismatch.replace('{{criterion}}', dict.criteria.education),
        first: translateEnum(firstProfile.education),
        second: translateEnum(secondProfile.education),
        importance: 'medium',
        category: 'preferences',
      });
    }

    // Occupation
    if (firstProfile.occupation != null && secondProfile.occupation != null) {
      const compatible =
        isInPreferredList(secondProfile.occupation, firstProfile.preferredOccupations) &&
        isInPreferredList(firstProfile.occupation, secondProfile.preferredOccupations);
      items.push({
        criterion: dict.criteria.occupation,
        icon: <BookOpen className="w-4 h-4" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace('{{criterion}}', dict.criteria.occupation)
          : dict.reasons.mismatch.replace('{{criterion}}', dict.criteria.occupation),
        first: firstProfile.occupation,
        second: secondProfile.occupation,
        importance: 'medium',
        category: 'lifestyle',
      });
    }

    // Origin
    if (firstProfile.origin != null && secondProfile.origin != null) {
      items.push({
        criterion: dict.criteria.origin,
        icon: <Home className="w-4 h-4" />,
        compatible: true,
        reason:
          firstProfile.origin === secondProfile.origin
            ? dict.reasons.sameOrigin
            : dict.reasons.differentOrigin,
        first: firstProfile.origin,
        second: secondProfile.origin,
        importance: 'low',
        category: 'values',
      });
    }

    // Language
    if (firstProfile.nativeLanguage != null && secondProfile.nativeLanguage != null) {
      const sharedLanguage =
        firstProfile.nativeLanguage === secondProfile.nativeLanguage ||
        (firstProfile.additionalLanguages?.includes(secondProfile.nativeLanguage) ?? false) ||
        (secondProfile.additionalLanguages?.includes(firstProfile.nativeLanguage) ?? false);
      items.push({
        criterion: dict.criteria.language,
        icon: <Languages className="w-4 h-4" />,
        compatible: sharedLanguage,
        reason: sharedLanguage ? dict.reasons.sharedLanguage : dict.reasons.noSharedLanguage,
        first: firstProfile.nativeLanguage,
        second: secondProfile.nativeLanguage,
        importance: 'medium',
        category: 'lifestyle',
      });
    }

    return items;
  };

  const compatibilityItems = calculateCompatibilityItems();
  const compatibleCount = compatibilityItems.filter((item) => item.compatible).length;
  const compatibilityScore =
    compatibilityItems.length > 0
      ? Math.round((compatibleCount / compatibilityItems.length) * 100)
      : 0;

  const basicItems = compatibilityItems.filter((item) => item.category === 'basic');
  const lifestyleItems = compatibilityItems.filter((item) => item.category === 'lifestyle');
  const valuesItems = compatibilityItems.filter((item) => item.category === 'values');
  const preferencesItems = compatibilityItems.filter((item) => item.category === 'preferences');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-teal-600';
    if (score >= 60) return 'text-emerald-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-rose-600';
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return dict.overallScore.descriptionExcellent;
    if (score >= 60) return dict.overallScore.descriptionGood;
    if (score >= 40) return dict.overallScore.descriptionModerate;
    return dict.overallScore.descriptionChallenging;
  };

  if (compatibilityItems.length === 0) {
    return (
      <div className={cn('rounded-xl border border-gray-200 bg-white p-6', className)}>
        <div className="text-center py-8">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-600 mb-1">{dict.noDataTitle}</h3>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">{dict.noDataDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white overflow-hidden', className)}>
      {/* Compact overall score bar */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Star className="w-5 h-5 text-amber-500 fill-current" />
            <span className={cn('text-2xl font-bold', getScoreColor(compatibilityScore))}>
              {compatibilityScore}%
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-gray-700">
                {getScoreDescription(compatibilityScore)}
              </span>
              <span className="text-xs text-gray-400">
                {dict.overallScore.progressText
                  .replace('{{compatibleCount}}', compatibleCount.toString())
                  .replace('{{totalCount}}', compatibilityItems.length.toString())}
              </span>
            </div>
            <Progress value={compatibilityScore} className="h-2" />
          </div>
        </div>
      </div>

      {/* Compact category sections */}
      <div className="divide-y divide-gray-100">
        {/* Basic */}
        {basicItems.length > 0 && (
          <div>
            <CategoryHeader
              title={dict.categoryTitles.basic}
              compatibleCount={basicItems.filter((i) => i.compatible).length}
              totalCount={basicItems.length}
              dict={dict}
            />
            <div className="px-1 pb-2 space-y-1">
              {basicItems.map((item, i) => (
                <CompatibilityRow
                  key={i}
                  item={item}
                  firstName={firstParty.firstName}
                  secondName={secondParty.firstName}
                  dict={dict}
                />
              ))}
            </div>
          </div>
        )}

        {/* Values */}
        {valuesItems.length > 0 && (
          <div>
            <CategoryHeader
              title={dict.categoryTitles.values}
              compatibleCount={valuesItems.filter((i) => i.compatible).length}
              totalCount={valuesItems.length}
              dict={dict}
            />
            <div className="px-1 pb-2 space-y-1">
              {valuesItems.map((item, i) => (
                <CompatibilityRow
                  key={i}
                  item={item}
                  firstName={firstParty.firstName}
                  secondName={secondParty.firstName}
                  dict={dict}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle */}
        {lifestyleItems.length > 0 && (
          <div>
            <CategoryHeader
              title={dict.categoryTitles.lifestyle}
              compatibleCount={lifestyleItems.filter((i) => i.compatible).length}
              totalCount={lifestyleItems.length}
              dict={dict}
            />
            <div className="px-1 pb-2 space-y-1">
              {lifestyleItems.map((item, i) => (
                <CompatibilityRow
                  key={i}
                  item={item}
                  firstName={firstParty.firstName}
                  secondName={secondParty.firstName}
                  dict={dict}
                />
              ))}
            </div>
          </div>
        )}

        {/* Preferences */}
        {preferencesItems.length > 0 && (
          <div>
            <CategoryHeader
              title={dict.categoryTitles.preferences}
              compatibleCount={preferencesItems.filter((i) => i.compatible).length}
              totalCount={preferencesItems.length}
              dict={dict}
            />
            <div className="px-1 pb-2 space-y-1">
              {preferencesItems.map((item, i) => (
                <CompatibilityRow
                  key={i}
                  item={item}
                  firstName={firstParty.firstName}
                  secondName={secondParty.firstName}
                  dict={dict}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCompatibilityView;
