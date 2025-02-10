"use client";

import React, { useState, useEffect } from "react";
import { useNotifications } from "@/app/contexts/NotificationContext";
import { useSession } from "next-auth/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress"; // New import for progress bar
import {
  Search,
  Heart,
  Check,
  User,
  Loader2,
  Phone,
  Mail,
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { Client } from "@/app/types/matchmaker";
import type { Session } from "@/types/next-auth";
import type { CreateSuggestionData } from "@/app/types/suggestions";
import { ContactMethod } from "@prisma/client";

interface ContactPreference {
  method: ContactMethod;
  value: string;
}

interface NewSuggestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClient?: Client | null;
  onSubmit: (data: CreateSuggestionData) => Promise<void>;
}

export default function NewSuggestionForm({
  isOpen,
  onClose,
  selectedClient = null,
  onSubmit,
}: NewSuggestionFormProps) {
  const { data: session } = useSession() as { data: Session | null };
  const { refreshNotifications } = useNotifications();
  const [step, setStep] = useState(1); // Track current step
  const [firstParty, setFirstParty] = useState(selectedClient?.id || "");
  const [secondParty, setSecondParty] = useState("");
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [internalNotes, setInternalNotes] = useState("");
  const [firstPartyNotes, setFirstPartyNotes] = useState("");
  const [secondPartyNotes, setSecondPartyNotes] = useState("");
  const [firstPartyContact, setFirstPartyContact] = useState<ContactPreference>(
    {
      method: ContactMethod.EMAIL,
      value: "",
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const selectedClientData = availableClients.find(
      (c) => c.id === firstParty
    );
    console.log(
      "Full client data structure:",
      JSON.stringify(selectedClientData, null, 2)
    );

    if (selectedClientData?.email) {
      console.log(
        "About to set email contact with value:",
        selectedClientData.email
      );
      console.log("Current firstPartyContact state:", firstPartyContact);
      setFirstPartyContact({
        method: ContactMethod.EMAIL,
        value: selectedClientData.email,
      });
      console.log("FirstPartyContact has been set to:", {
        method: ContactMethod.EMAIL,
        value: selectedClientData.email,
      });
    } else {
      console.log("No email found for selected client");
    }
  }, [firstParty, availableClients]);
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/matchmaker/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setAvailableClients(data.clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load clients"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadClients();
      if (selectedClient) {
        setFirstParty(selectedClient.id);
      }
    }
  }, [isOpen, selectedClient]);

  const getFilteredClients = (forFirstParty: boolean = true) => {
    return availableClients.filter((client) => {
      if (forFirstParty && client.id === secondParty) return false;
      if (!forFirstParty && client.id === firstParty) return false;

      const selectedClient = forFirstParty
        ? availableClients.find((c) => c.id === secondParty)
        : availableClients.find((c) => c.id === firstParty);

      if (selectedClient && client.gender === selectedClient.gender)
        return false;

      if (searchQuery) {
        const searchStr =
          `${client.firstName} ${client.lastName}`.toLowerCase();
        return searchStr.includes(searchQuery.toLowerCase());
      }

      return true;
    });
  };

  const ClientCard = ({
    clientId,
    onRemove,
  }: {
    clientId: string;
    onRemove?: () => void;
  }) => {
    const client = availableClients.find((c) => c.id === clientId);
    if (!client) return null;

    return (
      <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {client.firstName} {client.lastName}
              </h3>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="hover:bg-red-50 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                <span>{calculateAge(client.birthDate)} שנים</span>
              </div>
              {client.personalInfo?.religiousLevel && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">🕊</span>
                  <span>{client.personalInfo.religiousLevel}</span>
                </div>
              )}
              {client.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">📍</span>
                  <span>{client.location}</span>
                </div>
              )}
              {client.personalInfo?.occupation && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="mr-2">💼</span>
                  <span>{client.personalInfo.occupation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const ClientSelector = ({
    forFirstParty,
    onSelect,
  }: {
    forFirstParty: boolean;
    onSelect: (clientId: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">
            {forFirstParty ? "צד ראשון" : "צד שני"}
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="hover:bg-blue-50"
          >
            {isOpen ? "סגור" : "בחר מועמד/ת"}
          </Button>
        </div>

        {isOpen && (
          <div className="relative w-full">
            <Command className="w-full rounded-lg border shadow-md">
              <CommandInput
                placeholder="חיפוש מועמד/ת..."
                onValueChange={setSearchQuery}
                className="w-full"
              />
              <CommandList className="max-h-[200px] overflow-auto">
                <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
                <CommandGroup>
                  {isLoading ? (
                    <div className="flex justify-center p-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    getFilteredClients(forFirstParty).map((client) => (
                      <CommandItem
                        key={client.id}
                        value={`${client.firstName} ${client.lastName}`}
                        onSelect={() => {
                          onSelect(client.id);
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <span>
                            {client.firstName} {client.lastName} -{" "}
                            {calculateAge(client.birthDate)} שנים
                          </span>
                        </div>
                        {(forFirstParty ? firstParty : secondParty) ===
                          client.id && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}
      </div>
    );
  };

  const handleFirstPartySelect = (clientId: string) => {
    console.log("handleFirstPartySelect called with ID:", clientId);
    const selectedClientData = availableClients.find((c) => c.id === clientId);
    console.log(
      "Full client data structure:",
      JSON.stringify(selectedClientData, null, 2)
    );

    console.log("Found client data:", selectedClientData);
    console.log("Client's email:", selectedClientData?.email);

    setFirstParty(clientId);

    if (selectedClientData?.email) {
      console.log("Setting contact info with email:", selectedClientData.email);
      setFirstPartyContact({
        method: ContactMethod.EMAIL,
        value: selectedClientData.email,
      });
      console.log("Contact info has been set");
    } else {
      console.log("No email found in client data");
    }
  };
  const handleSubmit = async (asDraft: boolean = true) => {
    try {
      setIsSubmitting(true);
      setError("");

      if (!firstParty || !secondParty || !session?.user?.id) {
        throw new Error("חסרים פרטים נדרשים");
      }

      // Prepare suggestion data
      const suggestionData: CreateSuggestionData = {
        matchmakerId: session.user.id,
        firstPartyId: firstParty,
        secondPartyId: secondParty,
        status: asDraft ? "DRAFT" : "PENDING_FIRST_PARTY",
        priority: "MEDIUM",
        requiresRabbinicApproval: false,
        notes: {
          internal: internalNotes || undefined,
          forFirstParty: firstPartyNotes || undefined,
          forSecondParty: secondPartyNotes || undefined,
        },
        dealBreakers: [],
        commonInterests: [],
        matchingCriteria: [],
        communications: !asDraft
          ? {
              firstParty: {
                method: firstPartyContact.method,
                value: firstPartyContact.value,
                content: firstPartyNotes || undefined,
                isUrgent: false,
                requiresResponse: true,
              },
            }
          : undefined,
      };

      console.log("Sending suggestion data:", suggestionData);

      const response = await fetch("/api/matchmaker/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(suggestionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create suggestion");
      }

      const result = await response.json();
      console.log("Suggestion created successfully:", result);
      await refreshNotifications();
      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err instanceof Error ? err.message : "אירעה שגיאה ביצירת ההצעה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <ClientSelector
              forFirstParty={true}
              onSelect={handleFirstPartySelect}
            />
            {firstParty && (
              <ClientCard
                clientId={firstParty}
                onRemove={() => setFirstParty("")}
              />
            )}
            <ClientSelector forFirstParty={false} onSelect={setSecondParty} />
            {secondParty && (
              <ClientCard
                clientId={secondParty}
                onRemove={() => setSecondParty("")}
              />
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 pt-4">
            <Label className="text-lg font-semibold">פרטי יצירת קשר</Label>
            <div className="space-y-4">
              <RadioGroup
                value={firstPartyContact.method}
                onValueChange={(value: ContactMethod) =>
                  setFirstPartyContact({
                    ...firstPartyContact,
                    method: value,
                  })
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={ContactMethod.EMAIL} id="email" />
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    אימייל
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={ContactMethod.PHONE} id="phone" />
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    טלפון
                  </Label>
                </div>
              </RadioGroup>

              <Input
                placeholder={
                  firstPartyContact.method === ContactMethod.EMAIL
                    ? "כתובת אימייל"
                    : "מספר טלפון"
                }
                value={firstPartyContact.value}
                onChange={(e) =>
                  setFirstPartyContact({
                    ...firstPartyContact,
                    value: e.target.value,
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                הערות פנימיות
              </Label>
              <Textarea
                placeholder="הערות פנימיות לשימוש המשרד..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="min-h-[100px] resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <span className="w-3 h-3 rounded-full bg-blue-400" />
                הערות לצד ראשון
              </Label>
              <Textarea
                placeholder="הערות שיישלחו לצד הראשון..."
                value={firstPartyNotes}
                onChange={(e) => setFirstPartyNotes(e.target.value)}
                className="min-h-[100px] resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-700">
                <span className="w-3 h-3 rounded-full bg-green-400" />
                הערות לצד שני
              </Label>
              <Textarea
                placeholder="הערות שיישלחו לצד השני..."
                value={secondPartyNotes}
                onChange={(e) => setSecondPartyNotes(e.target.value)}
                className="min-h-[100px] resize-y"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getStepValidation = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return firstParty && secondParty;
      case 2:
        return firstPartyContact.value.trim() !== "";
      case 3:
        return true; // Notes are optional
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[800px] h-[80vh] overflow-hidden"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            יצירת הצעת שידוך חדשה
          </DialogTitle>
          <Progress value={(step / 3) * 100} className="w-full h-2 mb-4" />
          <div className="flex justify-center gap-8 text-sm text-gray-600">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-blue-600 font-medium" : ""
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step >= 1 ? "bg-blue-100 text-blue-600" : "bg-gray-100"
                }`}
              >
                1
              </span>
              בחירת מועמדים
            </div>
            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-blue-600 font-medium" : ""
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step >= 2 ? "bg-blue-100 text-blue-600" : "bg-gray-100"
                }`}
              >
                2
              </span>
              פרטי קשר
            </div>
            <div
              className={`flex items-center gap-2 ${
                step >= 3 ? "text-blue-600 font-medium" : ""
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step >= 3 ? "bg-blue-100 text-blue-600" : "bg-gray-100"
                }`}
              >
                3
              </span>
              הערות
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-y-auto h-[calc(80vh-280px)] px-1 my-4">
          {renderStepContent()}
        </div>

        <DialogFooter className="border-t pt-4 mt-4">
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                  חזור
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="hover:bg-gray-100"
              >
                ביטול
              </Button>

              {step === 3 && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleSubmit(true)}
                    disabled={isSubmitting || !firstParty || !secondParty}
                    className="flex items-center gap-2 bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-200"
                  >
                    <Heart className="h-4 w-4" />
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "שמירה כטיוטה"
                    )}
                  </Button>

                  <Button
                    onClick={() => handleSubmit(false)}
                    disabled={
                      isSubmitting ||
                      !firstParty ||
                      !secondParty ||
                      !firstPartyContact.value
                    }
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <User className="h-4 w-4" />
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "שליחה לצד ראשון"
                    )}
                  </Button>
                </>
              )}

              {step < 3 && (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!getStepValidation(step)}
                  className="flex items-center gap-2"
                >
                  המשך
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
