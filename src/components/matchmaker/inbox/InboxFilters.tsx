// src/components/matchmaker/inbox/InboxFilters.tsx
'use client';

import React, { useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Search, X, Inbox, Mail, CheckSquare, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InboxFilter } from '@/types/inbox';

interface InboxFiltersProps {
  activeFilter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalUnread: number;
  totalTodo: number;
  isHe: boolean;
}

const FILTER_CONFIG: Array<{
  key: InboxFilter;
  icon: React.ElementType;
  labelHe: string;
  labelEn: string;
}> = [
  { key: 'all', icon: Inbox, labelHe: 'הכל', labelEn: 'All' },
  { key: 'unread', icon: Mail, labelHe: 'לא נקראו', labelEn: 'Unread' },
  { key: 'todo', icon: CheckSquare, labelHe: 'לטיפול', labelEn: 'To Do' },
  { key: 'archived', icon: Archive, labelHe: 'ארכיון', labelEn: 'Archived' },
];

export default function InboxFilters({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  totalUnread,
  totalTodo,
  isHe,
}: InboxFiltersProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl">
        {FILTER_CONFIG.map(({ key, icon: Icon, labelHe, labelEn }) => {
          const isActive = activeFilter === key;
          const count = key === 'unread' ? totalUnread : key === 'todo' ? totalTodo : 0;

          return (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isHe ? labelHe : labelEn}</span>
              {count > 0 && (
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 min-w-[18px] h-4 border-0',
                    isActive
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400',
            isHe ? 'right-3' : 'left-3'
          )}
        />
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={isHe ? 'חיפוש לפי שם...' : 'Search by name...'}
          className={cn(
            'w-full py-2 rounded-lg border border-gray-200 bg-white text-sm transition-all',
            'focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400',
            'placeholder:text-gray-400',
            isHe ? 'pr-9 pl-9' : 'pl-9 pr-9'
          )}
          dir={isHe ? 'rtl' : 'ltr'}
        />
        {searchQuery && (
          <button
            onClick={() => {
              onSearchChange('');
              searchRef.current?.focus();
            }}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100',
              isHe ? 'left-2' : 'right-2'
            )}
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}
