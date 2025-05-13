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

  // Personal details
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
  isVerifyingEmailCode: boolean; 
  emailForVerification: string | null; 
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
  isVerifyingEmailCode: false,
  emailForVerification: null,
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
  isLastStep: () => boolean; // Consider if this is still accurate with the new flow
  resetForm: () => void;
  setGoogleSignup: (data: Partial<RegistrationData>) => void;
  initializeForCompletion: (userData: {
    email: string;
    firstName?: string;
    lastName?: string;
  }) => void;
  proceedToEmailVerification: (email: string) => void; 
  completeEmailVerification: () => void; 
  exitEmailVerification: () => void; 
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
  proceedToEmailVerification: () => {},
  completeEmailVerification: () => {},
  exitEmailVerification: () => {},
});

// Provider component
export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<RegistrationData>({
    ...initialRegistrationData,
  });

  // Define total steps for non-completion flow (Welcome -> BasicInfo -> (VerifyEmail) -> PersonalDetails -> OptionalInfo -> (Potentially CompleteStep if not auto-redirecting))
  // For completion flow: PersonalDetails -> OptionalInfo -> CompleteStep
  // The 'step' number itself might need careful management if EmailVerificationCodeStep is considered a "sub-step" of BasicInfo.
  // For simplicity, let's treat EmailVerificationCode as a distinct state rather than a numbered step in the main sequence for now.
  // TOTAL_STEPS will refer to the main form steps.
  const TOTAL_MAIN_STEPS_REGISTRATION = 3; // 0:Welcome, 1:Basic, 2:Personal, 3:Optional

  const updateField = <K extends keyof RegistrationData>(
    field: K,
    value: RegistrationData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setData((prev) => {
      // If we are verifying email, this function shouldn't be called directly
      // to advance. completeEmailVerification will handle advancement.
      if (prev.isVerifyingEmailCode) {
        console.warn("RegistrationContext: nextStep called while isVerifyingEmailCode is true. This should be handled by completeEmailVerification.");
        return prev;
      }

      // For Google Signup or Profile Completion, steps are managed differently
      if (prev.isGoogleSignup || prev.isCompletingProfile) {
        // Assuming steps are 2 (PersonalDetails) and 3 (OptionalInfo) for completion
        if (prev.step < 3) { // Max step for completion before 'Complete' screen
          return { ...prev, step: prev.step + 1 };
        }
        // If already at step 3 (OptionalInfo), next would be CompleteStep (handled by UI or step 4)
        // Or, if you have a 'Complete' step as step 4
        if (prev.step === 3) {
             return { ...prev, step: 4 }; // Go to CompleteStep
        }
        return prev; // Or handle redirection to /profile if step 3 is the last data entry step
      }

      // Regular registration flow (not Google, not completing profile)
      // After BasicInfo (step 1), the flow is interrupted for email verification.
      // So, direct nextStep calls should only happen from Welcome (0 to 1)
      // or from PersonalDetails (2 to 3), OptionalInfo (3 to 4 for CompleteStep)
      if (prev.step < TOTAL_MAIN_STEPS_REGISTRATION) {
         // if step is 1 (BasicInfo), next step is handled by proceedToEmailVerification
        if (prev.step === 1 && !prev.isCompletingProfile && !prev.isGoogleSignup) {
            console.log("RegistrationContext: At BasicInfo (step 1), awaiting proceedToEmailVerification.");
            return prev; // Stay on step 1, UI will trigger verification
        }
        return { ...prev, step: prev.step + 1 };
      }
      return prev;
    });
  };

  const prevStep = () => {
    setData((prev) => {
      if (prev.isVerifyingEmailCode) {
        // Exiting email verification, go back to BasicInfo (step 1)
        return {
          ...prev,
          isVerifyingEmailCode: false,
          emailForVerification: null,
          step: 1, 
        };
      }
      if (prev.step > 0) {
        // If completing profile and at step 2 (PersonalDetails), prevStep should go to dashboard or similar
        // For now, just decrement, but this might need more specific logic.
        return { ...prev, step: prev.step - 1 };
      }
      return prev;
    });
  };

  const goToStep = (stepNum: number) => {
    // Ensure stepNum is within valid range and reset verification state
    const maxStep = data.isCompletingProfile ? 3 : TOTAL_MAIN_STEPS_REGISTRATION; // Or 4 if Complete is a step
    if (stepNum >= 0 && stepNum <= maxStep) {
      setData((prev) => ({
        ...prev,
        step: stepNum,
        isVerifyingEmailCode: false,
        emailForVerification: null,
      }));
    } else {
        console.warn(`goToStep: Invalid step number ${stepNum}`);
    }
  };

  // This might need re-evaluation based on the new flow
  const isLastStep = () => {
    if (data.isCompletingProfile) {
        return data.step === 3; // OptionalInfo is the last data entry before Complete screen
    }
    // For regular registration, OptionalInfo (step 3) is the last data entry
    return data.step === TOTAL_MAIN_STEPS_REGISTRATION; 
  };

  const resetForm = () => {
    setData({ ...initialRegistrationData });
  };

  const setGoogleSignup = (googleData: Partial<RegistrationData>) => {
    setData(() => ({
      ...initialRegistrationData, // Reset most things
      ...googleData, // Apply Google data
      isGoogleSignup: true,
      isCompletingProfile: true, // Google signup often requires profile completion
      isVerifyingEmailCode: false, 
      emailForVerification: null,
      // If basic info is present from Google, start at PersonalDetails (step 2)
      // Otherwise, if more info is needed, could start at BasicInfo (step 1)
      step: (googleData.email && googleData.firstName && googleData.lastName) ? 2 : 1,
    }));
    console.log("Context: Google signup initiated. Current step:", data.step);
  };

  const initializeForCompletion = (userData: {
    email: string;
    firstName?: string;
    lastName?: string;
  }) => {
    setData((prev) => ({
      ...initialRegistrationData, // Reset to defaults
      email: userData.email,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      isCompletingProfile: true,
      isGoogleSignup: prev.isGoogleSignup, // Preserve if they came via Google
      isVerifyingEmailCode: false,
      emailForVerification: null,
      step: 2, // Start profile completion at PersonalDetails
    }));
    console.log("Context: Initialized for profile completion, starting at step 2 (PersonalDetails).");
  };

  const proceedToEmailVerification = (emailToVerify: string) => {
    setData((prev) => ({
        ...prev,
        isVerifyingEmailCode: true,
        emailForVerification: emailToVerify,
        // step remains at 1 (BasicInfo), RegisterSteps will show EmailVerificationCodeStep
    }));
    console.log(`Context: Proceeding to email code verification for ${emailToVerify}. Current step: ${data.step}`);
  };

  const completeEmailVerification = () => {
    setData((prev) => ({
        ...prev,
        isVerifyingEmailCode: false,
        emailForVerification: null,
        step: 2 // After email verification, move to PersonalDetails (step 2)
    }));
    console.log("Context: Email verification completed. Moving to step 2 (PersonalDetails).");
  };

  const exitEmailVerification = () => {
    setData((prev) => ({
        ...prev,
        isVerifyingEmailCode: false,
        emailForVerification: null,
        step: 1 // Return to BasicInfo (step 1) if user cancels verification
    }));
    console.log("Context: Exited email verification process. Returning to step 1 (BasicInfo).");
  };

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
export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error(
      "useRegistration must be used within a RegistrationProvider"
    );
  }
  return context;
};