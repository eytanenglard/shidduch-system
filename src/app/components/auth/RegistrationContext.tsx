// src/app/components/auth/RegistrationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Gender, UserStatus } from "@prisma/client"; // Assuming you have these types from Prisma
import type { Session } from "next-auth"; // Import Session type

// Define the structure of the registration data
export interface RegistrationData {
  // Basic info (Step 1 for new registration)
  email: string;
  password: string; // Only for new email/password registration
  // Personal details (Step 2 for new reg / Step 1 for completion)
  firstName: string;
  lastName: string;
  phone: string;
  gender: Gender | "";
  birthDate: string; // "YYYY-MM-DD"
  maritalStatus: string;
  // Optional info (Step 3 for new reg / Step 2 for completion)
  height?: number;
  occupation?: string;
  education?: string;

  // Internal state for managing the flow
  step: number;
  isGoogleSignup: boolean; // True if the current flow initiated from a Google sign-up action
  isCompletingProfile: boolean; // True if user is completing an existing partial profile
  isVerifyingEmailCode: boolean; // True if user is in email OTP verification step
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
  step: 0, // Start at WelcomeStep (step 0) by default
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
  resetForm: () => void;
  setGoogleSignup: (googleUserData: {
    email: string;
    firstName?: string;
    lastName?: string;
  }) => void;
  initializeForCompletion: (userData: {
    // Kept for explicit calls if needed
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  }) => void;
  initializeFromSession: (sessionUser: Session["user"]) => void; // New function
  proceedToEmailVerification: (email: string) => void;
  completeEmailVerification: () => void;
  exitEmailVerification: () => void;
}

const RegistrationContext = createContext<RegistrationContextType>({
  data: initialRegistrationData,
  setData: () => {
    console.warn("RegistrationProvider not found");
  },
  updateField: () => {
    console.warn("RegistrationProvider not found");
  },
  nextStep: () => {
    console.warn("RegistrationProvider not found");
  },
  prevStep: () => {
    console.warn("RegistrationProvider not found");
  },
  goToStep: () => {
    console.warn("RegistrationProvider not found");
  },
  resetForm: () => {
    console.warn("RegistrationProvider not found");
  },
  setGoogleSignup: () => {
    console.warn("RegistrationProvider not found");
  },
  initializeForCompletion: () => {
    console.warn("RegistrationProvider not found");
  },
  initializeFromSession: () => {
    console.warn("RegistrationProvider not found");
  },
  proceedToEmailVerification: () => {
    console.warn("RegistrationProvider not found");
  },
  completeEmailVerification: () => {
    console.warn("RegistrationProvider not found");
  },
  exitEmailVerification: () => {
    console.warn("RegistrationProvider not found");
  },
});

export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<RegistrationData>(initialRegistrationData);

  const updateField = useCallback(
    <K extends keyof RegistrationData>(
      field: K,
      value: RegistrationData[K]
    ) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const nextStep = useCallback(() => {
    setData((prev) => {
      if (prev.isVerifyingEmailCode) {
        console.warn(
          "RegistrationContext: nextStep called during email verification. Use completeEmailVerification."
        );
        return prev;
      }

      const currentMaxStep = 3; // Basic(1)->EmailVerify->Personal(2)->Optional(3) -> CompleteScreen(4)

      if (
        prev.step === 1 &&
        !prev.isCompletingProfile &&
        !prev.isGoogleSignup
      ) {
        console.log(
          "RegistrationContext: At BasicInfo (step 1). UI should trigger 'proceedToEmailVerification'."
        );
        return prev;
      }

      if (prev.step < currentMaxStep) {
        return { ...prev, step: prev.step + 1 };
      } else if (prev.step === currentMaxStep) {
        return { ...prev, step: 4 }; // Go to Complete screen
      }
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setData((prev) => {
      if (prev.isVerifyingEmailCode) {
        return {
          ...prev,
          isVerifyingEmailCode: false,
          emailForVerification: null,
          step: 1, // Go back to BasicInfo
        };
      }
      if (prev.step > 0) {
        // If coming back from CompleteStep (step 4)
        if (prev.step === 4) {
          // If completing profile, previous step is OptionalInfo (3)
          // If new registration, previous step is OptionalInfo (3)
          return { ...prev, step: 3 };
        }
        return { ...prev, step: prev.step - 1 };
      }
      return prev;
    });
  }, []);

  const goToStep = useCallback((stepNum: number) => {
    setData((prev) => ({
      ...prev,
      step: stepNum,
      isVerifyingEmailCode: false,
      emailForVerification: null,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setData(initialRegistrationData);
  }, []);

  const setGoogleSignup = useCallback(
    (googleUserData: {
      email: string;
      firstName?: string;
      lastName?: string;
    }) => {
      // This is for NEW Google sign-ups that need to complete their profile
      setData({
        ...initialRegistrationData,
        email: googleUserData.email,
        firstName: googleUserData.firstName || "",
        lastName: googleUserData.lastName || "",
        isGoogleSignup: true, // Mark as Google signup initiated flow
        isCompletingProfile: true, // Google users need to complete profile details
        step: 2, // Start at PersonalDetails (step 2)
        isVerifyingEmailCode: false,
        emailForVerification: null,
      });
    },
    []
  );

  const initializeForCompletion = useCallback(
    (userData: {
      email: string;
      firstName?: string | null;
      lastName?: string | null;
    }) => {
      // Generic function to start profile completion, e.g., for existing email users
      // after email verification, or if middleware sends an existing user here.
      setData((prevData) => ({
        // Keep existing context data if any, then override
        ...prevData,
        ...initialRegistrationData, // Reset most things but allow some overrides
        email: userData.email,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        isCompletingProfile: true,
        isGoogleSignup: false, // Assume not Google unless setGoogleSignup was called
        step: 2, // Start profile completion at PersonalDetails (step 2)
        isVerifyingEmailCode: false,
        emailForVerification: null,
      }));
    },
    []
  );

  const initializeFromSession = useCallback(
    (sessionUser: Session["user"]) => {
      setData(() => {
        // Always start from a predictable base, then apply session specifics
        const isGoogleAccount =
          sessionUser.accounts?.some((acc) => acc.provider === "google") ||
          false;

        let baseState: RegistrationData = {
          ...initialRegistrationData,
          email: sessionUser.email || "",
          firstName: sessionUser.firstName || "",
          lastName: sessionUser.lastName || "",
          phone: sessionUser.phone || "",
        };

        if (sessionUser.profile) {
          baseState = {
            ...baseState,
            gender: sessionUser.profile.gender || "",
            birthDate: sessionUser.profile.birthDate
              ? new Date(sessionUser.profile.birthDate)
                  .toISOString()
                  .split("T")[0]
              : "",
            maritalStatus: sessionUser.profile.maritalStatus || "",
            height: sessionUser.profile.height ?? undefined,
            occupation: sessionUser.profile.occupation || "",
            education: sessionUser.profile.education || "",
          };
        }

        // Case 1: Email not verified (specific to Email/Password users)
        // UserStatus.PENDING_EMAIL_VERIFICATION comes from your Prisma enum
        if (
          sessionUser.status === UserStatus.PENDING_EMAIL_VERIFICATION &&
          !isGoogleAccount
        ) {
          return {
            ...baseState,
            isVerifyingEmailCode: true,
            emailForVerification: sessionUser.email,
            step: 1, // BasicInfo step leads to email verification
            isCompletingProfile: false, // Not yet completing full profile
            isGoogleSignup: false,
          };
        }

        // Case 2: Profile not complete
        // This applies to Google users needing to fill details, or Email/Pass users after email verification.
        // UserStatus.PENDING_PHONE_VERIFICATION might imply profile is filled or partially filled.
        // isProfileComplete is the more direct flag.
        if (!sessionUser.isProfileComplete) {
          return {
            ...baseState,
            isCompletingProfile: true,
            isGoogleSignup: isGoogleAccount, // Reflects if the session user is from Google
            step: 2, // Start at PersonalDetailsStep
            isVerifyingEmailCode: false,
          };
        }

        // Case 3: Profile complete, but phone not verified
        if (sessionUser.isProfileComplete && !sessionUser.isPhoneVerified) {
          return {
            ...baseState,
            isCompletingProfile: true, // Still part of the overall "completion" journey
            isGoogleSignup: isGoogleAccount,
            step: 4, // Go to CompleteStep, which should guide to phone verification
            isVerifyingEmailCode: false,
          };
        }

        // If user is fully verified (profile complete AND phone verified),
        // they shouldn't be on this page. Middleware/RegisterSteps should redirect.
        // If somehow they land here, reset to a safe default (Welcome).
        console.warn(
          "[RegistrationContext] initializeFromSession called for a user who seems fully verified or in an unexpected state. Resetting to WelcomeStep."
        );
        return {
          ...initialRegistrationData, // Reset to welcome
          email: sessionUser.email || "", // Keep email at least
        };
      });
    },
    [setData]
  );

  const proceedToEmailVerification = useCallback((emailToVerify: string) => {
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: true,
      emailForVerification: emailToVerify,
      // step remains (e.g., 1 for BasicInfo). RegisterSteps renders based on isVerifyingEmailCode.
    }));
  }, []);

  const completeEmailVerification = useCallback(() => {
    // Called after email code is successfully verified AND user is auto-signed in.
    // The goal is to move to the next step in the registration flow.
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      isCompletingProfile: false, // This might need to be true if going straight to profile filling
      step: 2, // Move to PersonalDetails (step 2)
    }));
  }, []);

  const exitEmailVerification = useCallback(() => {
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      step: 1, // Go back to BasicInfo
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
    initializeFromSession, // Added
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

export const useRegistration = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  if (
    context === undefined ||
    Object.keys(context).every(
      (key) =>
        typeof context[key as keyof RegistrationContextType] === "function" &&
        context[key as keyof RegistrationContextType]
          .toString()
          .includes("RegistrationProvider not found")
    )
  ) {
    throw new Error(
      "useRegistration must be used within a RegistrationProvider"
    );
  }
  return context;
};
