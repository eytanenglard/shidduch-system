"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accessibility,
  Plus,
  Minus,
  MoonStar,
  SunMedium,
  Type,
  MousePointer,
  Hand,
  Contrast,
  Speech,
  PanelRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface AccessibilityFeaturesProps {
  className?: string;
}

export default function AccessibilityFeatures({
  className,
}: AccessibilityFeaturesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [contrastMode, setContrastMode] = useState<"normal" | "high" | "dark">(
    "normal"
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [readableMode, setReadableMode] = useState(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [textReader, setTextReader] = useState(false);
  const [bigCursor, setBigCursor] = useState(false);

  // החל את ההגדרות שנשמרו בעבר
  useEffect(() => {
    // טען הגדרות מהלוקל סטורג' אם קיימות
    const savedSettings = localStorage.getItem("accessibilitySettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setFontScale(settings.fontScale || 1);
      setContrastMode(settings.contrastMode || "normal");
      setReducedMotion(settings.reducedMotion || false);
      setReadableMode(settings.readableMode || false);
      setBigCursor(settings.bigCursor || false);
    }
  }, []);

  // שמור הגדרות ועדכן את ה-CSS בכל שינוי
  useEffect(() => {
    // שמור הגדרות בלוקל סטורג'
    const settings = {
      fontScale,
      contrastMode,
      reducedMotion,
      readableMode,
      bigCursor,
    };
    localStorage.setItem("accessibilitySettings", JSON.stringify(settings));

    // החל את השינויים על תגית ה-HTML
    const htmlElement = document.documentElement;

    // גודל גופן
    htmlElement.style.fontSize = `${fontScale * 100}%`;

    // מצב ניגודיות
    if (contrastMode === "high") {
      htmlElement.classList.add("high-contrast");
      htmlElement.classList.remove("dark-mode");
    } else if (contrastMode === "dark") {
      htmlElement.classList.add("dark-mode");
      htmlElement.classList.remove("high-contrast");
    } else {
      htmlElement.classList.remove("high-contrast", "dark-mode");
    }

    // הפחתת אנימציות
    if (reducedMotion) {
      htmlElement.classList.add("reduce-motion");
    } else {
      htmlElement.classList.remove("reduce-motion");
    }

    // מצב קריאה נוח
    if (readableMode) {
      htmlElement.classList.add("readable-font");
    } else {
      htmlElement.classList.remove("readable-font");
    }

    // סמן גדול
    if (bigCursor) {
      htmlElement.classList.add("big-cursor");
    } else {
      htmlElement.classList.remove("big-cursor");
    }

    // הוסף את ה-CSS לגיליון הסגנון
    const styleElement =
      document.getElementById("accessibility-styles") ||
      document.createElement("style");
    styleElement.id = "accessibility-styles";
    styleElement.textContent = `
      .high-contrast {
        filter: contrast(1.5);
      }
      
      .dark-mode {
        filter: invert(1) hue-rotate(180deg);
      }
      
      .reduce-motion * {
        animation-duration: 0.001s !important;
        transition-duration: 0.001s !important;
      }
      
      .readable-font {
        font-family: Arial, sans-serif !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
        line-height: 1.6 !important;
      }
      
      .big-cursor,
      .big-cursor * {
        cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16"><circle fill="%23000" stroke="%23fff" stroke-width="2" cx="8" cy="8" r="5"/></svg>') 16 16, auto !important;
      }
    `;

    if (!document.getElementById("accessibility-styles")) {
      document.head.appendChild(styleElement);
    }
  }, [fontScale, contrastMode, reducedMotion, readableMode, bigCursor]);

  // פונקציה להפעלת/כיבוי קורא טקסט
  const toggleTextReader = () => {
    setTextReader(!textReader);

    if (!textReader) {
      // הוסף מאזין ללחיצה על אלמנטים כדי להקריא את התוכן שלהם
      document.addEventListener("click", readSelectedText);
    } else {
      // הסר את המאזין
      document.removeEventListener("click", readSelectedText);
    }
  };

  // פונקציה להקראת טקסט שנבחר
  const readSelectedText = (e: MouseEvent) => {
    const element = e.target as HTMLElement;

    if (element && element.textContent) {
      // בדוק אם ה-Web Speech API נתמך בדפדפן
      if ("speechSynthesis" in window) {
        // עצור הקראות קודמות
        window.speechSynthesis.cancel();

        const text = element.textContent.trim();
        if (text) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "he-IL"; // עברית
          window.speechSynthesis.speak(utterance);
        }
      }
    }
  };

  // איפוס כל ההגדרות
  const resetSettings = () => {
    setFontScale(1);
    setContrastMode("normal");
    setReducedMotion(false);
    setReadableMode(false);
    setBigCursor(false);
    setTextReader(false);

    // הסר את מאזין הקראת הטקסט
    document.removeEventListener("click", readSelectedText);
  };

  // הצגת הפאנל הצף
  const toggleAccessibilityPanel = () => {
    setShowAccessibilityPanel(!showAccessibilityPanel);
  };

  return (
    <>
      {/* כפתור נגישות קבוע */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "fixed z-50 rounded-full shadow-md",
                showAccessibilityPanel ? "bottom-4 right-4" : "top-20 right-4",
                className
              )}
              onClick={toggleAccessibilityPanel}
            >
              {showAccessibilityPanel ? (
                <X className="h-5 w-5" />
              ) : (
                <Accessibility className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>הגדרות נגישות</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* פאנל נגישות */}
      {showAccessibilityPanel && (
        <div className="fixed z-40 bottom-4 right-16 bg-white p-4 rounded-lg shadow-lg border max-w-xs w-full">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium flex items-center">
              <Accessibility className="h-4 w-4 mr-2" />
              הגדרות נגישות
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => setShowAccessibilityPanel(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* גודל טקסט */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm flex items-center">
                  <Type className="h-3.5 w-3.5 mr-1" />
                  גודל טקסט
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setFontScale(Math.max(0.8, fontScale - 0.1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs w-8 text-center">
                    {Math.round(fontScale * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setFontScale(Math.min(1.5, fontScale + 0.1))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[fontScale * 100]}
                min={80}
                max={150}
                step={5}
                onValueChange={(value) => setFontScale(value[0] / 100)}
                className="py-1"
              />
            </div>

            {/* מצב ניגודיות */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center">
                <Contrast className="h-3.5 w-3.5 mr-1" />
                מצב תצוגה
              </Label>
              <div className="flex gap-1">
                <Button
                  variant={contrastMode === "normal" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setContrastMode("normal")}
                >
                  <SunMedium className="h-3.5 w-3.5 mr-1" />
                  רגיל
                </Button>
                <Button
                  variant={contrastMode === "high" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setContrastMode("high")}
                >
                  <Contrast className="h-3.5 w-3.5 mr-1" />
                  ניגודיות
                </Button>
                <Button
                  variant={contrastMode === "dark" ? "default" : "outline"}
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => setContrastMode("dark")}
                >
                  <MoonStar className="h-3.5 w-3.5 mr-1" />
                  חשוך
                </Button>
              </div>
            </div>

            {/* מתגים נוספים */}
            <div className="space-y-3 pt-1 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center">
                  <Speech className="h-3.5 w-3.5 mr-1" />
                  הקראת תוכן
                </Label>
                <Switch
                  checked={textReader}
                  onCheckedChange={toggleTextReader}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center">
                  <MousePointer className="h-3.5 w-3.5 mr-1" />
                  סמן גדול
                </Label>
                <Switch checked={bigCursor} onCheckedChange={setBigCursor} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center">
                  <Type className="h-3.5 w-3.5 mr-1" />
                  פונט קריא
                </Label>
                <Switch
                  checked={readableMode}
                  onCheckedChange={setReadableMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center">
                  <Hand className="h-3.5 w-3.5 mr-1" />
                  הפחתת אנימציות
                </Label>
                <Switch
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                />
              </div>
            </div>

            {/* כפתור איפוס */}
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={resetSettings}
            >
              איפוס הגדרות
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
