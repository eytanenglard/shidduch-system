// src/components/matchmaker/suggestions/utils/matchingAlgorithm.ts

import { AvailabilityStatus } from '@prisma/client';
import type { UserProfile } from '@/types/next-auth';

export interface MatchScore {
  score: number;
  criteria: MatchCriteria[];
  compatibility: number;
  reasons: string[]; // This will now contain keys, e.g., "age.reasons.ideal"
}

export interface MatchCriteria {
  name: string;
  weight: number;
  score: number;
  reason?: string; // This will also be a key
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

  const aPrefsMatch = preferences.ageA ? 
    (ageB >= preferences.ageA.min && ageB <= preferences.ageA.max) : true;
  const bPrefsMatch = preferences.ageB ?
    (ageA >= preferences.ageB.min && ageA <= preferences.ageB.max) : true;

  if (aPrefsMatch && bPrefsMatch) {
    if (ageDiff <= 2) {
      score = 1;
      reason = 'age.reasons.ideal';
    } else if (ageDiff <= 5) {
      score = 0.8;
      reason = 'age.reasons.good';
    } else if (ageDiff <= 8) {
      score = 0.6;
      reason = 'age.reasons.fair';
    } else {
      score = 0.4;
      reason = 'age.reasons.large';
    }
  } else {
    score = 0.2;
    reason = 'age.reasons.preferenceMismatch';
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
      reason: 'location.reasons.noData'
    };
  }

  const sameCity = profileA.city === profileB.city;
  const preferredLocationsA = profileA.preferredLocations || [];
  const preferredLocationsB = profileB.preferredLocations || [];

  if (sameCity) {
    score = 1;
    reason = 'location.reasons.sameCity';
  } else if (
    preferredLocationsA.includes(profileB.city) &&
    preferredLocationsB.includes(profileA.city)
  ) {
    score = 0.8;
    reason = 'location.reasons.mutualPreference';
  } else if (
    preferredLocationsA.includes(profileB.city) ||
    preferredLocationsB.includes(profileA.city)
  ) {
    score = 0.6;
    reason = 'location.reasons.oneWayPreference';
  } else {
    score = 0.4;
    reason = 'location.reasons.differentCities';
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
      reason: 'religious.reasons.noData'
    };
  }

  const sameLevel = profileA.religiousLevel === profileB.religiousLevel;
  const preferredLevelsA = profileA.preferredReligiousLevels || [];
  const preferredLevelsB = profileB.preferredReligiousLevels || [];

  if (sameLevel) {
    score = 1;
    reason = 'religious.reasons.sameLevel';
  } else if (
    preferredLevelsA.includes(profileB.religiousLevel) &&
    preferredLevelsB.includes(profileA.religiousLevel)
  ) {
    score = 0.8;
    reason = 'religious.reasons.mutualPreference';
  } else if (
    preferredLevelsA.includes(profileB.religiousLevel) ||
    preferredLevelsB.includes(profileA.religiousLevel)
  ) {
    score = 0.6;
    reason = 'religious.reasons.oneWayPreference';
  } else {
    score = 0.3;
    reason = 'religious.reasons.differentLevels';
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
  if (
    profileA.gender === profileB.gender ||
    profileA.availabilityStatus !== AvailabilityStatus.AVAILABLE ||
    profileB.availabilityStatus !== AvailabilityStatus.AVAILABLE
  ) {
    return null;
  }

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

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = criteria.reduce((sum, c) => sum + (c.score * c.weight), 0);
  const finalScore = (weightedScore / totalWeight) * 100;

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