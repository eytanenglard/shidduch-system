import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "lucide-react";
import type { AnswerValue, AnswerInputProps } from "../types/types";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Add custom CSS for progress indicator styles
// You would typically add these to your global CSS file
/* 
.progress-green .progress-indicator {
  background-color: #22c55e;
}
.progress-blue .progress-indicator {
  background-color: #3b82f6;
}
.progress-amber .progress-indicator {
  background-color: #f59e0b;
}
*/

export default function AnswerInput({
  question,
  value,
  onChange,
  onClear,
  showValidation = false,
  className = "",
}: AnswerInputProps) {
  const [internalValue, setInternalValue] = useState<AnswerValue>(value);
  const [error, setError] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState<string>("");
  const [, setCharactersCount] = useState<number>(0);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [, setSelectedOption] = useState<string | null>(null);
  const [textAreaHeight, setTextAreaHeight] = useState<number>(150);
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState<boolean>(false);
  const [textCopied, setTextCopied] = useState(false);

  useEffect(() => {
    setInternalValue(value);
    if (typeof value === "string") {
      setCharactersCount(value.length);
      // התאמת גובה תיבת הטקסט לגודל התוכן
      if (value.length > 200) {
        setTextAreaHeight(220);
      } else if (value.length > 100) {
        setTextAreaHeight(180);
      } else {
        setTextAreaHeight(150);
      }
    }
  }, [value]);

  const handleValueChange = (newValue: AnswerValue) => {
    if (newValue === internalValue && !question.isRequired) {
      handleClear();
      return;
    }

    setInternalValue(newValue);
    setError(null);
    onChange?.(newValue);

    if (typeof newValue === "string") {
      setCharactersCount(newValue.length);
    }
  };

  const handleClear = () => {
    let emptyValue: AnswerValue;
    switch (question.type) {
      case "multiChoice":
      case "multiSelect":
      case "multiSelectWithOther":
        emptyValue = [];
        break;
      case "budgetAllocation":
        emptyValue = {};
        break;
      case "openText":
        emptyValue = "";
        break;
      case "scale":
      case "singleChoice":
      case "scenario":
      case "iconChoice":
      default:
        emptyValue = undefined;
    }

    setInternalValue(emptyValue);
    setCustomValue("");
    setCharactersCount(0);
    setSelectedOption(null);
    setError(null);
    onClear?.();
  };

  const handleCopyText = useCallback(() => {
    if (typeof internalValue === "string" && internalValue) {
      navigator.clipboard.writeText(internalValue);
      setTextCopied(true);
      setTimeout(() => setTextCopied(false), 2000);
    }
  }, [internalValue]);

  // אנימציות
  const optionVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  const renderSingleChoiceOption = (option, isSelected) => (
    <motion.div
      key={option.value}
      variants={optionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
      className={cn(
        "p-3 border rounded-lg cursor-pointer transition-all",
        "hover:bg-gray-50 flex items-center justify-between gap-2",
        "relative overflow-hidden",
        isSelected && "bg-blue-50 border-blue-500 shadow-sm"
      )}
      onClick={() => handleValueChange(option.value)}
    >
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-blue-500/5"
        />
      )}

      <div className="flex items-center gap-2 flex-1 z-10">
        {option.icon && (
          <div
            className={cn(
              "text-blue-600 transition-transform",
              isSelected && "scale-110"
            )}
          >
            {option.icon}
          </div>
        )}
        <span className={cn("font-medium", isSelected && "text-blue-700")}>
          {option.text}
        </span>
      </div>

      {isSelected ? (
        <CheckCircle
          className={cn(
            "h-5 w-5 text-blue-500 z-10",
            !question.isRequired && "group-hover:hidden"
          )}
        />
      ) : null}

      {isSelected && !question.isRequired && (
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 z-10"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );

  const renderInput = () => {
    switch (question.type) {
      case "singleChoice":
        return (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {question.options?.map((option) => {
                const isSelected = internalValue === option.value;
                return renderSingleChoiceOption(option, isSelected);
              })}
            </AnimatePresence>
          </div>
        );

      case "multiChoice":
      case "multiSelect":
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
                      "p-3 border rounded-lg cursor-pointer transition-all",
                      "hover:bg-gray-50 flex items-center justify-between",
                      "relative overflow-hidden",
                      isSelected && "bg-blue-50 border-blue-500"
                    )}
                    onClick={() => {
                      const newValues: string[] = isSelected
                        ? selectedValues.filter((v) => v !== option.value)
                        : [...selectedValues, option.value];
                      handleValueChange(newValues);
                    }}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 bg-blue-500/5"
                      />
                    )}

                    <div className="flex items-center gap-2 z-10">
                      {option.icon && (
                        <div
                          className={cn(
                            "text-blue-600 transition-transform",
                            isSelected && "scale-110"
                          )}
                        >
                          {option.icon}
                        </div>
                      )}
                      <span
                        className={cn(
                          "font-medium",
                          isSelected && "text-blue-700"
                        )}
                      >
                        {option.text}
                      </span>
                    </div>

                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-blue-500 z-10" />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* מראה כמה נבחרו ומה המגבלות */}
            {(question.minSelections || question.maxSelections) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 mt-2 flex justify-between items-center p-2 bg-gray-50 rounded-lg"
              >
                <span className="flex items-center">
                  <Info className="h-3 w-3 mr-1 text-blue-500" />
                  נבחרו {selectedValues.length} אפשרויות
                </span>
                <span>
                  {question.minSelections &&
                    `מינימום: ${question.minSelections}`}
                  {question.minSelections && question.maxSelections && " • "}
                  {question.maxSelections &&
                    `מקסימום: ${question.maxSelections}`}
                </span>
              </motion.div>
            )}
          </div>
        );

      case "multiSelectWithOther":
        const selectedWithOtherValues = Array.isArray(internalValue)
          ? (internalValue as string[])
          : [];
        return (
          <div className="space-y-4">
            {question.options?.map((option) => {
              const isSelected = selectedWithOtherValues.includes(option.value);
              return (
                <motion.div
                  key={option.value}
                  variants={optionVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                  whileTap="tap"
                  className={cn(
                    "p-3 border rounded-lg cursor-pointer transition-all",
                    "hover:bg-gray-50 flex items-center justify-between",
                    "relative overflow-hidden",
                    isSelected && "bg-blue-50 border-blue-500"
                  )}
                  onClick={() => {
                    const newValues: string[] = isSelected
                      ? selectedWithOtherValues.filter(
                          (v) => v !== option.value
                        )
                      : [...selectedWithOtherValues, option.value];
                    handleValueChange(newValues);
                  }}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-blue-500/5"
                    />
                  )}

                  <div className="flex items-center gap-2 z-10">
                    {option.icon && (
                      <div
                        className={cn(
                          "text-blue-600 transition-transform",
                          isSelected && "scale-110"
                        )}
                      >
                        {option.icon}
                      </div>
                    )}
                    <span
                      className={cn(
                        "font-medium",
                        isSelected && "text-blue-700"
                      )}
                    >
                      {option.text}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-blue-500 z-10" />
                  )}
                </motion.div>
              );
            })}

            <div className="space-y-2 border-t pt-4 mt-4">
              <Label className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-500" />
                הוספת תשובה אחרת
              </Label>
              <div className="flex gap-2">
                <Input
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="הוסף אפשרות אחרת..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (customValue.trim()) {
                      const newValues: string[] = [
                        ...selectedWithOtherValues,
                        `custom:${customValue.trim()}`,
                      ];
                      handleValueChange(newValues);
                      setCustomValue("");
                    }
                  }}
                  disabled={!customValue.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  הוסף
                </Button>
              </div>
            </div>

            {selectedWithOtherValues.filter((v) => v.startsWith("custom:"))
              .length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200"
              >
                <Label className="text-sm text-gray-600 flex items-center">
                  <Edit className="h-3.5 w-3.5 mr-1 text-blue-600" />
                  תשובות מותאמות אישית:
                </Label>

                <div className="space-y-2 mt-2">
                  {selectedWithOtherValues
                    .filter((v) => v.startsWith("custom:"))
                    .map((customVal, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center">
                          <CornerDownRight className="w-3.5 h-3.5 text-blue-500 mr-2" />
                          <span>{customVal.replace("custom:", "")}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-0"
                          onClick={() => {
                            const newValues: string[] =
                              selectedWithOtherValues.filter(
                                (v) => v !== customVal
                              );
                            handleValueChange(newValues);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* מראה כמה נבחרו ומה המגבלות */}
            {(question.minSelections || question.maxSelections) && (
              <div className="text-xs text-gray-500 mt-2 flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="flex items-center">
                  <Info className="h-3 w-3 mr-1 text-blue-500" />
                  נבחרו {selectedWithOtherValues.length} אפשרויות
                </span>
                <span>
                  {question.minSelections &&
                    `מינימום: ${question.minSelections}`}
                  {question.minSelections && question.maxSelections && " • "}
                  {question.maxSelections &&
                    `מקסימום: ${question.maxSelections}`}
                </span>
              </div>
            )}
          </div>
        );

      case "scenario":
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
                    "p-4 border rounded-lg cursor-pointer transition-all",
                    "hover:bg-gray-50 flex items-center justify-between",
                    "relative overflow-hidden",
                    isSelected && "bg-blue-50 border-blue-500 shadow-sm"
                  )}
                  onClick={() => handleValueChange(optionValue)}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-blue-500/5"
                    />
                  )}

                  <div className="flex-1 z-10">
                    <div
                      className={cn(
                        "font-medium",
                        isSelected && "text-blue-700"
                      )}
                    >
                      {option.text}
                    </div>
                    {option.description && (
                      <div
                        className={cn(
                          "text-sm text-gray-600 mt-1",
                          isSelected && "text-blue-600"
                        )}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>

                  {isSelected ? (
                    <CheckCircle className="h-5 w-5 text-blue-500 ml-2 z-10" />
                  ) : null}

                  {isSelected && !question.isRequired && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 ml-2 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        );

      case "iconChoice":
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      >
                        <Card
                          className={cn(
                            "p-4 cursor-pointer transition-all hover:shadow-md relative",
                            "flex flex-col items-center gap-2 text-center",
                            isSelected
                              ? "ring-2 ring-blue-500 bg-blue-50"
                              : "bg-white hover:bg-gray-50"
                          )}
                          onClick={() => handleValueChange(option.value)}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                            </motion.div>
                          )}

                          {isSelected && !question.isRequired && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="absolute top-1 right-1 h-6 w-6 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          )}

                          <motion.div
                            animate={{
                              scale: isSelected ? 1.1 : 1,
                              y: isSelected ? -2 : 0,
                            }}
                            className={cn(
                              "text-3xl mb-2 transition-colors",
                              isSelected ? "text-blue-600" : "text-gray-600"
                            )}
                          >
                            {option.icon}
                          </motion.div>
                          <motion.span
                            animate={{ fontWeight: isSelected ? 600 : 500 }}
                            className={cn(
                              "text-sm",
                              isSelected ? "text-blue-700" : ""
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

      case "openText":
        const textValue = (internalValue as string) || "";
        const hasMinLength =
          question.minLength !== undefined && question.minLength > 0;
        const hasMaxLength =
          question.maxLength !== undefined && question.maxLength > 0;
        const hasLength = hasMinLength || hasMaxLength;

        const isMinLengthMet =
          !hasMinLength || textValue.length >= (question.minLength ?? 0);
        const isCloseToMax =
          hasMaxLength && textValue.length > (question.maxLength ?? 0) * 0.85;

        // חישוב אחוז השלמה של הטקסט
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
                "relative border rounded-md transition-all",
                isFocused && "ring-2 ring-blue-500",
                !isMinLengthMet && question.isRequired
                  ? "border-red-300"
                  : "border-gray-300"
              )}
            >
              <Textarea
                value={textValue}
                onChange={(e) => handleValueChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={question.placeholder}
                className={cn(
                  "resize-y border-0 focus-visible:ring-0",
                  isCloseToMax ? "bg-amber-50" : "",
                  textValue.length > 0 ? "pr-12" : ""
                )}
                maxLength={question.maxLength}
                style={{ minHeight: `${textAreaHeight}px` }}
              />

              {/* צלמיות פעולה בתיבת הטקסט */}
              {textValue.length > 0 && (
                <div className="absolute top-2 right-2 flex flex-col gap-1">
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
                      <TooltipContent side="left">
                        <p>{textCopied ? "הועתק!" : "העתק טקסט"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

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
                      <TooltipContent side="left">
                        <p>נקה טקסט</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {/* מידע על אורך הטקסט */}
              {hasLength && (
                <div className="absolute bottom-2 right-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-normal",
                      isCloseToMax
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {textValue.length}
                    {hasMaxLength && ` / ${question.maxLength}`}
                  </Badge>
                </div>
              )}
            </div>

            {/* פרוגרס-בר להשלמת הטקסט */}
            {hasMinLength && question.isRequired && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">
                    {!isMinLengthMet ? (
                      <span className="flex items-center">
                        <AlertCircle className="h-3 w-3 text-amber-500 mr-1" />
                        נדרש עוד {(question.minLength ?? 0) -
                          textValue.length}{" "}
                        תווים
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        עברת את המינימום הנדרש
                      </span>
                    )}
                  </span>

                  <span className="font-medium">{completionPercentage}%</span>
                </div>
                {/* FIX: Changed the Progress component to use classes instead of indicatorClassName */}
                <Progress
                  value={completionPercentage}
                  className={cn(
                    "h-1.5",
                    completionPercentage >= 100
                      ? "progress-green"
                      : completionPercentage > 60
                      ? "progress-blue"
                      : "progress-amber"
                  )}
                />
              </div>
            )}

            <div className="flex justify-between items-center mt-1">
              <div className="space-x-1 space-y-1 rtl:space-x-reverse">
                {hasMinLength && (
                  <div
                    className={cn(
                      "inline-flex items-center text-xs px-2 py-0.5 rounded-full",
                      !isMinLengthMet && question.isRequired
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    )}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    {question.isRequired ? "נדרש לפחות" : "מומלץ לפחות"}{" "}
                    {question.minLength ?? 0} תווים
                  </div>
                )}
              </div>

              {/* מידע על זמן כתיבה משוער */}
              {hasMinLength && (
                <div className="text-xs text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  זמן כתיבה משוער:{" "}
                  {Math.max(1, Math.ceil((question.minLength ?? 0) / 70))}{" "}
                  דק&apos
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
                    className="w-full flex items-center justify-between px-4 py-2 h-auto hover:bg-blue-50"
                  >
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-sm">טיפים למענה על שאלה זו</span>
                    </div>
                    {isCollapsibleOpen ? (
                      <ChevronUp className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-blue-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 bg-blue-50 rounded-md mt-2">
                  <p className="text-sm text-blue-900">
                    {question.description}
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        );

      case "budgetAllocation":
        const values = (internalValue as Record<string, number>) || {};
        const totalPoints = Object.values(values).reduce(
          (sum, val) => sum + (val || 0),
          0
        );
        return (
          <div className="space-y-4">
            {question.categories?.map((category) => {
              const categoryValue = values[category.label] || 0;
              const isActive = categoryValue > 0;

              return (
                <motion.div
                  key={category.label}
                  className="space-y-2"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-between items-center">
                    <Label className="flex items-center gap-2">
                      {category.icon && (
                        <div
                          className={cn(
                            "text-blue-600 transition-all",
                            isActive && "scale-110"
                          )}
                        >
                          {category.icon}
                        </div>
                      )}
                      {category.label}
                    </Label>
                    {/* FIX: Added variant prop to Badge for consistency */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "transition-all",
                        categoryValue > 0
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}
                    >
                      {categoryValue.toFixed(0)}%
                    </Badge>
                  </div>
                  <Slider
                    value={[categoryValue]}
                    min={category.min || 0}
                    max={category.max || 100}
                    step={1}
                    onValueChange={(newValues: number[]) => {
                      handleValueChange({
                        ...values,
                        [category.label]: newValues[0],
                      });
                    }}
                    className={cn("py-1", isActive ? "accent-blue-600" : "")}
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
                "flex justify-between items-center p-3 rounded-lg border",
                totalPoints === 100
                  ? "bg-green-50 border-green-200"
                  : totalPoints > 100
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              )}
            >
              <div className="text-sm">
                סה&quot;כ:{" "}
                <span
                  className={cn(
                    "font-medium",
                    totalPoints === 100
                      ? "text-green-600"
                      : totalPoints > 100
                      ? "text-red-600"
                      : ""
                  )}
                >
                  {totalPoints}%
                </span>
                {totalPoints !== 100 && (
                  <span className="text-xs text-gray-600 ml-2">
                    (
                    {totalPoints < 100
                      ? `חסר ${100 - totalPoints}%`
                      : `עודף ${totalPoints - 100}%`}
                    )
                  </span>
                )}
              </div>

              {Object.keys(values).length > 0 && !question.isRequired && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-red-500 hover:text-red-700"
                >
                  <Eraser className="w-3.5 h-3.5 mr-1" />
                  אפס הכל
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return <div>סוג שאלה לא נתמך: {question.type}</div>;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {renderInput()}
      {error && showValidation && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
