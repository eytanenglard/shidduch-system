'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
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
  Heart,
  Moon,
  Loader2,
  AlertTriangle,
  Clock,
  Bookmark,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardErrorBoundary } from '@/components/ui/error-boundary';
import PotentialMatchCard from '../PotentialMatchCard';
import { Virtuoso } from 'react-virtuoso';
import { CandidateToHide } from '../HideCandidateDialog';
import type {
  PotentialMatchFilterStatus,
  PotentialMatchesStats as FullStatsType,
  Pagination,
} from '../types/potentialMatches';

export interface MatchesGridProps {
  // Data
  matches: any[];
  filteredMatches: any[];
  stats: FullStatsType | null;
  isLoading: boolean;
  error: string | null;
  // View
  viewMode: 'grid' | 'list';
  cardStyle: 'expanded' | 'compact';
  // Focus
  focusedMatchIndex: number;
  onFocusedMatchIndexChange: (index: number) => void;
  // Filters for empty/badge states
  filters: any;
  setFilters: (filters: any) => void;
  localSearchTerm: string;
  onResetFilters: () => void;
  onConfirmScanDialog: () => void;
  // Pagination
  pagination: Pagination;
  pageInput: string;
  onPageInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPageInputSubmit: () => void;
  onPageInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSetPage: (page: number) => void;
  onSetPageSize: (size: number) => void;
  // Actions
  onRefresh: () => void;
  onCreateSuggestion: (id: string) => void;
  onDismiss: (id: string) => void;
  onReview: (id: string) => void;
  onRestore: (id: string) => void;
  onSave: (id: string) => void;
  onViewProfile: (userId: string) => void;
  onAnalyzeCandidate: (candidate: any) => void;
  onProfileFeedback: (candidate: any) => void;
  onHideCandidate: (candidate: CandidateToHide) => void;
  onFilterByUser: (name: string) => void;
  hiddenCandidateIds: Set<string>;
  // Selection
  showBulkActions: boolean;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;
}

const MatchesGrid: React.FC<MatchesGridProps> = ({
  matches,
  filteredMatches,
  stats,
  isLoading,
  error,
  viewMode,
  cardStyle,
  focusedMatchIndex,
  onFocusedMatchIndexChange,
  filters,
  setFilters,
  localSearchTerm,
  onResetFilters,
  onConfirmScanDialog,
  pagination,
  pageInput,
  onPageInputChange,
  onPageInputSubmit,
  onPageInputKeyDown,
  onSetPage,
  onSetPageSize,
  onRefresh,
  onCreateSuggestion,
  onDismiss,
  onReview,
  onRestore,
  onSave,
  onViewProfile,
  onAnalyzeCandidate,
  onProfileFeedback,
  onHideCandidate,
  onFilterByUser,
  hiddenCandidateIds,
  showBulkActions,
  isSelected,
  toggleSelection,
}) => {
  // Render a single match card (shared between virtualized and standard rendering)
  const renderMatchCard = (match: any, index: number) => (
    <CardErrorBoundary key={match.id}>
      <div
        data-match-card
        className={cn(
          'transition-all duration-150',
          focusedMatchIndex === index && 'ring-2 ring-blue-400 ring-offset-2 rounded-xl'
        )}
        onClick={() => onFocusedMatchIndexChange(index)}
      >
        <PotentialMatchCard
          match={match as any}
          onCreateSuggestion={(id) => onCreateSuggestion(id)}
          onDismiss={(id) => onDismiss(id)}
          onReview={onReview}
          onRestore={onRestore}
          onSave={onSave}
          onViewProfile={onViewProfile}
          onAnalyzeCandidate={(candidate) => onAnalyzeCandidate(candidate)}
          onProfileFeedback={(candidate) => onProfileFeedback(candidate)}
          isSelected={isSelected(match.id)}
          onToggleSelect={showBulkActions ? toggleSelection : undefined}
          showSelection={showBulkActions}
          onHideCandidate={onHideCandidate}
          hiddenCandidateIds={hiddenCandidateIds}
          onFilterByUser={onFilterByUser}
          isCompact={cardStyle === 'compact'}
        />
      </div>
    </CardErrorBoundary>
  );

  return (
    <>
      {/* Quick Filter Badges */}
      {stats && (() => {
        const s = stats;
        return (
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: `ממתינות 7+ ימים`,
                active: !!filters.scannedBefore,
                onClick: () => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  setFilters({
                    status: 'pending' as PotentialMatchFilterStatus,
                    scannedBefore: filters.scannedBefore ? undefined : weekAgo.toISOString().split('T')[0],
                  } as any);
                },
                count: null as number | null,
                color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
                activeColor: 'bg-amber-200 text-amber-800 border-amber-400',
                icon: Clock,
              },
              {
                label: 'עם אזהרות',
                active: filters.status === 'with_warnings',
                onClick: () => setFilters({
                  status: filters.status === 'with_warnings' ? 'all' : 'with_warnings' as PotentialMatchFilterStatus,
                }),
                count: s.withWarnings as number | null,
                color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
                activeColor: 'bg-orange-200 text-orange-800 border-orange-400',
                icon: AlertTriangle,
              },
              {
                label: 'ציון 85+',
                active: filters.minScore === 85,
                onClick: () => setFilters({
                  minScore: filters.minScore === 85 ? 0 : 85,
                  maxScore: 100,
                  status: 'all' as PotentialMatchFilterStatus,
                }),
                count: s.highScore as number | null,
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
                activeColor: 'bg-emerald-200 text-emerald-800 border-emerald-400',
                icon: Sparkles,
              },
              {
                label: 'שמורים בצד',
                active: filters.status === 'shortlisted',
                onClick: () => setFilters({
                  status: filters.status === 'shortlisted' ? 'all' : 'shortlisted' as PotentialMatchFilterStatus,
                }),
                count: null as number | null,
                color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
                activeColor: 'bg-purple-200 text-purple-800 border-purple-400',
                icon: Bookmark,
              },
            ].map((badge) => {
              const IconComp = badge.icon;
              return (
                <button
                  key={badge.label}
                  onClick={badge.onClick}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                    badge.active ? badge.activeColor : badge.color
                  )}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  {badge.label}
                  {badge.count !== null && badge.count > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/60 text-[10px] font-bold">
                      {badge.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Error State */}
      {error && (
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              נסה שוב
            </Button>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && matches.length === 0 && (
        <Card className="p-12 text-center border-0 shadow-lg">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">
            לא נמצאו התאמות
          </h3>
          <p className="text-gray-500 mb-6">
            {localSearchTerm
              ? 'לא נמצאו תוצאות התואמות את החיפוש שלך.'
              : filters.status !== 'all'
                ? 'נסה לשנות את הפילטרים או לחפש בכל ההתאמות.'
                : 'הפעל סריקה לילית למציאת התאמות חדשות.'}
          </p>
          {localSearchTerm || filters.status !== 'all' ? (
            <Button variant="outline" onClick={onResetFilters}>
              נקה חיפוש ופילטרים
            </Button>
          ) : (
            <Button onClick={onConfirmScanDialog}>
              <Moon className="w-4 h-4 ml-2" />
              הפעל סריקה
            </Button>
          )}
        </Card>
      )}

      {/* Matches Grid / List */}
      {!isLoading && matches.length > 0 && (
        <>
          {/* Virtualized list for list/compact mode with many items */}
          {viewMode === 'list' && filteredMatches.length > 20 ? (
            <Virtuoso
              useWindowScroll
              totalCount={filteredMatches.length}
              overscan={5}
              itemContent={(index) => {
                const match = filteredMatches[index];
                return (
                  <div className={cn('pb-3', cardStyle === 'compact' ? 'pb-2' : 'pb-4')}>
                    {renderMatchCard(match, index)}
                  </div>
                );
              }}
            />
          ) : (
            /* Standard grid rendering */
            <div
              className={cn(
                'grid',
                cardStyle === 'compact' ? 'gap-3' : 'gap-4 sm:gap-6',
                viewMode === 'grid'
                  ? cardStyle === 'compact'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              )}
            >
              <AnimatePresence mode="popLayout">
                {filteredMatches.map((match, index) =>
                  renderMatchCard(match, index)
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          <Card className="p-4 border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  מציג {(pagination.page - 1) * pagination.pageSize + 1} -{' '}
                  {Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total
                  )}{' '}
                  מתוך {pagination.total}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  <span className="text-sm text-gray-600">עמוד</span>
                  <Input
                    className="h-8 w-12 text-center p-0"
                    value={pageInput}
                    onChange={onPageInputChange}
                    onBlur={onPageInputSubmit}
                    onKeyDown={onPageInputKeyDown}
                  />
                  <span className="text-sm text-gray-600">
                    מתוך {pagination.totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>

              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => onSetPageSize(parseInt(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </>
      )}
    </>
  );
};

export default MatchesGrid;
