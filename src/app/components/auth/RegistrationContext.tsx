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
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  }) => void;
  initializeFromSession: (sessionUser: Session["user"]) => void; // Uses Session["user"] type from next-auth
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
        // If proceedToEmailVerification is called, it sets isVerifyingEmailCode to true.
        // The UI then renders the verification step. nextStep should not advance the step counter here.
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
        if (prev.step === 4) {
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
      isVerifyingEmailCode: false, // Ensure email verification state is reset when jumping steps
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
      setData({
        ...initialRegistrationData,
        email: googleUserData.email,
        firstName: googleUserData.firstName || "",
        lastName: googleUserData.lastName || "",
        isGoogleSignup: true,
        isCompletingProfile: true,
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
      setData((prevData) => ({
        ...prevData, // Keep existing context data if any, then override
        ...initialRegistrationData,
        email: userData.email,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        isCompletingProfile: true,
        isGoogleSignup: prevData.isGoogleSignup, // Preserve if it was already set by setGoogleSignup
        step: 2,
        isVerifyingEmailCode: false,
        emailForVerification: null,
      }));
    },
    []
  );

  const initializeFromSession = useCallback(
    (sessionUser: Session["user"]) => {
      setData(() => {
        // `sessionUser.accounts` is not available on the Session["user"] type
        // as defined in your next-auth.d.ts.
        // The determination of `isGoogleAccount` needs to be handled differently,
        // e.g., by adding a specific flag to Session["user"] in your NextAuth session callback
        // (based on token.accounts or token.provider in the JWT callback).
        // For now, this is a placeholder. If this function is critical for Google users
        // who have an existing session, this logic needs enhancement.
        const isGoogleAccount = false; // Placeholder - adjust if you have another way to determine this

        const baseState: RegistrationData = {
          ...initialRegistrationData,
          email: sessionUser.email, // email is required on Session["user"]
          firstName: sessionUser.firstName, // firstName is required
          lastName: sessionUser.lastName, // lastName is required
          phone: sessionUser.phone || "", // phone is optional (string | null | undefined)
        };

        // `sessionUser.profile` is not available on the Session["user"] type
        // as defined in your next-auth.d.ts.
        // Therefore, profile-specific fields (gender, birthDate, etc.)
        // cannot be pre-filled from sessionUser here. They will retain
        // their default values from initialRegistrationData.
        // If you need to pre-fill these, `sessionUser` (i.e., Session["user"]) needs to include
        // profile data. This requires updating `next-auth.d.ts` and your NextAuth `session` callback.
        /*
        // Example of how it would look IF profile was on sessionUser:
        if (sessionUser.profile) { // This would require sessionUser.profile to exist and be typed
          baseState = {
            ...baseState,
            // Ensure sessionUser.profile fields are accessed safely, e.g. sessionUser.profile.gender
            // gender: sessionUser.profile.gender || "",
            // birthDate: sessionUser.profile.birthDate
            //   ? new Date(sessionUser.profile.birthDate).toISOString().split("T")[0]
            //   : "",
            // maritalStatus: sessionUser.profile.maritalStatus || "",
            // height: sessionUser.profile.height ?? undefined,
            // occupation: sessionUser.profile.occupation || "",
            // education: sessionUser.profile.education || "",
          };
        }
        */

        // Case 1: Email not verified (specific to Email/Password users)
        if (
          sessionUser.status === UserStatus.PENDING_EMAIL_VERIFICATION &&
          !isGoogleAccount // This check depends on the accuracy of isGoogleAccount
        ) {
          return {
            ...baseState,
            isVerifyingEmailCode: true,
            emailForVerification: sessionUser.email,
            step: 1, // BasicInfo step leads to email verification
            isCompletingProfile: false,
            isGoogleSignup: false, // Consistent with isGoogleAccount being false here
          };
        }

        // Case 2: Profile not complete
        // This applies to users (Google or Email/Pass after email verification) needing to fill details.
        if (!sessionUser.isProfileComplete) {
          return {
            ...baseState,
            isCompletingProfile: true,
            isGoogleSignup: isGoogleAccount, // Reflects the placeholder value
            step: 2, // Start at PersonalDetailsStep
            isVerifyingEmailCode: false,
          };
        }

        // Case 3: Profile complete, but phone not verified
        if (sessionUser.isProfileComplete && !sessionUser.isPhoneVerified) {
          return {
            ...baseState,
            isCompletingProfile: true, // Still part of the overall "completion" journey
            isGoogleSignup: isGoogleAccount, // Reflects the placeholder value
            step: 4, // Go to CompleteStep, which should guide to phone verification
            isVerifyingEmailCode: false,
          };
        }

        console.warn(
          "[RegistrationContext] initializeFromSession called for a user who seems fully verified or in an unexpected state. Resetting to WelcomeStep."
        );
        return {
          ...initialRegistrationData,
          email: sessionUser.email, // Keep email at least
        };
      });
    },
    [setData] // initialRegistrationData is stable, UserStatus is an enum.
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
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      // After email verification, user typically needs to complete their profile.
      // isCompletingProfile could be set to true here if that's the immediate next phase.
      // The step determines which form is shown.
      isCompletingProfile: true, // Assuming profile completion follows.
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
    initializeFromSession,
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
