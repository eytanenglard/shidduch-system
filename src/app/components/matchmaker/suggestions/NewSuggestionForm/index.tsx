// src/app/components/matchmaker/suggestions/NewSuggestionForm/index.tsx

"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Priority, MatchSuggestionStatus } from "@prisma/client";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Sparkles, Loader2, BarChart2, CheckCircle, Users } from "lucide-react";

// Types
import type { Candidate } from "../../new/types/candidates";
import { newSuggestionSchema, type NewSuggestionFormData } from "./schema";

// Components
import SuggestionDetails from "./SuggestionDetails";
import MatchPreview from "./MatchPreview";
import CandidateSelector from "./CandidateSelector";
import { AiMatchAnalysisDialog } from "../../new/dialogs/AiMatchAnalysisDialog";

interface NewSuggestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  selectedCandidate?: Candidate | null;
  onSubmit: (data: NewSuggestionFormData) => Promise<void>;
}

const NewSuggestionForm: React.FC<NewSuggestionFormProps> = ({ isOpen, onClose, candidates, selectedCandidate, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstParty, setFirstParty] = useState<Candidate | null>(null);
  const [secondParty, setSecondParty] = useState<Candidate | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  const form = useForm<NewSuggestionFormData>({
    resolver: zodResolver(newSuggestionSchema),
    defaultValues: {
      priority: Priority.MEDIUM,
      status: MatchSuggestionStatus.DRAFT,
      decisionDeadline: new Date(new Date().setDate(new Date().getDate() + 14)), // Default to 2 weeks
    },
  });

  // Reset form and state when dialog opens or selectedCandidate changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        priority: Priority.MEDIUM,
        status: MatchSuggestionStatus.DRAFT,
        decisionDeadline: new Date(new Date().setDate(new Date().getDate() + 14)),
        firstPartyId: selectedCandidate?.id || "",
        secondPartyId: "",
      });
      setFirstParty(selectedCandidate || null);
      setSecondParty(null);
    }
  }, [isOpen, selectedCandidate, form]);

  const handleCandidateSelect = (type: "first" | "second") => (candidate: Candidate | null) => {
    const setter = type === 'first' ? setFirstParty : setSecondParty;
    const fieldName = type === 'first' ? 'firstPartyId' : 'secondPartyId';
    setter(candidate);
    form.setValue(fieldName, candidate?.id || "", { shouldValidate: true, shouldDirty: true });
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!firstParty || !secondParty) {
      toast.error("יש לבחור את שני הצדדים להצעה.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success("ההצעה נוצרה בהצלחה!");
      onClose();
    } catch (error) {
      toast.error("שגיאה ביצירת ההצעה: " + (error instanceof Error ? error.message : "שגיאה לא ידועה"));
    } finally {
      setIsSubmitting(false);
    }
  });

  const maleCandidates = candidates.filter(c => c.profile.gender === 'MALE');
  const femaleCandidates = candidates.filter(c => c.profile.gender === 'FEMALE');

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-full h-[95vh] flex flex-col p-0" dir="rtl">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="text-2xl flex items-center gap-3">
              <UserPlus className="text-primary"/>
              יצירת הצעת שידוך חדשה
            </DialogTitle>
            <DialogDescription>
              בחר שני מועמדים, נתח את ההתאמה ביניהם והגדר את פרטי ההצעה.
            </DialogDescription>
          </DialogHeader>

          <FormProvider {...form}>
            <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 p-6 overflow-hidden">
              
              {/* Left Panel: Male Selector */}
              <div className="md:col-span-3 flex flex-col gap-4">
                <CandidateSelector
                  label="צד א' (גבר)"
                  value={firstParty}
                  onChange={handleCandidateSelect("first")}
                  candidates={maleCandidates}
                  otherParty={secondParty}
                  fieldName="firstPartyId"
                  error={form.formState.errors.firstPartyId?.message}
                />
              </div>
              
              {/* Center Panel: Details and Actions */}
              <div className="md:col-span-6 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
                {firstParty && secondParty ? (
                  <>
                    <MatchPreview firstParty={firstParty} secondParty={secondParty} />
                     <div className="flex gap-2 justify-center">
                      <Button type="button" variant="outline" onClick={() => setShowAnalysisDialog(true)}>
                        <BarChart2 className="w-4 h-4 ml-2"/>
                        נתח התאמה מלא (AI)
                      </Button>
                     </div>
                    <SuggestionDetails firstParty={firstParty} secondParty={secondParty} />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed">
                    <div className="text-center text-gray-500">
                        <Users className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-medium">בחר מועמדים</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            יש לבחור מועמד ומועמדת מהעמודות בצדדים.
                        </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Panel: Female Selector */}
              <div className="md:col-span-3 flex flex-col gap-4">
                <CandidateSelector
                  label="צד ב' (אישה)"
                  value={secondParty}
                  onChange={handleCandidateSelect("second")}
                  candidates={femaleCandidates}
                  otherParty={firstParty}
                  fieldName="secondPartyId"
                  error={form.formState.errors.secondPartyId?.message}
                />
              </div>

            </form>
          </FormProvider>

          <DialogFooter className="p-4 border-t flex-shrink-0">
            <div className="flex justify-between w-full items-center">
                <span className="text-xs text-gray-500">לאחר יצירת ההצעה, היא תופיע בסטטוס טיוטה.</span>
                <div className="flex gap-2">
                    <DialogClose asChild><Button variant="outline">ביטול</Button></DialogClose>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !firstParty || !secondParty}
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2"/> : <CheckCircle className="w-4 h-4 ml-2"/>}
                        {isSubmitting ? "יוצר הצעה..." : "צור הצעה"}
                    </Button>
                </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {firstParty && secondParty && (
        <AiMatchAnalysisDialog
          isOpen={showAnalysisDialog}
          onClose={() => setShowAnalysisDialog(false)}
          targetCandidate={firstParty}
          comparisonCandidates={[secondParty]}
        />
      )}
    </>
  );
};

export default NewSuggestionForm;