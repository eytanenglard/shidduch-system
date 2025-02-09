"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Added for multiSelectWithOther
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, X, Plus } from "lucide-react";
import type {
  Question,
  Option,
  AnswerValue,
  AnswerInputProps,
} from "../types/types";
import { cn } from "@/lib/utils";

export default function AnswerInput({
  question,
  value,
  onChange,
  onClear,
  language = "he",
  showValidation = false,
  className = "",
}: AnswerInputProps) {
  const [internalValue, setInternalValue] = useState<any>(value);
  const [error, setError] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState<string>(""); // Added for multiSelectWithOther

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleValueChange = (newValue: any) => {
    // אם לוחצים על אותו ערך שכבר נבחר, מנקים את הבחירה
    if (newValue === internalValue) {
      handleClear();
      return;
    }

    setInternalValue(newValue);
    setError(null);
    onChange?.(newValue);
  };

  const handleClear = () => {
    // Set type-appropriate empty value
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
    setCustomValue(""); // Clear custom value for multiSelectWithOther
    setError(null);
    onChange?.(emptyValue);
  };

  const renderInput = () => {
    switch (question.type) {
      case "singleChoice":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all",
                  "hover:bg-gray-50 flex items-center justify-between",
                  internalValue === option.value && "bg-blue-50 border-blue-500"
                )}
                onClick={() => handleValueChange(option.value)}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.text}</span>
                </div>
                {internalValue === option.value && !question.isRequired && (
                  <X
                    className="w-4 h-4 text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        );

      case "multiChoice":
      case "multiSelect":
        const selectedValues = Array.isArray(internalValue)
          ? internalValue
          : [];
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all",
                  "hover:bg-gray-50 flex items-center justify-between",
                  selectedValues.includes(option.value) &&
                    "bg-blue-50 border-blue-500"
                )}
                onClick={() => {
                  const newValues = selectedValues.includes(option.value)
                    ? selectedValues.filter((v) => v !== option.value)
                    : [...selectedValues, option.value];
                  handleValueChange(newValues);
                }}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.text}</span>
                </div>
              </div>
            ))}
          </div>
        );

      case "multiSelectWithOther":
        const selectedWithOtherValues = Array.isArray(internalValue)
          ? internalValue
          : [];
        return (
          <div className="space-y-4">
            {/* Regular options */}
            {question.options?.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "p-3 border rounded-lg cursor-pointer transition-all",
                  "hover:bg-gray-50 flex items-center justify-between",
                  selectedWithOtherValues.includes(option.value) &&
                    "bg-blue-50 border-blue-500"
                )}
                onClick={() => {
                  const newValues = selectedWithOtherValues.includes(
                    option.value
                  )
                    ? selectedWithOtherValues.filter((v) => v !== option.value)
                    : [...selectedWithOtherValues, option.value];
                  handleValueChange(newValues);
                }}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.text}</span>
                </div>
              </div>
            ))}

            {/* Custom input section */}
            <div className="space-y-2">
              <Label>אחר</Label>
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
                      const newValues = [
                        ...selectedWithOtherValues,
                        `custom:${customValue.trim()}`,
                      ];
                      handleValueChange(newValues);
                      setCustomValue("");
                    }
                  }}
                  disabled={!customValue.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Custom values display */}
            <div className="space-y-2">
              {selectedWithOtherValues
                .filter((v) => v.startsWith("custom:"))
                .map((customVal, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
                  >
                    <span>{customVal.replace("custom:", "")}</span>
                    <X
                      className="w-4 h-4 text-gray-500 hover:text-red-500 cursor-pointer"
                      onClick={() => {
                        const newValues = selectedWithOtherValues.filter(
                          (v) => v !== customVal
                        );
                        handleValueChange(newValues);
                      }}
                    />
                  </div>
                ))}
            </div>
          </div>
        );

      case "scenario":
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all",
                  "hover:bg-gray-50 flex items-center justify-between",
                  internalValue === (option.value || option.text) &&
                    "bg-blue-50 border-blue-500"
                )}
                onClick={() => handleValueChange(option.value || option.text)}
              >
                <div>
                  <div className="font-medium">{option.text}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </div>
                  )}
                </div>
                {internalValue === (option.value || option.text) &&
                  !question.isRequired && (
                    <X
                      className="w-4 h-4 text-gray-500 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                    />
                  )}
              </div>
            ))}
          </div>
        );

      case "iconChoice":
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {question.options?.map((option) => (
              <TooltipProvider key={option.value}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card
                      className={cn(
                        "p-4 cursor-pointer transition-all hover:shadow-md relative",
                        "flex flex-col items-center gap-2 text-center",
                        internalValue === option.value &&
                          "ring-2 ring-blue-500 bg-blue-50"
                      )}
                      onClick={() => handleValueChange(option.value)}
                    >
                      {internalValue === option.value &&
                        !question.isRequired && (
                          <X
                            className="absolute top-2 right-2 w-4 h-4 text-gray-500 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClear();
                            }}
                          />
                        )}
                      <div className="text-3xl">{option.icon}</div>
                      <span className="text-sm font-medium">{option.text}</span>
                    </Card>
                  </TooltipTrigger>
                  {option.description && (
                    <TooltipContent>
                      <p>{option.description}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        );

      case "openText":
        return (
          <div className="space-y-2">
            <Textarea
              value={internalValue as string}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={question.placeholder}
              className="min-h-[100px]"
              maxLength={question.maxLength}
            />
            <div className="flex justify-between items-center">
              {question.maxLength && (
                <div className="text-sm text-gray-500">
                  {((internalValue as string) || "").length} /{" "}
                  {question.maxLength}
                </div>
              )}
              {internalValue && !question.isRequired && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  נקה טקסט
                </Button>
              )}
            </div>
          </div>
        );

      case "budgetAllocation":
        const values = (internalValue as Record<string, number>) || {};
        return (
          <div className="space-y-4">
            {question.categories?.map((category) => (
              <div key={category.label} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    {category.icon}
                    {category.label}
                  </Label>
                  <span className="text-sm text-gray-500">
                    {(values[category.label] || 0).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[values[category.label] || 0]}
                  min={category.min}
                  max={category.max}
                  step={1}
                  onValueChange={(newValues) => {
                    handleValueChange({
                      ...values,
                      [category.label]: newValues[0],
                    });
                  }}
                />
              </div>
            ))}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                סה"כ:{" "}
                {Object.values(values).reduce(
                  (sum, val) => sum + (val || 0),
                  0
                )}
                %
              </div>
              {Object.keys(values).length > 0 && !question.isRequired && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
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
