'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Database, Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AiMatchMeta } from './types';
import type { SearchMethod } from '@/app/[locale]/contexts/MatchingJobContext';

interface CacheInfoBadgeProps {
  meta: AiMatchMeta | null;
  matchesCount: number;
  method?: SearchMethod;
}

const CacheInfoBadge: React.FC<CacheInfoBadgeProps> = ({
  meta,
  matchesCount,
  method,
}) => {
  if (!meta || matchesCount === 0) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const methodLabel = method === 'vector' ? 'וקטורי' : 'AI';

  if (meta.fromCache) {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium',
          meta.isStale
            ? 'bg-amber-100 text-amber-700 border border-amber-200'
            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        )}
      >
        {meta.isStale ? (
          <>
            <Clock className="w-3 h-3" />
            <span>
              {methodLabel} ישן ({formatDate(meta.savedAt)})
            </span>
          </>
        ) : (
          <>
            <Database className="w-3 h-3" />
            <span>
              {methodLabel} שמור ({formatDate(meta.savedAt)})
            </span>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border',
        method === 'vector'
          ? 'bg-blue-100 text-blue-700 border-blue-200'
          : 'bg-purple-100 text-purple-700 border-purple-200'
      )}
    >
      {method === 'vector' ? (
        <Zap className="w-3 h-3" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      <span>חדש</span>
      {meta.totalCandidatesScanned && (
        <span className="opacity-70">
          ({meta.totalCandidatesScanned} נסרקו)
        </span>
      )}
    </motion.div>
  );
};

export default CacheInfoBadge;
