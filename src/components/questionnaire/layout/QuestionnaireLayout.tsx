import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Heart,
  User,
  Users,
  Save,
  LogOut,
  Settings,
  HelpCircle,
  AlertCircle,
  Scroll,
  Loader2,
} from "lucide-react";
import type {
  WorldId,
  UserTrack,
  QuestionnaireLayoutProps,
} from "../types/types";
import { cn } from "@/lib/utils";

interface SimpleToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
  isVisible: boolean;
}

function SimpleToast({
  message,
  type = "info",
  onClose,
  isVisible,
}: SimpleToastProps) {
  if (!isVisible) return null;

  const baseClasses =
    "fixed bottom-4 left-4 p-4 rounded-md shadow-lg z-50 transition-all duration-300";
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
  };

  return (
    <div className={cn(baseClasses, typeClasses[type])}>
      <div className="flex items-center justify-between">
        <p>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-white hover:text-gray-200"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

const worldIcons = {
  PERSONALITY: User,
  VALUES: Heart,
  RELATIONSHIP: Users,
  PARTNER: Heart,
  RELIGION: Scroll,
} as const;

const worldLabels = {
  PERSONALITY: "אישיות",
  VALUES: "ערכים ואמונות",
  RELATIONSHIP: "זוגיות",
  PARTNER: "תכונות וערכים בבן/בת הזוג",
  RELIGION: "דת ומסורת",
} as const;

export default function QuestionnaireLayout({
  children,
  currentWorld,
  userTrack,
  completedWorlds,
  onWorldChange,
  onExit,
  onSaveProgress,
  language = "he",
}: QuestionnaireLayoutProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
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

  // Toast utilities
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // Save functionality
  const handleSave = async () => {
    if (!onSaveProgress) {
      showToast("לא ניתן לשמור את השאלון כרגע", "error");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSaveProgress();
      showToast("השאלון נשמר בהצלחה", "success");
    } catch (err) {
      setError("אירעה שגיאה בשמירת השאלון");
      showToast("אירעה שגיאה בשמירת השאלון", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Setup RTL/LTR classes
  const isRTL = language === "he";
  const layoutClasses = cn(
    "flex h-screen overflow-hidden bg-gray-50",
    isRTL ? "flex-row-reverse" : "flex-row"
  );

  const sidebarClasses = cn(
    "w-80 bg-white overflow-y-auto",
    isRTL ? "border-l" : "border-r"
  );

  return (
    <div className={layoutClasses}>
      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <div className="fixed top-4 left-4 z-50">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                שמור מצב נוכחי
              </>
            )}
          </Button>
        </div>

        {children}
      </main>

      {/* Navigation sidebar */}
      <nav className={sidebarClasses}>
        {/* Top navigation bar */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Worlds navigation */}
        <div className="p-4 space-y-4">
          {Object.entries(worldIcons).map(([worldId, Icon]) => {
            const isActive = currentWorld === worldId;
            const isCompleted = completedWorlds.includes(worldId as WorldId);

            return (
              <Card
                key={worldId}
                className={cn(
                  "transition-all duration-200",
                  isActive ? "ring-2 ring-blue-500" : "",
                  "hover:shadow-md cursor-pointer"
                )}
                onClick={() => onWorldChange(worldId as WorldId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-5 h-5" />
                      <span>
                        {worldLabels[worldId as keyof typeof worldLabels]}
                      </span>
                    </div>
                    {isCompleted && (
                      <AlertCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t mt-auto">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowExitPrompt(true)}
          >
            <LogOut className="w-4 h-4 me-2" />
            יציאה
          </Button>
        </div>
      </nav>

      {/* Exit Confirmation Dialog */}
      {showExitPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">
              האם אתה בטוח שברצונך לצאת?
            </h3>
            <p className="text-gray-600 mb-6">
              כל התשובות שלא נשמרו יאבדו. האם ברצונך לשמור לפני היציאה?
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowExitPrompt(false)}
              >
                ביטול
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await handleSave();
                  onExit?.();
                }}
              >
                שמור וצא
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowExitPrompt(false);
                  onExit?.();
                }}
              >
                צא ללא שמירה
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <SimpleToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
