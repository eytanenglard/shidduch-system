// src/components/matchmaker/suggestions/NewSuggestionForm/MatchPreview.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Heart,
  Star,
  Sparkles,
  TrendingUp,
  Award,
  Crown,
  Gem,
  Zap,
  Target,
  Trophy,
  Gift,
} from 'lucide-react';
import { calculateMatchScore } from '../utils/matchingAlgorithm';
import type { Candidate } from '../../new/types/candidates';
import type { MatchScore } from '../utils/matchingAlgorithm';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionary';

interface MatchPreviewProps {
  dict: MatchmakerPageDictionary['suggestionsDashboard']['newSuggestionForm']['matchPreview'];
  firstParty: Candidate;
  secondParty: Candidate;
  className?: string;
}

/**
 * Helper function to dynamically access nested dictionary properties using a dot-notation key.
 * @param dict - The dictionary object to search within.
 * @param key - The dot-separated key (e.g., "age.reasons.ideal").
 * @returns The translated string or the key itself as a fallback.
 */
const getTranslatedReason = (dict: any, key: string): string => {
  try {
    const keys = key.split('.');
    let result = dict;
    for (const k of keys) {
      if (result[k] === undefined) {
        // If any part of the path is missing, return the original key
        return key;
      }
      result = result[k];
    }
    return typeof result === 'string' ? result : key;
  } catch (error) {
    console.warn(`Translation key not found: ${key}`, error);
    return key; // Fallback to the key itself if an error occurs
  }
};

const MatchCriteriaCard: React.FC<{
  dict: MatchmakerPageDictionary['suggestionsDashboard']['newSuggestionForm']['matchPreview'];
  criterion: {
    name: string;
    score: number;
    reason?: string;
  };
  index: number;
}> = ({ dict, criterion, index }) => {
  const getCriterionInfo = (name: string) => {
    switch (name) {
      case 'age':
        return {
          icon: Target,
          label: dict.criteria.age,
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'from-blue-50 to-cyan-50',
        };
      case 'location':
        return {
          icon: Crown,
          label: dict.criteria.location,
          color: 'from-green-500 to-emerald-500',
          bgColor: 'from-green-50 to-emerald-50',
        };
      case 'religious':
        return {
          icon: Sparkles,
          label: dict.criteria.religious,
          color: 'from-purple-500 to-pink-500',
          bgColor: 'from-purple-50 to-pink-50',
        };
      default:
        return {
          icon: Star,
          label: name,
          color: 'from-gray-500 to-slate-500',
          bgColor: 'from-gray-50 to-slate-50',
        };
    }
  };

  const info = getCriterionInfo(criterion.name);
  const IconComponent = info.icon;
  const scorePercentage = Math.round(criterion.score * 100);
  const translatedReason = criterion.reason
    ? getTranslatedReason(dict.criteria, criterion.reason)
    : '';

  const getScoreCategory = (score: number) => {
    if (score >= 0.9)
      return {
        label: dict.scoreCategories.perfect,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100',
      };
    if (score >= 0.8)
      return {
        label: dict.scoreCategories.excellent,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      };
    if (score >= 0.7)
      return {
        label: dict.scoreCategories.good,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      };
    if (score >= 0.5)
      return {
        label: dict.scoreCategories.medium,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
      };
    return {
      label: dict.scoreCategories.low,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    };
  };

  const scoreCategory = getScoreCategory(criterion.score);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl transition-all duration-500 group hover:scale-105',
        'bg-gradient-to-br',
        info.bgColor,
        'border border-white/50 shadow-lg hover:shadow-2xl'
      )}
      style={{
        animationDelay: `${index * 150}ms`,
        animationFillMode: 'both',
      }}
    >
   <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      </div>
      <div className="relative z-10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform bg-gradient-to-r text-white',
                info.color
              )}
            >
              <IconComponent className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-gray-800">{info.label}</h4>
          </div>
          <Badge
            className={cn(
              'px-3 py-1 font-bold shadow-lg',
              scoreCategory.bgColor,
              scoreCategory.color
            )}
          >
            {scoreCategory.label}
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">
              {dict.scoreLabel}
            </span>
            <span className="text-2xl font-bold text-gray-800">
              {scorePercentage}%
            </span>
          </div>
          <div className="relative">
            <Progress
              value={scorePercentage}
              className="h-3 bg-white/50 shadow-inner"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
        {translatedReason && (
          <div className="p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50 shadow-inner">
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              {translatedReason}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const MatchPreview: React.FC<MatchPreviewProps> = ({
  dict,
  firstParty,
  secondParty,
  className,
}) => {
  const matchScore: MatchScore | null = calculateMatchScore(
    firstParty.profile,
    secondParty.profile
  );

  if (!matchScore) {
    return (
      <Card
        className={cn(
          'border-0 shadow-xl rounded-3xl overflow-hidden',
          className
        )}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center mx-auto shadow-xl">
              <AlertCircle className="w-12 h-12 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {dict.errorState.title}
              </h3>
              <p className="text-gray-600">{dict.errorState.description}</p>
            </div>
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">
                {dict.errorState.suggestion}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getMatchQuality = (score: number) => {
    const qualityMap = {
      perfect: {
        icon: Crown,
        bgGradient: 'from-purple-500 to-pink-500',
        bgColor: 'from-purple-50 to-pink-50',
        animation: 'animate-pulse',
      },
      excellent: {
        icon: Gem,
        bgGradient: 'from-emerald-500 to-green-500',
        bgColor: 'from-emerald-50 to-green-50',
        animation: '',
      },
      good: {
        icon: Trophy,
        bgGradient: 'from-blue-500 to-cyan-500',
        bgColor: 'from-blue-50 to-cyan-50',
        animation: '',
      },
      medium: {
        icon: Star,
        bgGradient: 'from-yellow-500 to-amber-500',
        bgColor: 'from-yellow-50 to-amber-50',
        animation: '',
      },
      low: {
        icon: AlertCircle,
        bgGradient: 'from-red-500 to-pink-500',
        bgColor: 'from-red-50 to-pink-50',
        animation: '',
      },
    };

    if (score >= 95)
      return { ...dict.qualityLevels.perfect, ...qualityMap.perfect };
    if (score >= 85)
      return { ...dict.qualityLevels.excellent, ...qualityMap.excellent };
    if (score >= 75) return { ...dict.qualityLevels.good, ...qualityMap.good };
    if (score >= 60)
      return { ...dict.qualityLevels.medium, ...qualityMap.medium };
    return { ...dict.qualityLevels.low, ...qualityMap.low };
  };

  const quality = getMatchQuality(matchScore.score);
  const Icon = quality.icon;

  return (
    <Card
      className={cn(
        'border-0 shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-3xl',
        'bg-gradient-to-br',
        quality.bgColor,
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div
          className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl animate-float"
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-3xl animate-float"
          style={{ animationDelay: '4s' }}
        ></div>
      </div>
      <CardContent className="relative z-10 p-8 space-y-8">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center">
            <div
              className={cn(
                'p-6 rounded-full shadow-2xl bg-gradient-to-r text-white transform hover:scale-110 transition-transform duration-300',
                quality.bgGradient,
                quality.animation
              )}
            >
              <Icon className="w-12 h-12" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-800">{quality.text}</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {quality.description}
            </p>
          </div>
          <div className="relative">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  {Math.round(matchScore.score)}%
                </div>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  {dict.generalScoreLabel}
                </p>
              </div>
            </div>
            <div className="relative w-32 h-32 mx-auto">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - matchScore.score / 100)}`}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="50%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
              <TrendingUp className="w-6 h-6 text-purple-500" />
              {dict.criteriaSection.title}
            </h3>
            <p className="text-gray-600">{dict.criteriaSection.description}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {matchScore.criteria.map((criterion, index) => (
              <div key={criterion.name} className="animate-fade-in-up">
                <MatchCriteriaCard
                  dict={dict}
                  criterion={criterion}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
        {matchScore.reasons.length > 0 && (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="text-xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
                <Heart className="w-5 h-5 text-red-500" />
                {dict.reasonsSection.title}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchScore.reasons.map((reasonKey, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  style={{
                    animationDelay: `${(index + 3) * 150}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Gift className="w-4 h-4" />
                  </div>
                  <p className="text-gray-700 leading-relaxed font-medium flex-1">
                    {getTranslatedReason(dict.criteria, reasonKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white/50 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-800">
                  {dict.summary.title}
                </h4>
                <p className="text-gray-600">{dict.summary.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                {matchScore.score >= 80 ? (
                  <>
                    <Zap className="w-5 h-5 text-green-500" />
                    <span className="font-bold text-green-600">
                      {dict.summary.recommendations.high}
                    </span>
                  </>
                ) : matchScore.score >= 60 ? (
                  <>
                    <Star className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-blue-600">
                      {dict.summary.recommendations.medium}
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-yellow-600">
                      {dict.summary.recommendations.low}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {dict.summary.basedOn.replace(
                  '{{count}}',
                  matchScore.criteria.length.toString()
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchPreview;
