// SavedFilters.tsx - This file is correct. The issue lies in the UI component definitions.
'use client';
import React from 'react';
import {
  Star,
  MoreVertical,
  Edit,
  Trash,
  Crown,
  Bookmark,
  Calendar,
  Sparkles,
  Zap,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import type { CandidatesFilter } from '../types/candidates';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface SavedFilter {
  id: string;
  name: string;
  filter: CandidatesFilter;
  isDefault?: boolean;
  createdAt: Date;
}

interface SavedFiltersProps {
  filters: SavedFilter[];
  activeFilterId?: string;
  onSelect: (filter: SavedFilter) => void;
  onDelete: (filterId: string) => void;
  onEdit: (filter: SavedFilter) => void;
  onSetDefault: (filterId: string) => void;
  className?: string;
  dict: MatchmakerPageDictionary['candidatesManager']['filterPanel']['savedFilters'];
}

// Enhanced filter summary function outside component for performance
const formatFilterSummary = (
  filter: CandidatesFilter,
  dict: SavedFiltersProps['dict']['filterCard']['summary']
): string => {
  const parts: string[] = [];

  if (filter.searchQuery) {
    parts.push(dict.search.replace('{{query}}', filter.searchQuery));
  }
  if (filter.gender) {
    parts.push(dict.gender.replace('{{gender}}', filter.gender));
  }
  if (filter.ageRange) {
    parts.push(
      `${dict.age} ${dict.ageValue.replace('{{min}}', String(filter.ageRange.min)).replace('{{max}}', String(filter.ageRange.max))}`
    );
  }
  if (filter.heightRange) {
    parts.push(
      `${dict.height} ${dict.heightValue.replace('{{min}}', String(filter.heightRange.min)).replace('{{max}}', String(filter.heightRange.max))}`
    );
  }
  if (filter.cities?.length) {
    if (filter.cities.length === 1) {
      parts.push(dict.city.replace('{{city}}', filter.cities[0]));
    } else {
      parts.push(
        dict.cities.replace('{{count}}', String(filter.cities.length))
      );
    }
  }
  if (filter.religiousLevel) {
    parts.push(dict.religiousLevel.replace('{{level}}', filter.religiousLevel));
  }
  if (filter.educationLevel) {
    parts.push(dict.educationLevel.replace('{{level}}', filter.educationLevel));
  }
  if (filter.maritalStatus) {
    parts.push(dict.maritalStatus.replace('{{status}}', filter.maritalStatus));
  }
  if (filter.occupations?.length) {
    if (filter.occupations.length === 1) {
      parts.push(
        dict.occupation.replace('{{occupation}}', filter.occupations[0])
      );
    } else {
      parts.push(
        dict.occupations.replace('{{count}}', String(filter.occupations.length))
      );
    }
  }
  if (filter.availabilityStatus) {
    const statusKey = filter.availabilityStatus as keyof typeof dict.statuses;
    parts.push(dict.status.replace('{{status}}', dict.statuses[statusKey]));
  }
  if (filter.isVerified) {
    parts.push(dict.verifiedOnly);
  }
  if (filter.hasReferences) {
    parts.push(dict.withRecommendations);
  }
  if (filter.isProfileComplete) {
    parts.push(dict.fullProfile);
  }
  if (filter.lastActiveDays) {
    let label;
    switch (filter.lastActiveDays) {
      case 1:
        label = dict.activeToday;
        break;
      case 7:
        label = dict.activeLastWeek;
        break;
      case 30:
        label = dict.activeLastMonth;
        break;
      default:
        label = dict.activeInDays.replace(
          '{{days}}',
          String(filter.lastActiveDays)
        );
    }
    parts.push(label);
  }
  if (filter.separateFiltering) {
    parts.push(dict.separateFiltering);
  }

  if (parts.length === 0) {
    return dict.noCriteria;
  }
  if (parts.length <= 3) {
    return parts.join(' • ');
  } else {
    return `${parts.slice(0, 2).join(' • ')} ${dict.andMore.replace('{{count}}', String(parts.length - 2))}`;
  }
};

const SavedFilters: React.FC<SavedFiltersProps> = ({
  filters,
  activeFilterId,
  onSelect,
  onDelete,
  onEdit,
  onSetDefault,
  className,
  dict,
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const getFilterComplexity = (
    filter: CandidatesFilter
  ): { score: number; label: string; color: string } => {
    const score = Object.keys(filter).filter(
      (key) => filter[key as keyof CandidatesFilter] !== undefined
    ).length;

    if (score <= 2)
      return {
        score,
        label: dict.filterCard.complexity.basic,
        color: 'from-green-500 to-emerald-500',
      };
    if (score <= 5)
      return {
        score,
        label: dict.filterCard.complexity.advanced,
        color: 'from-blue-500 to-cyan-500',
      };
    if (score <= 8)
      return {
        score,
        label: dict.filterCard.complexity.complex,
        color: 'from-purple-500 to-pink-500',
      };
    return {
      score,
      label: dict.filterCard.complexity.expert,
      color: 'from-amber-500 to-orange-500',
    };
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white via-purple-50/30 to-pink-50/30 rounded-2xl shadow-lg border border-gray-100/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {dict.header.title}
            </h3>
            <p className="text-sm text-gray-600">
              {dict.header.subtitle
                .replace('{{count}}', String(filters.length))
                .replace(
                  '{{label}}',
                  filters.length === 1
                    ? dict.header.singleFilter
                    : dict.header.multipleFilters
                )}
            </p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg px-3 py-1 font-bold">
          {filters.length}
        </Badge>
      </div>

      <ScrollArea className="h-[400px] rounded-2xl">
        <div className="space-y-3 p-1">
          <AnimatePresence>
            {filters.map((filter, index) => {
              const complexity = getFilterComplexity(filter.filter);
              const isActive = activeFilterId === filter.id;
              return (
                <motion.div
                  key={filter.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{
                    delay: index * 0.05,
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={cn(
                    'relative group cursor-pointer rounded-2xl overflow-hidden shadow-xl border-0 transition-all duration-300',
                    isActive
                      ? 'ring-4 ring-purple-400 ring-opacity-60 shadow-purple-200'
                      : 'shadow-gray-200 hover:shadow-2xl'
                  )}
                  onClick={() => onSelect(filter)}
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br transition-opacity duration-300',
                      isActive
                        ? 'from-purple-50 via-pink-50/50 to-purple-50 opacity-90'
                        : 'from-white via-gray-50/30 to-white opacity-95 group-hover:opacity-100'
                    )}
                  />
                  <div className="relative z-10 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {filter.isDefault && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
                          >
                            <Crown className="w-4 h-4" />
                          </motion.div>
                        )}
                        <div
                          className={cn(
                            'p-2 rounded-full text-white shadow-lg bg-gradient-to-r',
                            complexity.color
                          )}
                        >
                          {complexity.score <= 2 ? (
                            <Star className="w-4 h-4" />
                          ) : complexity.score <= 5 ? (
                            <Sparkles className="w-4 h-4" />
                          ) : complexity.score <= 8 ? (
                            <Zap className="w-4 h-4" />
                          ) : (
                            <Award className="w-4 h-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-800 group-hover:text-purple-700 transition-colors">
                            {filter.name}
                          </h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatFilterSummary(
                              filter.filter,
                              dict.filterCard.summary
                            )}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-100 rounded-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-xl"
                        >
                          <DropdownMenuItem
                            onClick={() => onEdit(filter)}
                            className="hover:bg-blue-50 rounded-lg"
                          >
                            <Edit className="mr-2 h-4 w-4 text-blue-600" />
                            <span className="text-blue-700">
                              {dict.filterCard.actions.edit}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onSetDefault(filter.id)}
                            disabled={filter.isDefault}
                            className="hover:bg-yellow-50 rounded-lg"
                          >
                            <Crown className="mr-2 h-4 w-4 text-yellow-600" />
                            <span className="text-yellow-700">
                              {filter.isDefault
                                ? dict.filterCard.actions.isDefault
                                : dict.filterCard.actions.setDefault}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(filter.id)}
                            className="hover:bg-red-50 rounded-lg"
                          >
                            <Trash className="mr-2 h-4 w-4 text-red-600" />
                            <span className="text-red-700">
                              {dict.filterCard.actions.delete}
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          className={cn(
                            'text-white border-0 shadow-lg font-bold px-3 py-1 bg-gradient-to-r',
                            complexity.color
                          )}
                        >
                          {complexity.label} •{' '}
                          {dict.filterCard.criteria.replace(
                            '{{count}}',
                            String(complexity.score)
                          )}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(filter.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/0 to-purple-400/0 group-hover:from-purple-400/10 group-hover:via-pink-400/10 group-hover:to-purple-400/10 transition-all duration-500 pointer-events-none rounded-2xl"></div>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-3 left-3 w-3 h-3 bg-purple-500 rounded-full shadow-lg"
                    >
                      <div className="w-full h-full bg-purple-400 rounded-full animate-ping"></div>
                    </motion.div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl"></div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {filters.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl shadow-xl border border-gray-100/50"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            {dict.emptyState.title}
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            {dict.emptyState.description}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-600 border-blue-200"
            >
              <Star className="w-3 h-3 mr-1" />
              {dict.emptyState.fastSearches}
            </Badge>
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-600 border-purple-200"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {dict.emptyState.advancedFiltering}
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-600 border-green-200"
            >
              <Award className="w-3 h-3 mr-1" />
              {dict.emptyState.quickAccess}
            </Badge>
          </div>
        </motion.div>
      )}

      {filters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 shadow-lg border border-gray-100/50"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-indigo-600">
                {filters.filter((f) => f.isDefault).length}
              </div>
              <div className="text-xs text-gray-600">{dict.stats.default}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {
                  filters.filter((f) => getFilterComplexity(f.filter).score > 5)
                    .length
                }
              </div>
              <div className="text-xs text-gray-600">{dict.stats.advanced}</div>
            </div>
            <div>
              <div className="text-lg font-bold text-pink-600">
                {Math.round(
                  filters.reduce(
                    (acc, f) => acc + getFilterComplexity(f.filter).score,
                    0
                  ) / (filters.length || 1)
                )}
              </div>
              <div className="text-xs text-gray-600">
                {dict.stats.avgCriteria}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SavedFilters;