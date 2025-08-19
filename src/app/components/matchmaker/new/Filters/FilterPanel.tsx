// /Filters/FilterPanel.tsx - גרסה מודרנית ומשודרגת
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Prisma Types
import { UserSource, UserStatus } from '@prisma/client';

// Lucide React Icons
import {
  Activity,
  Award,
  Bookmark,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Crown,
  Filter as FilterIcon,
  GraduationCap,
  Heart,
  MapPin,
  RefreshCw,
  Ruler,
  Save,
  Scroll,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  User,
  UserPlus,
  Zap,
} from 'lucide-react';

// Utility Functions
import { cn } from '@/lib/utils';

// UI Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Local Components, Types & Constants
import SavedFilters from './SavedFilters';
import {
  AGE_RANGE,
  AVAILABILITY_STATUS_OPTIONS,
  EDUCATION_LEVELS,
  HEIGHT_RANGE,
  MARITAL_STATUS,
  OCCUPATION_CATEGORIES,
  POPULAR_CITIES,
  RELIGIOUS_LEVELS,
} from '../constants/filterOptions';
import type { CandidatesFilter } from '../types/candidates';
import type { FilterState } from '../types/filters';

// Interfaces
interface PopularFilterOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  filter: Partial<CandidatesFilter>;
  gradient: string;
}

interface FilterPanelProps {
  filters: CandidatesFilter;
  onFiltersChange: (filters: CandidatesFilter) => void;
  onSavePreset?: (name: string) => void;
  onReset: () => void;
  onApplySavedFilter?: (id: string) => void;
  savedFilters?: Array<{
    id: string;
    name: string;
    isDefault?: boolean;
  }>;
  popularFilters?: string[];
  className?: string;
  compactMode?: boolean;
  separateFiltering?: boolean;
  onToggleSeparateFiltering?: () => void;
  onMaleFiltersChange?: (filters: Partial<FilterState>) => void;
  onFemaleFiltersChange?: (filters: Partial<FilterState>) => void;
  onCopyFilters?: (
    source: 'male' | 'female',
    target: 'male' | 'female'
  ) => void;
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
  gradient?: string;
}

// Constants
const POPULAR_FILTERS: PopularFilterOption[] = [
  {
    id: 'active-recently',
    label: 'פעילים לאחרונה',
    icon: <Activity className="w-4 h-4" />,
    filter: { lastActiveDays: 7 },
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'verified-only',
    label: 'מאומתים בלבד',
    icon: <Shield className="w-4 h-4" />,
    filter: { isVerified: true },
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    id: 'has-recommendations',
    label: 'עם המלצות',
    icon: <Award className="w-4 h-4" />,
    filter: { hasReferences: true },
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'available-only',
    label: 'פנויים בלבד',
    icon: <Heart className="w-4 h-4" />,
    filter: { availabilityStatus: 'AVAILABLE' },
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'complete-profiles',
    label: 'פרופילים מלאים',
    icon: <Star className="w-4 h-4" />,
    filter: { isProfileComplete: true },
    gradient: 'from-purple-500 to-indigo-500',
  },
];

// Helper Components
const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  gradient = 'from-blue-500 to-cyan-500',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="rounded-2xl overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white via-gray-50/30 to-white"
      >
        <CollapsibleTrigger asChild>
          <motion.div
            className={cn(
              'flex items-center justify-between p-4 cursor-pointer transition-all duration-300',
              'bg-gradient-to-r',
              gradient,
              'text-white hover:shadow-lg'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                {icon}
              </div>
              <span className="font-bold text-lg">{title}</span>
              {badge !== undefined && (
                <Badge className="bg-white/20 text-white border-white/30 shadow-lg">
                  {badge}
                </Badge>
              )}
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={20} className="text-white/80" />
            </motion.div>
          </motion.div>
        </CollapsibleTrigger>

        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
          <div className="p-6 bg-gradient-to-br from-white via-gray-50/20 to-white">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

const GenderFilterPanel = ({
  gender,
  filters,
  onFiltersChange,
  className,
  copyTarget,
  onCopyFilters,
}: {
  gender: 'male' | 'female';
  filters: Partial<FilterState>;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  className?: string;
  copyTarget: 'male' | 'female';
  onCopyFilters?: (
    source: 'male' | 'female',
    target: 'male' | 'female'
  ) => void;
}) => {
  const genderConfig = {
    male: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50/50 to-cyan-50/30',
      text: 'text-blue-800',
      icon: <Target className="w-5 h-5" />,
      title: 'סינון מועמדים',
    },
    female: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50/50 to-pink-50/30',
      text: 'text-purple-800',
      icon: <Crown className="w-5 h-5" />,
      title: 'סינון מועמדות',
    },
  };

  const config = genderConfig[gender];

  const handleAgeChange = (type: 'min' | 'max', value: string) => {
    const numericValue = parseInt(value);
    if (
      isNaN(numericValue) ||
      numericValue < AGE_RANGE.min ||
      numericValue > AGE_RANGE.max
    )
      return;

    const currentMin = filters.ageRange?.min || AGE_RANGE.default.min;
    const currentMax = filters.ageRange?.max || AGE_RANGE.default.max;

    onFiltersChange({
      ...filters,
      ageRange: {
        min: type === 'min' ? Math.min(numericValue, currentMax) : currentMin,
        max: type === 'max' ? Math.max(numericValue, currentMin) : currentMax,
      },
    });
  };

  const handleHeightChange = (type: 'min' | 'max', value: string) => {
    const numericValue = parseInt(value);
    if (
      isNaN(numericValue) ||
      numericValue < HEIGHT_RANGE.min ||
      numericValue > HEIGHT_RANGE.max
    )
      return;

    const currentMin = filters.heightRange?.min || HEIGHT_RANGE.default.min;
    const currentMax = filters.heightRange?.max || HEIGHT_RANGE.default.max;

    onFiltersChange({
      ...filters,
      heightRange: {
        min: type === 'min' ? Math.min(numericValue, currentMax) : currentMin,
        max: type === 'max' ? Math.max(numericValue, currentMin) : currentMax,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'mb-6 rounded-2xl overflow-hidden shadow-xl border-0',
        className
      )}
    >
      <div
        className={cn(
          'flex justify-between items-center px-6 py-4',
          'bg-gradient-to-r',
          config.gradient,
          'text-white'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
            {config.icon}
          </div>
          <h3 className="text-lg font-bold">{config.title}</h3>
        </div>
        {onCopyFilters && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyFilters(gender, copyTarget)}
                  className="text-white hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  העתק ל{copyTarget === 'male' ? 'מועמדים' : 'מועמדות'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  העתק הגדרות ל{copyTarget === 'male' ? 'מועמדים' : 'מועמדות'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className={cn('p-6 space-y-6 bg-gradient-to-br', config.bg)}>
        {/* Age Range */}
        <div className="space-y-4">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            גיל
          </Label>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100/50">
            <div className="flex justify-between items-center mb-4">
              <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl shadow-md p-3 min-w-[80px]">
                <p className="text-xs text-blue-600 mb-1 font-medium">
                  מינימום
                </p>
                <input
                  type="number"
                  min={AGE_RANGE.min}
                  max={AGE_RANGE.max}
                  value={filters?.ageRange?.min || AGE_RANGE.default.min}
                  onChange={(e) => handleAgeChange('min', e.target.value)}
                  className="w-16 text-center text-lg font-bold text-blue-700 focus:outline-none bg-transparent"
                />
              </div>
              <span className="text-xl font-bold text-gray-400">-</span>
              <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl shadow-md p-3 min-w-[80px]">
                <p className="text-xs text-blue-600 mb-1 font-medium">
                  מקסימום
                </p>
                <input
                  type="number"
                  min={AGE_RANGE.min}
                  max={AGE_RANGE.max}
                  value={filters?.ageRange?.max || AGE_RANGE.default.max}
                  onChange={(e) => handleAgeChange('max', e.target.value)}
                  className="w-16 text-center text-lg font-bold text-blue-700 focus:outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="px-2">
              <Slider
                value={[
                  filters?.ageRange?.min || AGE_RANGE.default.min,
                  filters?.ageRange?.max || AGE_RANGE.default.max,
                ]}
                min={AGE_RANGE.min}
                max={AGE_RANGE.max}
                step={1}
                onValueChange={(value) => {
                  onFiltersChange({
                    ...filters,
                    ageRange: { min: value[0], max: value[1] },
                  });
                }}
                className="h-5 [&>span]:bg-gradient-to-r [&>span]:from-blue-500 [&>span]:to-cyan-500"
                dir="rtl"
              />
              <div className="flex justify-between mt-3 px-2 text-xs text-gray-500">
                <span>{AGE_RANGE.min}</span>
                <span>{AGE_RANGE.max}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Height Range */}
        <div className="space-y-4">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-purple-600" />
            גובה (ס&quot;מ)
          </Label>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100/50">
            <div className="flex justify-between items-center mb-4">
              <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-md p-3 min-w-[80px]">
                <p className="text-xs text-purple-600 mb-1 font-medium">
                  מינימום
                </p>
                <input
                  type="number"
                  min={HEIGHT_RANGE.min}
                  max={HEIGHT_RANGE.max}
                  value={filters?.heightRange?.min || HEIGHT_RANGE.default.min}
                  onChange={(e) => handleHeightChange('min', e.target.value)}
                  className="w-16 text-center text-lg font-bold text-purple-700 focus:outline-none bg-transparent"
                />
              </div>
              <span className="text-xl font-bold text-gray-400">-</span>
              <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-md p-3 min-w-[80px]">
                <p className="text-xs text-purple-600 mb-1 font-medium">
                  מקסימום
                </p>
                <input
                  type="number"
                  min={HEIGHT_RANGE.min}
                  max={HEIGHT_RANGE.max}
                  value={filters?.heightRange?.max || HEIGHT_RANGE.default.max}
                  onChange={(e) => handleHeightChange('max', e.target.value)}
                  className="w-16 text-center text-lg font-bold text-purple-700 focus:outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="px-2">
              <Slider
                value={[
                  filters?.heightRange?.min || HEIGHT_RANGE.default.min,
                  filters?.heightRange?.max || HEIGHT_RANGE.default.max,
                ]}
                min={HEIGHT_RANGE.min}
                max={HEIGHT_RANGE.max}
                step={1}
                onValueChange={(value) => {
                  onFiltersChange({
                    ...filters,
                    heightRange: { min: value[0], max: value[1] },
                  });
                }}
                className="h-5 [&>span]:bg-gradient-to-r [&>span]:from-purple-500 [&>span]:to-pink-500"
                dir="rtl"
              />
              <div className="flex justify-between mt-3 px-2 text-xs text-gray-500">
                <span>{HEIGHT_RANGE.min}</span>
                <span>{HEIGHT_RANGE.max}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Other Selects */}
        {[
          {
            label: 'רמת דתיות',
            icon: <Scroll className="w-5 h-5 text-amber-600" />,
            filterKey: 'religiousLevel',
            options: RELIGIOUS_LEVELS,
            placeholder: 'בחר רמת דתיות',
            hoverColor: 'amber',
          },
          {
            label: 'עיר מגורים',
            icon: <MapPin className="w-5 h-5 text-emerald-600" />,
            filterKey: 'cities',
            options: POPULAR_CITIES.map((c) => ({ label: c, value: c })),
            placeholder: 'בחר עיר',
            hoverColor: 'emerald',
          },
        ].map(
          ({ label, icon, filterKey, options, placeholder, hoverColor }) => (
            <div key={filterKey} className="space-y-3">
              <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
                {icon}
                {label}
              </Label>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100/50">
                <Select
                  value={
                    filterKey === 'cities'
                      ? filters.cities?.[0] || ''
                      : (filters[filterKey as keyof FilterState] as string) ||
                        ''
                  }
                  onValueChange={(value) => {
                    const newValue = value === 'all' ? undefined : value;
                    if (filterKey === 'cities') {
                      onFiltersChange({
                        ...filters,
                        cities: newValue ? [newValue] : [],
                      });
                    } else {
                      onFiltersChange({ ...filters, [filterKey]: newValue });
                    }
                  }}
                >
                  <SelectTrigger
                    className={`w-full border-0 bg-transparent focus:ring-2 focus:ring-${hoverColor}-200 rounded-xl`}
                  >
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-xl">
                    <SelectItem
                      value="all"
                      className={`hover:bg-${hoverColor}-50`}
                    >
                      הכל
                    </SelectItem>
                    {options.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className={`hover:bg-${hoverColor}-50`}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        )}

        {/* Toggle Switches */}
        <div className="space-y-4 pt-4 border-t border-gray-200/50">
          {[
            {
              key: 'isVerified',
              label: 'מאומתים בלבד',
              icon: <Shield className="w-4 h-4" />,
              gradient: 'from-emerald-500 to-green-500',
            },
            {
              key: 'hasReferences',
              label: 'עם המלצות',
              icon: <Award className="w-4 h-4" />,
              gradient: 'from-amber-500 to-orange-500',
            },
            {
              key: 'isProfileComplete',
              label: 'פרופיל מלא',
              icon: <Star className="w-4 h-4" />,
              gradient: 'from-purple-500 to-indigo-500',
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100/50 hover:bg-white/80 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg bg-gradient-to-r text-white',
                    item.gradient
                  )}
                >
                  {item.icon}
                </div>
                <span className="font-medium text-gray-800">{item.label}</span>
              </div>
              <Switch
                checked={
                  (filters?.[item.key as keyof typeof filters] as boolean) ||
                  false
                }
                onCheckedChange={(checked) => {
                  onFiltersChange({
                    ...filters,
                    [item.key]: checked || undefined,
                  });
                }}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-500"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onSavePreset,
  onReset,
  onApplySavedFilter,
  savedFilters = [],
  popularFilters = [],
  className,
  compactMode = false,
  separateFiltering = false,
  onToggleSeparateFiltering,
  onMaleFiltersChange,
  onFemaleFiltersChange,
  onCopyFilters,
}) => {
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [activeGenderFilter, setActiveGenderFilter] = useState<
    'male' | 'female'
  >('male');

  const handleSavePreset = () => {
    if (presetName && onSavePreset) {
      onSavePreset(presetName);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  const handleAgeRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      ageRange: { min: value[0], max: value[1] },
    });
  };

  const handleHeightRangeChange = (value: number[]) => {
    onFiltersChange({
      ...filters,
      heightRange: { min: value[0], max: value[1] },
    });
  };

  const handleApplyPopularFilter = (filter: Partial<CandidatesFilter>) => {
    onFiltersChange({
      ...filters,
      ...filter,
    });
  };

  const countActiveFilters = (category: string): number => {
    let count = 0;
    switch (category) {
      case 'basic':
        if (filters.gender) count++;
        if (
          filters.ageRange &&
          (filters.ageRange.min !== AGE_RANGE.default.min ||
            filters.ageRange.max !== AGE_RANGE.default.max)
        )
          count++;
        if (filters.cities?.length) count++;
        if (filters.religiousLevel) count++;
        break;
      case 'advanced':
        if (
          filters.heightRange &&
          (filters.heightRange.min !== HEIGHT_RANGE.default.min ||
            filters.heightRange.max !== HEIGHT_RANGE.default.max)
        )
          count++;
        if (filters.occupations?.length) count++;
        if (filters.educationLevel) count++;
        if (filters.maritalStatus) count++;
        break;
      case 'status':
        if (filters.availabilityStatus) count++;
        if (filters.isVerified !== undefined) count++;
        if (filters.hasReferences !== undefined) count++;
        if (filters.lastActiveDays !== undefined) count++;
        if (filters.isProfileComplete !== undefined) count++;
        break;
      case 'saved':
        return savedFilters.length;
    }
    return count;
  };

  return (
    <Card
      className={cn(
        'shadow-2xl border-0 bg-gradient-to-br from-white via-purple-50/20 to-pink-50/10 backdrop-blur-sm rounded-3xl overflow-hidden',
        className
      )}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-2xl"></div>
      </div>

      <div className="relative">
        {!compactMode && (
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                  <FilterIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    סינון מועמדים מתקדם
                  </h3>
                  <p className="text-white/80 mt-1">מערכת סינון חכמה עם AI</p>
                </div>
              </div>
              <div className="flex gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onReset}
                        className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>איפוס כל הפילטרים</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSavePreset(!showSavePreset)}
                        className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                      >
                        <Bookmark className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>שמירת הפילטר הנוכחי</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {POPULAR_FILTERS.map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyPopularFilter(option.filter)}
                    className={cn(
                      'w-full h-auto min-h-24 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-300 text-white flex flex-col items-center gap-2' // <-- הוספנו min-h-24
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg bg-gradient-to-r',
                        option.gradient,
                        'text-white shadow-lg'
                      )}
                    >
                      {option.icon}
                    </div>
                    <span className="text-xs font-medium text-center leading-tight whitespace-normal">
                      {option.label}
                    </span>{' '}
                    {/* <-- הוספנו whitespace-normal */}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {showSavePreset && !compactMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-purple-100"
            >
              <div className="p-6">
                <Label className="text-lg font-bold text-gray-800 mb-3 block">
                  שם לשמירת הפילטר
                </Label>
                <div className="flex gap-3">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="פילטר מותאם אישית"
                    className="flex-1 border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl focus:ring-2 focus:ring-purple-300"
                  />
                  <Button
                    size="sm"
                    onClick={handleSavePreset}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg rounded-xl px-6"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    שמור
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50 border-b border-purple-100/50">
          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    סינון וחיפוש נפרד לפי מגדר
                  </div>
                </div>
                <p className="text-sm text-gray-600 mr-10">
                  סנן מועמדים ומועמדות עם קריטריונים שונים
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={separateFiltering}
                  onCheckedChange={onToggleSeparateFiltering}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-indigo-500 data-[state=checked]:to-purple-500"
                />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="p-6">
          {separateFiltering ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-white via-gray-50/30 to-white rounded-2xl p-2 shadow-lg border border-gray-100/50">
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    type="button"
                    variant={
                      activeGenderFilter === 'male' ? 'default' : 'ghost'
                    }
                    onClick={() => setActiveGenderFilter('male')}
                    className={cn(
                      'rounded-xl py-3 transition-all duration-300',
                      activeGenderFilter === 'male'
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-blue-50'
                    )}
                  >
                    <Target className="w-5 h-5 mr-2" />
                    סינון מועמדים
                  </Button>
                  <Button
                    type="button"
                    variant={
                      activeGenderFilter === 'female' ? 'default' : 'ghost'
                    }
                    onClick={() => setActiveGenderFilter('female')}
                    className={cn(
                      'rounded-xl py-3 transition-all duration-300',
                      activeGenderFilter === 'female'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-600 hover:bg-purple-50'
                    )}
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    סינון מועמדות
                  </Button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {activeGenderFilter === 'male' ? (
                  <motion.div
                    key="male"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GenderFilterPanel
                      gender="male"
                      filters={filters.maleFilters || {}}
                      onFiltersChange={onMaleFiltersChange || (() => {})}
                      copyTarget="female"
                      onCopyFilters={onCopyFilters}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="female"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GenderFilterPanel
                      gender="female"
                      filters={filters.femaleFilters || {}}
                      onFiltersChange={onFemaleFiltersChange || (() => {})}
                      copyTarget="male"
                      onCopyFilters={onCopyFilters}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full bg-gradient-to-r from-indigo-50 to-purple-50 p-2 rounded-2xl shadow-lg border border-white/50 h-auto">
                {[
                  {
                    value: 'basic',
                    label: 'בסיסי',
                    icon: User,
                    gradient: 'from-blue-500 to-cyan-500',
                  },
                  {
                    value: 'advanced',
                    label: 'מתקדם',
                    icon: Sparkles,
                    gradient: 'from-purple-500 to-pink-500',
                  },
                  {
                    value: 'status',
                    label: 'סטטוס',
                    icon: Activity,
                    gradient: 'from-emerald-500 to-green-500',
                  },
                  {
                    value: 'saved',
                    label: 'שמורים',
                    icon: Bookmark,
                    gradient: 'from-amber-500 to-orange-500',
                  },
                ].map((tab) => {
                  const IconComponent = tab.icon;
                  const count = countActiveFilters(tab.value);
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all duration-300 py-3 hover:scale-105 relative overflow-hidden group data-[state=active]:shadow-lg',
                        activeTab === tab.value
                          ? `bg-gradient-to-r ${tab.gradient} text-white`
                          : 'text-gray-600 hover:bg-white/50'
                      )}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white">
                          {count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <div className="mt-6 space-y-6">
                <TabsContent value="basic" className="space-y-6 m-0">
                  <FilterSection
                    title="מגדר"
                    icon={<User className="w-5 h-5" />}
                    defaultOpen={true}
                    gradient="from-blue-500 to-cyan-500"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          value: 'MALE',
                          label: 'גברים',
                          gradient: 'from-blue-500 to-cyan-500',
                        },
                        {
                          value: 'FEMALE',
                          label: 'נשים',
                          gradient: 'from-purple-500 to-pink-500',
                        },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={
                            filters.gender === option.value
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() =>
                            onFiltersChange({
                              ...filters,
                              gender: option.value as 'MALE' | 'FEMALE',
                            })
                          }
                          className={cn(
                            'h-12 rounded-xl font-bold transition-all duration-300 hover:scale-105',
                            filters.gender === option.value
                              ? `bg-gradient-to-r ${option.gradient} text-white shadow-lg hover:shadow-xl`
                              : 'bg-white/80 backdrop-blur-sm border-2 border-gray-200 hover:border-gray-300'
                          )}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    {filters.gender && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onFiltersChange({ ...filters, gender: undefined })
                        }
                        className="w-full mt-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl"
                      >
                        הסר בחירה
                      </Button>
                    )}
                  </FilterSection>
                  <FilterSection
                    title="גיל"
                    icon={<Calendar className="w-5 h-5" />}
                    defaultOpen={true}
                    gradient="from-emerald-500 to-green-500"
                    badge={
                      filters.ageRange &&
                      (filters.ageRange.min !== AGE_RANGE.default.min ||
                        filters.ageRange.max !== AGE_RANGE.default.max)
                        ? 1
                        : undefined
                    }
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl shadow-md p-3 min-w-[80px]">
                          <p className="text-xs text-emerald-600 mb-1 font-medium">
                            מינימום
                          </p>
                          <input
                            type="number"
                            min={AGE_RANGE.min}
                            max={AGE_RANGE.max}
                            value={
                              filters.ageRange?.min || AGE_RANGE.default.min
                            }
                            onChange={(e) => {
                              const newMin = parseInt(e.target.value);
                              if (
                                !isNaN(newMin) &&
                                newMin >= AGE_RANGE.min &&
                                newMin <= AGE_RANGE.max
                              ) {
                                const currentMax =
                                  filters.ageRange?.max ||
                                  AGE_RANGE.default.max;
                                onFiltersChange({
                                  ...filters,
                                  ageRange: {
                                    min: Math.min(newMin, currentMax),
                                    max: currentMax,
                                  },
                                });
                              }
                            }}
                            className="w-16 text-center text-lg font-bold text-emerald-700 focus:outline-none bg-transparent"
                          />
                        </div>
                        <span className="text-xl font-bold text-gray-400">
                          -
                        </span>
                        <div className="text-center bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl shadow-md p-3 min-w-[80px]">
                          <p className="text-xs text-emerald-600 mb-1 font-medium">
                            מקסימום
                          </p>
                          <input
                            type="number"
                            min={AGE_RANGE.min}
                            max={AGE_RANGE.max}
                            value={
                              filters.ageRange?.max || AGE_RANGE.default.max
                            }
                            onChange={(e) => {
                              const newMax = parseInt(e.target.value);
                              if (
                                !isNaN(newMax) &&
                                newMax >= AGE_RANGE.min &&
                                newMax <= AGE_RANGE.max
                              ) {
                                const currentMin =
                                  filters.ageRange?.min ||
                                  AGE_RANGE.default.min;
                                onFiltersChange({
                                  ...filters,
                                  ageRange: {
                                    min: currentMin,
                                    max: Math.max(currentMin, newMax),
                                  },
                                });
                              }
                            }}
                            className="w-16 text-center text-lg font-bold text-emerald-700 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                      <div className="px-3">
                        <Slider
                          value={[
                            filters.ageRange?.min || AGE_RANGE.default.min,
                            filters.ageRange?.max || AGE_RANGE.default.max,
                          ]}
                          min={AGE_RANGE.min}
                          max={AGE_RANGE.max}
                          step={1}
                          onValueChange={handleAgeRangeChange}
                          className="h-6 [&>span]:bg-gradient-to-r [&>span]:from-emerald-500 [&>span]:to-green-500"
                          dir="rtl"
                        />
                        <div className="flex justify-between mt-2 px-1 text-xs text-gray-500">
                          <span>{AGE_RANGE.min}</span>
                          <span>{AGE_RANGE.max}</span>
                        </div>
                      </div>
                    </div>
                  </FilterSection>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6 m-0">
                  <FilterSection
                    title='גובה (סמ)'
                    icon={<Ruler className="w-5 h-5" />}
                    gradient="from-indigo-500 to-purple-500"
                    badge={
                      filters.heightRange &&
                      (filters.heightRange.min !== HEIGHT_RANGE.default.min ||
                        filters.heightRange.max !== HEIGHT_RANGE.default.max)
                        ? 1
                        : undefined
                    }
                  >
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-md p-3 min-w-[80px]">
                          <p className="text-xs text-indigo-600 mb-1 font-medium">
                            מינימום
                          </p>
                          <input
                            type="number"
                            min={HEIGHT_RANGE.min}
                            max={HEIGHT_RANGE.max}
                            value={
                              filters.heightRange?.min ||
                              HEIGHT_RANGE.default.min
                            }
                            onChange={(e) => {
                              const newMin = parseInt(e.target.value);
                              if (
                                !isNaN(newMin) &&
                                newMin >= HEIGHT_RANGE.min &&
                                newMin <= HEIGHT_RANGE.max
                              ) {
                                const currentMax =
                                  filters.heightRange?.max ||
                                  HEIGHT_RANGE.default.max;
                                onFiltersChange({
                                  ...filters,
                                  heightRange: {
                                    min: Math.min(newMin, currentMax),
                                    max: currentMax,
                                  },
                                });
                              }
                            }}
                            className="w-16 text-center text-lg font-bold text-indigo-700 focus:outline-none bg-transparent"
                          />
                        </div>

                        <span className="text-xl font-bold text-gray-400">
                          -
                        </span>

                        <div className="text-center bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-md p-3 min-w-[80px]">
                          <p className="text-xs text-indigo-600 mb-1 font-medium">
                            מקסימום
                          </p>
                          <input
                            type="number"
                            min={HEIGHT_RANGE.min}
                            max={HEIGHT_RANGE.max}
                            value={
                              filters.heightRange?.max ||
                              HEIGHT_RANGE.default.max
                            }
                            onChange={(e) => {
                              const newMax = parseInt(e.target.value);
                              if (
                                !isNaN(newMax) &&
                                newMax >= HEIGHT_RANGE.min &&
                                newMax <= HEIGHT_RANGE.max
                              ) {
                                const currentMin =
                                  filters.heightRange?.min ||
                                  HEIGHT_RANGE.default.min;
                                onFiltersChange({
                                  ...filters,
                                  heightRange: {
                                    min: currentMin,
                                    max: Math.max(currentMin, newMax),
                                  },
                                });
                              }
                            }}
                            className="w-16 text-center text-lg font-bold text-indigo-700 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>

                      <div className="px-3">
                        <Slider
                          value={[
                            filters.heightRange?.min ||
                              HEIGHT_RANGE.default.min,
                            filters.heightRange?.max ||
                              HEIGHT_RANGE.default.max,
                          ]}
                          min={HEIGHT_RANGE.min}
                          max={HEIGHT_RANGE.max}
                          step={1}
                          onValueChange={handleHeightRangeChange}
                          className="h-6 [&>span]:bg-gradient-to-r [&>span]:from-indigo-500 [&>span]:to-purple-500"
                          dir="rtl"
                        />
                        <div className="flex justify-between mt-2 px-1 text-xs text-gray-500">
                          <span>{HEIGHT_RANGE.min} ס&quot;מ</span>
                          <span>{HEIGHT_RANGE.max} ס&quot;מ</span>
                        </div>
                      </div>
                    </div>
                  </FilterSection>
                </TabsContent>

                {/* Other Tabs content would go here */}

                <TabsContent value="saved" className="space-y-6 m-0">
                  {savedFilters.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12 bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl shadow-xl border border-gray-100/50"
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-6">
                        <Bookmark className="w-10 h-10 text-amber-500" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3">
                        אין פילטרים שמורים
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                        שמור את הפילטר הנוכחי ע"י לחיצה על כפתור השמירה
                      </p>
                      <Button
                        onClick={() => setShowSavePreset(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg rounded-xl px-6"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        שמור פילטר נוכחי
                      </Button>
                    </motion.div>
                  ) : (
                    <SavedFilters
                      filters={savedFilters.map((filter) => ({
                        id: filter.id,
                        name: filter.name,
                        filter: {},
                        isDefault: filter.isDefault,
                        createdAt: new Date(),
                      }))}
                      activeFilterId={filters.savedFilterId}
                      onSelect={(filter) => onApplySavedFilter?.(filter.id)}
                      onDelete={() => {}}
                      onEdit={() => {}}
                      onSetDefault={() => {}}
                    />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="flex justify-between items-center pt-6 border-t border-gray-200/50">
            <Button
              variant="outline"
              size={compactMode ? 'sm' : 'default'}
              onClick={onReset}
              className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-600 hover:from-red-100 hover:to-pink-100 rounded-xl transition-all duration-300 hover:scale-105"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              איפוס
            </Button>
            {!compactMode && (
              <Button
                onClick={() => setShowSavePreset(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg rounded-xl px-6 transition-all duration-300 hover:scale-105"
              >
                <Save className="w-4 h-4 mr-2" />
                שמירת פילטר
                <Sparkles className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FilterPanel;
