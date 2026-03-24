'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Heart,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface EmptyStateVariantProps {
  className?: string;
}

interface NoCandidatesProps extends EmptyStateVariantProps {
  onAddCandidate?: () => void;
}

interface NoSearchResultsProps extends EmptyStateVariantProps {
  searchTerm: string;
  onClearSearch?: () => void;
}

interface NoFilterResultsProps extends EmptyStateVariantProps {
  activeFilterCount: number;
  onResetFilters?: () => void;
}

interface NoMatchesProps extends EmptyStateVariantProps {
  onRetry?: () => void;
}

interface ErrorStateProps extends EmptyStateVariantProps {
  message?: string;
  onRetry?: () => void;
}

// =============================================================================
// Base Layout
// =============================================================================

const EmptyStateLayout: React.FC<{
  icon: React.ReactNode;
  iconGradient: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ icon, iconGradient, title, description, action, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-8',
      'bg-gradient-to-br from-white via-gray-50/50 to-white',
      'rounded-2xl border border-dashed border-gray-200/80',
      className
    )}
  >
    <div
      className={cn(
        'w-20 h-20 rounded-full flex items-center justify-center mb-6',
        'bg-gradient-to-br shadow-lg',
        iconGradient
      )}
    >
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
      {description}
    </p>
    {action}
  </motion.div>
);

// =============================================================================
// Variants
// =============================================================================

/**
 * No candidates at all — shown when the system has no candidates yet
 */
export const NoCandidatesEmpty: React.FC<NoCandidatesProps> = ({
  onAddCandidate,
  className,
}) => (
  <EmptyStateLayout
    icon={<Users className="w-10 h-10 text-white" />}
    iconGradient="from-indigo-400 to-purple-500"
    title="עדיין אין מועמדים במערכת"
    description="הוסף מועמדים ראשונים כדי להתחיל לעבוד. ניתן להוסיף באופן ידני, לייבא מקובץ, או לייבא מכרטיסים."
    action={
      onAddCandidate && (
        <Button
          onClick={onAddCandidate}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg rounded-xl px-6"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          הוסף מועמד ראשון
        </Button>
      )
    }
    className={className}
  />
);

/**
 * No search results — shown when a search query returns zero matches
 */
export const NoSearchResultsEmpty: React.FC<NoSearchResultsProps> = ({
  searchTerm,
  onClearSearch,
  className,
}) => (
  <EmptyStateLayout
    icon={<Search className="w-10 h-10 text-white" />}
    iconGradient="from-blue-400 to-cyan-500"
    title={`לא נמצאו תוצאות עבור "${searchTerm}"`}
    description="נסה לשנות את מילות החיפוש, או לבדוק שהשם מאויית נכון."
    action={
      onClearSearch && (
        <Button
          onClick={onClearSearch}
          variant="outline"
          className="border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          נקה חיפוש
        </Button>
      )
    }
    className={className}
  />
);

/**
 * No filter results — shown when active filters match zero candidates
 */
export const NoFilterResultsEmpty: React.FC<NoFilterResultsProps> = ({
  activeFilterCount,
  onResetFilters,
  className,
}) => (
  <EmptyStateLayout
    icon={<Filter className="w-10 h-10 text-white" />}
    iconGradient="from-amber-400 to-orange-500"
    title="אין מועמדים שתואמים את הפילטרים"
    description={`${activeFilterCount} פילטרים פעילים. נסה להרחיב את הקריטריונים או לאפס את הפילטרים.`}
    action={
      onResetFilters && (
        <Button
          onClick={onResetFilters}
          variant="outline"
          className="border-2 border-amber-200 text-amber-600 hover:bg-amber-50 rounded-xl"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          אפס פילטרים
        </Button>
      )
    }
    className={className}
  />
);

/**
 * No matches — shown when AI scan returned zero results for a candidate
 */
export const NoMatchesEmpty: React.FC<NoMatchesProps> = ({
  onRetry,
  className,
}) => (
  <EmptyStateLayout
    icon={<Heart className="w-10 h-10 text-white" />}
    iconGradient="from-pink-400 to-rose-500"
    title="לא נמצאו התאמות"
    description="נסה לסרוק שוב עם פרמטרים אחרים, או ודא שפרופיל המועמד מלא ומעודכן."
    action={
      onRetry && (
        <Button
          onClick={onRetry}
          className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg rounded-xl px-6"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          נסה שוב
        </Button>
      )
    }
    className={className}
  />
);

/**
 * Error state — shown when an API call fails
 */
export const ErrorEmpty: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  className,
}) => (
  <EmptyStateLayout
    icon={<AlertTriangle className="w-10 h-10 text-white" />}
    iconGradient="from-red-400 to-red-500"
    title="אירעה שגיאה"
    description={message || 'לא הצלחנו לטעון את הנתונים. נסה שוב מאוחר יותר.'}
    action={
      onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          נסה שוב
        </Button>
      )
    }
    className={className}
  />
);
