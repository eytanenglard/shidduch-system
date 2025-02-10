import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { MeetingFeedback } from "@/types/meetings";

interface MeetingFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: MeetingFeedback) => Promise<void>;
  meetingId: string;
}

export default function MeetingFeedbackDialog({
  isOpen,
  onClose,
  onSubmit,
  meetingId,
}: MeetingFeedbackDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [continueInterest, setContinueInterest] = useState<boolean | null>(null);
  const [nextMeetingScheduled, setNextMeetingScheduled] = useState(false);
  const [privateNotes, setPrivateNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (continueInterest === null) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: feedback,
        continueInterest,
        nextMeetingScheduled,
        privateNotes,
      });
      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>משוב על הפגישה</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>איך הייתה הפגישה?</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="ספר/י איך הייתה הפגישה..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>האם תרצה/י להמשיך?</Label>
            <RadioGroup
              value={continueInterest?.toString()}
              onValueChange={(value) => setContinueInterest(value === "true")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="continue-yes" />
                <Label htmlFor="continue-yes">כן, מעוניין/ת להמשיך</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="continue-no" />
                <Label htmlFor="continue-no">לא מעוניין/ת להמשיך</Label>
              </div>
            </RadioGroup>
          </div>

          {continueInterest && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="nextMeeting"
                checked={nextMeetingScheduled}
                onCheckedChange={(checked) =>
                  setNextMeetingScheduled(checked as boolean)
                }
              />
              <Label htmlFor="nextMeeting">קבענו פגישה נוספת</Label>
            </div>
          )}

          <div className="space-y-2">
            <Label>הערות פרטיות לשדכן/ית</Label>
            <Textarea
              value={privateNotes}
              onChange={(e) => setPrivateNotes(e.target.value)}
              placeholder="הערות שיהיו גלויות רק לשדכן/ית..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || continueInterest === null}
          >
            {isSubmitting ? "שולח..." : "שליחת משוב"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}