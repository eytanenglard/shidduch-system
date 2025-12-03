// src/app/components/suggestions/compatibility/MatchCompatibilityView.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
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
  Target,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PartyInfo } from '../types';
import type { SuggestionsCompatibilityDict } from '@/types/dictionary';

// =============================================================================
// COLOR PALETTE REFERENCE (Matching HeroSection.tsx)
// =============================================================================
// Primary Colors:
//   - Teal/Emerald: from-teal-400 via-teal-500 to-emerald-500 (Knowledge/New)
//   - Orange/Amber: from-orange-400 via-amber-500 to-yellow-500 (Action/Warmth)
//   - Rose/Pink:    from-rose-400 via-pink-500 to-red-500 (Love/Connection)
//
// Score Colors (Hero-aligned):
//   - High (85+): Teal/Emerald (Excellence)
//   - Good (70+): Teal (Good match)
//   - Medium (55+): Orange/Amber (Moderate)
//   - Low (<55): Rose (Needs attention)
//
// Category Colors:
//   - Basic: Teal (from-teal-50 to-emerald-50)
//   - Lifestyle: Orange (from-orange-50 to-amber-50)
//   - Values: Rose (from-rose-50 to-red-50)
//   - Preferences: Teal variant (from-emerald-50 to-teal-50)
// =============================================================================

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
  matchingReason?: string | null;
  className?: string;
  dict: SuggestionsCompatibilityDict;
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
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
};

// Hero-aligned importance colors
const getImportanceColor = (importance: string) => {
  switch (importance) {
    case 'high':
      // Rose/Red for high importance (critical)
      return 'from-rose-400 to-red-500';
    case 'medium':
      // Orange/Amber for medium importance (attention)
      return 'from-orange-400 to-amber-500';
    case 'low':
      // Teal for low importance (informational)
      return 'from-teal-400 to-teal-500';
    default:
      return 'from-gray-400 to-gray-500';
  }
};

// Hero-aligned category colors
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'basic':
      // Teal - Knowledge/Basics
      return 'from-teal-50 to-emerald-50';
    case 'lifestyle':
      // Orange - Action/Lifestyle
      return 'from-orange-50 to-amber-50';
    case 'values':
      // Rose - Connection/Values
      return 'from-rose-50 to-red-50';
    case 'preferences':
      // Emerald/Teal variant
      return 'from-emerald-50 to-teal-50';
    default:
      return 'from-gray-50 to-slate-50';
  }
};

const CompatibilityCard: React.FC<{
  item: CompatibilityItem;
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  dict: SuggestionsCompatibilityDict;
}> = ({ item, firstParty, secondParty, dict }) => {
  const importanceColor = getImportanceColor(item.importance);
  const categoryColor = getCategoryColor(item.category);

  return (
    <Card
      className={cn(
        'border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden bg-gradient-to-br',
        categoryColor
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md',
              item.compatible
                ? // Compatible: Teal/Emerald (positive - Hero primary)
                  'from-teal-500 to-emerald-500'
                : // Not compatible: Rose/Red (negative - Hero decline)
                  'from-rose-400 to-red-500'
            )}
          >
            {item.icon}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-800 text-base">
                    {item.criterion}
                  </h4>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs px-2 py-0.5 font-semibold border-0 text-white bg-gradient-to-r',
                      importanceColor
                    )}
                  >
                    {item.importance === 'high'
                      ? dict.importance.high
                      : item.importance === 'medium'
                        ? dict.importance.medium
                        : dict.importance.low}
                  </Badge>
                </div>
                <p
                  className={cn(
                    'text-sm font-medium leading-relaxed',
                    item.compatible ? 'text-teal-700' : 'text-rose-700'
                  )}
                >
                  {item.reason}
                </p>
              </div>
              <div className="flex-shrink-0">
                {item.compatible ? (
                  <CheckCircle className="w-6 h-6 text-teal-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-500" />
                )}
              </div>
            </div>
            {(item.first != null || item.second != null) && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/50">
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2">
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    {firstParty.firstName}
                  </div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {item.first ?? dict.card.notSpecified}
                  </div>
                </div>
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2">
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    {secondParty.firstName}
                  </div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {item.second ?? dict.card.notSpecified}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const CategorySection: React.FC<{
  title: string;
  icon: React.ElementType;
  items: CompatibilityItem[];
  color: string;
  firstParty: PartyInfo;
  secondParty: PartyInfo;
  dict: SuggestionsCompatibilityDict;
}> = ({ title, icon: Icon, items, color, firstParty, secondParty, dict }) => {
  const compatibleCount = items.filter((item) => item.compatible).length;
  const compatibilityRate =
    items.length > 0 ? (compatibleCount / items.length) * 100 : 0;

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg bg-gradient-to-r text-white shadow-md',
              color
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600">
              {dict.categorySubtitle
                .replace('{{compatibleCount}}', compatibleCount.toString())
                .replace('{{totalCount}}', items.length.toString())}
            </p>
          </div>
        </div>
        <div className="text-center">
          <div
            className={cn(
              'text-2xl font-bold',
              // Hero-aligned score colors
              compatibilityRate >= 70
                ? 'text-teal-600'
                : compatibilityRate >= 50
                  ? 'text-orange-600'
                  : 'text-rose-600'
            )}
          >
            {Math.round(compatibilityRate)}%
          </div>
          <div className="text-xs text-gray-500">{dict.compatibilityLabel}</div>
        </div>
      </div>
      <ul className="grid gap-4">
        {items.map((item, index) => (
          <li key={index}>
            <CompatibilityCard
              item={item}
              firstParty={firstParty}
              secondParty={secondParty}
              dict={dict}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

const MatchCompatibilityView: React.FC<MatchCompatibilityProps> = ({
  firstParty,
  secondParty,
  matchingReason,
  className,
  dict,
}) => {
  if (!firstParty.profile || !secondParty.profile) {
    return (
      <Card className={cn('shadow-xl border-0 overflow-hidden', className)}>
        {/* Header: Teal -> White -> Orange (Hero gradient) */}
        <CardHeader className="bg-gradient-to-r from-teal-50/80 via-white to-orange-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-gray-800">{dict.mainTitle}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {dict.errorTitle}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {dict.errorDescription}
            </p>
          </div>
        </CardContent>
      </Card>
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

  const calculateCompatibilityItems = (): CompatibilityItem[] => {
    const items: CompatibilityItem[] = [];

    // Age
    if (firstPartyAge != null && secondPartyAge != null) {
      const compatible =
        isWithinRange(
          secondPartyAge,
          firstProfile.preferredAgeMin,
          firstProfile.preferredAgeMax
        ) &&
        isWithinRange(
          firstPartyAge,
          secondProfile.preferredAgeMin,
          secondProfile.preferredAgeMax
        );
      items.push({
        criterion: dict.criteria.age,
        icon: <User className="w-6 h-6" />,
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
        isWithinRange(
          secondProfile.height,
          firstProfile.preferredHeightMin,
          firstProfile.preferredHeightMax
        ) &&
        isWithinRange(
          firstProfile.height,
          secondProfile.preferredHeightMin,
          secondProfile.preferredHeightMax
        );
      items.push({
        criterion: dict.criteria.height,
        icon: <TrendingUp className="w-6 h-6" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace(
              '{{criterion}}',
              dict.criteria.height
            )
          : dict.reasons.mismatch.replace(
              '{{criterion}}',
              dict.criteria.height
            ),
        first: `${firstProfile.height} ${dict.unitCm}`,
        second: `${secondProfile.height} ${dict.unitCm}`,
        importance: 'medium',
        category: 'basic',
      });
    }

    // Location
    if (firstProfile.city != null && secondProfile.city != null) {
      const compatible =
        isInPreferredList(
          secondProfile.city,
          firstProfile.preferredLocations
        ) &&
        isInPreferredList(firstProfile.city, secondProfile.preferredLocations);
      items.push({
        criterion: dict.criteria.location,
        icon: <MapPin className="w-6 h-6" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace(
              '{{criterion}}',
              dict.criteria.location
            )
          : dict.reasons.mismatch.replace(
              '{{criterion}}',
              dict.criteria.location
            ),
        first: firstProfile.city,
        second: secondProfile.city,
        importance: 'high',
        category: 'lifestyle',
      });
    }

    // Religious Level
    if (
      firstProfile.religiousLevel != null &&
      secondProfile.religiousLevel != null
    ) {
      const compatible =
        isInPreferredList(
          secondProfile.religiousLevel,
          firstProfile.preferredReligiousLevels
        ) &&
        isInPreferredList(
          firstProfile.religiousLevel,
          secondProfile.preferredReligiousLevels
        );
      items.push({
        criterion: dict.criteria.religiousLevel,
        icon: <Scroll className="w-6 h-6" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace(
              '{{criterion}}',
              dict.criteria.religiousLevel
            )
          : dict.reasons.mismatch.replace(
              '{{criterion}}',
              dict.criteria.religiousLevel
            ),
        first: firstProfile.religiousLevel,
        second: secondProfile.religiousLevel,
        importance: 'high',
        category: 'values',
      });
    }

    // Education
    if (firstProfile.education != null && secondProfile.education != null) {
      const compatible =
        isInPreferredList(
          secondProfile.education,
          firstProfile.preferredEducation
        ) &&
        isInPreferredList(
          firstProfile.education,
          secondProfile.preferredEducation
        );
      items.push({
        criterion: dict.criteria.education,
        icon: <GraduationCap className="w-6 h-6" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace(
              '{{criterion}}',
              dict.criteria.education
            )
          : dict.reasons.mismatch.replace(
              '{{criterion}}',
              dict.criteria.education
            ),
        first: firstProfile.education,
        second: secondProfile.education,
        importance: 'medium',
        category: 'preferences',
      });
    }

    // Occupation
    if (firstProfile.occupation != null && secondProfile.occupation != null) {
      const compatible =
        isInPreferredList(
          secondProfile.occupation,
          firstProfile.preferredOccupations
        ) &&
        isInPreferredList(
          firstProfile.occupation,
          secondProfile.preferredOccupations
        );
      items.push({
        criterion: dict.criteria.occupation,
        icon: <BookOpen className="w-6 h-6" />,
        compatible,
        reason: compatible
          ? dict.reasons.mutualMatch.replace(
              '{{criterion}}',
              dict.criteria.occupation
            )
          : dict.reasons.mismatch.replace(
              '{{criterion}}',
              dict.criteria.occupation
            ),
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
        icon: <Home className="w-6 h-6" />,
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
    if (
      firstProfile.nativeLanguage != null &&
      secondProfile.nativeLanguage != null
    ) {
      const sharedLanguage =
        firstProfile.nativeLanguage === secondProfile.nativeLanguage ||
        (firstProfile.additionalLanguages?.includes(
          secondProfile.nativeLanguage
        ) ??
          false) ||
        (secondProfile.additionalLanguages?.includes(
          firstProfile.nativeLanguage
        ) ??
          false);
      items.push({
        criterion: dict.criteria.language,
        icon: <Languages className="w-6 h-6" />,
        compatible: sharedLanguage,
        reason: sharedLanguage
          ? dict.reasons.sharedLanguage
          : dict.reasons.noSharedLanguage,
        first: firstProfile.nativeLanguage,
        second: secondProfile.nativeLanguage,
        importance: 'medium',
        category: 'lifestyle',
      });
    }

    return items;
  };

  const compatibilityItems = calculateCompatibilityItems();
  const compatibleCount = compatibilityItems.filter(
    (item) => item.compatible
  ).length;
  const compatibilityScore =
    compatibilityItems.length > 0
      ? Math.round((compatibleCount / compatibilityItems.length) * 100)
      : 0;

  const basicItems = compatibilityItems.filter(
    (item) => item.category === 'basic'
  );
  const lifestyleItems = compatibilityItems.filter(
    (item) => item.category === 'lifestyle'
  );
  const valuesItems = compatibilityItems.filter(
    (item) => item.category === 'values'
  );
  const preferencesItems = compatibilityItems.filter(
    (item) => item.category === 'preferences'
  );

  // Hero-aligned score colors
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

  return (
    <Card className={cn('shadow-xl border-0 overflow-hidden', className)}>
      {/* Header: Teal -> White -> Orange (Hero gradient) */}
      <CardHeader className="bg-gradient-to-r from-teal-50/80 via-white to-orange-50/50 border-b border-gray-100">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-gray-800">{dict.mainTitle}</span>
            <p className="text-sm text-gray-600 font-normal mt-1">
              {dict.mainSubtitle}
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {/* Overall Score Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Star className="w-8 h-8 text-amber-500 fill-current" />
                <div>
                  <div
                    className={cn(
                      'text-4xl font-bold',
                      getScoreColor(compatibilityScore)
                    )}
                  >
                    {compatibilityScore}%
                  </div>
                  <div className="text-lg font-semibold text-gray-700">
                    {getScoreDescription(compatibilityScore)}
                  </div>
                </div>
              </div>
              <Progress value={compatibilityScore} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>
                  {dict.overallScore.progressText
                    .replace('{{compatibleCount}}', compatibleCount.toString())
                    .replace(
                      '{{totalCount}}',
                      compatibilityItems.length.toString()
                    )}
                </span>
                <span>
                  {dict.overallScore.overallScoreLabel.replace(
                    '{{score}}',
                    compatibilityScore.toString()
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {compatibilityItems.length > 0 ? (
          <div className="space-y-8">
            {/* Basic: Teal */}
            <CategorySection
              title={dict.categoryTitles.basic}
              icon={User}
              items={basicItems}
              color="from-teal-500 to-emerald-500"
              firstParty={firstParty}
              secondParty={secondParty}
              dict={dict}
            />
            {/* Values: Rose */}
            <CategorySection
              title={dict.categoryTitles.values}
              icon={Heart}
              items={valuesItems}
              color="from-rose-400 to-pink-500"
              firstParty={firstParty}
              secondParty={secondParty}
              dict={dict}
            />
            {/* Lifestyle: Orange */}
            <CategorySection
              title={dict.categoryTitles.lifestyle}
              icon={Target}
              items={lifestyleItems}
              color="from-orange-400 to-amber-500"
              firstParty={firstParty}
              secondParty={secondParty}
              dict={dict}
            />
            {/* Preferences: Emerald/Teal variant */}
            <CategorySection
              title={dict.categoryTitles.preferences}
              icon={Star}
              items={preferencesItems}
              color="from-emerald-500 to-teal-500"
              firstParty={firstParty}
              secondParty={secondParty}
              dict={dict}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {dict.noDataTitle}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {dict.noDataDescription}
            </p>
          </div>
        )}

        {/* Matchmaker Rationale: Orange/Amber (Personal warmth) */}
        {matchingReason && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-800 text-lg mb-2">
                    {dict.matchmakerRationaleTitle}
                  </h3>
                  <p className="text-orange-900/80 leading-relaxed">
                    {matchingReason}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchCompatibilityView;
