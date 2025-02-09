"use client";

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
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Session } from "next-auth";

export default function AvailabilityStatus() {
  const { data: sessionData, update: updateSession } = useSession();
  const { data: session } = useSession() as { data: Session | null };

  const [showDialog, setShowDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [status, setStatus] = useState<AvailabilityStatusEnum>(
    session?.user?.profile?.availabilityStatus ||
      AvailabilityStatusEnum.AVAILABLE
  );
  const [note, setNote] = useState(
    session?.user?.profile?.availabilityNote || ""
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [localStatus, setLocalStatus] = useState<AvailabilityStatusEnum | null>(
    null
  );
  const [localNote, setLocalNote] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.profile?.availabilityStatus) {
      setStatus(session.user.profile.availabilityStatus);
      setNote(session.user.profile.availabilityNote || "");
    }
  }, [session]);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      setError("");

      setLocalStatus(status);
      setLocalNote(note);

      const response = await fetch("/api/profile/availability", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          availabilityStatus: status,
          availabilityNote: note || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Server update failed");
      }

      await updateSession({
        user: {
          ...session?.user,
          profile: {
            ...session?.user?.profile,
            availabilityStatus: status,
            availabilityNote: note,
          },
        },
      });

      await signIn("credentials", {
        redirect: false,
        email: session?.user?.email,
        password: undefined,
      });

      setShowDialog(false);
      setShowSuccessDialog(true); // פתיחת דיאלוג ההצלחה החדש
    } catch (err) {
      console.error("Error in update:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");

      setLocalStatus(null);
      setLocalNote(null);

      if (session?.user?.profile?.availabilityStatus) {
        setStatus(session.user.profile.availabilityStatus);
        setNote(session.user.profile.availabilityNote || "");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const displayStatus = localStatus || status;
  const displayNote = localNote || note;

  const getStatusColor = (status: AvailabilityStatusEnum) => {
    switch (status) {
      case AvailabilityStatusEnum.AVAILABLE:
        return "text-green-600 bg-green-50";
      case AvailabilityStatusEnum.UNAVAILABLE:
      case AvailabilityStatusEnum.DATING:
      case AvailabilityStatusEnum.ENGAGED:
      case AvailabilityStatusEnum.MARRIED:
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusDisplay = (status: AvailabilityStatusEnum): string => {
    switch (status) {
      case AvailabilityStatusEnum.AVAILABLE:
        return "פנוי/ה להצעות";
      case AvailabilityStatusEnum.UNAVAILABLE:
        return "לא פנוי/ה להצעות";
      case AvailabilityStatusEnum.DATING:
        return "בתהליך היכרות";
      case AvailabilityStatusEnum.ENGAGED:
        return "מאורס/ת";
      case AvailabilityStatusEnum.MARRIED:
        return "נשוי/אה";
      default:
        return "לא ידוע";
    }
  };

  if (!session?.user) return null;

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setShowDialog(true)}
        className={`flex items-center gap-2 ${getStatusColor(displayStatus)}`}
      >
        {displayStatus === AvailabilityStatusEnum.AVAILABLE ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-600" />
        )}
        {getStatusDisplay(displayStatus)}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>עדכון סטטוס זמינות</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as AvailabilityStatusEnum)
              }
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AvailabilityStatusEnum.AVAILABLE}>
                  פנוי/ה להצעות
                </SelectItem>
                <SelectItem value={AvailabilityStatusEnum.UNAVAILABLE}>
                  לא פנוי/ה להצעות
                </SelectItem>
                <SelectItem value={AvailabilityStatusEnum.DATING}>
                  בתהליך היכרות
                </SelectItem>
                <SelectItem value={AvailabilityStatusEnum.ENGAGED}>
                  מאורס/ת
                </SelectItem>
                <SelectItem value={AvailabilityStatusEnum.MARRIED}>
                  נשוי/אה
                </SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="הערה (אופציונלי)"
              value={displayNote}
              onChange={(e) => setNote(e.target.value)}
              disabled={isUpdating}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={
                status === AvailabilityStatusEnum.AVAILABLE
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isUpdating ? "מעדכן..." : "עדכון סטטוס"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>הסטטוס עודכן בהצלחה</AlertDialogTitle>
            <AlertDialogDescription>
              הסטטוס שלך עודכן בהצלחה במערכת.
              <br />
              <strong>שים/י לב:</strong> במידה ותרענן/י את הדף, יתכן שתראה/י
              זמנית את הסטטוס הקודם עד להתחברות מחדש.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => setShowSuccessDialog(false)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            הבנתי
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
