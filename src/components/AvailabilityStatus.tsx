// src/components/AvailabilityStatus.tsx

"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  DialogDescription,
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
import { AlertCircle, CheckCircle2, PauseCircle, Loader2, Heart, UserMinus, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Session } from "next-auth";

// *** UPDATED: Helper function with new design for the status indicator ***
const getStatusStyles = (status: AvailabilityStatusEnum) => {
  switch (status) {
    case AvailabilityStatusEnum.AVAILABLE:
      return {
        text: "פנוי/ה להצעות",
        dotClasses: "bg-cyan-500", // צבע הנקודה
        pulse: true, // האם להוסיף אנימציית פעימה
        icon: <CheckCircle2 />,
        iconColorClass: "text-cyan-600",
        dialogButtonClasses: "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white",
      };
    case AvailabilityStatusEnum.UNAVAILABLE:
      return {
        text: "לא פנוי/ה",
        dotClasses: "bg-gray-400",
        pulse: false,
        icon: <XCircle />,
        iconColorClass: "text-gray-500",
        dialogButtonClasses: "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white",
      };
    case AvailabilityStatusEnum.DATING:
      return {
        text: "בתהליך היכרות",
        dotClasses: "bg-pink-500",
        pulse: false,
        icon: <Heart />,
        iconColorClass: "text-pink-600",
        dialogButtonClasses: "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white",
      };
    case AvailabilityStatusEnum.PAUSED:
      return {
        text: "בהפסקה",
        dotClasses: "bg-orange-500",
        pulse: false,
        icon: <PauseCircle />,
        iconColorClass: "text-orange-600",
        dialogButtonClasses: "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white",
      };
    case AvailabilityStatusEnum.ENGAGED:
      return {
        text: "מאורס/ת",
        dotClasses: "bg-pink-500",
        pulse: true,
        icon: <Heart fill="currentColor" />,
        iconColorClass: "text-pink-600",
        dialogButtonClasses: "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white",
      };
    case AvailabilityStatusEnum.MARRIED:
        return {
        text: "נשוי/אה",
        dotClasses: "bg-gray-400",
        pulse: false,
        icon: <UserMinus />,
        iconColorClass: "text-gray-500",
        dialogButtonClasses: "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white",
      };
    default:
      return {
        text: "לא ידוע",
        dotClasses: "bg-gray-400",
        pulse: false,
        icon: <AlertCircle />,
        iconColorClass: "text-gray-500",
        dialogButtonClasses: "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white",
      };
  }
};

export default function AvailabilityStatus() {
  const { update: updateSession } = useSession();
  const { data: session } = useSession() as { data: Session | null };

  const [showDialog, setShowDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const initialStatus = session?.user?.profile?.availabilityStatus || AvailabilityStatusEnum.AVAILABLE;
  const initialNote = session?.user?.profile?.availabilityNote || "";

  const [status, setStatus] = useState<AvailabilityStatusEnum>(initialStatus);
  const [note, setNote] = useState(initialNote);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.profile) {
      setStatus(session.user.profile.availabilityStatus || AvailabilityStatusEnum.AVAILABLE);
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
        body: JSON.stringify({ availabilityStatus: status, availabilityNote: note || "" }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update status");
      }

      await updateSession();
      setShowDialog(false);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Error in update:", err);
      setError(err instanceof Error ? err.message : "שגיאה בעדכון הסטטוס");
    } finally {
      setIsUpdating(false);
    }
  };

  const displayStatus = session?.user?.profile?.availabilityStatus || AvailabilityStatusEnum.AVAILABLE;
  const currentStatusStyles = getStatusStyles(displayStatus);
  const editingStatusStyles = getStatusStyles(status);

  if (!session?.user) return null;

  return (
    <>
      {/* --- START OF CHANGES: The new button design --- */}
      <Button
        id="onboarding-target-availability-status" // <--- הוספת ID כאן

        variant="ghost"
        onClick={() => {
          setStatus(session?.user?.profile?.availabilityStatus || AvailabilityStatusEnum.AVAILABLE);
          setNote(session?.user?.profile?.availabilityNote || "");
          setError("");
          setShowDialog(true);
        }}
        className="flex items-center gap-x-2 px-3 h-10 rounded-full font-medium text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="relative flex h-2.5 w-2.5">
          {/* The pulsing ring for the 'Available' or 'Engaged' state */}
          {currentStatusStyles.pulse && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatusStyles.dotClasses}`}></span>
          )}
          {/* The solid dot */}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentStatusStyles.dotClasses}`}></span>
        </span>
        <span className="text-sm">{currentStatusStyles.text}</span>
      </Button>
      {/* --- END OF CHANGES --- */}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-xl shadow-2xl border-gray-100">
          <DialogHeader className="mb-4 text-right">
            <DialogTitle className="text-2xl font-bold text-gray-800">עדכון סטטוס זמינות</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              בחר/י את הסטטוס הנוכחי שלך. שינוי הסטטוס יעזור לשדכנים להציע לך הצעות רלוונטיות.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label htmlFor="status-select" className="text-sm font-medium text-gray-700">
                סטטוס זמינות
              </label>
              <Select value={status} onValueChange={(value) => setStatus(value as AvailabilityStatusEnum)} disabled={isUpdating}>
                <SelectTrigger
                  id="status-select"
                  className="w-full rounded-lg h-12 text-base bg-gray-50 border-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                >
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {Object.values(AvailabilityStatusEnum).map((enumKey) => {
                    const itemStyle = getStatusStyles(enumKey);
                    return (
                      <SelectItem key={enumKey} value={enumKey} className="cursor-pointer text-base py-2.5">
                        <div className="flex items-center gap-3">
                          {React.cloneElement(itemStyle.icon, { className: `w-4 h-4 ${itemStyle.iconColorClass}` })}
                          <span>{itemStyle.text}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status-note" className="text-sm font-medium text-gray-700">
                הערה (אופציונלי)
              </label>
              <Textarea
                id="status-note"
                placeholder="לדוגמה: 'חוזר/ת להצעות ביום ראשון', 'רק הצעות רציניות'"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isUpdating}
                className="rounded-lg min-h-[100px] text-base bg-gray-50 border-gray-200 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 placeholder:text-gray-400"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-6 sm:justify-between gap-2">
            <Button variant="ghost" onClick={() => setShowDialog(false)} disabled={isUpdating} className="rounded-lg text-gray-600 hover:bg-gray-100">
              ביטול
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating} className={`rounded-lg px-6 h-11 text-base font-medium transition-all shadow-md hover:shadow-lg ${editingStatusStyles.dialogButtonClasses}`}>
              {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : "עדכון סטטוס"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-md p-6 bg-white rounded-xl shadow-2xl">
          <AlertDialogHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-cyan-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-cyan-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-gray-800">
              הסטטוס עודכן בהצלחה!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-2">
              הסטטוס שלך עודכן במערכת. שים/י לב, ייתכן שיעברו מספר רגעים עד שהשינוי יופיע בכל מקום.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => setShowSuccessDialog(false)}
            className="w-full mt-4 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-base h-11 shadow-md hover:shadow-lg transition-all"
          >
            הבנתי
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}