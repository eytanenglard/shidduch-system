"use client";

// --- שינוי: הוספת useEffect ליבוא ---
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Priority, MatchSuggestionStatus } from "@prisma/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, Mail, Loader2 } from "lucide-react";
import type { Candidate } from "../types/candidates";

interface NewSuggestionFormData {
  firstPartyId: string;
  secondPartyId: string;
  priority: Priority;
  status: MatchSuggestionStatus;
}
interface ActionDialogsProps {
  suggestDialog: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewSuggestionFormData) => Promise<void>;
    selectedCandidate: Candidate | null;
  };
  availabilityDialog: {
    isOpen: boolean;
    onClose: () => void;
    onCheck: (candidate: Candidate) => Promise<void>;
    selectedCandidate: Candidate | null;
  };
  inviteDialog: {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (candidate: Candidate, email: string) => Promise<void>;
    selectedCandidate: Candidate | null;
  };
}

export const ActionDialogs: React.FC<ActionDialogsProps> = ({
  suggestDialog,
  availabilityDialog,
  inviteDialog,
}) => {
  // State for invite dialog
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // State for availability dialog
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  );

  // --- הוספה: useEffect למילוי אוטומטי של האימייל ---
  useEffect(() => {
    // בודקים אם דיאלוג ההזמנה פתוח ויש מועמד שנבחר
    if (inviteDialog.isOpen && inviteDialog.selectedCandidate) {
      // מעדכנים את שדה האימייל עם האימייל של המועמד מהדאטהבייס.
      // אם אין לו אימייל, השדה יישאר ריק.
      setInviteEmail(inviteDialog.selectedCandidate.email || "");
    } else {
      // כאשר הדיאלוג נסגר, מנקים את שדה האימייל
      setInviteEmail("");
    }
  }, [inviteDialog.isOpen, inviteDialog.selectedCandidate]); // ה-hook יופעל בכל פעם שהדיאלוג נפתח/נסגר או שהמועמד משתנה

  // Handler for invite submission
  const handleInviteSubmit = async () => {
    if (!inviteDialog.selectedCandidate || !inviteEmail) return;

    try {
      setIsInviting(true);
      setInviteError(null);
      await inviteDialog.onInvite(inviteDialog.selectedCandidate, inviteEmail);
      // setInviteEmail(""); // השורה הזו כבר לא הכרחית כי ה-useEffect ינקה את השדה בסגירה
      inviteDialog.onClose();
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setIsInviting(false);
    }
  };

  // Handler for availability check
  const handleAvailabilityCheck = async () => {
    if (!availabilityDialog.selectedCandidate) return;

    try {
      setIsChecking(true);
      setAvailabilityError(null);
      await availabilityDialog.onCheck(availabilityDialog.selectedCandidate);
      availabilityDialog.onClose();
    } catch (error) {
      setAvailabilityError(
        error instanceof Error ? error.message : "Failed to check availability"
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <>
      {/* Invite Dialog */}
      <Dialog open={inviteDialog.isOpen} onOpenChange={inviteDialog.onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>שליחת הזמנה למועמד</DialogTitle>
            <DialogDescription>
              {inviteDialog.selectedCandidate && (
                <span>
                  שליחת הזמנה ל: {inviteDialog.selectedCandidate.firstName}{" "}
                  {inviteDialog.selectedCandidate.lastName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>כתובת אימייל</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="הזן כתובת אימייל"
                className="mt-2"
              />
            </div>

            {inviteError && (
              <Alert variant="destructive">
                <AlertDescription>{inviteError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={inviteDialog.onClose}
              disabled={isInviting}
            >
              ביטול
            </Button>
            <Button
              onClick={handleInviteSubmit}
              disabled={isInviting || !inviteEmail}
            >
              {isInviting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="ml-2 h-4 w-4" />
              )}
              {isInviting ? "שולח..." : "שלח הזמנה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability Check Dialog */}
      <Dialog
        open={availabilityDialog.isOpen}
        onOpenChange={availabilityDialog.onClose}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>בדיקת זמינות</DialogTitle>
            <DialogDescription>
              {availabilityDialog.selectedCandidate && (
                <span>
                  בדיקת זמינות עבור:{" "}
                  {availabilityDialog.selectedCandidate.firstName}{" "}
                  {availabilityDialog.selectedCandidate.lastName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availabilityError && (
              <Alert variant="destructive">
                <AlertDescription>{availabilityError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={availabilityDialog.onClose}
              disabled={isChecking}
            >
              ביטול
            </Button>
            <Button onClick={handleAvailabilityCheck} disabled={isChecking}>
              {isChecking ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Clock className="ml-2 h-4 w-4" />
              )}
              {isChecking ? "בודק..." : "בדוק זמינות"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suggest Match Dialog */}
      <Dialog open={suggestDialog.isOpen} onOpenChange={suggestDialog.onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הצעת שידוך חדשה</DialogTitle>
            <DialogDescription>
              {suggestDialog.selectedCandidate && (
                <span>
                  יצירת הצעת שידוך עבור:{" "}
                  {suggestDialog.selectedCandidate.firstName}{" "}
                  {suggestDialog.selectedCandidate.lastName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {/* תוכן הדיאלוג יועבר מהקומפוננטה NewSuggestionForm */}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActionDialogs;