// SearchBar.tsx - גרסה סופית ומתקדמת עם תיקון z-index ו-RTL
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  History,
  Sparkles,
  Target,
  Crown,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { Candidate } from '../types/candidates';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from '@/components/ui/popover';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (candidate: Candidate) => void;
  recentSearches?: string[];
  onSaveSearch?: (value: string) => void;
  onClearRecentSearches?: () => void;
  suggestions?: Candidate[];
  loading?: boolean;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  genderTarget?: 'male' | 'female' | 'all';
  separateMode?: boolean;
  dict: MatchmakerPageDictionary['candidatesManager']['searchBar'];
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSelect,
  recentSearches = [],
  onSaveSearch,
  onClearRecentSearches,
  suggestions = [],
  loading = false,
  className = '',
  placeholder, // We will now primarily use the placeholder from dict
  autoFocus = false,
  genderTarget = 'all',
  separateMode = false,
  dict,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  const searchCategories = [
    { id: 'name', label: dict.categories.name, icon: <Star className="w-3 h-3" />, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'city', label: dict.categories.city, icon: <Target className="w-3 h-3" />, gradient: 'from-emerald-500 to-green-500' },
    { id: 'occupation', label: dict.categories.occupation, icon: <Zap className="w-3 h-3" />, gradient: 'from-purple-500 to-pink-500' },
    { id: 'all', label: dict.categories.all, icon: <Sparkles className="w-3 h-3" />, gradient: 'from-indigo-500 to-purple-500' },
  ];
  const [searchCategory, setSearchCategory] = useState<string>('all');


  const getSearchPlaceholder = () => {
    if (placeholder) return placeholder; // Allow override
    if (separateMode) {
      if (genderTarget === 'male') return dict.malePlaceholder;
      if (genderTarget === 'female') return dict.femalePlaceholder;
    }
    return dict.generalPlaceholder;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  const handleSearch = (searchValue: string) => {
    if (searchValue.trim()) {
      onChange(searchValue.trim());
      if (onSaveSearch) {
        onSaveSearch(searchValue.trim());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      handleSearch(inputValue);
      setShowDropdown(false);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleSuggestionSelect = (candidate: Candidate) => {
    if (onSelect) {
      onSelect(candidate);
    } else {
      const searchText = `${candidate.firstName} ${candidate.lastName}`;
      setInputValue(searchText);
      onChange(searchText);
    }
    setShowDropdown(false);
  };

  const getStyling = () => {
    if (!separateMode || genderTarget === 'all') {
      return { gradient: 'from-indigo-500 via-purple-500 to-pink-500', ring: 'focus:ring-purple-200', badge: 'bg-gradient-to-r from-indigo-500 to-purple-500' };
    }
    if (genderTarget === 'male') {
      return { gradient: 'from-blue-500 to-cyan-500', ring: 'focus:ring-blue-200', badge: 'bg-gradient-to-r from-blue-500 to-cyan-500' };
    }
    return { gradient: 'from-purple-500 to-pink-500', ring: 'focus:ring-purple-200', badge: 'bg-gradient-to-r from-purple-500 to-pink-500' };
  };

  const styling = getStyling();

  return (
    <Popover open={showDropdown} onOpenChange={setShowDropdown}>
      <div className={cn('relative group', className)}>
        <PopoverAnchor asChild>
          <motion.div
            className={cn('relative flex items-center rounded-2xl shadow-xl transition-all duration-300 backdrop-blur-sm border-0', `bg-gradient-to-r from-white via-gray-50/30 to-white`, isFocused || isHovered ? 'shadow-2xl scale-[1.02]' : 'shadow-lg', isFocused && `ring-2 ${styling.ring}`)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className={cn('absolute inset-0 bg-gradient-to-r opacity-5 rounded-2xl', styling.gradient)} />

            {separateMode && genderTarget !== 'all' && (
              <motion.div className="absolute left-4 top-1/2 -translate-y-1/2 z-10" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
                <Badge className={cn('text-white border-0 shadow-lg font-bold px-3 py-1.5 rounded-xl', styling.badge)}>
                  <div className="flex items-center gap-2">
                    {genderTarget === 'male' ? <Target className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                    {genderTarget === 'male' ? dict.tooltips.maleTarget : dict.tooltips.femaleTarget}
                  </div>
                </Badge>
              </motion.div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { setShowDropdown(true); setIsFocused(true); }}
              onBlur={() => setIsFocused(false)}
              placeholder={getSearchPlaceholder()}
              className={cn('w-full h-14 bg-transparent border-0 rounded-2xl text-lg font-medium relative z-10', 'placeholder:text-gray-500 text-gray-800', 'focus:outline-none transition-all duration-200', separateMode ? 'pl-32 pr-16' : 'pl-6 pr-16')}
              autoFocus={autoFocus}
              autoComplete="off"
              spellCheck="false"
            />

            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
              <motion.div
                animate={{ rotate: loading ? 360 : 0, scale: isHovered || isFocused ? 1.1 : 1 }}
                transition={{ rotate: { duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }, scale: { duration: 0.2 } }}
                className={cn('p-2.5 rounded-full text-white shadow-lg', `bg-gradient-to-r ${styling.gradient}`)}
              >
                <Search className="w-5 h-5" />
              </motion.div>
            </div>

            <AnimatePresence>
              {inputValue && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className={cn('absolute top-1/2 -translate-y-1/2 z-10', separateMode ? 'left-32' : 'left-4')}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" onClick={handleClear} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-md">
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent><p>{dict.clearTooltip}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-2xl pointer-events-none"></div>
          </motion.div>
        </PopoverAnchor>
      </div>

      <PopoverContent onOpenAutoFocus={(e) => e.preventDefault()} className="w-[--radix-popover-trigger-width] p-0 mt-2 z-[99] border-0 shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
        <div className={cn('p-4 bg-gradient-to-r text-white', styling.gradient)}>
          <div className="flex items-center justify-between mb-3 text-right">
            <div className="text-sm opacity-90">{dict.resultsCount.replace('{{count}}', String(suggestions.length))}</div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{dict.smartSearch}</span>
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-white/70" />
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 pr-10 py-2 text-sm text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-right"
              placeholder={dict.filterResultsPlaceholder}
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading === false && suggestions.length === 0 && recentSearches.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-gray-400" /></div>
              <h3 className="font-bold text-gray-800 mb-2">{dict.noResultsTitle}</h3>
              <p className="text-sm text-gray-500">{dict.noResultsDescription}</p>
            </motion.div>
          )}

          {loading === true && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-gray-400 animate-pulse" /></div>
              <h3 className="font-bold text-gray-800 mb-2">מחפש...</h3>
              <p className="text-sm text-gray-500">אנא המתן...</p>
            </motion.div>
          )}

          {recentSearches.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100/50">
                <div className="flex justify-between items-center">
                  {onClearRecentSearches && (<Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onClearRecentSearches(); }} className="h-6 text-xs text-gray-500 hover:text-gray-700 px-2">{dict.clearHistory}</Button>)}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{dict.recentSearches}</span>
                    <History className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>
              <div className="p-2">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <motion.div key={`recent-${index}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 rounded-xl cursor-pointer transition-all duration-200 group" onClick={() => { handleSearch(search); setShowDropdown(false); }}>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"><Zap className="w-3 h-3 text-blue-500" /></div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{search}</span>
                    <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-cyan-100 group-hover:from-blue-200 group-hover:to-cyan-200 transition-all duration-200"><History className="h-3 w-3 text-blue-600" /></div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div>
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-100">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-medium text-emerald-800">{dict.matchingResults.replace('{{count}}', String(suggestions.length))}</span>
                  <Star className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="p-2 space-y-1">
                {suggestions.map((candidate, index) => (
                  <motion.div key={candidate.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="flex items-center gap-3 px-3 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl cursor-pointer transition-all duration-200 group" onClick={() => handleSuggestionSelect(candidate)}>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity"><div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100"><Sparkles className="w-3 h-3 text-purple-600" /></div></div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="font-medium text-gray-800 group-hover:text-purple-700 transition-colors">{`${candidate.firstName} ${candidate.lastName}`}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{[candidate.profile.city, candidate.profile.occupation, candidate.profile.religiousLevel].filter(Boolean).join(' • ')}</div>
                    </div>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <span className="text-sm font-bold text-purple-600">{candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}</span>
                      </div>
                      {candidate.isVerified && (<div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center"><Star className="w-2 h-2 text-white" /></div>)}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div className="md:hidden border-t border-gray-100">
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-end gap-2 mb-3">
                <span className="text-sm font-medium text-indigo-800">חפש לפי קטגוריה</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {searchCategories.map((category) => (
                  <motion.div key={category.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant={searchCategory === category.id ? 'default' : 'outline'} size="sm" className={cn('w-full justify-start gap-2 rounded-xl transition-all duration-200', searchCategory === category.id ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg border-0` : 'bg-white/80 hover:bg-white border border-gray-200 hover:border-gray-300')} onClick={() => setSearchCategory(category.id)}>
                      {category.icon}
                      <span className="text-xs">{category.label}</span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-100">
            <div className="flex items-start gap-2 text-right">
              <Sparkles className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600 leading-relaxed"><span className="font-medium">{dict.tip}</span> {dict.tipContent}</div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SearchBar;