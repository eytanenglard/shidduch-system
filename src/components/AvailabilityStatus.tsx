"use client";
import React from 'react'; // <--- הוסף את השורה הזו
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { AvailabilityStatus as AvailabilityStatusEnum } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription, // Added for potential use
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, PauseCircle, Loader2 } from "lucide-react"; // Added Loader2
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Session } from "next-auth";

// Helper function to get status display properties
const getStatusStyles = (status: AvailabilityStatusEnum) => {
  switch (status) {
    case AvailabilityStatusEnum.AVAILABLE:
      return {
        text: "פנוי/ה להצעות",
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        buttonClasses:
          "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 border border-emerald-300 dark:border-emerald-700",
        dialogButtonClasses: "bg-emerald-500 hover:bg-emerald-600 text-white",
      };
    case AvailabilityStatusEnum.UNAVAILABLE:
      return {
        text: "לא פנוי/ה להצעות",
        icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
        buttonClasses:
          "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800 border border-rose-300 dark:border-rose-700",
        dialogButtonClasses: "bg-rose-500 hover:bg-rose-600 text-white",
      };
    case AvailabilityStatusEnum.DATING:
      return {
        text: "בתהליך היכרות",
        icon: <AlertCircle className="w-5 h-5 text-rose-500" />, // Could be a different icon, e.g., Users
        buttonClasses:
          "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800 border border-rose-300 dark:border-rose-700",
        dialogButtonClasses: "bg-rose-500 hover:bg-rose-600 text-white",
      };
    case AvailabilityStatusEnum.PAUSED:
      return {
        text: "בהפסקה זמנית",
        icon: <PauseCircle className="w-5 h-5 text-amber-500" />,
        buttonClasses:
          "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800 border border-amber-300 dark:border-amber-700",
        dialogButtonClasses: "bg-amber-500 hover:bg-amber-600 text-white",
      };
    case AvailabilityStatusEnum.ENGAGED:
      return {
        text: "מאורס/ת",
        icon: <AlertCircle className="w-5 h-5 text-rose-500" />, // Could be a different icon, e.g., Heart
        buttonClasses:
          "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800 border border-rose-300 dark:border-rose-700",
        dialogButtonClasses: "bg-rose-500 hover:bg-rose-600 text-white",
      };
    case AvailabilityStatusEnum.MARRIED:
      return {
        text: "נשוי/אה",
        icon: <AlertCircle className="w-5 h-5 text-rose-500" />, // Could be a different icon, e.g., Users
        buttonClasses:
          "bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-800 border border-rose-300 dark:border-rose-700",
        dialogButtonClasses: "bg-rose-500 hover:bg-rose-600 text-white",
      };
    default:
      return {
        text: "לא ידוע",
        icon: <AlertCircle className="w-5 h-5 text-slate-500" />,
        buttonClasses:
          "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600",
        dialogButtonClasses: "bg-slate-500 hover:bg-slate-600 text-white",
      };
  }
};

export default function AvailabilityStatus() {
  const { update: updateSession } = useSession();
  const { data: session } = useSession() as { data: Session | null };

  const [showDialog, setShowDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const initialStatus =
    session?.user?.profile?.availabilityStatus ||
    AvailabilityStatusEnum.AVAILABLE;
  const initialNote = session?.user?.profile?.availabilityNote || "";

  const [status, setStatus] = useState<AvailabilityStatusEnum>(initialStatus);
  const [note, setNote] = useState(initialNote);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  // This local state is for optimistic UI update, not strictly needed if session updates quickly
  // For simplicity, we'll rely on the main `status` and `note` reflecting the session or current edit
  // const [localStatus, setLocalStatus] = useState<AvailabilityStatusEnum | null>(null);
  // const [, setLocalNote] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.profile) {
      setStatus(
        session.user.profile.availabilityStatus ||
          AvailabilityStatusEnum.AVAILABLE
      );
      setNote(session.user.profile.availabilityNote || "");
    }
  }, [session]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError("");

    try {
      const response = await fetch("/api/profile/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityStatus: status,
          availabilityNote: note || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update status");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Server update failed");
      }

      await updateSession({
        user: {
          ...session?.user,
          profile: {
            ...(session?.user?.profile || {}),
            availabilityStatus: status,
            availabilityNote: note,
          },
        },
      });

      // Optional: Force session re-fetch if needed, your previous logic was fine
      if (session?.user?.email) {
        await signIn("credentials", {
          redirect: false,
          email: session.user.email,
          password: undefined,
        }).catch(console.error);
      }

      setShowDialog(false);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Error in update:", err);
      setError(err instanceof Error ? err.message : "שגיאה בעדכון הסטטוס");
      // Revert to original status from session on error, which useEffect will handle if session hasn't changed yet
      // Or, more explicitly:
      // setStatus(session?.user?.profile?.availabilityStatus || AvailabilityStatusEnum.AVAILABLE);
      // setNote(session?.user?.profile?.availabilityNote || "");
    } finally {
      setIsUpdating(false);
    }
  };

  // Determine the status to display. Prioritize the session's current status.
  // If the dialog is open for editing, `status` will hold the selected (but not yet saved) value.
  // If not editing, `status` should reflect the session.
  const displayStatus =
    session?.user?.profile?.availabilityStatus ||
    AvailabilityStatusEnum.AVAILABLE;
  const currentStatusStyles = getStatusStyles(displayStatus);
  const editingStatusStyles = getStatusStyles(status); // For the dialog button color

  if (!session?.user) return null;

  return (
    <>
      <Button
        variant="outline" // Using outline as a base, custom classes will override
        onClick={() => {
          // Reset dialog state to current session state when opening
          setStatus(
            session?.user?.profile?.availabilityStatus ||
              AvailabilityStatusEnum.AVAILABLE
          );
          setNote(session?.user?.profile?.availabilityNote || "");
          setError(""); // Clear previous errors
          setShowDialog(true);
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-sm transition-colors duration-150 ease-in-out ${currentStatusStyles.buttonClasses}`}
      >
        {currentStatusStyles.icon}
        <span>{currentStatusStyles.text}</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-slate-900 rounded-xl shadow-xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
              עדכון סטטוס זמינות
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
              בחר/י את הסטטוס הנוכחי שלך והוספ/י הערה אם תרצה/י.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label
                htmlFor="status-select"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                סטטוס זמינות
              </label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as AvailabilityStatusEnum)
                }
                disabled={isUpdating}
              >
                <SelectTrigger
                  id="status-select"
                  className="w-full rounded-lg h-11 text-base dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700"
                >
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent className="rounded-lg dark:bg-slate-800 dark:text-slate-50">
                  {Object.values(AvailabilityStatusEnum).map((enumKey) => {
                    const itemStyle = getStatusStyles(enumKey);
                    return (
                      <SelectItem
                        key={enumKey}
                        value={enumKey}
                        className="cursor-pointer hover:!bg-slate-100 dark:hover:!bg-slate-700 text-base py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          {/* We can use simpler icons here if the main ones are too detailed for dropdown */}
                          {React.cloneElement(itemStyle.icon, {
                            className: "w-4 h-4",
                          })}
                          {itemStyle.text}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="status-note"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                הערה (אופציונלי)
              </label>
              <Textarea
                id="status-note"
                placeholder="לדוגמה: 'חוזר/ת מפניות ביום ראשון', 'רק הצעות רציניות'"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isUpdating}
                className="rounded-lg min-h-[100px] text-base dark:bg-slate-800 dark:text-slate-50 dark:border-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="rounded-lg dark:bg-rose-900/30 dark:border-rose-500/50 dark:text-rose-300"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-6 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isUpdating}
              className="rounded-lg dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600 dark:hover:bg-slate-600"
            >
              ביטול
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`rounded-lg px-6 py-2.5 text-base font-medium transition-colors ${editingStatusStyles.dialogButtonClasses}`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  מעדכן...
                </>
              ) : (
                "עדכון סטטוס"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-md p-6 bg-white dark:bg-slate-900 rounded-xl shadow-xl">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              הסטטוס עודכן בהצלחה!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              הסטטוס שלך עודכן בהצלחה במערכת.
              <br />
              <strong>שים/י לב:</strong> ייתכן שייקח מספר רגעים עד שהשינוי
              יתעדכן במלואו בכל מקום.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => setShowSuccessDialog(false)}
            className="w-full mt-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-base py-2.5"
          >
            הבנתי
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
