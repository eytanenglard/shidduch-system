// src/app/components/suggestions/dialogs/AskMatchmakerDialog.tsx
"use client";

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
import { MessageCircle } from "lucide-react";

interface AskMatchmakerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => Promise<void>;
  matchmakerName?: string;
}

export const AskMatchmakerDialog: React.FC<AskMatchmakerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  matchmakerName,
}) => {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(question);
      setQuestion("");
      onClose();
    } catch (error) {
      console.error("Error submitting question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            שאלה ל{matchmakerName ? `שדכן ${matchmakerName}` : "שדכן"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="הזן את שאלתך כאן..."
            className="min-h-[120px]"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!question.trim() || isSubmitting}
          >
            <MessageCircle className="w-4 h-4 ml-2" />
            {isSubmitting ? "שולח..." : "שלח שאלה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};