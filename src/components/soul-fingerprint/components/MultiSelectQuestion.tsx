'use client';

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Undo2 } from 'lucide-react';
import type { SFQuestion } from '../types';

// Haptic feedback for mobile web
function triggerHaptic() {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  } catch {
    // Vibration not supported or denied — no-op
  }
}

// Check if user prefers reduced motion
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface Props {
  question: SFQuestion;
  value: string[];
  onChange: (value: string[]) => void;
  customValue?: string;
  onCustomChange?: (value: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export default function MultiSelectQuestion({ question, value, onChange, customValue, onCustomChange, t, isRTL }: Props) {
  const maxSelections = question.maxSelections || 99;
  const [localCustom, setLocalCustom] = useState(customValue || '');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const wasManuallyExpanded = useRef(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQuestionId = useRef(question.id);

  useEffect(() => {
    setLocalCustom(customValue || '');
  }, [customValue]);

  // Reset state when question changes
  useEffect(() => {
    if (prevQuestionId.current !== question.id) {
      setIsCollapsed(false);
      setShowUndo(false);
      wasManuallyExpanded.current = false;
      prevQuestionId.current = question.id;
    }
  }, [question.id]);

  const handleToggle = useCallback(
    (optValue: string) => {
      triggerHaptic();
      wasManuallyExpanded.current = false;
      // "doesnt_matter" clears everything else
      if (optValue === 'doesnt_matter') {
        onChange(['doesnt_matter']);
        return;
      }
      // If selecting something else while doesnt_matter is selected, remove it
      const current = value.filter((v) => v !== 'doesnt_matter');
      if (current.includes(optValue)) {
        onChange(current.filter((v) => v !== optValue));
      } else if (current.length < maxSelections) {
        onChange([...current, optValue]);
      }
    },
    [value, onChange, maxSelections]
  );

  const allOptions = question.options || [];

  const shouldAutoCollapse = useMemo(() => {
    if (!question.maxSelections) return false;
    if (value.length < question.maxSelections) return false;
    const unselectedCount = allOptions.length - value.length;
    return unselectedCount >= 3;
  }, [value.length, question.maxSelections, allOptions.length]);

  // Auto-collapse after reaching maxSelections
  useEffect(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);

    if (shouldAutoCollapse && !wasManuallyExpanded.current) {
      const collapseDelay = prefersReducedMotion() ? 0 : 700;
      collapseTimer.current = setTimeout(() => {
        setIsCollapsed(true);
        // Show undo toast — 5 seconds to give users enough time to react
        setShowUndo(true);
        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => setShowUndo(false), 5000);
      }, collapseDelay);
    } else if (!shouldAutoCollapse) {
      setIsCollapsed(false);
      setShowUndo(false);
    }

    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, [shouldAutoCollapse]);

  // Cleanup undo timer
  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const handleExpand = useCallback(() => {
    setIsCollapsed(false);
    setShowUndo(false);
    wasManuallyExpanded.current = true;
  }, []);

  const visibleOptions = isCollapsed
    ? allOptions.filter(opt => value.includes(opt.value))
    : allOptions;

  const hiddenCount = allOptions.length - visibleOptions.length;

  // Check if any selected option has isCustomInput
  const hasCustomSelected = allOptions.some(
    opt => opt.isCustomInput && value.includes(opt.value)
  );
  const customOption = allOptions.find(opt => opt.isCustomInput && value.includes(opt.value));

  return (
    <div className="space-y-2">
      {question.maxSelections && (
        <p className="text-xs text-gray-500 mb-2">
          {t('labels.selectUpTo').replace('{{count}}', String(question.maxSelections))}
          {' '} ({value.length}/{question.maxSelections})
        </p>
      )}
      <div className={`grid gap-2 ${allOptions.length > 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
        <AnimatePresence mode="popLayout">
          {visibleOptions.map((opt) => {
            const isSelected = value.includes(opt.value);
            return (
              <motion.div
                key={opt.value}
                layout={!prefersReducedMotion()}
                initial={prefersReducedMotion() ? false : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: prefersReducedMotion() ? 0 : 0.2 }}
              >
                <button
                  onClick={() => handleToggle(opt.value)}
                  disabled={!isSelected && value.length >= maxSelections && !value.includes('doesnt_matter')}
                  className={`
                    w-full flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                    ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}
                    ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-gray-200 hover:border-teal-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                    }
                  `}
                >
                  {opt.icon && <span className="text-lg flex-shrink-0">{opt.icon}</span>}
                  <span className={`flex-1 text-sm ${isSelected ? 'text-teal-700 font-medium' : 'text-gray-700'}`}>
                    {t(opt.labelKey)}
                  </span>
                  <div
                    className={`
                      w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2
                      ${isSelected ? 'bg-teal-500 border-teal-500' : 'border-gray-300'}
                    `}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                      </svg>
                    )}
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Undo / change bar — appears briefly after collapse */}
      <AnimatePresence>
        {isCollapsed && showUndo && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <span className="text-xs text-amber-700">
              {isRTL ? 'רוצה לשנות?' : 'Want to change?'}
            </span>
            <button
              onClick={handleExpand}
              className={`flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              {isRTL ? 'שנה בחירה' : 'Change'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show more button when collapsed (after undo disappears) */}
      {isCollapsed && !showUndo && hiddenCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          onClick={handleExpand}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors"
        >
          <span>{t('labels.showMoreOptions').replace('{{count}}', String(hiddenCount))}</span>
          <ChevronDown className="w-4 h-4" />
        </motion.button>
      )}

      {/* Custom text input for "other" options */}
      {hasCustomSelected && customOption && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-2">
          <input
            type="text"
            value={localCustom}
            onChange={(e) => {
              setLocalCustom(e.target.value);
              onCustomChange?.(e.target.value);
            }}
            placeholder={t(`options.${question.id}.${customOption.value}_placeholder`) || '...'}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="w-full p-3 rounded-xl border-2 border-teal-200 bg-teal-50/30 text-sm placeholder:text-gray-400 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
          />
        </div>
      )}
    </div>
  );
}
