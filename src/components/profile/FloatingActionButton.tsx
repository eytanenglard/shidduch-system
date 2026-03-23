'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Save, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  isEditing: boolean;
  onSave: () => void;
  onEdit: () => void;
  mounted: boolean;
  visible: boolean;
  saveLabel: string;
  editLabel: string;
  /** Gradient classes for the button background + ring */
  gradientClassName?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  isEditing,
  onSave,
  onEdit,
  mounted,
  visible,
  saveLabel,
  editLabel,
  gradientClassName = 'bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 ring-4 ring-cyan-200/50',
}) => {
  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
      <div className="w-full max-w-screen-xl px-4 relative h-0">
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute bottom-24 left-4 pointer-events-auto"
            >
              <Button
                onClick={isEditing ? onSave : onEdit}
                className={cn(
                  'h-14 w-14 rounded-full shadow-lg hover:shadow-xl',
                  'transition-all duration-300 ease-out',
                  'hover:scale-110 active:scale-95',
                  'flex items-center justify-center',
                  gradientClassName
                )}
                aria-label={isEditing ? saveLabel : editLabel}
              >
                {isEditing ? (
                  <Save className="w-6 h-6 text-white" />
                ) : (
                  <Pencil className="w-6 h-6 text-white" />
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    document.body
  );
};

export default React.memo(FloatingActionButton);
