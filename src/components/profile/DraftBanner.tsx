'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DraftBannerProps {
  visible: boolean;
  onRestore: () => void;
  onDismiss: () => void;
  restoreLabel?: string;
  dismissLabel?: string;
  message?: string;
}

const DraftBanner: React.FC<DraftBannerProps> = ({
  visible,
  onRestore,
  onDismiss,
  restoreLabel = 'שחזור טיוטה',
  dismissLabel = 'התעלם',
  message = 'נמצאה טיוטה שלא נשמרה. האם לשחזר?',
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="container mx-auto max-w-screen-xl px-4 mb-3"
        >
          <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onDismiss}
                className="rounded-full text-xs border-amber-300 text-amber-700 hover:bg-amber-100 px-3"
              >
                <X className="w-3 h-3 me-1" />
                {dismissLabel}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={onRestore}
                className="rounded-full text-xs bg-amber-500 hover:bg-amber-600 text-white px-3"
              >
                <RotateCcw className="w-3 h-3 me-1" />
                {restoreLabel}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DraftBanner;
