"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Gender } from "@prisma/client";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface FormData {
  firstName: string;
  lastName: string;
  gender: Gender | "";
  birthDate: string;
  maritalStatus: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  religiousLevel: string;
  height: string;
  education: string;
  occupation: string;
  about: string;
  sendInvitation: boolean;
}

interface AddCandidateWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const steps: Step[] = [
  {
    id: "basic",
    title: "פרטים בסיסיים",
    description: "מידע אישי בסיסי על המועמד/ת",
    icon: User,
  },
  {
    id: "personal",
    title: "פרטים אישיים",
    description: "מידע נוסף על המועמד/ת",
    icon: Heart,
  },
  {
    id: "contact",
    title: "פרטי קשר",
    description: "דרכי יצירת קשר והעדפות",
    icon: Mail,
  },
  {
    id: "education",
    title: "השכלה ותעסוקה",
    description: "רקע לימודי ומקצועי",
    icon: GraduationCap,
  },
];

export default function NewAddCandidateWizard({
  isOpen,
  onClose,
  onSuccess,
}: AddCandidateWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    maritalStatus: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    religiousLevel: "",
    height: "",
    education: "",
    occupation: "",
    about: "",
    sendInvitation: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (key: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/matchmaker/candidates/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to add candidate");
      }

      setShowSuccessDialog(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.firstName && formData.lastName && formData.gender;
      case 1:
        return formData.maritalStatus && formData.religiousLevel;
      case 2:
        return (
          (!formData.sendInvitation || formData.email) &&
          (formData.phone || formData.email)
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    onSuccess();
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">שם פרטי</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="הכנס שם פרטי"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">שם משפחה</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="הכנס שם משפחה"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>מגדר</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  handleInputChange("gender", value as Gender)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מגדר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">זכר</SelectItem>
                  <SelectItem value="FEMALE">נקבה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">תאריך לידה</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>מצב משפחתי</Label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value) =>
                  handleInputChange("maritalStatus", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מצב משפחתי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="רווק/ה">רווק/ה</SelectItem>
                  <SelectItem value="גרוש/ה">גרוש/ה</SelectItem>
                  <SelectItem value="אלמן/ה">אלמן/ה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>רמת דתיות</Label>
              <Select
                value={formData.religiousLevel}
                onValueChange={(value) =>
                  handleInputChange("religiousLevel", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר רמת דתיות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="חרדי">חרדי</SelectItem>
                  <SelectItem value="דתי">דתי</SelectItem>
                  <SelectItem value="מסורתי">מסורתי</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">גובה (בס"מ)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                placeholder="הכנס גובה"
                min="140"
                max="220"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="sendInvitation"
                checked={formData.sendInvitation}
                onCheckedChange={(checked) =>
                  handleInputChange("sendInvitation", checked as boolean)
                }
              />
              <Label htmlFor="sendInvitation">שלח הזמנה להרשמה למערכת</Label>
            </div>

            {formData.sendInvitation && (
              <div className="space-y-2">
                <Label htmlFor="email">כתובת אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="example@domain.com"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">מספר טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="הכנס מספר טלפון"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">עיר</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="הכנס עיר"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="הכנס כתובת"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="education">השכלה</Label>
              <Input
                id="education"
                value={formData.education}
                onChange={(e) => handleInputChange("education", e.target.value)}
                placeholder="פרט/י השכלה"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">עיסוק</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) =>
                  handleInputChange("occupation", e.target.value)
                }
                placeholder="פרט/י עיסוק נוכחי"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">מידע נוסף</Label>
              <textarea
                id="about"
                value={formData.about}
                onChange={(e) => handleInputChange("about", e.target.value)}
                placeholder="מידע נוסף שחשוב לציין..."
                className="w-full min-h-[100px] p-2 border rounded-md"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>הוספת מועמד חדש</DialogTitle>
            <DialogDescription>
              מלא/י את הפרטים בטופס להוספת מועמד/ת חדש/ה למערכת
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between mb-1 text-sm text-gray-500">
              <span>התקדמות</span>
              <span>
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Steps Indicators */}
          <div className="mb-8">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center w-1/4 ${
                    index !== steps.length - 1
                      ? "relative after:content-[''] after:absolute after:top-5 after:right-1/2 after:w-full after:h-0.5 after:bg-gray-200"
                      : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors ${
                      index <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500 hidden md:block">
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="min-h-[400px] relative">
            <div className="absolute inset-0 transition-opacity duration-300">
              {renderStepContent()}
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={currentStep === 0}
            >
              <ChevronRight className="ml-2 h-4 w-4" />
              הקודם
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={!canProceed()}
              >
                הבא
                <ChevronLeft className="mr-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  "שומר..."
                ) : (
                  <>
                    סיום והוספה
                    <Check className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={handleSuccessClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>המועמד נוסף בהצלחה</AlertDialogTitle>
            <AlertDialogDescription>
              {formData.sendInvitation
                ? "הזמנה נשלחה לכתובת האימייל שהוזנה"
                : "המועמד נוסף למאגר המועמדים שלך"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessClose}>
              אישור
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
