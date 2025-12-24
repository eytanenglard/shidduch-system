'use client';

import React from 'react';
import { X, RefreshCw, Sparkles, Filter, Star, Zap, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CandidatesFilter } from '../types/candidates';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface ActiveFiltersProps {
  filters: CandidatesFilter;
  onRemoveFilter: (key: keyof CandidatesFilter, value?: string) => void;
  onResetAll: () => void;
  onSuggestFilter?: () => void;
  className?: string;
  dict: MatchmakerPageDictionary['candidatesManager']['activeFilters'];
}

interface ActiveFilter {
  key: keyof CandidatesFilter;
  label: string;
  value?: string;
  color?: string;
  icon?: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onRemoveFilter,
  onResetAll,
  onSuggestFilter,
  className,
  dict,
}) => {
  const getActiveFilters = (): ActiveFilter[] => {
    const activeFilters: ActiveFilter[] = [];

    if (!filters.separateFiltering && filters.searchQuery) {
      activeFilters.push({
        key: 'searchQuery',
        label: dict.labels.search.replace('{{query}}', filters.searchQuery),
        color: 'primary',
        icon: <Sparkles className="w-3 h-3" />,
        priority: 'high',
      });
    }

    if (filters.separateFiltering && filters.maleSearchQuery) {
      activeFilters.push({
        key: 'maleSearchQuery',
        label: dict.labels.maleSearch.replace(
          '{{query}}',
          filters.maleSearchQuery
        ),
        color: 'male',
        icon: <Star className="w-3 h-3" />,
        priority: 'high',
      });
    }

    if (filters.separateFiltering && filters.femaleSearchQuery) {
      activeFilters.push({
        key: 'femaleSearchQuery',
        label: dict.labels.femaleSearch.replace(
          '{{query}}',
          filters.femaleSearchQuery
        ),
        color: 'female',
        icon: <Crown className="w-3 h-3" />,
        priority: 'high',
      });
    }

    if (filters.separateFiltering) {
      activeFilters.push({
        key: 'separateFiltering',
        label: dict.labels.separateFiltering,
        color: 'special',
        icon: <Zap className="w-3 h-3" />,
        priority: 'high',
      });
    }

    if (filters.gender) {
      const genderLabel =
        filters.gender === 'MALE'
          ? dict.labels.genders.MALE
          : dict.labels.genders.FEMALE;
      activeFilters.push({
        key: 'gender',
        label: dict.labels.gender.replace('{{gender}}', genderLabel),
        color: filters.gender === 'MALE' ? 'male' : 'female',
        priority: 'high',
      });
    }

    if (filters.ageRange) {
      const isDefaultMin = filters.ageRange.min === 18;
      const isDefaultMax = filters.ageRange.max === 99;

      if (!isDefaultMin || !isDefaultMax) {
        let label = '';
        if (!isDefaultMin && !isDefaultMax) {
          label = dict.labels.age
            .replace('{{min}}', String(filters.ageRange.min))
            .replace('{{max}}', String(filters.ageRange.max));
        } else if (!isDefaultMin) {
          label = dict.labels.ageAbove.replace(
            '{{min}}',
            String(filters.ageRange.min)
          );
        } else if (!isDefaultMax) {
          label = dict.labels.ageBelow.replace(
            '{{max}}',
            String(filters.ageRange.max)
          );
        }
        activeFilters.push({
          key: 'ageRange',
          label,
          color: 'primary',
          priority: 'high',
        });
      }
    }

    if (filters.heightRange) {
      const isDefaultMin = filters.heightRange.min === 140;
      const isDefaultMax = filters.heightRange.max === 210;

      if (!isDefaultMin || !isDefaultMax) {
        let label = '';
        if (!isDefaultMin && !isDefaultMax) {
          label = dict.labels.height
            .replace('{{min}}', String(filters.heightRange.min))
            .replace('{{max}}', String(filters.heightRange.max));
        } else if (!isDefaultMin) {
          label = dict.labels.heightAbove.replace(
            '{{min}}',
            String(filters.heightRange.min)
          );
        } else if (!isDefaultMax) {
          label = dict.labels.heightBelow.replace(
            '{{max}}',
            String(filters.heightRange.max)
          );
        }
        activeFilters.push({
          key: 'heightRange',
          label,
          color: 'secondary',
          priority: 'medium',
        });
      }
    }

    if (filters.religiousLevel) {
      activeFilters.push({
        key: 'religiousLevel',
        label: dict.labels.religiousLevel.replace(
          '{{level}}',
          filters.religiousLevel
        ),
        color: 'warning',
        priority: 'medium',
      });
    }

    if (filters.educationLevel) {
      activeFilters.push({
        key: 'educationLevel',
        label: dict.labels.educationLevel.replace(
          '{{level}}',
          filters.educationLevel
        ),
        color: 'secondary',
        priority: 'medium',
      });
    }

    filters.cities?.forEach((city) => {
      activeFilters.push({
        key: 'cities',
        value: city,
        label: dict.labels.city.replace('{{city}}', city),
        color: 'success',
        priority: 'medium',
      });
    });

    filters.occupations?.forEach((occupation) => {
      activeFilters.push({
        key: 'occupations',
        value: occupation,
        label: dict.labels.occupation.replace('{{occupation}}', occupation),
        color: 'primary',
        priority: 'medium',
      });
    });

    if (filters.availabilityStatus) {
      const status =
        filters.availabilityStatus as keyof typeof dict.labels.availability;
      const statusLabel =
        dict.labels.availability[status] || filters.availabilityStatus;
      activeFilters.push({
        key: 'availabilityStatus',
        label: dict.labels.status.replace('{{status}}', statusLabel),
        color:
          filters.availabilityStatus === 'AVAILABLE' ? 'success' : 'warning',
        priority: 'high',
      });
    }

    if (filters.maritalStatus) {
      activeFilters.push({
        key: 'maritalStatus',
        label: dict.labels.maritalStatus.replace(
          '{{status}}',
          filters.maritalStatus
        ),
        color: 'secondary',
        priority: 'medium',
      });
    }

    if (filters.isVerified) {
      activeFilters.push({
        key: 'isVerified',
        label: dict.labels.verifiedOnly,
        color: 'primary',
        icon: <Star className="w-3 h-3" />,
        priority: 'high',
      });
    }

    if (filters.hasReferences) {
      activeFilters.push({
        key: 'hasReferences',
        label: dict.labels.withRecommendations,
        color: 'success',
        priority: 'medium',
      });
    }

    if (filters.isProfileComplete) {
      activeFilters.push({
        key: 'isProfileComplete',
        label: dict.labels.fullProfile,
        color: 'primary',
        priority: 'medium',
      });
    }

    if (filters.lastActiveDays) {
      let label: string;
      switch (filters.lastActiveDays) {
        case 1:
          label = dict.labels.activeToday;
          break;
        case 3:
          label = dict.labels.activeLast3Days;
          break;
        case 7:
          label = dict.labels.activeLast7Days;
          break;
        case 30:
          label = dict.labels.activeLast30Days;
          break;
        default:
          label = dict.labels.activeInDays.replace(
            '{{days}}',
            String(filters.lastActiveDays)
          );
      }
      activeFilters.push({
        key: 'lastActiveDays',
        label,
        color: 'special',
        priority: 'medium',
      });
    }

    return activeFilters;
  };

  const getFilterColors = (color?: string) => {
    const colorSchemes = {
      primary: {
        badge:
          'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg',
        hover: 'hover:from-blue-600 hover:to-cyan-600',
      },
      secondary: {
        badge:
          'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg',
        hover: 'hover:from-purple-600 hover:to-pink-600',
      },
      success: {
        badge:
          'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 shadow-lg',
        hover: 'hover:from-emerald-600 hover:to-green-600',
      },
      warning: {
        badge:
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg',
        hover: 'hover:from-amber-600 hover:to-orange-600',
      },
      male: {
        badge:
          'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg',
        hover: 'hover:from-blue-700 hover:to-indigo-700',
      },
      female: {
        badge:
          'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg',
        hover: 'hover:from-purple-700 hover:to-pink-700',
      },
      special: {
        badge:
          'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-lg',
        hover: 'hover:from-indigo-600 hover:to-purple-600',
      },
    };
    return (
      colorSchemes[color as keyof typeof colorSchemes] || colorSchemes.primary
    );
  };

  const activeFilters = getActiveFilters();
  const sortedFilters = activeFilters.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (
      priorityOrder[b.priority || 'low'] - priorityOrder[a.priority || 'low']
    );
  });

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-xl"></div>
      </div>
      <div className="relative z-10 bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {dict.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {activeFilters.length === 1
                  ? dict.filterActive
                  : dict.filtersActive.replace(
                      '{{count}}',
                      String(activeFilters.length)
                    )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onSuggestFilter && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onSuggestFilter}
                      className="bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 border border-emerald-200 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {dict.suggestButton}
                      <Zap className="w-3 h-3 ml-1" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{dict.suggestTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetAll}
                    className="bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 text-red-700 border border-red-200 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {dict.clearAllButton}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dict.clearAllTooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <AnimatePresence mode="popLayout">
            {sortedFilters.map((filter, index) => {
              const colors = getFilterColors(filter.color);
              return (
                <motion.div
                  key={`${filter.key}-${filter.value || index}`}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Badge
                    className={cn(
                      'px-4 py-2.5 whitespace-nowrap font-bold text-sm rounded-xl transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-xl',
                      colors.badge,
                      colors.hover,
                      filter.priority === 'high' && 'ring-2 ring-white/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {filter.icon && (
                        <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                          {filter.icon}
                        </span>
                      )}
                      <span className="max-w-[200px] truncate font-medium">
                        {filter.label}
                      </span>
                      <button
                        className="ml-2 hover:bg-white/20 rounded-full p-1 transition-all duration-200 hover:scale-110 group-hover:bg-white/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFilter(filter.key, filter.value);
                        }}
                        aria-label={`הסר פילטר ${filter.label}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Badge>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {activeFilters.length > 3 && (
          <div className="mt-6 pt-4 border-t border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>
                  {dict.summary.title.replace(
                    '{{count}}',
                    String(activeFilters.length)
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {activeFilters.filter((f) => f.priority === 'high').length >
                  0 && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 text-xs"
                  >
                    {dict.summary.highPriority.replace(
                      '{{count}}',
                      String(
                        activeFilters.filter((f) => f.priority === 'high')
                          .length
                      )
                    )}
                  </Badge>
                )}
                {activeFilters.filter((f) => f.priority === 'medium').length >
                  0 && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
                  >
                    {dict.summary.mediumPriority.replace(
                      '{{count}}',
                      String(
                        activeFilters.filter((f) => f.priority === 'medium')
                          .length
                      )
                    )}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-purple-400/5 to-pink-400/5 rounded-2xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default ActiveFilters;
