'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  User,
  Calendar,
  Scroll,
  Target,
  Crown,
  Search,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { PotentialMatchFilters } from './hooks/usePotentialMatches';

// --- Constants ---
const RELIGIOUS_OPTIONS = [
  { value: 'charedi_litvak', label: 'חרדי/ת ליטאי/ת' },
  { value: 'charedi_hasidic', label: 'חרדי/ת חסידי/ת' },
  { value: 'charedi_sephardic', label: 'חרדי/ת ספרדי/ת' },
  { value: 'charedi_modern', label: 'חרדי/ת מודרני/ת' },
  { value: 'chabad', label: 'חב״ד' },
  { value: 'breslov', label: 'ברסלב' },
  { value: 'dati_leumi_torani', label: 'דתי/ה לאומי/ת תורני/ת' },
  { value: 'dati_leumi_standard', label: 'דתי/ה לאומי/ת (סטנדרטי)' },
  { value: 'dati_leumi_liberal', label: 'דתי/ה לאומי/ת ליברלי/ת' },
  { value: 'masorti_strong', label: 'מסורתי/ת (קרוב/ה לדת)' },
  { value: 'masorti_light', label: 'מסורתי/ת (קשר קל למסורת)' },
  { value: 'secular_traditional_connection', label: 'חילוני/ת עם זיקה למסורת' },
  { value: 'secular', label: 'חילוני/ת' },
  { value: 'spiritual_not_religious', label: 'רוחני/ת (לאו דווקא דתי/ה)' },
  { value: 'other', label: 'אחר' },
];

const AGE_RANGE = { min: 18, max: 99, default: { min: 18, max: 50 } };

// --- Interfaces ---
interface PotentialMatchesFiltersProps {
  filters: PotentialMatchFilters;
  onFiltersChange: (filters: Partial<PotentialMatchFilters>) => void;
  onReset: () => void;
  className?: string;
}

// --- Sub-Components ---

// Safe Number Input
const SafeNumberInput: React.FC<{
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
  className?: string;
}> = ({ value, min, max, onCommit, className }) => {
  const [localValue, setLocalValue] = useState<string>(value?.toString() || '');

  React.useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleCommit = () => {
    let num = parseInt(localValue);
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;
    setLocalValue(num.toString());
    onCommit(num);
  };

  return (
    <input
      type="number"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      className={className}
    />
  );
};

// Religious Multi-Select
const ReligiousMultiSelect: React.FC<{
  selectedValues: string[];
  onChange: (values: string[]) => void;
  label?: string;
}> = ({ selectedValues = [], onChange, label }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleValue = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((v) => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  };

  const filteredOptions = RELIGIOUS_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-gray-100 space-y-2">
      {label && <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>}
      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="חפש רמה דתית..."
          className="pr-9 bg-white border-gray-200 h-9 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ScrollArea className="h-36 rounded-md border border-gray-100 bg-white p-2">
        <div className="space-y-1">
          {filteredOptions.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            return (
              <div
                key={option.value}
                onClick={() => toggleValue(option.value)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm',
                  isSelected
                    ? 'bg-amber-50 text-amber-900'
                    : 'hover:bg-gray-50 text-gray-700'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleValue(option.value)}
                  className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <span className="flex-1">{option.label}</span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selectedValues.map((val) => {
            const label = RELIGIOUS_OPTIONS.find((o) => o.value === val)?.label;
            return (
              <Badge
                key={val}
                variant="secondary"
                className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200"
              >
                {label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleValue(val);
                  }}
                  className="mr-1 hover:text-amber-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Filter Section
const FilterSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
  gradient?: string;
}> = ({ title, icon, children, defaultOpen = false, badge, gradient = 'from-gray-500 to-gray-600' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl cursor-pointer hover:bg-white/80 transition-colors border border-gray-100">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-gradient-to-r text-white', gradient)}>
              {icon}
            </div>
            <span className="font-medium text-gray-700">{title}</span>
            {badge && badge > 0 && (
              <Badge className="bg-red-500 text-white text-xs">{badge}</Badge>
            )}
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-3 pb-1"
        >
          {children}
        </motion.div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// --- Main Component ---
const PotentialMatchesFilters: React.FC<PotentialMatchesFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeGender, setActiveGender] = useState<'male' | 'female' | 'both'>('both');

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (filters.gender) count++;
    if (filters.maleAgeRange) count++;
    if (filters.femaleAgeRange) count++;
    if (filters.maleReligiousLevel && filters.maleReligiousLevel.length > 0) count++;
    if (filters.femaleReligiousLevel && filters.femaleReligiousLevel.length > 0) count++;
    if (filters.religiousLevel && filters.religiousLevel.length > 0) count++;
    return count;
  };

  const activeCount = countActiveFilters();

  return (
    <Card className={cn('border-0 shadow-lg overflow-hidden', className)}>
      {/* Header */}
      <div
        className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">פילטרים מתקדמים</h3>
              <p className="text-sm text-gray-500">סנן הצעות לפי מגדר, גיל ורמה דתית</p>
            </div>
            {activeCount > 0 && (
              <Badge className="bg-indigo-500 text-white">{activeCount} פילטרים פעילים</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="w-4 h-4 ml-1" />
                נקה
              </Button>
            )}
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-gradient-to-b from-white to-gray-50/50">
              {/* Gender Toggle - Show which gender to filter */}
              <div className="bg-white/80 rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-3">הצג הצעות עם:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={activeGender === 'both' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setActiveGender('both');
                      onFiltersChange({ gender: null });
                    }}
                    className={cn(
                      'rounded-xl transition-all',
                      activeGender === 'both' && 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                    )}
                  >
                    שניהם
                  </Button>
                  <Button
                    variant={activeGender === 'male' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setActiveGender('male');
                      onFiltersChange({ gender: 'MALE' });
                    }}
                    className={cn(
                      'rounded-xl transition-all',
                      activeGender === 'male' && 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    )}
                  >
                    <Target className="w-4 h-4 ml-1" />
                    בנים בלבד
                  </Button>
                  <Button
                    variant={activeGender === 'female' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setActiveGender('female');
                      onFiltersChange({ gender: 'FEMALE' });
                    }}
                    className={cn(
                      'rounded-xl transition-all',
                      activeGender === 'female' && 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    )}
                  >
                    <Crown className="w-4 h-4 ml-1" />
                    בנות בלבד
                  </Button>
                </div>
              </div>

              {/* Separate Filters by Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Male Filters */}
                {(activeGender === 'both' || activeGender === 'male') && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                        <Target className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-blue-800">פילטרים לבנים</h4>
                    </div>

                    {/* Age Range */}
                    <FilterSection
                      title="טווח גיל"
                      icon={<Calendar className="w-4 h-4" />}
                      gradient="from-blue-500 to-cyan-500"
                      badge={filters.maleAgeRange ? 1 : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 text-center">
                          <p className="text-xs text-blue-600 mb-1">מינימום</p>
                          <SafeNumberInput
                            min={AGE_RANGE.min}
                            max={AGE_RANGE.max}
                            value={filters.maleAgeRange?.min || AGE_RANGE.default.min}
                            onCommit={(val) => {
                              const currentMax = filters.maleAgeRange?.max || AGE_RANGE.default.max;
                              onFiltersChange({
                                maleAgeRange: { min: Math.min(val, currentMax), max: currentMax },
                              });
                            }}
                            className="w-full text-center border rounded-lg p-2 text-lg font-bold text-blue-700"
                          />
                        </div>
                        <span className="text-gray-400">—</span>
                        <div className="flex-1 text-center">
                          <p className="text-xs text-blue-600 mb-1">מקסימום</p>
                          <SafeNumberInput
                            min={AGE_RANGE.min}
                            max={AGE_RANGE.max}
                            value={filters.maleAgeRange?.max || AGE_RANGE.default.max}
                            onCommit={(val) => {
                              const currentMin = filters.maleAgeRange?.min || AGE_RANGE.default.min;
                              onFiltersChange({
                                maleAgeRange: { min: currentMin, max: Math.max(val, currentMin) },
                              });
                            }}
                            className="w-full text-center border rounded-lg p-2 text-lg font-bold text-blue-700"
                          />
                        </div>
                      </div>
                      {filters.maleAgeRange && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFiltersChange({ maleAgeRange: undefined })}
                          className="w-full mt-2 text-gray-500 hover:text-gray-700"
                        >
                          נקה סינון גיל
                        </Button>
                      )}
                    </FilterSection>

                    {/* Religious Level */}
                    <div className="mt-3">
                      <FilterSection
                        title="רמה דתית"
                        icon={<Scroll className="w-4 h-4" />}
                        gradient="from-blue-500 to-cyan-500"
                        badge={filters.maleReligiousLevel?.length || undefined}
                      >
                        <ReligiousMultiSelect
                          selectedValues={filters.maleReligiousLevel || []}
                          onChange={(values) => onFiltersChange({ maleReligiousLevel: values })}
                        />
                      </FilterSection>
                    </div>
                  </div>
                )}

                {/* Female Filters */}
                {(activeGender === 'both' || activeGender === 'female') && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        <Crown className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-purple-800">פילטרים לבנות</h4>
                    </div>

                    {/* Age Range */}
                    <FilterSection
                      title="טווח גיל"
                      icon={<Calendar className="w-4 h-4" />}
                      gradient="from-purple-500 to-pink-500"
                      badge={filters.femaleAgeRange ? 1 : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 text-center">
                          <p className="text-xs text-purple-600 mb-1">מינימום</p>
                          <SafeNumberInput
                            min={AGE_RANGE.min}
                            max={AGE_RANGE.max}
                            value={filters.femaleAgeRange?.min || AGE_RANGE.default.min}
                            onCommit={(val) => {
                              const currentMax = filters.femaleAgeRange?.max || AGE_RANGE.default.max;
                              onFiltersChange({
                                femaleAgeRange: { min: Math.min(val, currentMax), max: currentMax },
                              });
                            }}
                            className="w-full text-center border rounded-lg p-2 text-lg font-bold text-purple-700"
                          />
                        </div>
                        <span className="text-gray-400">—</span>
                        <div className="flex-1 text-center">
                          <p className="text-xs text-purple-600 mb-1">מקסימום</p>
                          <SafeNumberInput
                            min={AGE_RANGE.min}
                            max={AGE_RANGE.max}
                            value={filters.femaleAgeRange?.max || AGE_RANGE.default.max}
                            onCommit={(val) => {
                              const currentMin = filters.femaleAgeRange?.min || AGE_RANGE.default.min;
                              onFiltersChange({
                                femaleAgeRange: { min: currentMin, max: Math.max(val, currentMin) },
                              });
                            }}
                            className="w-full text-center border rounded-lg p-2 text-lg font-bold text-purple-700"
                          />
                        </div>
                      </div>
                      {filters.femaleAgeRange && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFiltersChange({ femaleAgeRange: undefined })}
                          className="w-full mt-2 text-gray-500 hover:text-gray-700"
                        >
                          נקה סינון גיל
                        </Button>
                      )}
                    </FilterSection>

                    {/* Religious Level */}
                    <div className="mt-3">
                      <FilterSection
                        title="רמה דתית"
                        icon={<Scroll className="w-4 h-4" />}
                        gradient="from-purple-500 to-pink-500"
                        badge={filters.femaleReligiousLevel?.length || undefined}
                      >
                        <ReligiousMultiSelect
                          selectedValues={filters.femaleReligiousLevel || []}
                          onChange={(values) => onFiltersChange({ femaleReligiousLevel: values })}
                        />
                      </FilterSection>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default PotentialMatchesFilters;