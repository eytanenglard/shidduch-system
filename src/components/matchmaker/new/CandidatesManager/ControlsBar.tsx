'use client';

import React from 'react';
import {
  Filter,
  LayoutGrid,
  List,
  ArrowUpDown,
  UserCircle,
  View,
  Columns,
  Users,
  UserX,
  Tag,
  X,
  Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import SearchBar from '../Filters/SearchBar';
import FilterPanel from '../Filters/FilterPanel';
import ActiveFilters from '../Filters/ActiveFilters';
import { cn } from '@/lib/utils';
import { SORT_OPTIONS, VIEW_OPTIONS } from '../constants/filterOptions';
import type { ViewMode, MobileView, CandidatesFilter } from '../types/candidates';
import type { FilterState, SavedFilter, FilterOption } from '../types/filters';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface ControlsBarProps {
  // Search
  searchQuery: string;
  onSearch: (value: string) => void;
  recentSearches: string[];
  onClearRecentSearches: () => void;

  // Filters
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onSavePreset: (name: string) => void;
  onResetFilters: () => void;
  savedFilters: SavedFilter[];
  popularFilters: string[];
  activeFilters: FilterOption[];
  activeFilterCount: number;
  onRemoveFilter: (key: keyof FilterState, value?: string) => void;

  // Separate filtering
  separateFiltering: boolean;
  onToggleSeparateFiltering: () => void;
  onMaleFiltersChange: (filters: Partial<FilterState>) => void;
  onFemaleFiltersChange: (filters: Partial<FilterState>) => void;
  onCopyFilters: (source: 'male' | 'female', target: 'male' | 'female') => void;

  // Sort
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;

  // View
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  mobileView: MobileView;
  onMobileViewChange: (mode: MobileView) => void;
  isMobile: boolean;

  // Virtual search
  onOpenSavedVirtualProfiles: () => void;

  // Filters panel
  showFiltersPanel: boolean;
  onToggleFiltersPanel: () => void;
  showFiltersMobile: boolean;
  onSetFiltersMobile: (show: boolean) => void;

  // Tags
  matchmakerTags?: Array<{ id: string; name: string; color: string; candidateCount: number }>;

  // Presets
  onLoadPreset?: (id: string) => void;

  // Page size
  pageSize: number;
  totalCount: number;
  onPageSizeChange: (size: number) => void;

  // Locale & dict
  locale: string;
  dict: MatchmakerPageDictionary;
}

const ControlsBar: React.FC<ControlsBarProps> = ({
  searchQuery,
  onSearch,
  recentSearches,
  onClearRecentSearches,
  filters,
  onFiltersChange,
  onSavePreset,
  onResetFilters,
  savedFilters,
  popularFilters,
  activeFilters,
  activeFilterCount,
  onRemoveFilter,
  separateFiltering,
  onToggleSeparateFiltering,
  onMaleFiltersChange,
  onFemaleFiltersChange,
  onCopyFilters,
  onSortChange,
  viewMode,
  onViewModeChange,
  mobileView,
  onMobileViewChange,
  isMobile,
  onOpenSavedVirtualProfiles,
  showFiltersPanel,
  onToggleFiltersPanel,
  showFiltersMobile,
  onSetFiltersMobile,
  matchmakerTags = [],
  onLoadPreset,
  pageSize,
  totalCount,
  onPageSizeChange,
  locale,
  dict,
}) => {
  const direction = locale === 'he' ? 'rtl' : 'ltr';
  const cmDict = dict.candidatesManager;

  return (
    <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 py-3 px-4 mt-16">
      <div className="container mx-auto px-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          {!separateFiltering && (
            <div className="w-full md:flex-1 md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={onSearch}
                placeholder={cmDict.searchBar.generalPlaceholder}
                recentSearches={recentSearches}
                onClearRecentSearches={onClearRecentSearches}
                dict={cmDict.searchBar}
              />
            </div>
          )}

          <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-2 flex-wrap">
            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 shadow-sm border border-gray-200"
                >
                  <ArrowUpDown
                    className={cn(
                      'w-4 h-4',
                      locale === 'he' ? 'ml-1' : 'mr-1'
                    )}
                  />
                  {cmDict.controls.sort}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{cmDict.controls.sortBy}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() =>
                      onSortChange(
                        option.value,
                        option.defaultOrder as 'asc' | 'desc'
                      )
                    }
                  >
                    {
                      cmDict.sortOptions[
                        option.value as keyof typeof cmDict.sortOptions
                      ]
                    }
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Preset Switcher */}
            {savedFilters.length > 0 && onLoadPreset && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'shadow-sm border',
                      filters.savedFilterId
                        ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                        : 'bg-white/90 border-gray-200'
                    )}
                  >
                    <Bookmark className={cn('w-4 h-4', locale === 'he' ? 'ml-1' : 'mr-1')} />
                    {filters.savedFilterId
                      ? savedFilters.find((f) => f.id === filters.savedFilterId)?.name || 'פריסט'
                      : 'פריסטים'}
                    {savedFilters.length > 0 && (
                      <Badge variant="secondary" className="mr-1 h-4 min-w-[16px] px-1 text-[10px]">
                        {savedFilters.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuLabel>פריסטים שמורים</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {savedFilters.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      onClick={() => onLoadPreset(preset.id)}
                      className={cn(
                        'flex items-center justify-between',
                        filters.savedFilterId === preset.id && 'bg-amber-50 font-medium'
                      )}
                    >
                      <span>{preset.name}</span>
                      {preset.isDefault && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1">ברירת מחדל</Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {filters.savedFilterId && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onResetFilters} className="text-gray-500">
                        <X className="w-3.5 h-3.5 ml-1" />
                        נקה פריסט
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Quick filter: No suggestions */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  hasNoSuggestions: !filters.hasNoSuggestions,
                })
              }
              className={cn(
                'shadow-sm border',
                filters.hasNoSuggestions
                  ? 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200'
                  : 'bg-white/90 border-gray-200'
              )}
            >
              <UserX
                className={cn(
                  'w-4 h-4',
                  locale === 'he' ? 'ml-1' : 'mr-1'
                )}
              />
              ללא הצעות
            </Button>

            {/* Tag filter */}
            {matchmakerTags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'shadow-sm border',
                      filters.customTags?.length
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-700 hover:bg-indigo-200'
                        : 'bg-white/90 border-gray-200'
                    )}
                  >
                    <Tag
                      className={cn(
                        'w-4 h-4',
                        locale === 'he' ? 'ml-1' : 'mr-1'
                      )}
                    />
                    תגיות
                    {filters.customTags?.length ? (
                      <Badge className="h-4 px-1 ms-1 bg-indigo-500 text-white text-[10px]">
                        {filters.customTags.length}
                      </Badge>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>סנן לפי תגית</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {matchmakerTags.map((tag) => {
                    const isActive = filters.customTags?.includes(tag.id);
                    return (
                      <DropdownMenuItem
                        key={tag.id}
                        onClick={() => {
                          const current = filters.customTags ?? [];
                          const next = isActive
                            ? current.filter((id) => id !== tag.id)
                            : [...current, tag.id];
                          onFiltersChange({ customTags: next });
                        }}
                        className="flex items-center gap-2"
                      >
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1">{tag.name}</span>
                        {isActive && (
                          <span className="text-indigo-500 font-bold text-xs">✓</span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  {filters.customTags?.length ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onFiltersChange({ customTags: [] })}
                        className="text-red-500"
                      >
                        <X className="w-3 h-3 me-1" />
                        נקה סינון תגיות
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Virtual search */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSavedVirtualProfiles}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 hover:opacity-90 shadow-sm"
            >
              <UserCircle
                className={cn(
                  'w-4 h-4',
                  locale === 'he' ? 'ml-1' : 'mr-1'
                )}
              />
              חיפוש וירטואלי
            </Button>

            {/* Desktop filters toggle */}
            <div className="hidden lg:flex">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleFiltersPanel}
                className="bg-white/90 shadow-sm border border-gray-200"
              >
                <Filter className="w-4 h-4 ml-1" />
                {showFiltersPanel
                  ? cmDict.controls.hideFilters
                  : cmDict.controls.filters}
              </Button>
            </div>

            {/* Mobile filters sheet */}
            <Sheet open={showFiltersMobile} onOpenChange={onSetFiltersMobile}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden relative bg-white/90 shadow-sm border border-gray-200"
                >
                  <Filter className="w-4 h-4 ml-1" />
                  {cmDict.controls.filters}
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-indigo-500 border-0 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                className="w-full h-full flex flex-col p-0 sm:max-w-md"
                side={direction === 'rtl' ? 'right' : 'left'}
              >
                <div className="flex-1 overflow-y-auto p-4 pt-10">
                  <FilterPanel
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                    onSavePreset={onSavePreset}
                    onReset={onResetFilters}
                    savedFilters={savedFilters.map((f) => ({
                      id: f.id,
                      name: f.name,
                      isDefault: f.isDefault,
                    }))}
                    popularFilters={popularFilters}
                    separateFiltering={separateFiltering}
                    onToggleSeparateFiltering={onToggleSeparateFiltering}
                    onMaleFiltersChange={onMaleFiltersChange}
                    onFemaleFiltersChange={onFemaleFiltersChange}
                    onCopyFilters={onCopyFilters}
                    dict={cmDict.filterPanel}
                    className="pb-10"
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Page size selector */}
            <div className="flex items-center gap-1.5">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => onPageSizeChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[80px] bg-white/90 shadow-sm border border-gray-200 text-sm">
                  <SelectValue>{pageSize === 0 ? 'הכל' : pageSize}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">הכל</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500 hidden sm:inline">
                ({totalCount})
              </span>
            </div>

            {/* View mode switcher */}
            <div className="flex gap-1 bg-white/90 p-1 rounded-lg shadow-sm border border-gray-200">
              {isMobile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-24 justify-between px-2 border-0"
                    >
                      {mobileView === 'split' && (
                        <Users className="w-4 h-4" />
                      )}
                      {mobileView === 'single' && (
                        <View className="w-4 h-4" />
                      )}
                      {mobileView === 'double' && (
                        <Columns className="w-4 h-4" />
                      )}
                      <ArrowUpDown className="w-3 h-3 opacity-50 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup
                      value={mobileView}
                      onValueChange={(value) =>
                        onMobileViewChange(value as MobileView)
                      }
                    >
                      <DropdownMenuRadioItem value="split">
                        <Users className="w-4 h-4 mr-2" />
                        {cmDict.controls.mobile.split}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="single">
                        <View className="w-4 h-4 mr-2" />
                        {cmDict.controls.mobile.singleCol}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="double">
                        <Columns className="w-4 h-4 mr-2" />
                        {cmDict.controls.mobile.doubleCol}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                VIEW_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={viewMode === option.value ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => onViewModeChange(option.value as ViewMode)}
                    className={cn(
                      'h-8 w-8',
                      viewMode === option.value && 'bg-indigo-500 text-white'
                    )}
                  >
                    {option.value === 'grid' ? (
                      <LayoutGrid className="w-4 h-4" />
                    ) : (
                      <List className="w-4 h-4" />
                    )}
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <ActiveFilters
            filters={filters}
            onRemoveFilter={onRemoveFilter}
            onResetAll={onResetFilters}
            dict={dict.candidatesManager.activeFilters}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ControlsBar);
