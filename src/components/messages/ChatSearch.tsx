// =============================================================================
// src/components/messages/ChatSearch.tsx
// =============================================================================
//
// Slide-down search bar for searching across chat messages.
// Real-time results with 300ms debounce, highlighted matches,
// scrollable result list.
//
// Usage:
//   <ChatSearch
//     open={isSearchOpen}
//     searchUrl="/api/messages/search"
//     isHe={true}
//     onResultClick={(messageId, conversationId, type) => { ... }}
//   />
// =============================================================================

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, X, Loader2 } from 'lucide-react';

// ==========================================
// Types
// ==========================================

interface SearchResult {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
  conversationId: string;
  conversationType: 'direct' | 'suggestion';
  suggestionContext?: string;
  candidateName?: string;
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface ChatSearchProps {
  onResultClick: (
    messageId: string,
    conversationId: string,
    conversationType: 'direct' | 'suggestion'
  ) => void;
  searchUrl: string;
  isHe: boolean;
  open: boolean;
}

// ==========================================
// Dictionary
// ==========================================

const dict = {
  he: {
    placeholder: 'חיפוש בהודעות...',
    noResults: 'לא נמצאו תוצאות',
    noResultsHint: 'נסה/י מילות חיפוש אחרות',
    results: 'תוצאות',
    directChat: 'צ\'אט ישיר',
    suggestion: 'הצעה',
    loading: 'מחפש...',
    typeToSearch: 'הקלד/י כדי לחפש בהודעות',
  },
  en: {
    placeholder: 'Search messages...',
    noResults: 'No results found',
    noResultsHint: 'Try different search terms',
    results: 'results',
    directChat: 'Direct chat',
    suggestion: 'Suggestion',
    loading: 'Searching...',
    typeToSearch: 'Type to search messages',
  },
};

// ==========================================
// Helpers
// ==========================================

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  // Escape special regex characters in the query
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function formatTimestamp(iso: string, isHe: boolean): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(isHe ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (diffDays === 1) {
    return isHe ? 'אתמול' : 'Yesterday';
  }

  if (diffDays < 7) {
    return date.toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
      weekday: 'short',
    });
  }

  return date.toLocaleDateString(isHe ? 'he-IL' : 'en-US', {
    day: 'numeric',
    month: 'short',
  });
}

function truncateContent(content: string, maxLen: number = 120): string {
  if (content.length <= maxLen) return content;
  return content.slice(0, maxLen) + '...';
}

// ==========================================
// Component
// ==========================================

export default function ChatSearch({
  open,
  searchUrl,
  isHe,
  onResultClick,
}: ChatSearchProps) {
  const t = isHe ? dict.he : dict.en;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to allow the slide animation to start
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Reset state when closed
      setQuery('');
      setResults([]);
      setTotalCount(0);
      setHasSearched(false);
    }
  }, [open]);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setTotalCount(0);
        setHasSearched(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery,
          scope: 'all',
          limit: '20',
        });
        const res = await fetch(`${searchUrl}?${params}`);
        if (!res.ok) throw new Error('Search failed');

        const data: SearchResponse = await res.json();
        if (data.success) {
          setResults(data.results);
          setTotalCount(data.totalCount);
        }
      } catch (error) {
        console.error('[ChatSearch] Search error:', error);
        setResults([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    },
    [searchUrl]
  );

  // Debounce effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setTotalCount(0);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setTotalCount(0);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  if (!open) return null;

  return (
    <div
      className={cn(
        'border-b bg-white shadow-sm',
        'animate-in slide-in-from-top duration-200'
      )}
      dir={isHe ? 'rtl' : 'ltr'}
    >
      {/* Search Input */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400',
              isHe ? 'right-3' : 'left-3'
            )}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.placeholder}
            className={cn(
              'w-full py-2 rounded-lg border border-gray-200 bg-gray-50/80',
              'text-sm text-gray-800 placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-300',
              'transition-colors',
              'px-10'
            )}
            dir={isHe ? 'rtl' : 'ltr'}
          />
          {/* Clear / Loading indicator */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2',
              isHe ? 'left-3' : 'right-3'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
            ) : query ? (
              <button
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                type="button"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Results count */}
        {hasSearched && !isLoading && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {totalCount} {t.results}
            </span>
          </div>
        )}
      </div>

      {/* Results List */}
      {(hasSearched || isLoading) && (
        <ScrollArea className="max-h-[350px]">
          {isLoading && !hasSearched ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
              <span className="text-sm text-gray-500 ms-2">{t.loading}</span>
            </div>
          ) : results.length === 0 && hasSearched ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <Search className="w-10 h-10 text-gray-200 mb-2" />
              <p className="text-sm font-medium text-gray-500">{t.noResults}</p>
              <p className="text-xs text-gray-400 mt-1">{t.noResultsHint}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() =>
                    onResultClick(
                      result.id,
                      result.conversationId,
                      result.conversationType
                    )
                  }
                  className={cn(
                    'w-full px-4 py-3 text-start transition-colors',
                    'hover:bg-teal-50/50 active:bg-teal-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Sender + badge */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-gray-700 truncate">
                        {result.senderName}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] px-1.5 py-0 h-4 flex-shrink-0',
                          result.conversationType === 'direct'
                            ? 'border-blue-200 text-blue-600 bg-blue-50'
                            : 'border-purple-200 text-purple-600 bg-purple-50'
                        )}
                      >
                        {result.conversationType === 'direct'
                          ? t.directChat
                          : t.suggestion}
                      </Badge>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[11px] text-gray-400 flex-shrink-0 mt-0.5">
                      {formatTimestamp(result.createdAt, isHe)}
                    </span>
                  </div>

                  {/* Suggestion context (if applicable) */}
                  {result.suggestionContext && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      {result.suggestionContext}
                    </p>
                  )}

                  {/* Message preview with highlighted match */}
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2">
                    {highlightMatch(truncateContent(result.content), query)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Initial state — no query yet */}
      {!hasSearched && !isLoading && !query && (
        <div className="flex items-center justify-center py-6 text-center px-4">
          <p className="text-xs text-gray-400">{t.typeToSearch}</p>
        </div>
      )}
    </div>
  );
}
