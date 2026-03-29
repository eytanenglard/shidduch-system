'use client';

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { SFQuestion } from '../types';

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
  const wasManuallyExpanded = useRef(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQuestionId = useRef(question.id);

  useEffect(() => {
    setLocalCustom(customValue || '');
  }, [customValue]);

  // Reset collapse state when question changes
  useEffect(() => {
    if (prevQuestionId.current !== question.id) {
      setIsCollapsed(false);
      wasManuallyExpanded.current = false;
      prevQuestionId.current = question.id;
    }
  }, [question.id]);

  const handleToggle = useCallback(
    (optValue: string) => {
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
    // Only collapse if there are enough unselected options to hide (at least 3)
    const unselectedCount = allOptions.length - value.length;
    return unselectedCount >= 3;
  }, [value.length, question.maxSelections, allOptions.length]);

  // Auto-collapse after reaching maxSelections
  useEffect(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);

    if (shouldAutoCollapse && !wasManuallyExpanded.current) {
      collapseTimer.current = setTimeout(() => setIsCollapsed(true), 700);
    } else if (!shouldAutoCollapse) {
      setIsCollapsed(false);
    }

    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, [shouldAutoCollapse]);

  const handleExpand = () => {
    setIsCollapsed(false);
    wasManuallyExpanded.current = true;
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <AnimatePresence mode="popLayout">
          {visibleOptions.map((opt) => {
            const isSelected = value.includes(opt.value);
            return (
              <motion.div
                key={opt.value}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
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

      {/* Show more button when collapsed */}
      {isCollapsed && hiddenCount > 0 && (
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
