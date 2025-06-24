// src/app/components/suggestions/compatibility/MatchCompatibilityView.tsx

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PartyInfo } from "../types";
import type { UserProfile } from "@/types/next-auth";

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
}

const calculateAge = (birthDate?: Date | string | null): number | null => {
  if (!birthDate) return null;

  try {
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
};

const getImportanceColor = (importance: string) => {
  switch (importance) {
    case 'high':
      return 'from-red-400 to-red-500';
    case 'medium':
      return 'from-amber-400 to-orange-500';
    case 'low':
      return 'from-cyan-400 to-blue-500';
    default:
      return 'from-gray-400 to-gray-500';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'basic':
      return 'from-cyan-50 to-blue-50';
    case 'lifestyle':
      return 'from-emerald-50 to-green-50';
    case 'values':
      return 'from-blue-50 to-cyan-50';
    case 'preferences':
      return 'from-green-50 to-emerald-50';
    default:
      return 'from-gray-50 to-slate-50';
  }
};

const CompatibilityCard: React.FC<{
  item: CompatibilityItem;
  index: number;
  firstParty: PartyInfo;
  secondParty: PartyInfo;
}> = ({ item, index, firstParty, secondParty }) => {
  const importanceColor = getImportanceColor(item.importance);
  const categoryColor = getCategoryColor(item.category);
  
  return (
    <Card className={cn(
      "border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden bg-gradient-to-br",
      categoryColor
    )}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-md",
            item.compatible 
              ? "from-emerald-500 to-green-500" 
              : "from-red-400 to-rose-500"
          )}>
            {item.icon}
          </div>
          
          {/* Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-800 text-base">{item.criterion}</h4>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs px-2 py-0.5 font-semibold border-0 text-white",
                      importanceColor
                    )}
                  >
                    {item.importance === 'high' ? 'חשוב' : 
                     item.importance === 'medium' ? 'בינוני' : 'נמוך'}
                  </Badge>
                </div>
                <p className={cn(
                  "text-sm font-medium leading-relaxed",
                  item.compatible ? "text-emerald-700" : "text-red-700"
                )}>
                  {item.reason}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                {item.compatible ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
            </div>

            {/* Details */}
            {(item.first != null || item.second != null) && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/50">
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2">
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    {firstParty.firstName}
                  </div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {item.first ?? "לא צוין"}
                  </div>
                </div>
                <div className="text-center bg-white/60 backdrop-blur-sm rounded-lg p-2">
                  <div className="text-xs text-gray-500 font-medium mb-1">
                    {secondParty.firstName}
                  </div>
                  <div className="font-semibold text-gray-800 text-sm">
                    {item.second ?? "לא צוין"}
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
}> = ({ title, icon: Icon, items, color, firstParty, secondParty }) => {
  const compatibleCount = items.filter(item => item.compatible).length;
  const compatibilityRate = items.length > 0 ? (compatibleCount / items.length) * 100 : 0;
  
  if (items.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-gradient-to-r text-white shadow-md", color)}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600">{compatibleCount} מתוך {items.length} קריטריונים תואמים</p>
          </div>
        </div>
        <div className="text-center">
          <div className={cn("text-2xl font-bold", compatibilityRate >= 70 ? "text-emerald-600" : compatibilityRate >= 50 ? "text-amber-600" : "text-red-600")}>
            {Math.round(compatibilityRate)}%
          </div>
          <div className="text-xs text-gray-500">התאמה</div>
        </div>
      </div>
      
      <div className="grid gap-4">
        {items.map((item, index) => (
          <CompatibilityCard key={index} item={item} index={index} firstParty={firstParty} secondParty={secondParty} />
        ))}
      </div>
    </div>
  );
};

const MatchCompatibilityView: React.FC<MatchCompatibilityProps> = ({
  firstParty,
  secondParty,
  matchingReason,
  className,
}) => {
  const firstPartyAge = calculateAge(firstParty.profile.birthDate);
  const secondPartyAge = calculateAge(secondParty.profile.birthDate);

  // Helper functions
  const isWithinRange = (value: number | null | undefined, min: number | null | undefined, max: number | null | undefined): boolean => {
    if (value == null) return false;
    const minOk = min == null || value >= min;
    const maxOk = max == null || value <= max;
    return minOk && maxOk;
  }

  const isInPreferredList = (value: string | null | undefined, preferredList: string[] | null | undefined): boolean => {
    if (value == null) return false;
    if (preferredList == null || preferredList.length === 0) return true;
    return preferredList.includes(value);
  }

  // Calculate compatibility items
  const calculateCompatibilityItems = (): CompatibilityItem[] => {
    const items: CompatibilityItem[] = [];

    // Age compatibility
    if (firstPartyAge != null && secondPartyAge != null) {
      const firstAgePreferenceMatch = isWithinRange(
        secondPartyAge,
        firstParty.profile.preferredAgeMin,
        firstParty.profile.preferredAgeMax
      );

      const secondAgePreferenceMatch = isWithinRange(
        firstPartyAge,
        secondParty.profile.preferredAgeMin,
        secondParty.profile.preferredAgeMax
      );

      const compatible = firstAgePreferenceMatch && secondAgePreferenceMatch;
      items.push({
        criterion: "גיל",
        icon: <User className="w-6 h-6" />,
        compatible,
        reason: compatible ? "התאמה הדדית בציפיות הגיל" : "אי התאמה בציפיות הגיל",
        first: firstPartyAge,
        second: secondPartyAge,
        importance: 'high',
        category: 'basic'
      });
    }

    // Height compatibility
    const firstHeight = firstParty.profile.height;
    const secondHeight = secondParty.profile.height;
    if (firstHeight != null && secondHeight != null) {
      const firstHeightPreferenceMatch = isWithinRange(
        secondHeight,
        firstParty.profile.preferredHeightMin,
        firstParty.profile.preferredHeightMax
      );

      const secondHeightPreferenceMatch = isWithinRange(
        firstHeight,
        secondParty.profile.preferredHeightMin,
        secondParty.profile.preferredHeightMax
      );

      const compatible = firstHeightPreferenceMatch && secondHeightPreferenceMatch;
      items.push({
        criterion: "גובה",
        icon: <TrendingUp className="w-6 h-6" />,
        compatible,
        reason: compatible ? "התאמה הדדית בציפיות הגובה" : "אי התאמה בציפיות הגובה",
        first: `${firstHeight} ס"מ`,
        second: `${secondHeight} ס"מ`,
        importance: 'medium',
        category: 'basic'
      });
    }

    // Location compatibility
    const firstCity = firstParty.profile.city;
    const secondCity = secondParty.profile.city;
    if (firstCity != null && secondCity != null) {
      const firstLocationPreferenceMatch = isInPreferredList(
        secondCity,
        firstParty.profile.preferredLocations
      );

      const secondLocationPreferenceMatch = isInPreferredList(
        firstCity,
        secondParty.profile.preferredLocations
      );

      const compatible = firstLocationPreferenceMatch && secondLocationPreferenceMatch;
      items.push({
        criterion: "מקום מגורים",
        icon: <MapPin className="w-6 h-6" />,
        compatible,
        reason: compatible ? "התאמה הדדית בהעדפות מיקום" : "אי התאמה בהעדפות מיקום",
        first: firstCity,
        second: secondCity,
        importance: 'high',
        category: 'lifestyle'
      });
    }

    // Religious level compatibility
    const firstReligious = firstParty.profile.religiousLevel;
    const secondReligious = secondParty.profile.religiousLevel;
    if (firstReligious != null && secondReligious != null) {
      const firstReligiousPreferenceMatch = isInPreferredList(
        secondReligious,
        firstParty.profile.preferredReligiousLevels
      );

      const secondReligiousPreferenceMatch = isInPreferredList(
        firstReligious,
        secondParty.profile.preferredReligiousLevels
      );

      const compatible = firstReligiousPreferenceMatch && secondReligiousPreferenceMatch;
      items.push({
        criterion: "רמה דתית",
        icon: <Scroll className="w-6 h-6" />,
        compatible,
        reason: compatible ? "התאמה הדדית בהעדפות רמה דתית" : "אי התאמה בהעדפות רמה דתית",
        first: firstReligious,
        second: secondReligious,
        importance: 'high',
        category: 'values'
      });
    }

    // Education compatibility
    const firstEdu = firstParty.profile.education;
    const secondEdu = secondParty.profile.education;
    if (firstEdu != null && secondEdu != null) {
      const firstEducationPreferenceMatch = isInPreferredList(
        secondEdu,
        firstParty.profile.preferredEducation
      );

      const secondEducationPreferenceMatch = isInPreferredList(
        firstEdu,
        secondParty.profile.preferredEducation
      );

      const compatible = firstEducationPreferenceMatch && secondEducationPreferenceMatch;
      items.push({
        criterion: "השכלה",
        icon: <GraduationCap className="w-6 h-6" />,
        compatible,
        reason: compatible ? "התאמה הדדית בהעדפות השכלה" : "אי התאמה בהעדפות השכלה",
        first: firstEdu,
        second: secondEdu,
        importance: 'medium',
        category: 'preferences'
      });
    }

    // Occupation compatibility
    const firstOcc = firstParty.profile.occupation;
    const secondOcc = secondParty.profile.occupation;
    if (firstOcc != null && secondOcc != null) {
      const firstOccupationPreferenceMatch = isInPreferredList(
        secondOcc,
        firstParty.profile.preferredOccupations
      );

      const secondOccupationPreferenceMatch = isInPreferredList(
        firstOcc,
        secondParty.profile.preferredOccupations
      );

      const compatible = firstOccupationPreferenceMatch && secondOccupationPreferenceMatch;
      items.push({
        criterion: "תעסוקה",
        icon: <BookOpen className="w-6 h-6" />,
        compatible,
        reason: compatible ? "התאמה הדדית בהעדפות תעסוקה" : "אי התאמה בהעדפות תעסוקה",
        first: firstOcc,
        second: secondOcc,
        importance: 'medium',
        category: 'lifestyle'
      });
    }

    // Origin compatibility
    const firstOrigin = firstParty.profile.origin;
    const secondOrigin = secondParty.profile.origin;
    if (firstOrigin != null && secondOrigin != null) {
      const sameOrigin = firstOrigin === secondOrigin;
      items.push({
        criterion: "מוצא",
        icon: <Home className="w-6 h-6" />,
        compatible: true,
        reason: sameOrigin ? "מוצא זהה" : "מוצא שונה - מעשיר את הקשר",
        first: firstOrigin,
        second: secondOrigin,
        importance: 'low',
        category: 'values'
      });
    }

    // Language compatibility
    const firstLang = firstParty.profile.nativeLanguage;
    const secondLang = secondParty.profile.nativeLanguage;
    if (firstLang != null && secondLang != null) {
      const nativeMatch = firstLang === secondLang;
      const firstSpeaksSecondNative = firstParty.profile.additionalLanguages?.includes(secondLang) ?? false;
      const secondSpeaksFirstNative = secondParty.profile.additionalLanguages?.includes(firstLang) ?? false;

      const sharedLanguage = nativeMatch || firstSpeaksSecondNative || secondSpeaksFirstNative;

      items.push({
        criterion: "שפה",
        icon: <Languages className="w-6 h-6" />,
        compatible: sharedLanguage,
        reason: sharedLanguage ? "יש שפה משותפת" : "אין שפה משותפת מוכרת",
        first: firstLang,
        second: secondLang,
        importance: 'medium',
        category: 'lifestyle'
      });
    }

    return items;
  };

  const compatibilityItems = calculateCompatibilityItems();
  const compatibleCount = compatibilityItems.filter(item => item.compatible).length;
  const compatibilityScore = compatibilityItems.length > 0 
    ? Math.round((compatibleCount / compatibilityItems.length) * 100) 
    : 0;

  // Group items by category
  const basicItems = compatibilityItems.filter(item => item.category === 'basic');
  const lifestyleItems = compatibilityItems.filter(item => item.category === 'lifestyle');
  const valuesItems = compatibilityItems.filter(item => item.category === 'values');
  const preferencesItems = compatibilityItems.filter(item => item.category === 'preferences');

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-cyan-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "התאמה מעולה";
    if (score >= 60) return "התאמה טובה";
    if (score >= 40) return "התאמה בינונית";
    return "התאמה מאתגרת";
  };

  return (
    <Card className={cn("shadow-xl border-0 overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-cyan-50/80 via-white to-emerald-50/50 border-b border-gray-100">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-gray-800">ניתוח התאמה מפורט</span>
            <p className="text-sm text-gray-600 font-normal mt-1">
              ניתוח מעמיק של נקודות החיבור והאתגרים הפוטנציאליים
            </p>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-8">
        {/* Overall Score */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Star className="w-8 h-8 text-yellow-500 fill-current" />
                <div>
                  <div className={cn("text-4xl font-bold", getScoreColor(compatibilityScore))}>
                    {compatibilityScore}%
                  </div>
                  <div className="text-lg font-semibold text-gray-700">
                    {getScoreDescription(compatibilityScore)}
                  </div>
                </div>
              </div>
              
              <Progress value={compatibilityScore} className="h-3" />
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>{compatibleCount} מתוך {compatibilityItems.length} קריטריונים תואמים</span>
                <span>ציון כללי: {compatibilityScore}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {compatibilityItems.length > 0 ? (
          <div className="space-y-8">
            {/* Basic Info */}
            <CategorySection
              title="מידע בסיסי"
              icon={User}
              items={basicItems}
              color="from-cyan-500 to-blue-500"
              firstParty={firstParty}
              secondParty={secondParty}
            />

            {/* Values */}
            <CategorySection
              title="ערכים והשקפה"
              icon={Heart}
              items={valuesItems}
              color="from-emerald-500 to-green-500"
              firstParty={firstParty}
              secondParty={secondParty}
            />

            {/* Lifestyle */}
            <CategorySection
              title="סגנון חיים"
              icon={Target}
              items={lifestyleItems}
              color="from-blue-500 to-cyan-500"
              firstParty={firstParty}
              secondParty={secondParty}
            />

            {/* Preferences */}
            <CategorySection
              title="העדפות אישיות"
              icon={Star}
              items={preferencesItems}
              color="from-green-500 to-emerald-500"
              firstParty={firstParty}
              secondParty={secondParty}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">אין מספיק נתונים</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              לא נמצא מספיק מידע משותף כדי לבצע ניתוח התאמה מפורט
            </p>
          </div>
        )}

        {/* Matchmaker Rationale */}
        {matchingReason && (
          <Card className="border-0 shadow-lg bg-gradient-to-r from-cyan-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-cyan-800 text-lg mb-2">
                    נימוק השדכן להצעה
                  </h3>
                  <p className="text-cyan-700 leading-relaxed">{matchingReason}</p>
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