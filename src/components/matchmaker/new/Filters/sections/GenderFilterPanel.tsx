'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  Calendar,
  Copy,
  Crown,
  Heart,
  MapPin,
  Ruler,
  Scroll,
  Shield,
  Star,
  Target,
  User,
  Zap,
  Palette,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AGE_RANGE, HEIGHT_RANGE, POPULAR_CITIES, BODY_TYPE_OPTIONS, APPEARANCE_TONE_OPTIONS, ETHNIC_BACKGROUND_OPTIONS } from '../../constants/filterOptions';
import { MARITAL_STATUS_OPTIONS } from './filterConstants';
import SafeNumberInput from './SafeNumberInput';
import ReligiousMultiSelect from './ReligiousMultiSelect';
import LanguageMultiSelect from './LanguageMultiSelect';
import type { FilterState } from '../../types/filters';
import type { FilterPanelDict } from '@/types/dictionaries/matchmaker';

interface GenderFilterPanelProps {
  gender: 'male' | 'female';
  filters: Partial<FilterState>;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  className?: string;
  copyTarget: 'male' | 'female';
  onCopyFilters?: (
    source: 'male' | 'female',
    target: 'male' | 'female'
  ) => void;
  dict: FilterPanelDict['genderFilterPanel'];
}

const GenderFilterPanel: React.FC<GenderFilterPanelProps> = ({
  gender,
  filters,
  onFiltersChange,
  className,
  copyTarget,
  onCopyFilters,
  dict,
}) => {
  const genderConfig = {
    male: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50/50 to-cyan-50/30',
      text: 'text-blue-800',
      icon: <Target className="w-5 h-5" />,
      title: dict.maleTitle,
      copyLabel: dict.copyToFemale,
    },
    female: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'from-purple-50/50 to-pink-50/30',
      text: 'text-purple-800',
      icon: <Crown className="w-5 h-5" />,
      title: dict.femaleTitle,
      copyLabel: dict.copyToMale,
    },
  };

  const config = genderConfig[gender];

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
                  {config.copyLabel}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {dict.copyTooltip.replace(
                    '{{gender}}',
                    copyTarget === 'male' ? dict.maleTitle : dict.femaleTitle
                  )}
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
            {dict.ageLabel}
          </Label>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100/50">
            <div className="flex justify-between items-center mb-4">
              <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl shadow-md p-3 min-w-[80px]">
                <p className="text-xs text-blue-600 mb-1 font-medium">
                  {dict.minLabel}
                </p>
                <SafeNumberInput
                  min={AGE_RANGE.min}
                  max={AGE_RANGE.max}
                  value={filters?.ageRange?.min || AGE_RANGE.default.min}
                  onCommit={(val) => {
                    const currentMax =
                      filters.ageRange?.max || AGE_RANGE.default.max;
                    onFiltersChange({
                      ...filters,
                      ageRange: {
                        min: Math.min(val, currentMax),
                        max: currentMax,
                      },
                    });
                  }}
                  className="w-16 text-center text-lg font-bold text-blue-700 focus:outline-none bg-transparent"
                />
              </div>
              <span className="text-xl font-bold text-gray-400">-</span>
              <div className="text-center bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl shadow-md p-3 min-w-[80px]">
                <p className="text-xs text-blue-600 mb-1 font-medium">
                  {dict.maxLabel}
                </p>
                <SafeNumberInput
                  min={AGE_RANGE.min}
                  max={AGE_RANGE.max}
                  value={filters?.ageRange?.max || AGE_RANGE.default.max}
                  onCommit={(val) => {
                    const currentMin =
                      filters.ageRange?.min || AGE_RANGE.default.min;
                    onFiltersChange({
                      ...filters,
                      ageRange: {
                        min: currentMin,
                        max: Math.max(val, currentMin),
                      },
                    });
                  }}
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
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    ageRange: { min: value[0], max: value[1] },
                  })
                }
                className="h-5 [&>span]:bg-gradient-to-r [&>span]:from-blue-500 [&>span]:to-cyan-500"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        {/* Height Range */}
        <div className="space-y-4">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-purple-600" />
            {dict.heightLabel}
          </Label>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100/50">
            <div className="flex justify-between items-center mb-4">
              <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-md p-3 min-w-[80px]">
                <p className="text-xs text-purple-600 mb-1 font-medium">
                  {dict.minLabel}
                </p>
                <SafeNumberInput
                  min={HEIGHT_RANGE.min}
                  max={HEIGHT_RANGE.max}
                  value={filters?.heightRange?.min || HEIGHT_RANGE.default.min}
                  onCommit={(val) => {
                    const currentMax =
                      filters.heightRange?.max || HEIGHT_RANGE.default.max;
                    onFiltersChange({
                      ...filters,
                      heightRange: {
                        min: Math.min(val, currentMax),
                        max: currentMax,
                      },
                    });
                  }}
                  className="w-16 text-center text-lg font-bold text-purple-700 focus:outline-none bg-transparent"
                />
              </div>
              <span className="text-xl font-bold text-gray-400">-</span>
              <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-md p-3 min-w-[80px]">
                <p className="text-xs text-purple-600 mb-1 font-medium">
                  {dict.maxLabel}
                </p>
                <SafeNumberInput
                  min={HEIGHT_RANGE.min}
                  max={HEIGHT_RANGE.max}
                  value={filters?.heightRange?.max || HEIGHT_RANGE.default.max}
                  onCommit={(val) => {
                    const currentMin =
                      filters.heightRange?.min || HEIGHT_RANGE.default.min;
                    onFiltersChange({
                      ...filters,
                      heightRange: {
                        min: currentMin,
                        max: Math.max(val, currentMin),
                      },
                    });
                  }}
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
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    heightRange: { min: value[0], max: value[1] },
                  })
                }
                className="h-5 [&>span]:bg-gradient-to-r [&>span]:from-purple-500 [&>span]:to-pink-500"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        {/* Religious Level (Multi-Select) */}
        <div className="space-y-3">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Scroll className="w-5 h-5 text-amber-600" />
            {dict.religiousLevelLabel}
          </Label>
          <ReligiousMultiSelect
            selectedValues={filters.religiousLevel || []}
            onChange={(values) =>
              onFiltersChange({ ...filters, religiousLevel: values })
            }
            dict={dict}
          />
        </div>

        {/* City */}
        <div className="space-y-3">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            {dict.cityLabel}
          </Label>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100/50">
            <Select
              value={filters.cities?.[0] || ''}
              onValueChange={(value) => {
                const newValue = value === 'all' ? undefined : value;
                onFiltersChange({
                  ...filters,
                  cities: newValue ? [newValue] : [],
                });
              }}
            >
              <SelectTrigger className="w-full border-0 bg-transparent focus:ring-2 focus:ring-emerald-200 rounded-xl">
                <SelectValue placeholder={dict.placeholders.selectCity} />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-xl">
                <SelectItem value="all" className="hover:bg-emerald-50">
                  {dict.options.all}
                </SelectItem>
                {POPULAR_CITIES.map((c) => (
                  <SelectItem key={c} value={c} className="hover:bg-emerald-50">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Marital Status */}
        <div className="space-y-3">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-violet-600" />
            {dict.maritalStatusLabel}
          </Label>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-100/50">
            <Select
              value={filters.maritalStatus || ''}
              onValueChange={(value) => {
                const newValue = value === 'all' ? undefined : value;
                onFiltersChange({
                  ...filters,
                  maritalStatus: newValue,
                });
              }}
            >
              <SelectTrigger className="w-full border-0 bg-transparent focus:ring-2 focus:ring-violet-200 rounded-xl">
                <SelectValue
                  placeholder={
                    dict.placeholders.selectMaritalStatus
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-xl">
                <SelectItem value="all" className="hover:bg-violet-50">
                  {dict.options.all}
                </SelectItem>
                {MARITAL_STATUS_OPTIONS.map((ms) => (
                  <SelectItem
                    key={ms.value}
                    value={ms.value}
                    className="hover:bg-violet-50"
                  >
                    {ms.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-3">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-600" />
            {dict.languageLabel}
          </Label>
          <LanguageMultiSelect
            selectedValues={filters.languages || []}
            onChange={(values) =>
              onFiltersChange({ ...filters, languages: values })
            }
            dict={dict}
          />
        </div>

        {/* ── Appearance Filters ────────────────────────────────────── */}

        {/* Body Type */}
        <div className="space-y-3">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-rose-500" />
            {dict.bodyTypeLabel}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {BODY_TYPE_OPTIONS.map((opt) => {
              const selected = (filters.bodyType || []).includes(opt.value);
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs rounded-full"
                  onClick={() => {
                    const current = filters.bodyType || [];
                    const updated = selected
                      ? current.filter((v) => v !== opt.value)
                      : [...current, opt.value];
                    onFiltersChange({ ...filters, bodyType: updated });
                  }}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Appearance Tone */}
        <div className="space-y-3">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            {dict.appearanceToneLabel}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {APPEARANCE_TONE_OPTIONS.map((opt) => {
              const selected = (filters.appearanceTone || []).includes(opt.value);
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs rounded-full"
                  onClick={() => {
                    const current = filters.appearanceTone || [];
                    const updated = selected
                      ? current.filter((v) => v !== opt.value)
                      : [...current, opt.value];
                    onFiltersChange({ ...filters, appearanceTone: updated });
                  }}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Ethnic Background */}
        <div className="space-y-3">
          <Label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-600" />
            {dict.ethnicBackgroundLabel}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {ETHNIC_BACKGROUND_OPTIONS.map((opt) => {
              const selected = (filters.ethnicBackground || []).includes(opt.value);
              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs rounded-full"
                  onClick={() => {
                    const current = filters.ethnicBackground || [];
                    const updated = selected
                      ? current.filter((v) => v !== opt.value)
                      : [...current, opt.value];
                    onFiltersChange({ ...filters, ethnicBackground: updated });
                  }}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Consolidated Status Toggles */}
        <div className="space-y-4 pt-4 border-t border-gray-200/50">
          {[
            {
              key: 'isVerified',
              label: dict.verifiedOnlyLabel,
              icon: <Shield className="w-4 h-4" />,
              gradient: 'from-emerald-500 to-green-500',
            },
            {
              key: 'hasReferences',
              label: dict.withRecommendationsLabel,
              icon: <Award className="w-4 h-4" />,
              gradient: 'from-amber-500 to-orange-500',
            },
            {
              key: 'isProfileComplete',
              label: dict.fullProfileLabel,
              icon: <Star className="w-4 h-4" />,
              gradient: 'from-purple-500 to-indigo-500',
            },
            {
              key: 'availabilityStatus',
              label: dict.availableOnlyLabel,
              icon: <Heart className="w-4 h-4" />,
              gradient: 'from-pink-500 to-rose-500',
              value: filters.availabilityStatus === 'AVAILABLE',
              onChange: (checked: boolean) =>
                onFiltersChange({
                  ...filters,
                  availabilityStatus: checked ? 'AVAILABLE' : undefined,
                }),
            },
            {
              key: 'lastActiveDays',
              label: dict.activeRecentlyLabel,
              icon: <Activity className="w-4 h-4" />,
              gradient: 'from-blue-500 to-cyan-500',
              value: filters.lastActiveDays === 7,
              onChange: (checked: boolean) =>
                onFiltersChange({
                  ...filters,
                  lastActiveDays: checked ? 7 : undefined,
                }),
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100/50 hover:bg-white/80 transition-all duration-300"
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
                <span className="font-medium text-gray-800 text-sm">
                  {item.label}
                </span>
              </div>
              <Switch
                checked={
                  item.value !== undefined
                    ? item.value
                    : (filters?.[
                        item.key as keyof typeof filters
                      ] as boolean) || false
                }
                onCheckedChange={
                  item.onChange
                    ? item.onChange
                    : (checked) =>
                        onFiltersChange({
                          ...filters,
                          [item.key]: checked || undefined,
                        })
                }
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-emerald-500 data-[state=checked]:to-green-500"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default GenderFilterPanel;
