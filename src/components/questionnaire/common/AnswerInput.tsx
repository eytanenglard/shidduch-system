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

export interface AnswerInputProps {
  locale: string;
  question: Question;
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
}: AnswerInputProps) {
  const isRTL = locale === 'he'; // הגדר משתנה עזר

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
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
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
      className={cn(
        'p-3 border rounded-lg cursor-pointer transition-all',
        'hover:bg-gray-50 flex items-center justify-between gap-2',
        'relative overflow-hidden',
        isSelected && 'bg-blue-50 border-blue-500 shadow-sm'
      )}
      onClick={() => handleValueChange(choiceOption.value)}
    >
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 opacity-60"
          />
        )}
      </AnimatePresence>
      <div
        className={cn(
          'flex items-center gap-2 flex-1 z-10',
          isRTL && 'flex-row-reverse'
        )}
      >
        {' '}
        {choiceOption.icon && (
          <motion.div
            className={cn(
              'text-blue-600 transition-transform',
              isSelected && 'text-blue-700'
            )}
            animate={{ scale: isSelected ? 1.1 : 1 }}
          >
            {choiceOption.icon}
          </motion.div>
        )}
        <span className={cn('font-medium', isSelected && 'text-blue-700')}>
          {choiceOption.text}
        </span>
      </div>
      <div className="relative w-6 h-6 z-10">
        <AnimatePresence>
          {isSelected && (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </motion.div>
          )}
          {isSelected && !question.isRequired && (
            <motion.div
              key="clear"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                aria-label={dict.answerInput.clearSelection}
              >
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderInput = () => {
    switch (question.type) {
      case 'singleChoice':
        return (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {question.options?.map((optionItem) => {
                const isSelected = internalValue === optionItem.value;
                return renderSingleChoiceOption(optionItem, isSelected);
              })}
            </AnimatePresence>
          </div>
        );

      case 'scale':
        return (
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
        );

      case 'multiChoice':
      case 'multiSelect':
        const selectedValues = Array.isArray(internalValue)
          ? (internalValue as string[])
          : [];
        return (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {question.options?.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <motion.div
                    key={option.value}
                    variants={optionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover="hover"
                    whileTap="tap"
                    className={cn(
                      'p-3 border rounded-lg cursor-pointer transition-all',
                      'hover:bg-gray-50 flex items-center justify-between',
                      'relative overflow-hidden',
                      isSelected && 'bg-blue-50 border-blue-500'
                    )}
                    onClick={() => {
                      let newValues: string[];
                      if (isSelected) {
                        newValues = selectedValues.filter(
                          (v) => v !== option.value
                        );
                      } else {
                        if (
                          question.maxSelections &&
                          selectedValues.length >= question.maxSelections
                        ) {
                          setError(
                            dict.answerInput.multiSelect.maxSelectionError.replace(
                              '{{count}}',
                              String(question.maxSelections)
                            )
                          );
                          setTimeout(() => setError(null), 2000);
                          return;
                        }
                        newValues = [...selectedValues, option.value];
                      }
                      handleValueChange(newValues);
                    }}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 opacity-60"
                        />
                      )}
                    </AnimatePresence>
                    <div
                      className={cn(
                        'flex items-center gap-2 z-10',
                        isRTL && 'flex-row-reverse'
                      )}
                    >
                      {' '}
                      {option.icon && (
                        <motion.div
                          className={cn(
                            'text-blue-600 transition-transform',
                            isSelected && 'text-blue-700'
                          )}
                          animate={{ scale: isSelected ? 1.1 : 1 }}
                        >
                          {option.icon}
                        </motion.div>
                      )}
                      <span
                        className={cn(
                          'font-medium',
                          isSelected && 'text-blue-700'
                        )}
                      >
                        {option.text}
                      </span>
                    </div>
                    <div
                      className={cn(
                        'w-5 h-5 border rounded flex items-center justify-center transition-colors',
                        isSelected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 bg-white'
                      )}
                    >
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <CheckCheck className="w-4 h-4 text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {error}
              </motion.p>
            )}
            {(question.minSelections || question.maxSelections) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 mt-2 flex justify-between items-center p-2 bg-gray-50 rounded-lg"
              >
                <span className="flex items-center">
                  <Info className="h-3 w-3 mr-1 text-blue-500" />
                  {dict.answerInput.multiSelect.selectedInfo.replace(
                    '{{count}}',
                    selectedValues.length.toString()
                  )}
                </span>
                <span>
                  {question.minSelections &&
                    `${dict.answerInput.multiSelect.minLabel}: ${question.minSelections}`}
                  {question.minSelections && question.maxSelections && ' • '}
                  {question.maxSelections &&
                    `${dict.answerInput.multiSelect.maxLabel}: ${question.maxSelections}`}
                </span>
              </motion.div>
            )}
          </div>
        );

      case 'multiSelectWithOther':
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
            {question.options?.map((option) => {
              if (option.value === 'other') return null;
              const isSelected = predefinedAnswers.includes(option.value);
              return (
                <motion.div
                  key={option.value}
                  variants={optionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  whileHover="hover"
                  whileTap="tap"
                  className={cn(
                    'p-3 border rounded-lg cursor-pointer transition-all',
                    'hover:bg-gray-50 flex items-center justify-between',
                    'relative overflow-hidden',
                    isSelected && 'bg-blue-50 border-blue-500'
                  )}
                  onClick={() => {
                    let newValues: string[];
                    if (isSelected)
                      newValues = predefinedAnswers.filter(
                        (v) => v !== option.value
                      );
                    else {
                      if (isMaxLengthReached) {
                        setError(
                          dict.answerInput.multiSelect.maxSelectionError.replace(
                            '{{count}}',
                            String(question.maxSelections)
                          )
                        );
                        setTimeout(() => setError(null), 2000);
                        return;
                      }
                      newValues = [...predefinedAnswers, option.value];
                    }
                    handleValueChange([...newValues, ...customAnswers]);
                  }}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 opacity-60"
                      />
                    )}
                  </AnimatePresence>
                  <div
                    className={cn(
                      'flex items-center gap-2 z-10',
                      isRTL && 'flex-row-reverse'
                    )}
                  >
                    {' '}
                    {option.icon && (
                      <motion.div
                        animate={{ scale: isSelected ? 1.1 : 1 }}
                        className={cn(
                          'text-blue-600',
                          isSelected && 'text-blue-700'
                        )}
                      >
                        {option.icon}
                      </motion.div>
                    )}
                    <span
                      className={cn(
                        'font-medium',
                        isSelected && 'text-blue-700'
                      )}
                    >
                      {option.text}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 border rounded flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 bg-white'
                    )}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <CheckCheck className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
            <div className="space-y-2 border-t pt-4 mt-4">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Plus className="h-4 w-4 text-blue-500" />
                {dict.answerInput.multiSelectWithOther.addOtherOptionLabel}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder={
                    dict.answerInput.multiSelectWithOther.otherOptionPlaceholder
                  }
                  className="flex-1 text-sm"
                  disabled={isMaxLengthReached && isCustomValueEmpty}
                />
                <Button
                  type="button"
                  variant="outline"
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
                        setTimeout(() => setError(null), 2000);
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
                        setTimeout(() => setError(null), 2000);
                      }
                    }
                  }}
                  disabled={isCustomValueEmpty || isMaxLengthReached}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {dict.answerInput.multiSelectWithOther.addButton}
                </Button>
              </div>
            </div>
            {customAnswers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200"
              >
                <Label className="text-xs text-gray-600 flex items-center font-normal">
                  <Edit className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  {dict.answerInput.multiSelectWithOther.addedAnswersLabel}
                </Label>
                <div className="space-y-1 mt-1">
                  {customAnswers.map((customVal, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-1.5 bg-white rounded-md border border-blue-100 text-sm"
                    >
                      <div className="flex items-center">
                        <CornerDownRight className="w-3.5 h-3.5 text-blue-400 mr-2" />
                        <span className="text-gray-700">
                          {customVal.replace('custom:', '')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                        onClick={() => {
                          const newValues = selectedWithOtherValues.filter(
                            (v) => v !== customVal
                          );
                          handleValueChange(newValues);
                        }}
                        aria-label={
                          dict.answerInput.tooltips.removeCustomAnswer
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-500 flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" /> {error}
              </motion.p>
            )}
            {(question.minSelections || question.maxSelections) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 mt-2 flex justify-between items-center p-2 bg-gray-50 rounded-lg"
              >
                <span className="flex items-center">
                  <Info className="h-3 w-3 mr-1 text-blue-500" />
                  {dict.answerInput.multiSelect.selectedInfo.replace(
                    '{{count}}',
                    selectedWithOtherValues.length.toString()
                  )}
                </span>
                <span>
                  {question.minSelections &&
                    `${dict.answerInput.multiSelect.minLabel}: ${question.minSelections}`}
                  {question.minSelections && question.maxSelections && ' • '}
                  {question.maxSelections &&
                    `${dict.answerInput.multiSelect.maxLabel}: ${question.maxSelections}`}
                </span>
              </motion.div>
            )}
          </div>
        );

      case 'scenario':
        return (
          <div className="space-y-2">
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
                  className={cn(
                    'p-4 border rounded-lg cursor-pointer transition-all',
                    'hover:bg-gray-50 flex items-center justify-between',
                    'relative overflow-hidden',
                    isSelected && 'bg-blue-50 border-blue-500 shadow-sm'
                  )}
                  onClick={() => handleValueChange(optionValue)}
                >
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 opacity-60"
                      />
                    )}
                  </AnimatePresence>
                  <div className="flex-1 z-10">
                    <div
                      className={cn(
                        'font-medium',
                        isSelected && 'text-blue-700'
                      )}
                    >
                      {option.text}
                    </div>
                    {option.description && (
                      <div
                        className={cn(
                          'text-sm text-gray-600 mt-1',
                          isSelected && 'text-blue-600'
                        )}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>
                  <div className="relative w-6 h-6 ml-2 z-10">
                    <AnimatePresence>
                      {isSelected ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        </motion.div>
                      ) : null}
                      {isSelected && !question.isRequired && (
                        <motion.div
                          key="clear"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClear();
                            }}
                            aria-label={dict.answerInput.clearSelection}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );

      case 'iconChoice':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {question.options?.map((option) => {
              const isSelected = internalValue === option.value;
              return (
                <TooltipProvider key={option.value} delayDuration={300}>
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
                            'p-4 cursor-pointer transition-all hover:shadow-md relative min-h-[100px]',
                            'flex flex-col items-center justify-center gap-2 text-center',
                            isSelected
                              ? 'ring-2 ring-blue-500 bg-blue-50'
                              : 'bg-white hover:bg-gray-50 border'
                          )}
                        >
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-0.5 shadow"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {isSelected && !question.isRequired && (
                            <motion.div
                              key="clear-icon"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity"
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClear();
                                }}
                                aria-label={dict.answerInput.clearSelection}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </motion.div>
                          )}
                          <motion.div
                            animate={{
                              scale: isSelected ? 1.1 : 1,
                              y: isSelected ? -2 : 0,
                            }}
                            className={cn(
                              'text-3xl mb-1 transition-colors duration-200',
                              isSelected
                                ? 'text-blue-600'
                                : 'text-gray-500 group-hover:text-gray-700'
                            )}
                          >
                            {option.icon}
                          </motion.div>
                          <motion.span
                            animate={{ fontWeight: isSelected ? 600 : 500 }}
                            className={cn(
                              'text-sm',
                              isSelected ? 'text-blue-700' : 'text-gray-700'
                            )}
                          >
                            {option.text}
                          </motion.span>
                        </Card>
                      </motion.div>
                    </TooltipTrigger>
                    {option.description && (
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{option.description}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        );

      case 'openText':
        let textValue = '';
        // קודם כל, נטפל במקרה הפשוט שבו הערך הוא מחרוזת
        if (typeof internalValue === 'string') {
          textValue = internalValue;
        }
        // לאחר מכן, נטפל במקרה המורכב יותר של אובייקט
        else if (
          typeof internalValue === 'object' &&
          internalValue !== null &&
          !Array.isArray(internalValue) &&
          'text' in internalValue
        ) {
          // TypeScript מבין כעת שב-internalValue בהכרח קיים המאפיין 'text'
          textValue = String(internalValue.text || ''); // המרה בטוחה למחרוזת
        }
        const hasMinLength =
          question.minLength !== undefined && question.minLength > 0;
        const hasMaxLength =
          question.maxLength !== undefined && question.maxLength > 0;
        const hasLength = hasMinLength || hasMaxLength;
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
        return (
          <div className="space-y-2">
            <div
              className={cn(
                'relative border rounded-md transition-all',
                isFocused && 'ring-2 ring-blue-500',
                !isMinLengthMet && question.isRequired
                  ? 'border-red-300'
                  : 'border-gray-300',
                lengthExceeded
                  ? 'border-red-400 bg-red-50/50'
                  : isCloseToMax
                    ? 'border-amber-300 bg-amber-50/50'
                    : ''
              )}
            >
              <Textarea
                value={textValue}
                onChange={(e) => handleValueChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={
                  question.placeholder || dict.answerInput.openText.placeholder
                }
                className={cn(
                  'resize-y border-0 focus-visible:ring-0 w-full min-h-[150px] text-base leading-relaxed',
                  textValue.length > 0
                    ? isRTL
                      ? 'pl-12'
                      : 'pr-12'
                    : isRTL
                      ? 'pl-3'
                      : 'pr-3',
                  isRTL ? 'py-3 pr-3' : 'py-3 pl-3'
                )}
                style={{ height: `${textAreaHeight}px` }}
                aria-label={question.question}
                aria-invalid={
                  (!isMinLengthMet && question.isRequired) || lengthExceeded
                }
                aria-describedby={question.id + '-length-info'}
              />
              {textValue.length > 0 && (
                <div
                  className={cn(
                    'absolute top-2 flex flex-col gap-1',
                    isRTL ? 'left-2' : 'right-2'
                  )}
                >
                  {' '}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                          onClick={handleCopyText}
                        >
                          {textCopied ? (
                            <CheckCheck className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-gray-400" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full"
                            onClick={handleClear}
                          >
                            <Eraser className="h-3.5 w-3.5 text-gray-400" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{dict.answerInput.tooltips.clearText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              )}
              {hasLength && (
                <div
                  id={question.id + '-length-info'}
                  className="absolute bottom-2 left-2"
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-normal transition-colors',
                      lengthExceeded
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : isCloseToMax
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {textValue.length}
                    {hasMaxLength && ` / ${question.maxLength}`}
                  </Badge>
                </div>
              )}
            </div>
            {hasMinLength && question.isRequired && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span
                    className={cn(
                      'flex items-center',
                      !isMinLengthMet ? 'text-amber-600' : 'text-green-600'
                    )}
                  >
                    {!isMinLengthMet ? (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {dict.answerInput.openText.minLengthRequired.replace(
                          '{{count}}',
                          (
                            (question.minLength ?? 0) - textValue.length
                          ).toString()
                        )}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {dict.answerInput.openText.minLengthMet}
                      </>
                    )}
                  </span>
                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-1.5" />
              </div>
            )}
            <div className="flex flex-wrap justify-between items-center mt-1 gap-2">
              <div className="flex flex-wrap gap-1">
                {hasMinLength && (
                  <div
                    className={cn(
                      'inline-flex items-center text-xs px-2 py-0.5 rounded-full',
                      !isMinLengthMet && question.isRequired
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {question.isRequired
                      ? dict.answerInput.openText.minLengthInfoRequired.replace(
                          '{{count}}',
                          String(question.minLength ?? 0)
                        )
                      : dict.answerInput.openText.minLengthInfoRecommended.replace(
                          '{{count}}',
                          String(question.minLength ?? 0)
                        )}
                  </div>
                )}
                {lengthExceeded && (
                  <div className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {dict.answerInput.openText.maxLengthExceeded}
                  </div>
                )}
              </div>
              {hasMinLength && (
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {dict.answerInput.openText.estimatedTime.replace(
                    '{{count}}',
                    String(
                      Math.max(1, Math.ceil((question.minLength ?? 0) / 70))
                    )
                  )}
                </div>
              )}
            </div>
            {question.description && (
              <Collapsible
                className="mt-4"
                open={isCollapsibleOpen}
                onOpenChange={setIsCollapsibleOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex items-center justify-between px-3 py-1.5 h-auto hover:bg-blue-50 text-sm text-blue-700"
                  >
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{dict.answerInput.openText.tipsButton}</span>
                    </div>
                    {isCollapsibleOpen ? (
                      <ChevronUp className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-blue-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-blue-50 rounded-md mt-2 text-sm text-blue-900 prose prose-sm max-w-none">
                  {question.description}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        );

      case 'budgetAllocation':
        const budgetValues = (internalValue as Record<string, number>) || {};
        const totalAllocatedPoints = Object.values(budgetValues).reduce(
          (sum, val) => sum + (Number(val) || 0),
          0
        );
        const totalPointsRequired = question.totalPoints ?? 100;
        const pointsDifference = totalPointsRequired - totalAllocatedPoints;
        const isAllocationComplete = pointsDifference === 0;
        const isOverAllocated = pointsDifference < 0;
        return (
          <fieldset className="space-y-4 border-none p-0 m-0">
            <legend className="sr-only">{question.question}</legend>
            <div className="space-y-4">
              {question.categories?.map((category) => {
                const categoryValue = budgetValues[category.value] || 0;
                const isActive = categoryValue > 0;
                return (
                  <motion.div
                    key={category.value}
                    className="space-y-2"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex justify-between items-center">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        {category.icon && (
                          <motion.div
                            animate={{ scale: isActive ? 1.1 : 1 }}
                            className="text-blue-600"
                          >
                            {category.icon}
                          </motion.div>
                        )}
                        {category.label}
                      </Label>
                      <Badge
                        variant="outline"
                        className={cn(
                          'transition-all text-sm px-2 py-0.5',
                          isActive
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        )}
                      >
                        {categoryValue.toFixed(0)}
                        {question.totalPoints ? '' : '%'}
                      </Badge>
                    </div>
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
                        'py-1',
                        isActive
                          ? '[&>span:first-child]:bg-blue-600'
                          : '[&>span:first-child]:bg-gray-300'
                      )}
                      aria-label={`הקצאת נקודות עבור ${category.label}`}
                    />
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {category.description}
                      </p>
                    )}
                  </motion.div>
                );
              })}
              <div
                className={cn(
                  'flex justify-between items-center p-3 rounded-lg border mt-4',
                  isAllocationComplete
                    ? 'bg-green-50 border-green-200'
                    : isOverAllocated
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                )}
              >
                <div className="text-sm">
                  {dict.answerInput.budgetAllocation.totalAllocated}{' '}
                  <span
                    className={cn(
                      'font-bold',
                      isAllocationComplete
                        ? 'text-green-700'
                        : isOverAllocated
                          ? 'text-red-700'
                          : 'text-blue-700'
                    )}
                  >
                    {totalAllocatedPoints} / {totalPointsRequired}
                  </span>
                  {!isAllocationComplete && (
                    <span
                      className={cn(
                        'text-xs ml-2',
                        isOverAllocated ? 'text-red-600' : 'text-amber-600'
                      )}
                    >
                      (
                      {pointsDifference > 0
                        ? dict.answerInput.budgetAllocation.remaining.replace(
                            '{{count}}',
                            String(pointsDifference)
                          )
                        : dict.answerInput.budgetAllocation.surplus.replace(
                            '{{count}}',
                            String(Math.abs(pointsDifference))
                          )}
                      )
                    </span>
                  )}
                </div>
                {totalAllocatedPoints > 0 &&
                  (!question.isRequired || isAllocationComplete) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                      aria-label={dict.answerInput.tooltips.resetAllocation}
                    >
                      <Eraser className="w-3.5 h-3.5 mr-1" />
                      {dict.answerInput.budgetAllocation.resetButton}
                    </Button>
                  )}
              </div>
              <AnimatePresence>
                {validationError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-center gap-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>{validationError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </fieldset>
        );

      default:
        console.warn('Unsupported question type:', question.type);
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            <p>
              <strong>
                {dict.answerInput.unsupportedType.replace(
                  '{{type}}',
                  question.type
                )}
              </strong>
            </p>
          </div>
        );
    }
  };

  return <div className={cn('space-y-4', className)}>{renderInput()}</div>;
}
