// src/app/components/auth/RegistrationContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Gender } from "@prisma/client";

// Define the structure of the registration data
export interface RegistrationData {
  // Basic info
  email: string;
  password: string;
  firstName: string;
  lastName: string;

  // Personal details (נשארים כאן לאיסוף נתונים אם המשתמש יחזור להשלים פרופיל)
  phone: string;
  gender: Gender | "";
  birthDate: string;
  maritalStatus: string;

  // Optional info
  height?: number;
  occupation?: string;
  education?: string;

  // Additional state
  step: number;
  isGoogleSignup: boolean;
  isCompletingProfile: boolean;
  isEmailVerificationPending: boolean; // <-- הוספנו state חדש
}

// Default initial state
const initialRegistrationData: RegistrationData = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  gender: "",
  birthDate: "",
  maritalStatus: "",
  height: undefined,
  occupation: "",
  education: "",
  step: 0, // Start at welcome by default
  isGoogleSignup: false,
  isCompletingProfile: false,
  isEmailVerificationPending: false, // <-- אתחול
};

// Define context type
interface RegistrationContextType {
  data: RegistrationData;
  setData: React.Dispatch<React.SetStateAction<RegistrationData>>;
  updateField: <K extends keyof RegistrationData>(
    field: K,
    value: RegistrationData[K]
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  isLastStep: () => boolean;
  resetForm: () => void;
  setGoogleSignup: (data: Partial<RegistrationData>) => void;
  initializeForCompletion: (userData: {
    email: string;
    firstName?: string;
    lastName?: string;
  }) => void;
  setEmailVerificationPending: (isPending: boolean) => void; // <-- פונקציה חדשה
}

// Create context with default values
const RegistrationContext = createContext<RegistrationContextType>({
  data: initialRegistrationData,
  setData: () => {},
  updateField: () => {},
  nextStep: () => {},
  prevStep: () => {},
  goToStep: () => {},
  isLastStep: () => false,
  resetForm: () => {},
  setGoogleSignup: () => {},
  initializeForCompletion: () => {},
  setEmailVerificationPending: () => {}, // <-- הוספה
});

// Provider component
export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<RegistrationData>({
    ...initialRegistrationData,
  });

  // עדכן את TOTAL_STEPS אם תהליך ההרשמה *הראשוני* מסתיים אחרי שלב 1
  // או השאר אם השלבים האחרים משמשים רק להשלמת פרופיל
  const TOTAL_STEPS = 4; // נשאיר 4 כרגע, נניח ששאר השלבים הם להשלמה

  const updateField = <K extends keyof RegistrationData>(
    field: K,
    value: RegistrationData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    // מנע מעבר אוטומטי לשלב 2 אם אנחנו בהרשמה ראשונית
    if (data.step === 1 && !data.isCompletingProfile && !data.isGoogleSignup) {
        console.log("RegistrationContext: Blocking automatic nextStep after step 1 for initial email signup.");
        return; // עצור כאן, ההתקדמות תנוהל ב-BasicInfoStep
    }
    if (data.step < TOTAL_STEPS) {
      setData((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const prevStep = () => {
    if (data.step > 0) {
       // אם חוזרים משלב "בדוק אימייל", אפס את הדגל
      if (data.isEmailVerificationPending) {
          setData((prev) => ({ ...prev, isEmailVerificationPending: false, step: prev.step - 1 }));
      } else {
          setData((prev) => ({ ...prev, step: prev.step - 1 }));
      }
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step <= TOTAL_STEPS) {
      // אפס את דגל "בדוק אימייל" אם עוברים לשלב אחר
      setData((prev) => ({ ...prev, step, isEmailVerificationPending: false }));
    }
  };

  const isLastStep = () => {
    return data.step === TOTAL_STEPS;
  };

  const resetForm = () => {
    setData({ ...initialRegistrationData });
  };

  const setGoogleSignup = (googleData: Partial<RegistrationData>) => {
    setData((prev) => ({
      ...prev,
      ...googleData,
      isGoogleSignup: true,
      isCompletingProfile: true,
      isEmailVerificationPending: false, // ודא שזה כבוי
      step:
        googleData.email && googleData.firstName && googleData.lastName ? 2 : 1,
    }));
  };

  const initializeForCompletion = (userData: {
    email: string;
    firstName?: string;
    lastName?: string;
  }) => {
    setData((prev) => ({
      ...initialRegistrationData,
      email: userData.email,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      isCompletingProfile: true,
      isGoogleSignup: prev.isGoogleSignup,
      isEmailVerificationPending: false, // ודא שזה כבוי
      step: 2,
    }));
    console.log(
      "Context initialized for profile completion, starting at step 2"
    );
  };

  // --- פונקציה חדשה לעדכון מצב "ממתין לאימות אימייל" ---
  const setEmailVerificationPending = (isPending: boolean) => {
      setData((prev) => ({ ...prev, isEmailVerificationPending: isPending }));
      if (isPending) {
          console.log("Context: Setting email verification pending state.");
          // אולי נרצה גם לעצור את התקדמות השלבים כאן, אבל נעדיף לטפל בזה בתצוגה
      }
  };
  // --- סוף פונקציה חדשה ---

  const value = {
    data,
    setData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    isLastStep,
    resetForm,
    setGoogleSignup,
    initializeForCompletion,
    setEmailVerificationPending, // <-- הוספת הפונקציה לקונטקסט
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

// Custom hook for using the registration context
export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error(
      "useRegistration must be used within a RegistrationProvider"
    );
  }
  return context;
};