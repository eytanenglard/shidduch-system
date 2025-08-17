// src/components/ui/VisibilityToggleButton.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Users, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisibilityToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function VisibilityToggleButton({
  isVisible,
  onToggle,
  disabled,
}: VisibilityToggleButtonProps) {
  const label = isVisible ? 'גלוי בפרופיל' : 'מוסתר מהפרופיל';
  const iconClasses = 'w-4 h-4';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isVisible}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'relative inline-flex items-center h-8 px-3 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500',
        isVisible
          ? 'bg-green-100 text-green-800'
          : 'bg-slate-200 text-slate-600',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={isVisible ? 'visible' : 'hidden'}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          {isVisible ? (
            <>
              <Eye className={iconClasses} />
              <Users className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <EyeOff className={iconClasses} />
              <Lock className="w-3.5 h-3.5" />
            </>
          )}
          <span className="text-sm font-medium">{label}</span>
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
