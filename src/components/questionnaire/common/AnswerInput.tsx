// src/components/questionnaire/common/AnswerInput.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  X,
  Plus,
  CheckCircle,
  Eraser,
  Info,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  AlertCircle,
  Sparkles,
  Clock,
  Copy,
  CheckCheck,
  Edit,
  Trash2,
  Zap,
  TrendingUp,
  Award,
  Target,
  Flame,
} from 'lucide-react';
import InteractiveScale from './InteractiveScale';
import type { AnswerValue, Option, Question } from '../types/types';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import type { AnswerInputDict, InteractiveScaleDict } from '@/types/dictionary';

type ThemeColor = 'sky' | 'rose' | 'purple' | 'teal' | 'amber';

const getThemeConfig = (themeColor: ThemeColor) => {
  const themes = {
    sky: {
      gradient: 'from-cyan-400 via-sky-500 to-blue-500',
      lightBg: 'from-cyan-50 to-blue-50',
      textColor: 'text-sky-900',
      iconColor: 'text-sky-600',
      borderColor: 'border-sky-400',
      ringColor: 'ring-sky-300',
      bgSoft: 'bg-sky-50',
      shadowColor: 'shadow-sky-200/50',
      progressFrom: 'from-cyan-500',
      progressTo: 'to-blue-600',
      hoverBorder: 'hover:border-sky-200',
      glowColor: 'rgba(14, 165, 233, 0.3)',
      glowColorStrong: 'rgba(14, 165, 233, 0.6)',
    },
    rose: {
      gradient: 'from-rose-400 via-pink-500 to-red-500',
      lightBg: 'from-rose-50 to-red-50',
      textColor: 'text-rose-900',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-400',
      ringColor: 'ring-rose-300',
      bgSoft: 'bg-rose-50',
      shadowColor: 'shadow-rose-200/50',
      progressFrom: 'from-rose-500',
      progressTo: 'to-red-600',
      hoverBorder: 'hover:border-rose-200',
      glowColor: 'rgba(244, 63, 94, 0.3)',
      glowColorStrong: 'rgba(244, 63, 94, 0.6)',
    },
    purple: {
      gradient: 'from-purple-400 via-violet-500 to-indigo-500',
      lightBg: 'from-purple-50 to-indigo-50',
      textColor: 'text-purple-900',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-400',
      ringColor: 'ring-purple-300',
      bgSoft: 'bg-purple-50',
      shadowColor: 'shadow-purple-200/50',
      progressFrom: 'from-purple-500',
      progressTo: 'to-indigo-600',
      hoverBorder: 'hover:border-purple-200',
      glowColor: 'rgba(139, 92, 246, 0.3)',
      glowColorStrong: 'rgba(139, 92, 246, 0.6)',
    },
    teal: {
      gradient: 'from-teal-400 via-emerald-500 to-green-500',
      lightBg: 'from-teal-50 to-emerald-50',
      textColor: 'text-teal-900',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-400',
      ringColor: 'ring-teal-300',
      bgSoft: 'bg-teal-50',
      shadowColor: 'shadow-teal-200/50',
      progressFrom: 'from-teal-500',
      progressTo: 'to-green-600',
      hoverBorder: 'hover:border-teal-200',
      glowColor: 'rgba(20, 184, 166, 0.3)',
      glowColorStrong: 'rgba(20, 184, 166, 0.6)',
    },
    amber: {
      gradient: 'from-amber-400 via-orange-500 to-yellow-500',
      lightBg: 'from-amber-50 to-orange-50',
      textColor: 'text-amber-900',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-400',
      ringColor: 'ring-amber-300',
      bgSoft: 'bg-amber-50',
      shadowColor: 'shadow-amber-200/50',
      progressFrom: 'from-amber-500',
      progressTo: 'to-orange-600',
      hoverBorder: 'hover:border-amber-200',
      glowColor: 'rgba(245, 158, 11, 0.3)',
      glowColorStrong: 'rgba(245, 158, 11, 0.6)',
    },
  };
  return themes[themeColor] || themes.sky;
};

export interface AnswerInputProps {
  locale: string;
  question: Question;
  themeColor?: ThemeColor;
  value?: AnswerValue;
  onChange?: (value: AnswerValue) => void;
  onClear?: () => void;
  className?: string;
  validationError?: string;
  dict: {
    answerInput: AnswerInputDict;
    interactiveScale: InteractiveScaleDict;
  };
}

export default function AnswerInput({
  question,
  value,
  onChange,
  onClear,
  className = '',
  validationError,
  dict,
  locale,
  themeColor = 'sky',
}: AnswerInputProps) {
  const isRTL = locale === 'he';
  const theme = getThemeConfig(themeColor);

  const [internalValue, setInternalValue] = useState<AnswerValue>(value);
  const [error, setError] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [textAreaHeight, setTextAreaHeight] = useState<number>(150);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState<boolean>(false);
  const [textCopied, setTextCopied] = useState(false);

  useEffect(() => {
    setInternalValue(value);
    if (typeof value === 'string') {
      if (value.length > 200) setTextAreaHeight(220);
      else if (value.length > 100) setTextAreaHeight(180);
      else setTextAreaHeight(150);
    } else if (value === undefined || value === null) {
      setTextAreaHeight(150);
    }
  }, [value]);

  const handleClear = useCallback(() => {
    let emptyValue: AnswerValue;
    switch (question.type) {
      case 'multiChoice':
      case 'multiSelect':
      case 'multiSelectWithOther':
        emptyValue = [];
        break;
      case 'budgetAllocation':
        emptyValue = {};
        break;
      case 'openText':
        emptyValue = '';
        break;
      case 'scale':
        emptyValue = undefined;
        break;
      case 'singleChoice':
      case 'scenario':
      case 'iconChoice':
      default:
        emptyValue = undefined;
    }
    setInternalValue(emptyValue);
    setCustomValue('');
    setError(null);
    onClear?.();
  }, [question.type, onClear]);

  const handleValueChange = useCallback(
    (newValue: AnswerValue) => {
      if (
        (question.type === 'singleChoice' ||
          question.type === 'iconChoice' ||
          question.type === 'scenario') &&
        newValue === internalValue &&
        !question.isRequired
      ) {
        handleClear();
        return;
      }
      setInternalValue(newValue);
      setError(null);
      onChange?.(newValue);
    },
    [internalValue, onChange, question.isRequired, question.type, handleClear]
  );

  const handleCopyText = useCallback(() => {
    if (typeof internalValue === 'string' && internalValue) {
      navigator.clipboard.writeText(internalValue);
      setTextCopied(true);
      setTimeout(() => setTextCopied(false), 2000);
    }
  }, [internalValue]);

  const optionVariants = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 1, 0.5, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: { duration: 0.2 },
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: { duration: 0.2, ease: 'easeOut' },
    },
    tap: { scale: 0.98 },
  };

  const rippleVariants = {
    initial: { scale: 0, opacity: 0.5 },
    animate: {
      scale: 2,
      opacity: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const renderSingleChoiceOption = (
    choiceOption: Option,
    isSelected: boolean
  ) => (
    <motion.div
      key={choiceOption.value}
      variants={optionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={!isSelected ? 'hover' : undefined}
      whileTap="tap"
      layout
      className="relative"
    >
      <div
        className={cn(
          'group relative p-4 rounded-2xl cursor-pointer transition-all duration-300',
          'border-2 overflow-hidden',
          isSelected
            ? cn(
                'bg-gradient-to-br',
                theme.lightBg,
                theme.borderColor,
                'shadow-lg',
                theme.shadowColor
              )
            : cn(
                'bg-white hover:bg-gradient-to-br border-gray-200 hover:shadow-md',
                theme.lightBg
                  .replace('from-', 'hover:from-')
                  .replace('to-', 'hover:to-'),
                theme.hoverBorder
              )
        )}
        onClick={() => handleValueChange(choiceOption.value)}
      >
        {!isSelected && (
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        )}

        <AnimatePresence>
          {isSelected && (
            <motion.div
              variants={rippleVariants}
              initial="initial"
              animate="animate"
              className={cn(
                'absolute inset-0 rounded-2xl bg-gradient-to-r opacity-20',
                theme.gradient
              )}
            />
          )}
        </AnimatePresence>

        <div
          className={cn(
            'flex items-center justify-between gap-3 relative z-10',
            isRTL && 'flex-row-reverse'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-3 flex-1',
              isRTL && 'flex-row-reverse'
            )}
          >
            {choiceOption.icon && (
              <motion.div
                animate={{
                  scale: isSelected ? [1, 1.2, 1] : 1,
                  rotate: isSelected ? [0, 5, -5, 0] : 0,
                }}
                transition={{ duration: 0.5 }}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  isSelected
                    ? cn(
                        'bg-gradient-to-br text-white shadow-md',
                        theme.gradient
                      )
                    : `bg-gray-100 text-gray-600 group-hover:${theme.bgSoft} group-hover:${theme.iconColor}`
                )}
              >
                {choiceOption.icon}
              </motion.div>
            )}
            <span
              className={cn(
                'font-medium transition-colors',
                isSelected
                  ? theme.textColor
                  : cn(
                      'text-gray-700',
                      theme.textColor.replace('text-', 'group-hover:text-')
                    )
              )}
            >
              {choiceOption.text}
            </span>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isSelected ? 1 : 0 }}
            className="relative"
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg',
                theme.gradient
              )}
            >
              <CheckCircle className="w-4 h-4 text-white" fill="white" />
            </div>
          </motion.div>
        </div>

        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className={cn(
              'absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full opacity-50',
              theme.gradient
            )}
          />
        )}
      </div>
    </motion.div>
  );

  const renderInput = () => {
    switch (question.type) {
      case 'singleChoice':
        return (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {question.options?.map((optionItem) => {
                const isSelected = internalValue === optionItem.value;
                return renderSingleChoiceOption(optionItem, isSelected);
              })}
            </AnimatePresence>
          </div>
        );

      case 'scale':
        return (
          <div className="relative">
            <div
              className={cn(
                'absolute inset-0 rounded-2xl blur-xl -z-10 bg-gradient-to-r opacity-50',
                theme.lightBg
              )}
            />

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-100 shadow-lg">
              <InteractiveScale
                min={question.min ?? 1}
                max={question.max ?? 10}
                step={question.step ?? 1}
                value={
                  typeof internalValue === 'number' ? internalValue : undefined
                }
                onChange={(newValue) => handleValueChange(newValue)}
                showLabels={true}
                showValue={true}
                name={question.id}
                required={question.isRequired}
                ariaLabelledby={question.id}
                dict={dict.interactiveScale}
              />
            </div>
          </div>
        );

      case 'multiChoice':
      case 'multiSelect': {
        const selectedValues = Array.isArray(internalValue)
          ? (internalValue as string[])
          : [];
        const progress = question.maxSelections
          ? (selectedValues.length / question.maxSelections) * 100
          : 0;

        return (
          <div className="space-y-4">
            {question.maxSelections && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'bg-gradient-to-r rounded-xl p-4 border',
                  theme.lightBg,
                  theme.borderColor
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className={cn('w-4 h-4', theme.iconColor)} />
                    <span
                      className={cn('text-sm font-medium', theme.textColor)}
                    >
                      {dict.answerInput.multiSelect.selectedInfo.replace(
                        '{{count}}',
                        selectedValues.length.toString()
                      )}
                    </span>
                  </div>
                  <Badge
                    className={cn(
                      'text-white bg-gradient-to-r',
                      theme.gradient
                    )}
                  >
                    {selectedValues.length}/{question.maxSelections}
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </motion.div>
            )}

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {question.options?.map((option, index) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isMaxReached =
                    question.maxSelections &&
                    selectedValues.length >= question.maxSelections &&
                    !isSelected;

                  return (
                    <motion.div
                      key={option.value}
                      variants={optionVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      whileHover={!isMaxReached ? 'hover' : undefined}
                      whileTap={!isMaxReached ? 'tap' : undefined}
                      layout
                      style={{ zIndex: isSelected ? 10 : 1 }}
                    >
                      <div
                        className={cn(
                          'group relative p-4 rounded-2xl cursor-pointer transition-all duration-300',
                          'border-2 overflow-hidden',
                          isSelected
                            ? cn(
                                'bg-gradient-to-r',
                                theme.lightBg,
                                theme.borderColor,
                                'shadow-lg',
                                theme.shadowColor
                              )
                            : isMaxReached
                              ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                              : cn(
                                  'bg-white border-gray-200 hover:shadow-md',
                                  theme.bgSoft.replace('bg-', 'hover:bg-') +
                                    '/30',
                                  theme.hoverBorder
                                )
                        )}
                        onClick={() => {
                          if (isMaxReached) {
                            setError(
                              dict.answerInput.multiSelect.maxSelectionError.replace(
                                '{{count}}',
                                String(question.maxSelections)
                              )
                            );
                            setTimeout(() => setError(null), 2500);
                            return;
                          }

                          let newValues: string[];
                          if (isSelected) {
                            newValues = selectedValues.filter(
                              (v) => v !== option.value
                            );
                          } else {
                            newValues = [...selectedValues, option.value];
                          }
                          handleValueChange(newValues);
                        }}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1.5, opacity: 0 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.6 }}
                              className={cn(
                                'absolute inset-0 rounded-2xl bg-gradient-to-r opacity-20',
                                theme.gradient
                              )}
                            />
                          )}
                        </AnimatePresence>

                        <div
                          className={cn(
                            'flex items-center justify-between gap-3 relative z-10',
                            isRTL && 'flex-row-reverse'
                          )}
                        >
                          <div
                            className={cn(
                              'flex items-center gap-3 flex-1',
                              isRTL && 'flex-row-reverse'
                            )}
                          >
                            {option.icon && (
                              <motion.div
                                animate={{ scale: isSelected ? 1.1 : 1 }}
                                className={cn(
                                  'p-2 rounded-xl transition-all',
                                  isSelected
                                    ? cn(
                                        'bg-gradient-to-br text-white',
                                        theme.gradient
                                      )
                                    : cn(
                                        'bg-gray-100 text-gray-600',
                                        theme.bgSoft.replace(
                                          'bg-',
                                          'group-hover:bg-'
                                        )
                                      )
                                )}
                              >
                                {option.icon}
                              </motion.div>
                            )}
                            <span
                              className={cn(
                                'font-medium',
                                isSelected ? theme.textColor : 'text-gray-700'
                              )}
                            >
                              {option.text}
                            </span>
                          </div>

                          <motion.div
                            className={cn(
                              'w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
                              isSelected
                                ? cn(
                                    'bg-gradient-to-br',
                                    theme.gradient,
                                    theme.borderColor
                                  )
                                : 'border-gray-300 bg-white'
                            )}
                            whileTap={{ scale: 0.9 }}
                          >
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                >
                                  <CheckCheck
                                    className="w-4 h-4 text-white"
                                    strokeWidth={3}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      case 'multiSelectWithOther': {
        const selectedWithOtherValues = Array.isArray(internalValue)
          ? (internalValue as string[])
          : [];
        const customAnswers = selectedWithOtherValues.filter((v) =>
          v.startsWith('custom:')
        );
        const predefinedAnswers = selectedWithOtherValues.filter(
          (v) => !v.startsWith('custom:')
        );
        const isCustomValueEmpty = !customValue.trim();
        const isMaxLengthReached =
          question.maxSelections !== undefined &&
          selectedWithOtherValues.length >= question.maxSelections;

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              {question.options?.map((option) => {
                if (option.value === 'other') return null;
                const isSelected = predefinedAnswers.includes(option.value);

                return (
                  <motion.div
                    key={option.value}
                    variants={optionVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                    whileTap="tap"
                    layout
                  >
                    <div
                      className={cn(
                        'p-4 rounded-2xl cursor-pointer border-2 transition-all',
                        isSelected
                          ? cn(
                              'bg-gradient-to-r shadow-lg',
                              theme.lightBg,
                              theme.borderColor
                            )
                          : cn(
                              'bg-white border-gray-200',
                              theme.bgSoft.replace('bg-', 'hover:bg-') + '/30',
                              theme.hoverBorder
                            )
                      )}
                      onClick={() => {
                        if (isMaxLengthReached && !isSelected) {
                          setError(
                            dict.answerInput.multiSelect.maxSelectionError.replace(
                              '{{count}}',
                              String(question.maxSelections)
                            )
                          );
                          setTimeout(() => setError(null), 2500);
                          return;
                        }

                        let newValues: string[];
                        if (isSelected) {
                          newValues = predefinedAnswers.filter(
                            (v) => v !== option.value
                          );
                        } else {
                          newValues = [...predefinedAnswers, option.value];
                        }
                        handleValueChange([...newValues, ...customAnswers]);
                      }}
                    >
                      <div
                        className={cn(
                          'flex items-center justify-between',
                          isRTL && 'flex-row-reverse'
                        )}
                      >
                        <div
                          className={cn(
                            'flex items-center gap-3',
                            isRTL && 'flex-row-reverse'
                          )}
                        >
                          {option.icon && (
                            <div
                              className={cn(
                                'p-2 rounded-xl',
                                isSelected
                                  ? cn(
                                      'text-white bg-gradient-to-r',
                                      theme.gradient
                                    )
                                  : 'bg-gray-100 text-gray-600'
                              )}
                            >
                              {option.icon}
                            </div>
                          )}
                          <span
                            className={cn(
                              'font-medium',
                              isSelected ? theme.textColor : 'text-gray-700'
                            )}
                          >
                            {option.text}
                          </span>
                        </div>
                        <motion.div
                          className={cn(
                            'w-6 h-6 rounded-lg border-2 flex items-center justify-center',
                            isSelected
                              ? cn(
                                  'bg-gradient-to-r',
                                  theme.gradient,
                                  theme.borderColor
                                )
                              : 'border-gray-300'
                          )}
                        >
                          {isSelected && (
                            <CheckCheck className="w-4 h-4 text-white" />
                          )}
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Custom input section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-2xl blur-xl" />
              <div className="relative bg-white rounded-2xl p-5 border-2 border-dashed border-purple-300 space-y-3">
                <div className="flex items-center gap-2 text-purple-900">
                  <Sparkles className="w-5 h-5" />
                  <Label className="font-semibold">
                    {dict.answerInput.multiSelectWithOther.addOtherOptionLabel}
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={
                      dict.answerInput.multiSelectWithOther
                        .otherOptionPlaceholder
                    }
                    className="flex-1 border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                    disabled={isMaxLengthReached && isCustomValueEmpty}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (!isCustomValueEmpty) {
                        if (isMaxLengthReached) {
                          setError(
                            dict.answerInput.multiSelect.maxSelectionError.replace(
                              '{{count}}',
                              String(question.maxSelections)
                            )
                          );
                          setTimeout(() => setError(null), 2500);
                          return;
                        }
                        const newCustomAnswer = `custom:${customValue.trim()}`;
                        if (!customAnswers.includes(newCustomAnswer)) {
                          handleValueChange([
                            ...predefinedAnswers,
                            ...customAnswers,
                            newCustomAnswer,
                          ]);
                          setCustomValue('');
                        } else {
                          setError(
                            dict.answerInput.multiSelectWithOther.errorExists
                          );
                          setTimeout(() => setError(null), 2500);
                        }
                      }
                    }}
                    disabled={isCustomValueEmpty || isMaxLengthReached}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {dict.answerInput.multiSelectWithOther.addButton}
                  </Button>
                </div>

                <AnimatePresence>
                  {customAnswers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 pt-2"
                    >
                      <Label className="text-xs text-purple-700 flex items-center gap-1">
                        <Edit className="w-3 h-3" />
                        {
                          dict.answerInput.multiSelectWithOther
                            .addedAnswersLabel
                        }
                      </Label>
                      {customAnswers.map((customVal, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200"
                        >
                          <div className="flex items-center gap-2">
                            <CornerDownRight className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-purple-900">
                              {customVal.replace('custom:', '')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-purple-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => {
                              const newValues = selectedWithOtherValues.filter(
                                (v) => v !== customVal
                              );
                              handleValueChange(newValues);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </div>
        );
      }

      case 'scenario':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const optionValue = option.value || option.text;
              const isSelected = internalValue === optionValue;

              return (
                <motion.div
                  key={index}
                  variants={optionVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  whileTap="tap"
                  layout
                >
                  <div
                    className={cn(
                      'relative p-5 rounded-2xl cursor-pointer border-2 transition-all overflow-hidden',
                      isSelected
                        ? cn(
                            'bg-gradient-to-br shadow-xl',
                            theme.lightBg,
                            theme.borderColor,
                            theme.shadowColor
                          )
                        : cn(
                            'bg-white hover:bg-gradient-to-br border-gray-200 hover:shadow-lg',
                            theme.lightBg
                              .replace('from-', 'hover:from-')
                              .replace('to-', 'hover:to-'),
                            theme.hoverBorder
                          )
                    )}
                    onClick={() => handleValueChange(optionValue)}
                  >
                    <div
                      className={cn(
                        'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br to-transparent rounded-bl-full opacity-20',
                        theme.gradient
                      )}
                    />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div
                            className={cn(
                              'font-semibold text-lg mb-2 transition-colors',
                              isSelected ? theme.textColor : 'text-gray-800'
                            )}
                          >
                            {option.text}
                          </div>
                          {option.description && (
                            <p
                              className={cn(
                                'text-sm leading-relaxed transition-colors',
                                isSelected ? 'text-gray-700' : 'text-gray-600'
                              )}
                            >
                              {option.description}
                            </p>
                          )}
                        </div>

                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: isSelected ? 1 : 0 }}
                        >
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg',
                              theme.gradient
                            )}
                          >
                            <CheckCircle
                              className="w-5 h-5 text-white"
                              fill="white"
                            />
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          'absolute inset-0 rounded-2xl bg-gradient-to-r opacity-10',
                          theme.gradient
                        )}
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        );

      case 'iconChoice':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {question.options?.map((option) => {
              const isSelected = internalValue === option.value;

              return (
                <TooltipProvider key={option.value} delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        variants={optionVariants}
                        initial="initial"
                        animate="animate"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => handleValueChange(option.value)}
                      >
                        <Card
                          className={cn(
                            'relative p-6 cursor-pointer transition-all min-h-[140px]',
                            'flex flex-col items-center justify-center gap-3 text-center overflow-hidden',
                            'border-2',
                            isSelected
                              ? cn(
                                  'bg-gradient-to-br shadow-xl',
                                  theme.lightBg,
                                  theme.borderColor,
                                  theme.shadowColor
                                )
                              : cn(
                                  'bg-white hover:bg-gradient-to-br border-gray-200 hover:shadow-lg',
                                  theme.lightBg
                                    .replace('from-', 'hover:from-')
                                    .replace('to-', 'hover:to-'),
                                  theme.hoverBorder
                                )
                          )}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 2, opacity: 0.3 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                className={cn(
                                  'absolute inset-0 bg-gradient-to-br blur-2xl',
                                  theme.gradient
                                )}
                              />
                            )}
                          </AnimatePresence>

                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                className={cn(
                                  'absolute -top-2 -right-2 bg-gradient-to-br text-white rounded-full p-1.5 shadow-lg z-10',
                                  theme.gradient
                                )}
                              >
                                <CheckCircle className="h-4 w-4" fill="white" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="relative z-10">
                            <motion.div
                              animate={{
                                scale: isSelected ? [1, 1.2, 1] : 1,
                                rotate: isSelected ? [0, 10, -10, 0] : 0,
                              }}
                              transition={{ duration: 0.5 }}
                              className={cn(
                                'text-5xl mb-3 transition-all',
                                isSelected
                                  ? 'drop-shadow-lg'
                                  : 'opacity-70 group-hover:opacity-100'
                              )}
                            >
                              {option.icon}
                            </motion.div>

                            <span
                              className={cn(
                                'text-sm font-semibold transition-colors',
                                isSelected ? theme.textColor : 'text-gray-700'
                              )}
                            >
                              {option.text}
                            </span>
                          </div>
                        </Card>
                      </motion.div>
                    </TooltipTrigger>
                    {option.description && (
                      <TooltipContent
                        side="top"
                        className="max-w-xs bg-white/95 backdrop-blur-sm"
                      >
                        <p className="text-sm">{option.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        );

      case 'openText': {
        let textValue = '';
        if (typeof internalValue === 'string') {
          textValue = internalValue;
        } else if (
          typeof internalValue === 'object' &&
          internalValue !== null &&
          !Array.isArray(internalValue) &&
          'text' in internalValue
        ) {
          textValue = String(internalValue.text || '');
        }

        const hasMinLength =
          question.minLength !== undefined && question.minLength > 0;
        const hasMaxLength =
          question.maxLength !== undefined && question.maxLength > 0;
        const isMinLengthMet =
          !hasMinLength || textValue.length >= (question.minLength ?? 0);
        const isCloseToMax =
          hasMaxLength && textValue.length > (question.maxLength ?? 0) * 0.85;
        const lengthExceeded =
          hasMaxLength && textValue.length > (question.maxLength ?? 0);
        const completionPercentage = hasMinLength
          ? Math.min(
              100,
              Math.round((textValue.length / (question.minLength ?? 1)) * 100)
            )
          : 0;

        const wordCount = textValue.trim()
          ? textValue.trim().split(/\s+/).length
          : 0;
        const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

        return (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    theme.bgSoft,
                    theme.textColor.replace('900', '700'),
                    theme.borderColor
                  )}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  {wordCount} מילים
                </Badge>
                {wordCount > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {estimatedReadTime} דקות קריאה
                  </Badge>
                )}
              </div>

              {hasMinLength && (
                <Badge
                  className={cn(
                    'transition-all',
                    isMinLengthMet
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : completionPercentage > 50
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                        : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                  )}
                >
                  {completionPercentage}% הושלם
                </Badge>
              )}
            </motion.div>

            <div className="relative">
              <div
                className={cn(
                  'absolute inset-0 rounded-2xl blur-2xl -z-10 bg-gradient-to-br opacity-50',
                  theme.lightBg
                )}
              />

              <div
                className={cn(
                  'relative rounded-2xl transition-all duration-300 overflow-hidden',
                  'border-2',
                  isFocused
                    ? cn(
                        theme.borderColor,
                        'shadow-xl',
                        theme.shadowColor,
                        'ring-4',
                        theme.ringColor
                      )
                    : lengthExceeded
                      ? 'border-red-400 shadow-lg shadow-red-200/50'
                      : isCloseToMax
                        ? 'border-amber-400 shadow-lg shadow-amber-200/50'
                        : cn('border-gray-200 shadow-md', theme.hoverBorder)
                )}
              >
                <Textarea
                  value={textValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={
                    question.placeholder ||
                    dict.answerInput.openText.placeholder
                  }
                  className={cn(
                    'resize-y border-0 focus-visible:ring-0 w-full min-h-[180px] text-base leading-relaxed',
                    'bg-white/80 backdrop-blur-sm relative z-10',
                    textValue.length > 0 ? (isRTL ? 'pl-14' : 'pr-14') : '',
                    isRTL ? 'py-4 pr-4' : 'py-4 pl-4'
                  )}
                  style={{ height: `${textAreaHeight}px` }}
                  aria-label={question.question}
                  aria-invalid={
                    (!isMinLengthMet && question.isRequired) || lengthExceeded
                  }
                />

                {textValue.length > 0 && (
                  <div
                    className={cn(
                      'absolute top-3 flex flex-col gap-2 z-20',
                      isRTL ? 'left-3' : 'right-3'
                    )}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                              'p-2 rounded-xl transition-all shadow-md',
                              textCopied
                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                : `bg-white text-gray-600 hover:${theme.bgSoft} hover:${theme.iconColor}`
                            )}
                            onClick={handleCopyText}
                          >
                            {textCopied ? (
                              <CheckCheck className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </motion.button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {textCopied
                              ? dict.answerInput.tooltips.copied
                              : dict.answerInput.tooltips.copy}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {!question.isRequired && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 rounded-xl bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all shadow-md"
                              onClick={handleClear}
                            >
                              <Eraser className="h-4 w-4" />
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{dict.answerInput.tooltips.clearText}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}

                {(hasMinLength || hasMaxLength) && (
                  <div className="absolute bottom-3 left-3">
                    <Badge
                      className={cn(
                        'font-mono transition-all',
                        lengthExceeded
                          ? 'bg-red-500 text-white animate-pulse'
                          : isCloseToMax
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-700 text-white'
                      )}
                    >
                      {textValue.length}
                      {hasMaxLength && ` / ${question.maxLength}`}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {hasMinLength && question.isRequired && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {isMinLengthMet ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-700 font-medium">
                          {dict.answerInput.openText.minLengthMet}
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-700 font-medium">
                          {dict.answerInput.openText.minLengthRequired.replace(
                            '{{count}}',
                            (
                              (question.minLength ?? 0) - textValue.length
                            ).toString()
                          )}
                        </span>
                      </>
                    )}
                  </div>
                  <span
                    className={cn(
                      'font-bold text-lg',
                      isMinLengthMet ? 'text-green-600' : 'text-amber-600'
                    )}
                  >
                    {completionPercentage}%
                  </span>
                </div>

                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      'bg-gradient-to-r',
                      isMinLengthMet
                        ? 'from-green-500 to-emerald-600'
                        : completionPercentage > 50
                          ? 'from-amber-500 to-orange-600'
                          : 'from-gray-400 to-gray-500'
                    )}
                  />

                  {!isMinLengthMet && completionPercentage > 0 && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  )}
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap gap-2">
              {hasMinLength && (
                <Badge
                  variant="outline"
                  className={cn(
                    'border-2',
                    !isMinLengthMet && question.isRequired
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : cn(
                          theme.borderColor,
                          theme.bgSoft,
                          theme.textColor.replace('900', '700')
                        )
                  )}
                >
                  <Info className="w-3 h-3 mr-1" />
                  {question.isRequired
                    ? dict.answerInput.openText.minLengthInfoRequired.replace(
                        '{{count}}',
                        String(question.minLength ?? 0)
                      )
                    : dict.answerInput.openText.minLengthInfoRecommended.replace(
                        '{{count}}',
                        String(question.minLength ?? 0)
                      )}
                </Badge>
              )}

              {lengthExceeded && (
                <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white animate-pulse">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {dict.answerInput.openText.maxLengthExceeded}
                </Badge>
              )}

              {textValue.length > 50 && !lengthExceeded && (
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700"
                >
                  <Flame className="w-3 h-3 mr-1" />
                  כתיבה מעולה! ממשיכים כך
                </Badge>
              )}
            </div>

            {question.description && (
              <Collapsible
                open={isCollapsibleOpen}
                onOpenChange={setIsCollapsibleOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl transition-all border-2 border-dashed border-purple-200"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <span className="font-semibold text-purple-900">
                        {dict.answerInput.openText.tipsButton}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isCollapsibleOpen ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-5 w-5 text-purple-500" />
                    </motion.div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200"
                  >
                    <div className="prose prose-sm max-w-none text-purple-900">
                      {question.description}
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        );
      }

      case 'budgetAllocation': {
        const budgetValues = (internalValue as Record<string, number>) || {};
        const totalAllocatedPoints = Object.values(budgetValues).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const totalPointsRequired = question.totalPoints ?? 100;
        const pointsDifference = totalPointsRequired - totalAllocatedPoints;
        const isAllocationComplete = pointsDifference === 0;
        const isOverAllocated = pointsDifference < 0;
        const allocationPercentage = Math.min(
          100,
          (totalAllocatedPoints / totalPointsRequired) * 100
        );
        const headerTheme = isAllocationComplete
          ? 'green'
          : isOverAllocated
            ? 'red'
            : themeColor;
        const headerColors = {
          green: {
            bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
            border: 'border-green-400',
            iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
            text: 'text-green-700',
            progress: 'from-green-500 to-emerald-600',
          },
          red: {
            bg: 'bg-gradient-to-r from-red-50 to-rose-50',
            border: 'border-red-400',
            iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
            text: 'text-red-700',
            progress: 'from-red-500 to-rose-600',
          },
          [themeColor]: {
            bg: `bg-gradient-to-r ${theme.lightBg}`,
            border: theme.borderColor,
            iconBg: `bg-gradient-to-br ${theme.gradient}`,
            text: theme.textColor,
            progress: `${theme.progressFrom} ${theme.progressTo}`,
          },
        };
        const currentHeaderColors =
          headerColors[headerTheme as keyof typeof headerColors];

        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'relative p-6 rounded-2xl border-2 overflow-hidden',
                currentHeaderColors.bg,
                currentHeaderColors.border
              )}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/50 to-transparent rounded-bl-full" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-3 rounded-xl',
                        currentHeaderColors.iconBg
                      )}
                    >
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {dict.answerInput.budgetAllocation.totalAllocated}
                      </p>
                      <p
                        className={cn(
                          'text-2xl font-bold',
                          currentHeaderColors.text
                        )}
                      >
                        {totalAllocatedPoints} / {totalPointsRequired}
                      </p>
                    </div>
                  </div>

                  {isAllocationComplete && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full"
                    >
                      <CheckCircle className="w-5 h-5" fill="white" />
                      <span className="font-bold">מושלם!</span>
                    </motion.div>
                  )}

                  {!isAllocationComplete && (
                    <Badge
                      className={cn(
                        'text-sm px-3 py-1',
                        isOverAllocated
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                      )}
                    >
                      {pointsDifference > 0
                        ? dict.answerInput.budgetAllocation.remaining.replace(
                            '{{count}}',
                            String(pointsDifference)
                          )
                        : dict.answerInput.budgetAllocation.surplus.replace(
                            '{{count}}',
                            String(Math.abs(pointsDifference))
                          )}
                    </Badge>
                  )}
                </div>

                <div className="relative h-4 bg-white/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${allocationPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      'bg-gradient-to-r',
                      currentHeaderColors.progress
                    )}
                  />
                </div>
              </div>
            </motion.div>

            <div className="space-y-4">
              {question.categories?.map((category, index) => {
                const categoryValue = budgetValues[category.value] || 0;
                const isActive = categoryValue > 0;
                const percentage = (categoryValue / totalPointsRequired) * 100;

                return (
                  <motion.div
                    key={category.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'relative p-5 rounded-2xl border-2 transition-all',
                      isActive
                        ? cn(
                            'bg-gradient-to-r shadow-lg',
                            theme.lightBg,
                            theme.borderColor
                          )
                        : cn('bg-white border-gray-200', theme.hoverBorder)
                    )}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {category.icon && (
                            <motion.div
                              animate={{
                                scale: isActive ? [1, 1.1, 1] : 1,
                              }}
                              transition={{ duration: 0.3 }}
                              className={cn(
                                'p-2.5 rounded-xl transition-all',
                                isActive
                                  ? cn(
                                      'bg-gradient-to-br text-white shadow-md',
                                      theme.gradient
                                    )
                                  : 'bg-gray-100 text-gray-500'
                              )}
                            >
                              {category.icon}
                            </motion.div>
                          )}
                          <div>
                            <Label className="font-semibold text-base text-gray-800">
                              {category.label}
                            </Label>
                            {category.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              'text-lg font-bold px-3 py-1',
                              isActive
                                ? cn(
                                    'bg-gradient-to-r text-white',
                                    theme.gradient
                                  )
                                : 'bg-gray-200 text-gray-600'
                            )}
                          >
                            {categoryValue}
                            {!question.totalPoints && '%'}
                          </Badge>
                          {isActive && (
                            <Badge variant="outline" className="text-xs">
                              {percentage.toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Slider
                          value={[categoryValue]}
                          min={category.min ?? 0}
                          max={category.max ?? totalPointsRequired}
                          step={1}
                          onValueChange={(newValues: number[]) => {
                            const currentOthersTotal =
                              totalAllocatedPoints - categoryValue;
                            const newValue = Math.min(
                              newValues[0],
                              totalPointsRequired - currentOthersTotal
                            );
                            handleValueChange({
                              ...budgetValues,
                              [category.value]: newValue,
                            });
                          }}
                          className={cn(
                            'py-2',
                            isActive
                              ? `[&>span:first-child]:bg-gradient-to-r ${theme.gradient}`
                              : '[&>span:first-child]:bg-gray-300'
                          )}
                        />

                        {isActive && (
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className={cn(
                                'h-full rounded-full bg-gradient-to-r',
                                theme.gradient
                              )}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        className={cn(
                          'absolute inset-0 rounded-2xl blur-xl bg-gradient-to-r opacity-10',
                          theme.gradient
                        )}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {totalAllocatedPoints > 0 &&
              (!question.isRequired || isAllocationComplete) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl"
                  >
                    <Eraser className="w-4 h-4 mr-2" />
                    {dict.answerInput.budgetAllocation.resetButton}
                  </Button>
                </motion.div>
              )}

            <AnimatePresence>
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-700">
                    {validationError}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      default:
        console.warn('Unsupported question type:', question.type);
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-amber-900 mb-1">
                  {dict.answerInput.unsupportedType.replace(
                    '{{type}}',
                    question.type
                  )}
                </p>
                <p className="text-sm text-amber-700">
                  אנא פנה לתמיכה טכנית לפתרון הבעיה
                </p>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {renderInput()}

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
