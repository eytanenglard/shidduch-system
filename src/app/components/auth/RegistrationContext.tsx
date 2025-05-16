// src/app/components/auth/RegistrationContext.tsx
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { Gender } from "@prisma/client"; // Assuming you have this type from Prisma

// Define the structure of the registration data
export interface RegistrationData {
  // Basic info (Step 1 for new registration)
  email: string;
  password: string; // Only for new email/password registration
  // Personal details (Step 2 for new reg / Step 1 for completion)
  firstName: string;
  lastName: string;
  phone: string; // Usually collected before phone verification step
  gender: Gender | ""; // Use Gender type from Prisma, allow empty string for initial state
  birthDate: string; // Consider using Date object or a consistent string format e.g., "YYYY-MM-DD"
  maritalStatus: string;
  // Optional info (Step 3 for new reg / Step 2 for completion)
  height?: number; // Optional field
  occupation?: string; // Optional field
  education?: string; // Optional field

  // Internal state for managing the flow
  step: number; // Current step in the registration/completion process
  isGoogleSignup: boolean; // True if the user signed up via Google
  isCompletingProfile: boolean; // True if user is completing an existing partial profile
  isVerifyingEmailCode: boolean; // True if user is in email OTP verification step
  emailForVerification: string | null; // Stores the email being verified
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
  step: 0, // Start at WelcomeStep (step 0) by default
  isGoogleSignup: false,
  isCompletingProfile: false,
  isVerifyingEmailCode: false,
  emailForVerification: null,
};

// Define context type
interface RegistrationContextType {
  data: RegistrationData;
  setData: React.Dispatch<React.SetStateAction<RegistrationData>>; // For direct state manipulation if absolutely necessary
  updateField: <K extends keyof RegistrationData>(
    field: K,
    value: RegistrationData[K]
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetForm: () => void; // Resets the form to initial state
  setGoogleSignup: (googleUserData: { // Data received from Google
    email: string;
    firstName?: string;
    lastName?: string;
  }) => void;
  initializeForCompletion: (userData: { // Data for users needing to complete their profile
    email: string;
    firstName?: string | null; // Allow null from session
    lastName?: string | null;  // Allow null from session
  }) => void;
  proceedToEmailVerification: (email: string) => void; // To enter email verification mode
  completeEmailVerification: () => void; // To mark email as verified and proceed
  exitEmailVerification: () => void; // To cancel or go back from email verification
}

// Create context with initial (empty) functions to satisfy the type
const RegistrationContext = createContext<RegistrationContextType>({
  data: initialRegistrationData,
  setData: () => { console.warn("RegistrationProvider not found") },
  updateField: () => { console.warn("RegistrationProvider not found") },
  nextStep: () => { console.warn("RegistrationProvider not found") },
  prevStep: () => { console.warn("RegistrationProvider not found") },
  goToStep: () => { console.warn("RegistrationProvider not found") },
  resetForm: () => { console.warn("RegistrationProvider not found") },
  setGoogleSignup: () => { console.warn("RegistrationProvider not found") },
  initializeForCompletion: () => { console.warn("RegistrationProvider not found") },
  proceedToEmailVerification: () => { console.warn("RegistrationProvider not found") },
  completeEmailVerification: () => { console.warn("RegistrationProvider not found") },
  exitEmailVerification: () => { console.warn("RegistrationProvider not found") },
});

// Provider component
export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<RegistrationData>(initialRegistrationData);

  const updateField = useCallback(<K extends keyof RegistrationData>(
    field: K,
    value: RegistrationData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const nextStep = useCallback(() => {
    setData((prev) => {
      if (prev.isVerifyingEmailCode) {
        console.warn("RegistrationContext: nextStep called during email verification. Use completeEmailVerification.");
        return prev; // Should not proceed here
      }

      let currentMaxStep;
      if (prev.isCompletingProfile) {
        // Completion flow: Step 2 (Personal), Step 3 (Optional) -> then Step 4 (Complete screen)
        currentMaxStep = 3; // Last data entry step is Optional (step 3)
      } else {
        // New registration flow: Step 0 (Welcome), Step 1 (Basic), Step 2 (Personal), Step 3 (Optional) -> then Step 4 (Complete screen)
        currentMaxStep = 3; // Last data entry step is Optional (step 3)
      }

      // If current step is 1 (Basic Info) and it's a new registration,
      // next action is email verification, not incrementing step directly here.
      if (prev.step === 1 && !prev.isCompletingProfile && !prev.isGoogleSignup) {
        console.log("RegistrationContext: At BasicInfo (step 1). UI should trigger 'proceedToEmailVerification'.");
        // The UI (BasicInfoStep) should call proceedToEmailVerification upon form submission.
        return prev;
      }

      if (prev.step < currentMaxStep) {
        return { ...prev, step: prev.step + 1 };
      } else if (prev.step === currentMaxStep) {
        // Reached the last data input step, move to "Complete" screen (step 4)
        return { ...prev, step: 4 };
      }
      return prev; // Already at or beyond 'Complete' screen
    });
  }, []);

  const prevStep = useCallback(() => {
    setData((prev) => {
      if (prev.isVerifyingEmailCode) {
        // If user goes back from email verification screen
        return {
          ...prev,
          isVerifyingEmailCode: false,
          emailForVerification: null,
          step: 1, // Go back to BasicInfo (step 1)
        };
      }

      // For completion flow, if at step 2 (PersonalDetails), prev might be nuanced.
      // For simplicity, just decrement. If special logic needed, add here.
      // Example: if (prev.isCompletingProfile && prev.step === 2) { /* do something else */ }

      if (prev.step > 0) {
        return { ...prev, step: prev.step - 1 };
      }
      return prev; // Already at step 0 (Welcome)
    });
  }, []);

  const goToStep = useCallback((stepNum: number) => {
    setData((prev) => ({
      ...prev,
      step: stepNum,
      isVerifyingEmailCode: false, // Always exit email verification when jumping steps
      emailForVerification: null,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setData(initialRegistrationData);
  }, []);

  const setGoogleSignup = useCallback((googleUserData: {
    email: string;
    firstName?: string;
    lastName?: string;
  }) => {
    setData({
      ...initialRegistrationData, // Start fresh
      email: googleUserData.email,
      firstName: googleUserData.firstName || "",
      lastName: googleUserData.lastName || "",
      isGoogleSignup: true,
      isCompletingProfile: true, // Google users typically need to complete their profile
      step: 2, // Assume Google provides enough for Basic Info, start at PersonalDetails (step 2)
      isVerifyingEmailCode: false,
      emailForVerification: null,
    });
  }, []);

  const initializeForCompletion = useCallback((userData: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  }) => {
    setData({
      ...initialRegistrationData, // Start fresh but keep some user data
      email: userData.email,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      isCompletingProfile: true,
      isGoogleSignup: false, // This is for non-Google users redirected to complete
      step: 2, // Start profile completion at PersonalDetails (step 2)
      isVerifyingEmailCode: false,
      emailForVerification: null,
    });
  }, []);

  const proceedToEmailVerification = useCallback((emailToVerify: string) => {
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: true,
      emailForVerification: emailToVerify,
      // step remains where it was (e.g., 1 for BasicInfo).
      // RegisterSteps component will render EmailVerificationCodeStep based on isVerifyingEmailCode.
    }));
  }, []);

  const completeEmailVerification = useCallback(() => {
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      step: 2, // After successful email verification, move to PersonalDetails (step 2)
    }));
  }, []);

  const exitEmailVerification = useCallback(() => {
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      step: 1, // Go back to BasicInfo (step 1)
    }));
  }, []);

  const value: RegistrationContextType = {
    data,
    setData,
    updateField,
    nextStep,
    prevStep,
    goToStep,
    resetForm,
    setGoogleSignup,
    initializeForCompletion,
    proceedToEmailVerification,
    completeEmailVerification,
    exitEmailVerification,
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};

// Custom hook for using the registration context
export const useRegistration = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  // The default value check in createContext should prevent `context` from being undefined
  // if the provider is missing, but an explicit check here is good practice.
  if (context === undefined || Object.keys(context).every(key => typeof context[key as keyof RegistrationContextType] === 'function' && context[key as keyof RegistrationContextType].toString().includes("RegistrationProvider not found"))) {
    throw new Error(
      "useRegistration must be used within a RegistrationProvider"
    );
  }
  return context;
};