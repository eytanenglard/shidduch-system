import { AvailabilityStatus } from '@prisma/client';
import type { UserProfile } from '@/types/next-auth';

export interface MatchScore {
  score: number;
  criteria: MatchCriteria[];
  compatibility: number;
  reasons: string[];
}

export interface MatchCriteria {
  name: string;
  weight: number;
  score: number;
  reason?: string;
}

interface AgePreference {
  min: number;
  max: number;
}

const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const calculateAgeCompatibility = (
  profileA: UserProfile,
  profileB: UserProfile,
  preferences: { ageA?: AgePreference; ageB?: AgePreference }
): MatchCriteria => {
  const ageA = calculateAge(profileA.birthDate);
  const ageB = calculateAge(profileB.birthDate);
  const ageDiff = Math.abs(ageA - ageB);
  
  let score = 0;
  let reason = '';

  // בדיקת העדפות גיל הדדית
  const aPrefsMatch = preferences.ageA ? 
    (ageB >= preferences.ageA.min && ageB <= preferences.ageA.max) : true;
  const bPrefsMatch = preferences.ageB ?
    (ageA >= preferences.ageB.min && ageA <= preferences.ageB.max) : true;

  if (aPrefsMatch && bPrefsMatch) {
    if (ageDiff <= 2) {
      score = 1;
      reason = 'הפרש גילאים אידיאלי';
    } else if (ageDiff <= 5) {
      score = 0.8;
      reason = 'הפרש גילאים טוב';
    } else if (ageDiff <= 8) {
      score = 0.6;
      reason = 'הפרש גילאים סביר';
    } else {
      score = 0.4;
      reason = 'הפרש גילאים גדול';
    }
  } else {
    score = 0.2;
    reason = 'לא תואם להעדפות הגיל';
  }

  return {
    name: 'age',
    weight: 15,
    score,
    reason
  };
};

const calculateLocationCompatibility = (
  profileA: UserProfile,
  profileB: UserProfile
): MatchCriteria => {
  let score = 0;
  let reason = '';

  if (!profileA.city || !profileB.city) {
    return {
      name: 'location',
      weight: 10,
      score: 0.5,
      reason: 'חסר מידע על מיקום'
    };
  }

  const sameCity = profileA.city === profileB.city;
  const preferredLocationsA = profileA.preferredLocations || [];
  const preferredLocationsB = profileB.preferredLocations || [];

  if (sameCity) {
    score = 1;
    reason = 'גרים באותה עיר';
  } else if (
    preferredLocationsA.includes(profileB.city) &&
    preferredLocationsB.includes(profileA.city)
  ) {
    score = 0.8;
    reason = 'מיקום מועדף הדדי';
  } else if (
    preferredLocationsA.includes(profileB.city) ||
    preferredLocationsB.includes(profileA.city)
  ) {
    score = 0.6;
    reason = 'מיקום מועדף חד צדדי';
  } else {
    score = 0.4;
    reason = 'ערים שונות';
  }

  return {
    name: 'location',
    weight: 10,
    score,
    reason
  };
};

const calculateReligiousCompatibility = (
  profileA: UserProfile,
  profileB: UserProfile
): MatchCriteria => {
  let score = 0;
  let reason = '';

  if (!profileA.religiousLevel || !profileB.religiousLevel) {
    return {
      name: 'religious',
      weight: 20,
      score: 0.5,
      reason: 'חסר מידע על רמת דתיות'
    };
  }

  const sameLevel = profileA.religiousLevel === profileB.religiousLevel;
  const preferredLevelsA = profileA.preferredReligiousLevels || [];
  const preferredLevelsB = profileB.preferredReligiousLevels || [];

  if (sameLevel) {
    score = 1;
    reason = 'רמת דתיות זהה';
  } else if (
    preferredLevelsA.includes(profileB.religiousLevel) &&
    preferredLevelsB.includes(profileA.religiousLevel)
  ) {
    score = 0.8;
    reason = 'רמת דתיות מועדפת הדדית';
  } else if (
    preferredLevelsA.includes(profileB.religiousLevel) ||
    preferredLevelsB.includes(profileA.religiousLevel)
  ) {
    score = 0.6;
    reason = 'רמת דתיות מועדפת חד צדדית';
  } else {
    score = 0.3;
    reason = 'רמות דתיות שונות';
  }

  return {
    name: 'religious',
    weight: 20,
    score,
    reason
  };
};

export const calculateMatchScore = (
  profileA: UserProfile,
  profileB: UserProfile
): MatchScore | null => {
  // בדיקת תנאי סף
  if (
    profileA.gender === profileB.gender ||
    profileA.availabilityStatus !== AvailabilityStatus.AVAILABLE ||
    profileB.availabilityStatus !== AvailabilityStatus.AVAILABLE
  ) {
    return null;
  }

  // חישוב קריטריונים
  const ageCriteria = calculateAgeCompatibility(
    profileA,
    profileB,
    {
      ageA: profileA.preferredAgeMin && profileA.preferredAgeMax
        ? { min: profileA.preferredAgeMin, max: profileA.preferredAgeMax }
        : undefined,
      ageB: profileB.preferredAgeMin && profileB.preferredAgeMax
        ? { min: profileB.preferredAgeMin, max: profileB.preferredAgeMax }
        : undefined
    }
  );

  const locationCriteria = calculateLocationCompatibility(profileA, profileB);
  const religiousCriteria = calculateReligiousCompatibility(profileA, profileB);

  const criteria = [
    ageCriteria,
    locationCriteria,
    religiousCriteria
  ];

  // חישוב ציון סופי
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = criteria.reduce((sum, c) => sum + (c.score * c.weight), 0);
  const finalScore = (weightedScore / totalWeight) * 100;

  // סיבות להתאמה
  const reasons = criteria
    .filter(c => c.score >= 0.6)
    .map(c => c.reason)
    .filter((reason): reason is string => reason !== undefined);

  return {
    score: Math.round(finalScore),
    criteria,
    compatibility: finalScore / 100,
    reasons
  };
};

export const findBestMatches = (
  profile: UserProfile,
  profiles: UserProfile[],
  limit: number = 10
): { profile: UserProfile; score: MatchScore }[] => {
  const matches = profiles
    .filter(p => p.id !== profile.id)
    .map(p => {
      const score = calculateMatchScore(profile, p);
      return score ? { profile: p, score } : null;
    })
    .filter((match): match is { profile: UserProfile; score: MatchScore } => match !== null)
    .sort((a, b) => b.score.score - a.score.score);

  return matches.slice(0, limit);
};

export default {
  calculateMatchScore,
  findBestMatches
};