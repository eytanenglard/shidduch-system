// /utils/statisticsCalculator.ts
import type { Candidate } from '../types/candidates';
import { Gender, AvailabilityStatus } from '@prisma/client';


export interface AgeDistribution {
  ageGroups: Record<string, number>;
  averageAge: number;
  medianAge: number;
}

export interface LocationDistribution {
  cities: Record<string, number>;
  topCities: Array<{ city: string; count: number }>;
}

export interface ReligiousDistribution {
  levels: Record<string, number>;
  percentages: Record<string, number>;
}

export interface ActivityStats {
  activeLastWeek: number;
  activeLastMonth: number;
  averageLoginFrequency: number;
  completedProfiles: number;
}

export interface MatchingStats {
  totalMatches: number;
  successfulMatches: number;
  averageMatchScore: number;
  matchesByStatus: Record<string, number>;
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

export const calculateAgeDistribution = (candidates: Candidate[]): AgeDistribution => {
  const ages = candidates.map(c => calculateAge(c.profile.birthDate));
  
  // חישוב קבוצות גיל
  const ageGroups = ages.reduce((acc, age) => {
    const group = `${Math.floor(age / 5) * 5}-${Math.floor(age / 5) * 5 + 4}`;
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // חישוב ממוצע
  const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;

  // חישוב חציון
  const sortedAges = [...ages].sort((a, b) => a - b);
  const medianAge = sortedAges.length % 2 === 0
    ? (sortedAges[sortedAges.length / 2 - 1] + sortedAges[sortedAges.length / 2]) / 2
    : sortedAges[Math.floor(sortedAges.length / 2)];

  return {
    ageGroups,
    averageAge: Math.round(averageAge * 10) / 10,
    medianAge
  };
};

export const calculateLocationDistribution = (
  candidates: Candidate[],
  topCount: number = 10
): LocationDistribution => {
  // ספירת מועמדים לפי ערים
  const cities = candidates.reduce((acc, candidate) => {
    const city = candidate.profile.city || 'לא צוין';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // מיון הערים לפי כמות מועמדים
  const topCities = Object.entries(cities)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topCount);

  return {
    cities,
    topCities
  };
};

export const calculateReligiousDistribution = (candidates: Candidate[]): ReligiousDistribution => {
  const total = candidates.length;
  
  // ספירת מועמדים לפי רמת דתיות
  const levels = candidates.reduce((acc, candidate) => {
    const level = candidate.profile.religiousLevel || 'לא צוין';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // חישוב אחוזים
  const percentages = Object.entries(levels).reduce((acc, [level, count]) => {
    acc[level] = Math.round((count / total) * 100);
    return acc;
  }, {} as Record<string, number>);

  return {
    levels,
    percentages
  };
};

export const calculateActivityStats = (candidates: Candidate[]): ActivityStats => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const activeLastWeek = candidates.filter(c => 
    c.profile.lastActive && new Date(c.profile.lastActive) >= weekAgo
  ).length;

  const activeLastMonth = candidates.filter(c =>
    c.profile.lastActive && new Date(c.profile.lastActive) >= monthAgo
  ).length;

  // חישוב תדירות התחברות ממוצעת (בימים)
  const loginGaps = candidates
    .filter(c => c.profile.lastActive)
    .map(c => {
      const lastActive = new Date(c.profile.lastActive!);
      return Math.floor((now.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000));
    });

  const averageLoginFrequency = loginGaps.length > 0
    ? loginGaps.reduce((sum, gap) => sum + gap, 0) / loginGaps.length
    : 0;

  // ספירת פרופילים מלאים
  const completedProfiles = candidates.filter(c => 
    c.profile.about &&
    c.profile.religiousLevel &&
    c.profile.city &&
    c.images.length > 0
  ).length;

  return {
    activeLastWeek,
    activeLastMonth,
    averageLoginFrequency: Math.round(averageLoginFrequency * 10) / 10,
    completedProfiles
  };
};

export const calculateGenderStats = (candidates: Candidate[]) => {
  const maleCount = candidates.filter(c => c.profile.gender === Gender.MALE).length;
  const femaleCount = candidates.filter(c => c.profile.gender === Gender.FEMALE).length;
  
  return {
    maleCount,
    femaleCount,
    ratio: maleCount / femaleCount,
    total: candidates.length,
    percentages: {
      male: Math.round((maleCount / candidates.length) * 100),
      female: Math.round((femaleCount / candidates.length) * 100)
    }
  };
};

export const calculateAvailabilityStats = (candidates: Candidate[]) => {
  const total = candidates.length;
  const statusCounts = candidates.reduce((acc, candidate) => {
    const status = candidate.profile.availabilityStatus;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<AvailabilityStatus, number>);

  return {
    counts: statusCounts,
    percentages: Object.entries(statusCounts).reduce((acc, [status, count]) => {
      acc[status] = Math.round((count / total) * 100);
      return acc;
    }, {} as Record<string, number>)
  };
};

export const calculateCompletionStats = (candidates: Candidate[]) => {
  const total = candidates.length;
  const  stats = {
    hasPhotos: 0,
    hasAbout: 0,
    hasReferences: 0,
    hasPreferences: 0,
    isVerified: 0,
    fullyCompleted: 0
  };

  candidates.forEach(candidate => {
    if (candidate.images.length > 0) stats.hasPhotos++;
    if (candidate.profile.about) stats.hasAbout++;
    if (candidate.profile.referenceName1 || candidate.profile.referenceName2) stats.hasReferences++;
    if (candidate.profile.preferredAgeMin && candidate.profile.preferredAgeMax) stats.hasPreferences++;
    if (candidate.isVerified) stats.isVerified++;
    
    // בדיקת פרופיל מלא
    if (
      candidate.images.length > 0 &&
      candidate.profile.about &&
      candidate.profile.religiousLevel &&
      candidate.profile.city &&
      (candidate.profile.referenceName1 || candidate.profile.referenceName2) &&
      candidate.profile.preferredAgeMin &&
      candidate.profile.preferredAgeMax
    ) {
      stats.fullyCompleted++;
    }
  });

  return {
    counts: stats,
    percentages: {
      hasPhotos: Math.round((stats.hasPhotos / total) * 100),
      hasAbout: Math.round((stats.hasAbout / total) * 100),
      hasReferences: Math.round((stats.hasReferences / total) * 100),
      hasPreferences: Math.round((stats.hasPreferences / total) * 100),
      isVerified: Math.round((stats.isVerified / total) * 100),
      fullyCompleted: Math.round((stats.fullyCompleted / total) * 100)
    }
  };
};

const statisticsCalculator = {
  calculateAgeDistribution,
  calculateLocationDistribution,
  calculateReligiousDistribution,
  calculateActivityStats,
  calculateGenderStats,
  calculateAvailabilityStats,
  calculateCompletionStats
};

export default statisticsCalculator;