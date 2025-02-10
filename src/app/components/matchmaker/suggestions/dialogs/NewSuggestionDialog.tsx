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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Steps } from "@/components/ui/steps";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { calculateMatchScore } from "../utils/matchingAlgorithm";
import { Priority } from "@prisma/client";
import CandidateSelector from "../../CandidateCard/CandidateSelector";
import type { Candidate } from "../../types/candidates";

interface NewSuggestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  candidates: Candidate[];
}

const STEPS = [
  { title: "בחירת מועמדים", description: "בחירת שני הצדדים להצעה" },
  { title: "פרטי ההצעה", description: "הגדרת פרטי ההצעה ותזמונים" },
];

const NewSuggestionDialog: React.FC<NewSuggestionDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  candidates,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstPartyId: "",
    secondPartyId: "",
    priority: Priority.MEDIUM,
    matchingReason: "",
    firstPartyNotes: "",
    secondPartyNotes: "",
    internalNotes: "",
    decisionDeadline: new Date(),
  });

  const [firstParty, setFirstParty] = useState<Candidate | null>(null);
  const [secondParty, setSecondParty] = useState<Candidate | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const handleCandidateSelect =
    (type: "first" | "second") => (candidate: Candidate | null) => {
      if (type === "first") {
        setFirstParty(candidate);
        setFormData((prev) => ({ ...prev, firstPartyId: candidate?.id || "" }));
      } else {
        setSecondParty(candidate);
        setFormData((prev) => ({
          ...prev,
          secondPartyId: candidate?.id || "",
        }));
      }

      if (candidate) {
        const otherParty = type === "first" ? secondParty : firstParty;
        if (otherParty) {
          const score = calculateMatchScore(
            candidate.profile,
            otherParty.profile
          );
          setMatchScore(score?.score || null);
        }
      }
    };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      toast.success("ההצעה נוצרה בהצלחה");
      onClose();
    } catch (error) {
      console.error("Error creating suggestion:", error);
      toast.error("שגיאה ביצירת ההצעה");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>יצירת הצעת שידוך חדשה</DialogTitle>
        </DialogHeader>

        <Steps steps={STEPS} currentStep={step} className="my-6" />

        <div className="space-y-6">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-6">
                <CandidateSelector
                  label="צד א׳"
                  value={firstParty}
                  onChange={handleCandidateSelect("first")}
                  candidates={candidates}
                  otherParty={secondParty}
                  fieldName="firstPartyId"
                />

                <CandidateSelector
                  label="צד ב׳"
                  value={secondParty}
                  onChange={handleCandidateSelect("second")}
                  candidates={candidates}
                  otherParty={firstParty}
                  fieldName="secondPartyId"
                />
              </div>

              {matchScore !== null && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-2">ניתוח התאמה ראשוני</h3>
                  <p className="text-sm text-gray-600">
                    רמת ההתאמה הראשונית היא {matchScore}%
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label>עדיפות</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: value as Priority,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Priority.LOW}>נמוכה</SelectItem>
                      <SelectItem value={Priority.MEDIUM}>רגילה</SelectItem>
                      <SelectItem value={Priority.HIGH}>גבוהה</SelectItem>
                      <SelectItem value={Priority.URGENT}>דחופה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>תאריך יעד להחלטה</Label>
                  <Calendar
                    mode="single"
                    selected={formData.decisionDeadline}
                    onSelect={(date) =>
                      setFormData((prev) => ({
                        ...prev,
                        decisionDeadline: date || new Date(),
                      }))
                    }
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <Label>סיבת ההתאמה</Label>
                  <Textarea
                    value={formData.matchingReason}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        matchingReason: e.target.value,
                      }))
                    }
                    placeholder="פרט/י מדוע לדעתך יש התאמה בין המועמדים..."
                  />
                </div>

                <Separator />

                <div>
                  <Label>הערות לצד א׳</Label>
                  <Textarea
                    value={formData.firstPartyNotes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstPartyNotes: e.target.value,
                      }))
                    }
                    placeholder="הערות שיוצגו רק לצד א׳..."
                  />
                </div>

                <div>
                  <Label>הערות לצד ב׳</Label>
                  <Textarea
                    value={formData.secondPartyNotes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        secondPartyNotes: e.target.value,
                      }))
                    }
                    placeholder="הערות שיוצגו רק לצד ב׳..."
                  />
                </div>

                <div>
                  <Label>הערות פנימיות</Label>
                  <Textarea
                    value={formData.internalNotes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        internalNotes: e.target.value,
                      }))
                    }
                    placeholder="הערות פנימיות לשימוש השדכן..."
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              ביטול
            </Button>

            <div className="flex gap-2">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep((prev) => prev - 1)}
                  disabled={isSubmitting}
                >
                  חזרה
                </Button>
              )}

              {step === 1 ? (
                <Button
                  onClick={() => setStep(2)}
                  disabled={!firstParty || !secondParty}
                >
                  המשך
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "יוצר הצעה..." : "יצירת הצעה"}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewSuggestionDialog;
