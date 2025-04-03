"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/use-toast";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Priority, MatchSuggestionStatus } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, UserPlus } from "lucide-react";
import { Steps } from "@/components/ui/steps";
import type { Candidate } from "../../new/types/candidates";
import { newSuggestionSchema } from "./schema";
import type { NewSuggestionFormData } from "./schema";
import SuggestionDetails from "./SuggestionDetails";
import MatchPreview from "./MatchPreview";
import CandidateSelector from "./CandidateSelector";

interface NewSuggestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  selectedCandidate?: Candidate | null;
  onSubmit: (data: NewSuggestionFormData) => Promise<void>;
}

const STEPS = [
  {
    title: "בחירת מועמדים",
    description: "בחירת שני הצדדים להצעה",
    icon: UserPlus,
  },
  {
    title: "פרטי ההצעה",
    description: "הגדרת פרטי ההצעה ותזמונים",
    icon: CheckCircle,
  },
];

const NewSuggestionForm: React.FC<NewSuggestionFormProps> = ({
  isOpen,
  onClose,
  candidates,
  selectedCandidate,
  onSubmit,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstParty, setFirstParty] = useState<Candidate | null>(
    selectedCandidate || null
  );
  const [secondParty, setSecondParty] = useState<Candidate | null>(null);

  const { toast } = useToast();

  const form = useForm<NewSuggestionFormData>({
    resolver: zodResolver(newSuggestionSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      status: MatchSuggestionStatus.DRAFT,
      firstPartyId: selectedCandidate?.id || "",
      secondPartyId: "",
    },
  });

  // Debug logging for form state changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      console.log("Form value changed:", {
        name,
        value,
        type,
        allValues: form.getValues(),
        formState: form.formState,
      });
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Handle candidate selection
  const handleCandidateSelect =
    (type: "first" | "second") => (candidate: Candidate | null) => {
      console.log(`${type} party selection:`, { candidate });

      if (type === "first") {
        setFirstParty(candidate);
        if (candidate) {
          form.setValue("firstPartyId", candidate.id, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        } else {
          form.setValue("firstPartyId", "", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        }
      } else {
        setSecondParty(candidate);
        if (candidate) {
          form.setValue("secondPartyId", candidate.id, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        } else {
          form.setValue("secondPartyId", "", {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
        }
      }

      // Log form state after update
      console.log("Form state after selection:", {
        values: form.getValues(),
        errors: form.formState.errors,
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
      });
    };

  const handleSubmit = async (data: NewSuggestionFormData) => {
    console.log("Submit attempt:", {
      formData: data,
      formState: form.formState,
      firstParty,
      secondParty,
    });

    if (!firstParty || !secondParty) {
      console.log("Missing parties:", { firstParty, secondParty });
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("=== Before API call ===");
      await onSubmit(data);
      console.log("=== After successful API call ===");
      toast({
        title: "ההצעה נוצרה בהצלחה",
        description: "ההצעה נשמרה במערכת והועברה לטיפול",
      });
      onClose();
    } catch (error) {
      console.log("=== API call failed ===", error);
      console.error("Submission error:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת יצירת ההצעה",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form validation before moving to next step
  const handleNextStep = () => {
    form.trigger(["firstPartyId", "secondPartyId"]).then((isValid) => {
      if (isValid) {
        setStep(2);
      } else {
        console.log("Validation failed:", form.formState.errors);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-8 pt-6 pb-2">
          <DialogTitle className="text-2xl">יצירת הצעת שידוך חדשה</DialogTitle>
          <DialogDescription>
            יצירת הצעת שידוך בין שני מועמדים והגדרת פרטי ההצעה
          </DialogDescription>
        </DialogHeader>

        {/* Steps Indicator */}
        <div className="px-8 py-4">
          <Steps steps={STEPS} currentStep={step} />
        </div>

        <Separator />

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-8 pt-6">
            {/* Step 1: Candidate Selection */}
            <div className={step !== 1 ? "hidden" : "space-y-8"}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CandidateSelector
                  label="צד א׳"
                  value={firstParty}
                  onChange={handleCandidateSelect("first")}
                  candidates={candidates}
                  otherParty={secondParty}
                  fieldName="firstPartyId"
                  error={form.formState.errors.firstPartyId?.message}
                />

                <CandidateSelector
                  label="צד ב׳"
                  value={secondParty}
                  onChange={handleCandidateSelect("second")}
                  candidates={candidates}
                  otherParty={firstParty}
                  fieldName="secondPartyId"
                  error={form.formState.errors.secondPartyId?.message}
                />
              </div>

              {firstParty && secondParty && (
                <div className="rounded-lg border bg-card">
                  <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">
                      התאמה בין המועמדים
                    </h3>
                  </div>
                  <div className="p-6">
                    <MatchPreview
                      firstParty={firstParty}
                      secondParty={secondParty}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleNextStep}
                  disabled={!firstParty || !secondParty}
                >
                  המשך להגדרת פרטי ההצעה
                </Button>
              </div>
            </div>

            {/* Step 2: Suggestion Details */}
            <div className={step !== 2 ? "hidden" : "space-y-8"}>
              <div className="rounded-lg border bg-card">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold">פרטי ההצעה</h3>
                </div>
                <div className="p-6">
                  {firstParty && secondParty ? (
                    <SuggestionDetails
                      firstParty={firstParty}
                      secondParty={secondParty}
                    />
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      יש לבחור את שני הצדדים בשלב הראשון
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(1)}
                >
                  חזרה לבחירת מועמדים
                </Button>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || !form.formState.isValid}
                >
                  {isSubmitting ? "שומר הצעה..." : "שמור הצעה"}
                </Button>
              </div>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default NewSuggestionForm;
