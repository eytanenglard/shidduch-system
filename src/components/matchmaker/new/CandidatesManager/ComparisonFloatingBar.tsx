'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, Layers, X } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { Candidate } from '../types/candidates';

interface ComparisonFloatingBarProps {
  aiTargetCandidate: Candidate | null;
  comparisonSelection: Record<string, Candidate>;
  onOpenAnalysis: () => void;
  onOpenBulkSuggestions: () => void;
  onClearComparison: () => void;
  compareButtonLabel: string;
  prepareSuggestionsLabel?: string;
  locale: string;
}

const ComparisonFloatingBar: React.FC<ComparisonFloatingBarProps> = ({
  aiTargetCandidate,
  comparisonSelection,
  onOpenAnalysis,
  onOpenBulkSuggestions,
  onClearComparison,
  compareButtonLabel,
  prepareSuggestionsLabel = 'הכן הצעות',
  locale,
}) => {
  const comparisonCount = Object.keys(comparisonSelection).length;
  const comparisonAvatars = Object.values(comparisonSelection).slice(0, 3);

  return (
    <AnimatePresence>
      {aiTargetCandidate && comparisonCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-2xl border flex items-center gap-4">
            <div className="flex items-center -space-x-4">
              {comparisonAvatars.map((c) => (
                <div
                  key={c.id}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-gray-200 flex items-center justify-center text-gray-500 font-bold"
                >
                  {c.images?.find((img) => img.isMain) ? (
                    <Image
                      src={getRelativeCloudinaryPath(
                        c.images.find((img) => img.isMain)!.url
                      )}
                      alt={c.firstName}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <span>
                      {c.firstName.charAt(0)}
                      {c.lastName.charAt(0)}
                    </span>
                  )}
                </div>
              ))}
              {comparisonCount > 3 && (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 border-2 border-white">
                  +{comparisonCount - 3}
                </div>
              )}
            </div>
            <Button
              onClick={onOpenAnalysis}
              className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold shadow-lg"
            >
              <GitCompare
                className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
              />
              {compareButtonLabel.replace('{{count}}', String(comparisonCount))}
            </Button>

            <Button
              onClick={onOpenBulkSuggestions}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold shadow-lg"
            >
              <Layers
                className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
              />
              {prepareSuggestionsLabel}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClearComparison}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(ComparisonFloatingBar);
