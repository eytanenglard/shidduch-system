'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchMethod } from '@/app/[locale]/contexts/MatchingJobContext';

interface AiReasoningDisplayProps {
  reasoning?: string;
  similarity?: number;
  method?: SearchMethod;
  className?: string;
}

const AiReasoningDisplay: React.FC<AiReasoningDisplayProps> = ({
  reasoning,
  similarity,
  method,
  className,
}) => {
  if (!reasoning && !similarity) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'mt-2 p-3 rounded-lg text-sm',
        method === 'vector'
          ? 'bg-blue-50 border border-blue-100'
          : 'bg-purple-50 border border-purple-100',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <MessageSquare
          className={cn(
            'w-4 h-4 mt-0.5 flex-shrink-0',
            method === 'vector' ? 'text-blue-500' : 'text-purple-500'
          )}
        />
        <div className="flex-1">
          {similarity !== undefined && (
            <div className="text-xs text-gray-500 mb-1">
              דמיון וקטורי: {(similarity * 100).toFixed(1)}%
            </div>
          )}
          {reasoning && (
            <p className="text-gray-700 leading-relaxed">{reasoning}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AiReasoningDisplay;
