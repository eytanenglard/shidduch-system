// src/app/components/matchmaker/suggestions/NewSuggestionForm/SuggestionDetails.tsx

"use client";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Priority } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { NewSuggestionFormData } from "./schema";
import type { Candidate } from "../../new/types/candidates";

interface SuggestionDetailsProps {
  firstParty: Candidate;
  secondParty: Candidate;
}

const SuggestionDetails: React.FC<SuggestionDetailsProps> = ({ firstParty, secondParty }) => {
  const { register, formState: { errors }, setValue, watch } = useFormContext<NewSuggestionFormData>();
  const [isGeneratingRationale, setIsGeneratingRationale] = useState(false);

  const priority = watch("priority", Priority.MEDIUM);

  const handleGenerateRationale = async () => {
    setIsGeneratingRationale(true);
    toast.info("ה-AI מנסח את חבילת הנימוקים...");
    try {
      const response = await fetch('/api/ai/generate-suggestion-rationale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId1: firstParty.id, userId2: secondParty.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.rationales) {
        throw new Error(data.error || "שגיאה בייצור הנימוקים");
      }

      // --- START OF CHANGE: Populate all three fields ---
      const { generalRationale, rationaleForParty1, rationaleForParty2 } = data.rationales;

      setValue('matchingReason', generalRationale, { shouldValidate: true, shouldDirty: true });
      setValue('firstPartyNotes', rationaleForParty1, { shouldValidate: true, shouldDirty: true });
      setValue('secondPartyNotes', rationaleForParty2, { shouldValidate: true, shouldDirty: true });
      // --- END OF CHANGE ---

      toast.success("הנימוקים נוצרו בהצלחה והוזנו בשדות המתאימים.");

    } catch (error) {
      console.error("Failed to generate rationales:", error);
      toast.error(error instanceof Error ? error.message : "שגיאה לא צפויה");
    } finally {
      setIsGeneratingRationale(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="priority">עדיפות ההצעה</Label>
            <Select
              onValueChange={(value: Priority) => setValue("priority", value, { shouldValidate: true })}
              defaultValue={priority}
              name="priority"
            >
              <SelectTrigger id="priority"><SelectValue placeholder="בחר/י עדיפות" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={Priority.URGENT}>דחופה</SelectItem>
                <SelectItem value={Priority.HIGH}>גבוהה</SelectItem>
                <SelectItem value={Priority.MEDIUM}>רגילה</SelectItem>
                <SelectItem value={Priority.LOW}>נמוכה</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && <p className="text-sm text-red-500 mt-1">{errors.priority.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="matchingReason">סיבת התאמה (כללי, יוצג לצדדים)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleGenerateRationale} disabled={isGeneratingRationale}>
                {isGeneratingRationale ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 ml-2 text-purple-500" />
                )}
                {isGeneratingRationale ? 'מנסח...' : 'צור נימוקים (AI)'}
              </Button>
            </div>
            <Textarea
              id="matchingReason"
              {...register("matchingReason")}
              placeholder="נימוק כללי המסביר מדוע יש התאמה בין הצדדים..."
              className="min-h-[120px]"
            />
            {errors.matchingReason && <p className="text-sm text-red-500 mt-1">{errors.matchingReason.message}</p>}
             <Alert variant="default" className="mt-2 text-xs p-3 bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-500" />
                <AlertDescription>
                  לחיצה על כפתור ה-AI תמלא אוטומטית את שדה זה וגם את שדות ההערות האישיות לכל צד.
                </AlertDescription>
            </Alert>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstPartyNotes">הערות אישיות לצד א׳ ({firstParty.firstName})</Label>
              <Textarea
                id="firstPartyNotes"
                {...register("firstPartyNotes")}
                placeholder="טקסט אישי המדגיש את היתרונות של צד ב' עבור צד א'..."
                className="min-h-[140px]"
              />
              {errors.firstPartyNotes && <p className="text-sm text-red-500 mt-1">{errors.firstPartyNotes.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondPartyNotes">הערות אישיות לצד ב׳ ({secondParty.firstName})</Label>
              <Textarea
                id="secondPartyNotes"
                {...register("secondPartyNotes")}
                placeholder="טקסט אישי המדגיש את היתרונות של צד א' עבור צד ב'..."
                className="min-h-[140px]"
              />
              {errors.secondPartyNotes && <p className="text-sm text-red-500 mt-1">{errors.secondPartyNotes.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">הערות פנימיות (לצוות השדכנים)</Label>
            <Textarea
              id="internalNotes"
              {...register("internalNotes")}
              placeholder="הערות והנחיות לשימוש פנימי בלבד..."
              className="min-h-[100px]"
            />
            {errors.internalNotes && <p className="text-sm text-red-500 mt-1">{errors.internalNotes.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>תאריך יעד להחלטה</Label>
            <Select
              onValueChange={(value) => {
                const days = parseInt(value, 10);
                const deadline = new Date();
                deadline.setDate(deadline.getDate() + days);
                setValue("decisionDeadline", deadline, { shouldValidate: true });
              }}
              defaultValue="14"
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 ימים</SelectItem>
                <SelectItem value="7">7 ימים</SelectItem>
                <SelectItem value="14">14 ימים</SelectItem>
                <SelectItem value="30">30 ימים</SelectItem>
              </SelectContent>
            </Select>
            {errors.decisionDeadline && <p className="text-sm text-red-500 mt-1">{errors.decisionDeadline.message}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestionDetails;