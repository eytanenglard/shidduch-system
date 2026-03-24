'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Search,
  Check,
  X,
  LayoutGrid,
  List,
  Minimize2,
  Maximize2,
  Heart,
  Clock,
  Eye,
  Send,
  Bookmark,
  AlertTriangle,
  CheckCircle,
  Keyboard,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PotentialMatchesFilters from '../PotentialMatchesFilters';
import type {
  PotentialMatchFilterStatus,
  PotentialMatchSortBy,
} from '../types/potentialMatches';

// Re-export these constants so other files can use them if needed
export const STATUS_OPTIONS: {
  value: PotentialMatchFilterStatus;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: 'all', label: 'הכל', icon: Heart },
  { value: 'pending', label: 'ממתינות', icon: Clock },
  { value: 'reviewed', label: 'נבדקו', icon: Eye },
  { value: 'sent', label: 'נשלחו', icon: Send },
  { value: 'shortlisted', label: 'שמורים בצד', icon: Bookmark },
  { value: 'dismissed', label: 'נדחו', icon: X },
  { value: 'with_warnings', label: 'עם אזהרות', icon: AlertTriangle },
  { value: 'no_warnings', label: 'ללא אזהרות', icon: CheckCircle },
];

export const SORT_OPTIONS: { value: PotentialMatchSortBy; label: string }[] = [
  { value: 'score_desc', label: 'ציון (גבוה לנמוך)' },
  { value: 'score_asc', label: 'ציון (נמוך לגבוה)' },
  { value: 'date_desc', label: 'תאריך (חדש לישן)' },
  { value: 'date_asc', label: 'תאריך (ישן לחדש)' },
  { value: 'male_waiting_time', label: 'זמן המתנה (גבר)' },
  { value: 'female_waiting_time', label: 'זמן המתנה (אישה)' },
  { value: 'asymmetry_desc', label: 'פער א-סימטריה (גדול לקטן)' },
];

export interface MatchesToolbarProps {
  // Search
  localSearchTerm: string;
  onLocalSearchTermChange: (term: string) => void;
  // Filters
  filters: any;
  setFilters: (filters: any) => void;
  resetFilters: () => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  // View mode
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  cardStyle: 'expanded' | 'compact';
  onCardStyleChange: (style: 'expanded' | 'compact') => void;
  // Bulk actions toggle
  showBulkActions: boolean;
  onToggleBulkActions: () => void;
  // Mobile
  mobileFiltersOpen: boolean;
  onMobileFiltersOpenChange: (open: boolean) => void;
}

const MatchesToolbar: React.FC<MatchesToolbarProps> = ({
  localSearchTerm,
  onLocalSearchTermChange,
  filters,
  setFilters,
  resetFilters,
  onResetFilters,
  activeFilterCount,
  viewMode,
  onViewModeChange,
  cardStyle,
  onCardStyleChange,
  showBulkActions,
  onToggleBulkActions,
  mobileFiltersOpen,
  onMobileFiltersOpenChange,
}) => {
  return (
    <Card className="p-3 md:p-4 border-0 shadow-lg sticky top-[73px] z-30 bg-white/95 backdrop-blur-sm">
      {/* ===== Mobile Filters Bar (below md) ===== */}
      <div className="flex md:hidden items-center gap-2">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש לפי שם..."
            value={localSearchTerm}
            onChange={(e) => onLocalSearchTermChange(e.target.value)}
            className="pr-10 h-9 text-sm"
          />
        </div>

        {/* Mobile Filters Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMobileFiltersOpenChange(true)}
          className="relative shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4 ml-1" />
          פילטרים
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -left-1.5 bg-purple-600 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] min-h-[18px] leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {/* View Mode (compact on mobile) */}
        <div className="flex items-center gap-0.5 border rounded-lg p-0.5 shrink-0">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onViewModeChange('grid')}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onViewModeChange('list')}
          >
            <List className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Card Style Toggle (compact on mobile) */}
        <div className="flex items-center gap-0.5 border rounded-lg p-0.5 shrink-0">
          <Button
            variant={cardStyle === 'expanded' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onCardStyleChange('expanded')}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={cardStyle === 'compact' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onCardStyleChange('compact')}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ===== Mobile Filters Sheet ===== */}
      <Sheet open={mobileFiltersOpen} onOpenChange={onMobileFiltersOpenChange}>
        <SheetContent side="right" className="w-[85vw] sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-right">פילטרים</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-5 mt-4 text-right">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">סטטוס</label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ status: value as PotentialMatchFilterStatus })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="w-4 h-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">מיון</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters({ sortBy: value as any })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="מיון" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Score Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">טווח ציונים</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.minScore}
                  onChange={(e) =>
                    setFilters({ minScore: parseInt(e.target.value) || 0 })
                  }
                  className="flex-1 text-center"
                />
                <span className="text-gray-400">&mdash;</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={filters.maxScore}
                  onChange={(e) =>
                    setFilters({ maxScore: parseInt(e.target.value) || 100 })
                  }
                  className="flex-1 text-center"
                />
              </div>
            </div>

            {/* Advanced Filters (embedded in sheet) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">פילטרים מתקדמים</label>
              <PotentialMatchesFilters
                filters={filters}
                onFiltersChange={setFilters}
                onReset={resetFilters}
              />
            </div>

            {/* Bulk Selection Toggle */}
            <Button
              variant={showBulkActions ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleBulkActions}
              className="w-full"
            >
              <Check className="w-4 h-4 ml-1" />
              בחירה מרובה
            </Button>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onResetFilters();
                  onMobileFiltersOpenChange(false);
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 ml-1" />
                נקה הכל
              </Button>
              <Button
                size="sm"
                onClick={() => onMobileFiltersOpenChange(false)}
                className="flex-1"
              >
                הצג תוצאות
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== Desktop Filters Bar (md and above) ===== */}
      <div className="hidden md:flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חיפוש לפי שם (לדוגמה: ישראל ישראלי)..."
            value={localSearchTerm}
            onChange={(e) => onLocalSearchTermChange(e.target.value)}
            className="pr-10"
          />
        </div>
        {/* Advanced Filters */}
        <PotentialMatchesFilters
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters({ status: value as PotentialMatchFilterStatus })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            setFilters({ sortBy: value as any })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="מיון" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Score Range */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">ציון:</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={filters.minScore}
            onChange={(e) =>
              setFilters({ minScore: parseInt(e.target.value) || 0 })
            }
            className="w-16 text-center"
          />
          <span>-</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={filters.maxScore}
            onChange={(e) =>
              setFilters({ maxScore: parseInt(e.target.value) || 100 })
            }
            className="w-16 text-center"
          />
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            title="תצוגת רשת"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            title="תצוגת רשימה"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Card Style Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={cardStyle === 'expanded' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onCardStyleChange('expanded')}
            title="כרטיסים מורחבים"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
          <Button
            variant={cardStyle === 'compact' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onCardStyleChange('compact')}
            title="כרטיסים מצומצמים"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Bulk Selection Toggle */}
        <Button
          variant={showBulkActions ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleBulkActions}
        >
          <Check className="w-4 h-4 ml-1" />
          בחירה מרובה
        </Button>

        {/* Reset Filters */}
        <Button variant="ghost" size="sm" onClick={onResetFilters}>
          <X className="w-4 h-4 ml-1" />
          נקה פילטרים
        </Button>

        {/* Keyboard Shortcuts Hint */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-gray-400 border-r pr-3 mr-1">
          <Keyboard className="w-3.5 h-3.5" />
          <span>J/K ניווט</span>
          <span>&middot;</span>
          <span>S שמור</span>
          <span>&middot;</span>
          <span>D דחה</span>
          <span>&middot;</span>
          <span>Enter הצעה</span>
        </div>
      </div>
    </Card>
  );
};

export default MatchesToolbar;
