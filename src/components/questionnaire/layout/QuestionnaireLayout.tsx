// src/components/questionnaire/layout/QuestionnaireLayout.tsx

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link"; // --- הוספנו ייבוא ל-Link ---
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Heart,
  User,
  Users,
  Save,
  LogOut,
  Settings,
  HelpCircle,
  CheckCircle,
  Loader2,
  Menu,
  X,
  Home,
  ArrowRightLeft,
  LogIn, // --- הוספנו אייקון ---
  UserPlus, // --- הוספנו אייקון ---
} from "lucide-react";
import type { WorldId, QuestionnaireLayoutProps } from "../types/types";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import FAQ from "../components/FAQ";
import AccessibilityFeatures from "../components/AccessibilityFeatures";

// Mapping icons for different "worlds" in the system
const worldIcons = {
  PERSONALITY: User,
  VALUES: Heart,
  RELATIONSHIP: Users,
  PARTNER: Heart,
  RELIGION: CheckCircle,
} as const;

// Mapping labels for different "worlds"
const worldLabels = {
  PERSONALITY: "אישיות",
  VALUES: "ערכים ואמונות",
  RELATIONSHIP: "זוגיות",
  PARTNER: "תכונות וערכים בבן/בת הזוג",
  RELIGION: "דת ומסורת",
} as const;

// Enhanced Toast component
const Toast = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={cn(
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg",
        "max-w-md w-full flex items-center justify-between",
        type === "success" && "bg-green-500 text-white",
        type === "error" && "bg-red-500 text-white",
        type === "info" && "bg-blue-500 text-white"
      )}
    >
      <span className="font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 text-white hover:bg-white/20 p-1 rounded-full transition-colors"
          aria-label="סגור הודעה"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
};

export default function QuestionnaireLayout({
  children,
  currentWorld,
  completedWorlds,
  onWorldChange,
  onExit,
  onSaveProgress,
  language = "he",
  isLoggedIn = false, // --- הוספנו prop עם ערך ברירת מחדל ---
}: QuestionnaireLayoutProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isVisible: boolean;
  }>({
    message: "",
    type: "info",
    isVisible: false,
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveCount, setSaveCount] = useState(0);

  const isSmallScreen = useMediaQuery("(max-width: 640px)");

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      setToast({ message, type, isVisible: true });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, isVisible: false }));
      }, 3000);
    },
    []
  );

  const handleSave = useCallback(
    async (isAutoSave = false) => {
      if (!onSaveProgress) {
        if (!isAutoSave) {
          showToast("לא ניתן לשמור את השאלון כרגע", "error");
        }
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        await onSaveProgress();
        setLastSaved(new Date());
        setSaveCount((prev) => prev + 1);
        if (!isAutoSave) {
          showToast("השאלון נשמר בהצלחה", "success");
        }
      } catch {
        setError("אירעה שגיאה בשמירת השאלון");
        if (!isAutoSave) {
          showToast("אירעה שגיאה בשמירת השאלון", "error");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [onSaveProgress, showToast]
  );

  useEffect(() => {
    let saveTimer: NodeJS.Timeout;

    if (onSaveProgress) {
      saveTimer = setInterval(() => {
        handleSave(true);
      }, 120000); // Auto-save every 2 minutes
    }

    return () => {
      if (saveTimer) clearInterval(saveTimer);
    };
  }, [onSaveProgress, handleSave]);

  const isRTL = language === "he";
  const directionClass = isRTL ? "rtl" : "ltr";

  const NavButton = ({ worldId, isMobile }) => {
    const Icon = worldIcons[worldId as keyof typeof worldIcons];
    const isActive = currentWorld === worldId;
    const isCompleted = completedWorlds.includes(worldId as WorldId);

    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isActive ? "default" : "outline"}
              size={isMobile ? "sm" : "default"}
              className={cn(
                "flex items-center justify-start gap-2 w-full mb-2 transition-all",
                isActive ? "bg-primary text-white" : "",
                isCompleted ? "border-green-500" : "",
                isMobile ? "text-xs py-1" : ""
              )}
              onClick={() => {
                onWorldChange(worldId as WorldId);
                if (isMobile) {
                  setShowMobileNav(false);
                }
              }}
            >
              <Icon className={cn("h-4 w-4", isMobile ? "mr-1" : "mr-2")} />
              <span className="truncate">
                {worldLabels[worldId as keyof typeof worldLabels]}
              </span>
              {isCompleted && (
                <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={isRTL ? "left" : "right"}>
            <div className="text-sm">
              <p className="font-medium">
                {worldLabels[worldId as keyof typeof worldLabels]}
              </p>
              <p>
                {isCompleted
                  ? "✓ הושלם"
                  : isActive
                  ? "◉ פעיל כעת"
                  : "○ טרם הושלם"}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderFAQButton = (isMobile: boolean) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "icon"}
          className={cn(
            "flex items-center justify-center",
            isMobile
              ? "justify-start gap-2 w-full mb-2 text-xs py-1"
              : "w-8 h-8 p-0 rounded-full"
          )}
          aria-label="שאלות נפוצות"
        >
          <HelpCircle className={cn("h-4 w-4", isMobile ? "mr-1" : "")} />
          {!isMobile && <span className="sr-only">שאלות נפוצות</span>}
          {isMobile && <span>שאלות נפוצות</span>}
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isRTL ? "left" : "right"}
        className="w-[90vw] max-w-lg overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>שאלות נפוצות</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FAQ />
        </div>
      </SheetContent>
    </Sheet>
  );

  // --- START: Added for unauthenticated user prompt ---
  const UnauthenticatedPrompt = () => (
    <div className="p-3 my-3 bg-cyan-50/70 border border-cyan-200 rounded-lg text-center space-y-2">
      <p className="text-sm text-cyan-800 font-medium">
        התקדמותך נשמרת זמנית בדפדפן.
      </p>
      <p className="text-xs text-cyan-700">
        התחבר/י או הרשמ/י כדי לשמור את התשובות לחשבונך.
      </p>
      <div className="flex gap-2 justify-center pt-1">
        <Link href="/auth/signin">
          <Button id="onboarding-target-exit-map" variant="outline" size="sm" className="bg-white/80">
            <LogIn className="w-3 h-3 ml-1" />
            התחברות
          </Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="default" size="sm">
            <UserPlus className="w-3 h-3 ml-1" />
            הרשמה
          </Button>
        </Link>
      </div>
    </div>
  );
  // --- END: Added for unauthenticated user prompt ---

  const MobileNav = () => (
    <AnimatePresence>
      {showMobileNav && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowMobileNav(false)}
          />
          <motion.div
            initial={{ x: isRTL ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed top-0 ${
              isRTL ? "right-0" : "left-0"
            } h-full w-3/4 max-w-xs bg-white shadow-lg p-4 z-50 ${directionClass} flex flex-col overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium flex items-center">
                <ArrowRightLeft className="w-5 h-5 mr-2 text-blue-500" />
                ניווט בשאלון
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileNav(false)}
                className="w-8 h-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-4">
              {Object.keys(worldIcons).map((worldId) => (
                <NavButton key={worldId} worldId={worldId} isMobile={true} />
              ))}
              {renderFAQButton(true)}
            </div>
            
            {/* --- START: Added prompt for mobile --- */}
            {!isLoggedIn && <UnauthenticatedPrompt />}
            {/* --- END: Added prompt for mobile --- */}

            <div className="pt-4 border-t space-y-4">
              {lastSaved && (
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  <span>
                    נשמר לאחרונה: {lastSaved.toLocaleTimeString()}
                    {saveCount > 0 && ` (${saveCount} שמירות)`}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => handleSave()}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-2" />
                  )}
                  שמור מצב נוכחי
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={onExit}
                >
                  <Home className="h-3 w-3 mr-2" />
                  חזרה למפת העולמות
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start text-red-500 hover:text-red-700"
                  onClick={() => setShowExitPrompt(true)}
                >
                  <LogOut className="h-3 w-3 mr-2" />
                  יציאה
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={`flex flex-col min-h-screen lg:flex-row bg-gray-50 ${directionClass}`}
    >
      <header className="lg:hidden sticky top-0 z-40 bg-white shadow-sm p-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMobileNav(true)}
          className="inline-flex items-center"
        >
          <Menu className="h-5 w-5" />
          {!isSmallScreen && <span className="ml-2">תפריט</span>}
        </Button>

        <div className="flex flex-col items-center">
          <h1 className="text-sm font-medium">
            {worldLabels[currentWorld as keyof typeof worldLabels]}
          </h1>
          {completedWorlds.length > 0 && (
            <div className="text-xs text-gray-500">
              {completedWorlds.length} / {Object.keys(worldLabels).length}{" "}
              הושלמו
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side={isRTL ? "left" : "right"}
              className="w-[90vw] max-w-lg overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle>שאלות נפוצות</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <FAQ />
              </div>
            </SheetContent>
          </Sheet>
          {lastSaved && !isSmallScreen && (
            <span className="text-xs text-gray-500 mr-1">
              <CheckCircle className="inline-block h-3 w-3 mr-1 text-green-500" />
              נשמר
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              isSaving ? "bg-blue-100" : "bg-green-50 text-green-600"
            )}
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </header>

      <MobileNav />

      <aside
        className={cn(
          "w-60 bg-white border-r hidden lg:flex lg:flex-col overflow-y-auto",
          isRTL ? "border-l" : "border-r"
        )}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">עולמות השאלון</h3>
            <div className="flex gap-1">
              {renderFAQButton(false)}
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 p-0 rounded-full"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>הגדרות</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {Object.keys(worldIcons).map((worldId) => (
            <NavButton key={worldId} worldId={worldId} isMobile={false} />
          ))}
        </div>
        
        {/* --- START: Added prompt for desktop sidebar --- */}
        {!isLoggedIn && <div className="px-4"><UnauthenticatedPrompt /></div>}
        {/* --- END: Added prompt for desktop sidebar --- */}

        <div className="p-4 border-t mt-auto">
          {lastSaved && (
            <div className="flex items-center text-xs text-gray-500 mb-3">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              <span>
                נשמר לאחרונה: {lastSaved.toLocaleTimeString()}
                {saveCount > 0 && ` (${saveCount} שמירות)`}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSave()}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              שמור התקדמות
            </Button>

            <Button variant="outline" className="w-full" onClick={onExit}>
              <Home className="w-4 h-4 mr-2" />
              מפת העולמות
            </Button>

            <Button
              variant="outline"
              className="w-full text-red-500 hover:text-red-700"
              onClick={() => setShowExitPrompt(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              יציאה
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-3 md:p-6 lg:pb-16 overflow-y-auto relative">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {children}
        <AccessibilityFeatures className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50" />
      </main>

      <AnimatePresence>
        {showExitPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    האם אתה בטוח שברצונך לצאת?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    כל התשובות שלא נשמרו יאבדו. האם ברצונך לשמור לפני היציאה?
                  </p>
                  <div className="flex flex-col sm:flex-row justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExitPrompt(false)}
                    >
                      ביטול
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await handleSave();
                        if (onExit) {
                          onExit();
                        }
                        setShowExitPrompt(false);
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      שמור וצא
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setShowExitPrompt(false);
                        if (onExit) {
                          onExit();
                        }
                      }}
                    >
                      צא ללא שמירה
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast.isVisible && (
          <Toast
            message={toast.message}
            type={toast.type}
            isVisible={toast.isVisible}
            onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}