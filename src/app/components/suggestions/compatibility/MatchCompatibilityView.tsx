// Full path: src/app/components/suggestions/compatibility/MatchCompatibilityView.tsx

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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  birthDate?: Date | string | null;
  age?: number;
  height?: number | null;
  preferredHeightMin?: number | null;
  preferredHeightMax?: number | null;
  city?: string | null;
  preferredLocations?: string[] | null;
  religiousLevel?: string | null;
  preferredReligiousLevels?: string[] | null;
  origin?: string | null;
  education?: string | null;
  preferredEducation?: string[] | null;
  occupation?: string | null;
  preferredOccupations?: string[] | null;
  preferredAgeMin?: number | null;
  preferredAgeMax?: number | null;
  nativeLanguage?: string | null;
  additionalLanguages?: string[] | null;
}

interface Party {
  firstName: string;
  profile: ProfileData;
}

interface MatchCompatibilityProps {
  firstParty: Party;
  secondParty: Party;
  matchingReason?: string | null;
  className?: string;
}

interface CompatibilityItem {
  criterion: string;
  icon: React.ReactNode;
  compatible: boolean;
  reason: string;
  first?: string | number | null;
  second?: string | number | null;
}


const calculateAge = (birthDate?: Date | string | null): number | null => {
  if (!birthDate) return null;

  try {
    const today = new Date();
    const birth = new Date(birthDate);
    // Basic validation if Date constructor returns invalid date
    if (isNaN(birth.getTime())) return null;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    // Ensure age is not negative if birthDate is in the future
    return age >= 0 ? age : null;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
};

const MatchCompatibilityView: React.FC<MatchCompatibilityProps> = ({
  firstParty,
  secondParty,
  matchingReason,
  className,
}) => {
  // Calculate ages if not provided
  const firstPartyAge =
    firstParty.profile.age ?? calculateAge(firstParty.profile.birthDate);
  const secondPartyAge =
    secondParty.profile.age ?? calculateAge(secondParty.profile.birthDate);

  // Helper to check if a value is within the preferred range (handles null/undefined)
  const isWithinRange = (value: number | null | undefined, min: number | null | undefined, max: number | null | undefined): boolean => {
    if (value == null) return false; // Cannot check compatibility if the value itself is missing
    const minOk = min == null || value >= min;
    const maxOk = max == null || value <= max;
    return minOk && maxOk;
  }

  // Helper to check if a value exists in preferred list (handles null/undefined/empty list)
  const isInPreferredList = (value: string | null | undefined, preferredList: string[] | null | undefined): boolean => {
    if (value == null) return false; // Cannot check compatibility if the value itself is missing
    // If no preferences are set (list is null, undefined, or empty), consider it compatible
    if (preferredList == null || preferredList.length === 0) {
      return true;
    }
    return preferredList.includes(value);
  }


  // Calculate compatibility score
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
        icon: <User className="h-5 w-5" />,
        compatible: compatible,
        reason: compatible
          ? "התאמה הדדית בציפיות הגיל"
          : "אי התאמה בציפיות הגיל",
        first: firstPartyAge,
        second: secondPartyAge,
      });
    }

    // Height compatibility
    const firstHeight = firstParty.profile.height;
    const secondHeight = secondParty.profile.height;
    // Only check if both heights are present
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
        icon: <User className="h-5 w-5" />, // Consider a different icon? Maybe ArrowsUpDown?
        compatible: compatible,
        reason: compatible
          ? "התאמה הדדית בציפיות הגובה"
          : "אי התאמה בציפיות הגובה",
        first: `${firstHeight} ס"מ`,
        second: `${secondHeight} ס"מ`,
      });
    }

    // Location compatibility
    const firstCity = firstParty.profile.city;
    const secondCity = secondParty.profile.city;
    // Only check if both cities are present
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
            icon: <MapPin className="h-5 w-5" />,
            compatible: compatible,
            reason: compatible
              ? "התאמה הדדית בהעדפות מיקום"
              : "אי התאמה בהעדפות מיקום",
            first: firstCity,
            second: secondCity,
        });
    }


    // Religious level compatibility
    const firstReligious = firstParty.profile.religiousLevel;
    const secondReligious = secondParty.profile.religiousLevel;
    // Only check if both levels are present
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
        icon: <Scroll className="h-5 w-5" />,
        compatible: compatible,
        reason: compatible
          ? "התאמה הדדית בהעדפות רמה דתית"
          : "אי התאמה בהעדפות רמה דתית",
        first: firstReligious,
        second: secondReligious,
      });
    }

    // Origin compatibility (informational, always 'compatible' in this logic)
    const firstOrigin = firstParty.profile.origin;
    const secondOrigin = secondParty.profile.origin;
    if (firstOrigin != null && secondOrigin != null) {
      const sameOrigin = firstOrigin === secondOrigin;
      items.push({
        criterion: "מוצא",
        icon: <Home className="h-5 w-5" />,
        compatible: true, // Not marking as incompatible, just informational based on sameness
        reason: sameOrigin ? "מוצא זהה" : "מוצא שונה",
        first: firstOrigin,
        second: secondOrigin,
      });
    }

    // Education compatibility
    const firstEdu = firstParty.profile.education;
    const secondEdu = secondParty.profile.education;
    // Only check if both education levels are present
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
        icon: <GraduationCap className="h-5 w-5" />,
        compatible: compatible,
        reason: compatible
          ? "התאמה הדדית בהעדפות השכלה"
          : "אי התאמה בהעדפות השכלה",
        first: firstEdu,
        second: secondEdu,
      });
    }

    // Occupation compatibility
    const firstOcc = firstParty.profile.occupation;
    const secondOcc = secondParty.profile.occupation;
    // Only check if both occupations are present
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
        icon: <BookOpen className="h-5 w-5" />,
        compatible: compatible,
        reason: compatible
          ? "התאמה הדדית בהעדפות תעסוקה"
          : "אי התאמה בהעדפות תעסוקה",
        first: firstOcc,
        second: secondOcc,
      });
    }

    // Language compatibility
    const firstLang = firstParty.profile.nativeLanguage;
    const secondLang = secondParty.profile.nativeLanguage;
    // Only check if both native languages are present
    if (firstLang != null && secondLang != null) {
        // Check if native languages match OR if one speaks the other's native language as additional
        const nativeMatch = firstLang === secondLang;
        const firstSpeaksSecondNative = firstParty.profile.additionalLanguages?.includes(secondLang) ?? false;
        const secondSpeaksFirstNative = secondParty.profile.additionalLanguages?.includes(firstLang) ?? false;

        const sharedLanguage = nativeMatch || firstSpeaksSecondNative || secondSpeaksFirstNative;

        items.push({
            criterion: "שפה",
            icon: <Languages className="h-5 w-5" />,
            compatible: sharedLanguage, // This is inherently boolean
            reason: sharedLanguage ? "יש שפה משותפת" : "אין שפה משותפת מוכרת",
            first: firstLang,
            second: secondLang,
        });
    }


    return items;
  };

  const compatibilityItems = calculateCompatibilityItems();
  const compatibleCount = compatibilityItems.filter(
    (item) => item.compatible
  ).length;
  // Avoid division by zero if no items could be calculated
  const compatibilityScore =
    compatibilityItems.length > 0
      ? Math.round((compatibleCount / compatibilityItems.length) * 100)
      : 0;

  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          ניתוח התאמה
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mb-6">
          <div className="flex justify-between mb-2 text-sm">
            <span className="font-medium">{compatibilityScore}% התאמה</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">
                {compatibleCount} מתוך {compatibilityItems.length} קריטריונים
                תואמים
              </span>
            </div>
          </div>
          <Progress value={compatibilityScore} className="h-2" />
        </div>

        {compatibilityItems.length > 0 ? (
          <div className="grid gap-4">
            {compatibilityItems.map((item, index) => (
              <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0"> {/* Improved styling for last item */}
                <div className="flex justify-between items-start mb-2 gap-2"> {/* Added gap */}
                  <div className="flex items-center gap-1 flex-shrink-0"> {/* Prevent shrinking */}
                    {item.compatible ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant="outline" className="gap-1 text-xs sm:text-sm whitespace-nowrap"> {/* Adjusted text size and nowrap */}
                      {item.icon}
                      <span>{item.criterion}</span>
                    </Badge>
                  </div>
                  <div className="text-sm text-right flex-grow"> {/* Allow reason to take space */}
                    <p
                      className={cn(
                        "font-medium", // Make reason slightly bolder
                        item.compatible ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {item.reason}
                    </p>
                  </div>
                </div>

                {/* Show details only if they exist */}
                {(item.first != null || item.second != null) && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-left truncate"> {/* Added truncate */}
                      <span className="text-gray-500">
                        {firstParty.firstName}:{" "}
                      </span>
                      <span className="font-medium">{item.first ?? "לא צוין"}</span> {/* Handle null/undefined */}
                    </div>
                    <div className="text-right truncate"> {/* Added truncate */}
                      <span className="text-gray-500">
                        {secondParty.firstName}:{" "}
                      </span>
                      <span className="font-medium">{item.second ?? "לא צוין"}</span> {/* Handle null/undefined */}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
            <p className="text-sm text-gray-500 text-center">אין מספיק נתונים לחישוב התאמה.</p>
        )}


        {matchingReason && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200"> {/* Added border */}
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-blue-800">סיבת ההצעה מהשדכן</h3> {/* Enhanced styling */}
            </div>
            <p className="text-sm text-gray-800 text-right">{matchingReason}</p> {/* Adjusted text size/color */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MatchCompatibilityView;