"use client";
import React from "react";
import { useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Priority } from "@prisma/client";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { calculateAge } from "@/lib/utils";
import type { NewSuggestionFormData } from "./schema";
import type { Candidate } from "../types/candidates";

interface SuggestionDetailsProps {
  className?: string;
  firstParty: Candidate;
  secondParty: Candidate;
}

const SuggestionDetails: React.FC<SuggestionDetailsProps> = ({
  className,
  firstParty,
  secondParty,
}) => {
  const {
    register,
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext<NewSuggestionFormData>();

  // Format candidate display
  const formatCandidateInfo = (candidate: Candidate): string => {
    const age = calculateAge(new Date(candidate.profile.birthDate));
    return `${candidate.firstName} ${candidate.lastName}, ${age}${
      candidate.profile.city ? `, ${candidate.profile.city}` : ""
    }`;
  };

  // Register all form fields
  React.useEffect(() => {
    // Set default values if not already set
    const currentValues = getValues();
    if (!currentValues.priority) {
      setValue("priority", Priority.MEDIUM);
    }
  }, [setValue, getValues]);

  return (
    <div className="space-y-6">
      {/* Selected Candidates Summary */}
      <Card className="bg-slate-50">
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">הצדדים המוצעים</h3>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-primary font-medium">צד א׳</Label>
            <div className="p-3 bg-white rounded-lg border">
              <div className="font-medium">
                {formatCandidateInfo(firstParty)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {firstParty.profile.religiousLevel} |
                {firstParty.profile.occupation &&
                  ` ${firstParty.profile.occupation} |`}
                {firstParty.profile.education &&
                  ` ${firstParty.profile.education}`}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-primary font-medium">צד ב׳</Label>
            <div className="p-3 bg-white rounded-lg border">
              <div className="font-medium">
                {formatCandidateInfo(secondParty)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {secondParty.profile.religiousLevel} |
                {secondParty.profile.occupation &&
                  ` ${secondParty.profile.occupation} |`}
                {secondParty.profile.education &&
                  ` ${secondParty.profile.education}`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Selection with Visual Indicators */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Label className="text-lg">עדיפות ההצעה</Label>
            <Select
              onValueChange={(value: Priority) => {
                setValue("priority", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }}
              value={getValues("priority") || Priority.MEDIUM}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר/י עדיפות" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Priority.URGENT}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="destructive"
                      className="h-2 w-2 p-0 rounded-full"
                    />
                    דחופה
                  </div>
                </SelectItem>
                <SelectItem value={Priority.HIGH}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="warning"
                      className="h-2 w-2 p-0 rounded-full"
                    />
                    גבוהה
                  </div>
                </SelectItem>
                <SelectItem value={Priority.MEDIUM}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="default"
                      className="h-2 w-2 p-0 rounded-full"
                    />
                    רגילה
                  </div>
                </SelectItem>
                <SelectItem value={Priority.LOW}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="h-2 w-2 p-0 rounded-full"
                    />
                    נמוכה
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && (
              <p className="text-sm text-red-500">{errors.priority.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matching Details */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Matching Reason */}
          <div className="space-y-3">
            <Label className="text-lg">סיבת ההתאמה</Label>
            <div className="text-sm text-gray-500 mb-2">
              פרט/י מדוע לדעתך יש התאמה בין המועמדים. מידע זה יוצג לשני הצדדים.
            </div>
            <Textarea
              {...register("matchingReason")}
              placeholder="לדוגמה: שני הצדדים מחפשים בן/בת זוג עם השקפת עולם דומה, שאיפות דומות..."
              className="min-h-[120px] resize-none"
            />
            {errors.matchingReason && (
              <p className="text-sm text-red-500">
                {errors.matchingReason.message}
              </p>
            )}
          </div>

          {/* Party-specific Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-lg">הערות לצד א׳</Label>
              <div className="text-sm text-gray-500 mb-2">
                הערות אישיות שיוצגו רק ל{firstParty.firstName}
              </div>
              <Textarea
                {...register("firstPartyNotes")}
                placeholder="מידע נוסף שחשוב שידע..."
                className="min-h-[100px] resize-none"
              />
              {errors.firstPartyNotes && (
                <p className="text-sm text-red-500">
                  {errors.firstPartyNotes.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-lg">הערות לצד ב׳</Label>
              <div className="text-sm text-gray-500 mb-2">
                הערות אישיות שיוצגו רק ל{secondParty.firstName}
              </div>
              <Textarea
                {...register("secondPartyNotes")}
                placeholder="מידע נוסף שחשוב שידע..."
                className="min-h-[100px] resize-none"
              />
              {errors.secondPartyNotes && (
                <p className="text-sm text-red-500">
                  {errors.secondPartyNotes.message}
                </p>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-3">
            <Label className="text-lg">הערות פנימיות</Label>
            <div className="text-sm text-gray-500 mb-2">
              הערות אלו יהיו גלויות רק לצוות השדכנים
            </div>
            <Textarea
              {...register("internalNotes")}
              placeholder="הערות והנחיות לשדכנים..."
              className="min-h-[100px] resize-none"
            />
            {errors.internalNotes && (
              <p className="text-sm text-red-500">
                {errors.internalNotes.message}
              </p>
            )}
          </div>

          {/* Decision Days */}
          <div className="space-y-3">
            <Label className="text-lg">זמן להחלטה</Label>
            <div className="text-sm text-gray-500 mb-2">
              תוך כמה ימים נדרשת החלטה סופית משני הצדדים
            </div>
            <Select
              onValueChange={(value) => {
                const days = parseInt(value);
                const deadline = new Date();
                deadline.setDate(deadline.getDate() + days);
                setValue("decisionDeadline", deadline, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }}
              defaultValue="14"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר/י מספר ימים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 ימים</SelectItem>
                <SelectItem value="3">3 ימים</SelectItem>
                <SelectItem value="5">5 ימים</SelectItem>
                <SelectItem value="7">7 ימים</SelectItem>
              </SelectContent>
            </Select>
            {errors.decisionDeadline && (
              <p className="text-sm text-red-500">
                {errors.decisionDeadline.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestionDetails;
