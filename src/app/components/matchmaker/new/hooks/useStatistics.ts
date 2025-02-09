// /hooks/useStatistics.ts

import { useMemo } from 'react';
import type { Candidate } from '../types/candidates';
import {
  calculateAgeDistribution,
  calculateLocationDistribution,
  calculateReligiousDistribution,
  calculateActivityStats,
  calculateGenderStats,
  calculateAvailabilityStats,
  calculateCompletionStats
} from '../utils/statisticsCalculator';

export interface Statistics {
  gender: {
    maleCount: number;
    femaleCount: number;
    ratio: number;
    total: number;
    percentages: {
      male: number;
      female: number;
    };
  };
  age: {
    ageGroups: Record<string, number>;
    averageAge: number;
    medianAge: number;
  };
  location: {
    cities: Record<string, number>;
    topCities: Array<{ city: string; count: number }>;
  };
  religious: {
    levels: Record<string, number>;
    percentages: Record<string, number>;
  };
  activity: {
    activeLastWeek: number;
    activeLastMonth: number;
    averageLoginFrequency: number;
    completedProfiles: number;
  };
  availability: {
    counts: Record<string, number>;
    percentages: Record<string, number>;
  };
  completion: {
    counts: {
      hasPhotos: number;
      hasAbout: number;
      hasReferences: number;
      hasPreferences: number;
      isVerified: number;
      fullyCompleted: number;
    };
    percentages: {
      hasPhotos: number;
      hasAbout: number;
      hasReferences: number;
      hasPreferences: number;
      isVerified: number;
      fullyCompleted: number;
    };
  };
}

export const useStatistics = (candidates: Candidate[]) => {
  const stats = useMemo<Statistics>(() => {
    return {
      gender: calculateGenderStats(candidates),
      age: calculateAgeDistribution(candidates),
      location: calculateLocationDistribution(candidates),
      religious: calculateReligiousDistribution(candidates),
      activity: calculateActivityStats(candidates),
      availability: calculateAvailabilityStats(candidates),
      completion: calculateCompletionStats(candidates)
    };
  }, [candidates]);

  // פונקציות עזר לשליפת נתונים ספציפיים
  const getGenderRatio = () => {
    return {
      ratio: stats.gender.ratio,
      formattedRatio: `${stats.gender.maleCount}:${stats.gender.femaleCount}`
    };
  };

  const getTopCities = (limit: number = 5) => {
    return stats.location.topCities.slice(0, limit);
  };

  const getActiveUsersPercent = () => {
    return Math.round((stats.activity.activeLastWeek / stats.gender.total) * 100);
  };

  const getCompletionRate = () => {
    return stats.completion.percentages.fullyCompleted;
  };

  const getAgeGroupDistribution = () => {
    return Object.entries(stats.age.ageGroups)
      .map(([range, count]) => ({
        range,
        count,
        percentage: Math.round((count / stats.gender.total) * 100)
      }))
      .sort((a, b) => {
        const [aMin] = a.range.split('-').map(Number);
        const [bMin] = b.range.split('-').map(Number);
        return aMin - bMin;
      });
  };

  const getReligiousDistribution = () => {
    return Object.entries(stats.religious.levels)
      .map(([level, count]) => ({
        level,
        count,
        percentage: stats.religious.percentages[level]
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getActivityTrend = () => {
    return {
      weekly: stats.activity.activeLastWeek,
      monthly: stats.activity.activeLastMonth,
      average: stats.activity.averageLoginFrequency
    };
  };

  const getProfileCompletionStats = () => {
    return {
      completed: stats.completion.counts.fullyCompleted,
      partial: stats.gender.total - stats.completion.counts.fullyCompleted,
      percentage: stats.completion.percentages.fullyCompleted
    };
  };

  return {
    stats,
    getGenderRatio,
    getTopCities,
    getActiveUsersPercent,
    getCompletionRate,
    getAgeGroupDistribution,
    getReligiousDistribution,
    getActivityTrend,
    getProfileCompletionStats
  };
};

export default useStatistics;