// src/components/auth/RegistrationContext.tsx - CORRECTED LOGIC

'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { Gender, UserStatus, UserSource } from '@prisma/client';
import type { User as SessionUserType } from '@/types/next-auth';

// ... (interface RegistrationData and initialRegistrationData remain the same) ...

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: Gender | '';
  birthDate: string;
  maritalStatus: string;
  height?: number;
  occupation?: string;
  education?: string;
  step: number;
  isGoogleSignup: boolean;
  language: 'he' | 'en'; 
  isCompletingProfile: boolean;
  isVerifyingEmailCode: boolean;
  emailForVerification: string | null;
    religiousLevel?: string; // הוסף את השדה כאן

}

const initialRegistrationData: RegistrationData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  gender: '',
  birthDate: '',
  maritalStatus: '',
  height: undefined,
  occupation: '',
  education: '',
    religiousLevel: '', // ערך התחלתי ריק

  step: 0,
  isGoogleSignup: false,
  language: 'he',
  isCompletingProfile: false,
  isVerifyingEmailCode: false,
  emailForVerification: null,
};

// ... (interface RegistrationContextType remains the same) ...
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
  initializeFromSession: (sessionUser: SessionUserType) => void;
  proceedToEmailVerification: (email: string) => void;
  completeEmailVerification: () => void;
  exitEmailVerification: () => void;
}


const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<RegistrationData>(initialRegistrationData);

  // ... (updateField, nextStep, prevStep, etc. remain the same) ...
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
    setData((prev) => ({ ...prev, step: prev.step + 1 }));
  }, []);

  const prevStep = useCallback(() => {
    setData((prev) => ({ ...prev, step: prev.step > 0 ? prev.step - 1 : 0 }));
  }, []);

  const goToStep = useCallback((stepNum: number) => {
    setData((prev) => ({ ...prev, step: stepNum }));
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
        isGoogleSignup: true,
      });
    },
    []
  );
  
  const initializeFromSession = useCallback((sessionUser: SessionUserType) => {
    setData((prevData) => {
      const isGoogleAcc = !!(
        sessionUser.source === UserSource.REGISTRATION &&
        sessionUser.accounts?.some((acc) => acc.provider === 'google')
      );

      const sessionGender: Gender | '' = sessionUser.profile?.gender || '';

      const baseStateFromSession = {
        email: sessionUser.email || '',
        firstName: sessionUser.firstName || '',
        lastName: sessionUser.lastName || '',
        phone: sessionUser.phone || '',
        gender: sessionGender,
        birthDate: sessionUser.profile?.birthDate
          ? new Date(sessionUser.profile.birthDate).toISOString().split('T')[0]
          : '',
        maritalStatus: sessionUser.profile?.maritalStatus || '',
        height: sessionUser.profile?.height ?? undefined,
        occupation: sessionUser.profile?.occupation || '',
        education: sessionUser.profile?.education || '',
      };

      // Scenario 1: New user needs to verify email (non-Google)
      if (
        sessionUser.status === UserStatus.PENDING_EMAIL_VERIFICATION &&
        !isGoogleAcc &&
        !sessionUser.isVerified
      ) {
        return {
          ...initialRegistrationData,
          ...baseStateFromSession,
          isVerifyingEmailCode: true,
          emailForVerification: sessionUser.email,
          step: 1, // Stay on a step that can render the verification component
          isCompletingProfile: false,
          isGoogleSignup: false,
        };
      }

      // ============================ FIX STARTS HERE ============================
      // Scenario 2: User needs to start the profile completion process.
      // The redirect logic for `isPhoneVerified: false` is now in RegisterClient,
      // so this block can focus only on starting the process.
      if (!sessionUser.isProfileComplete) {
        return {
          ...initialRegistrationData,
          ...baseStateFromSession,
          isCompletingProfile: true,
          isGoogleSignup: isGoogleAcc,
          step: 2, // Always start at the combined personal details step
          isVerifyingEmailCode: false,
        };
      }
      
      // If code reaches here, it means profile is complete.
      // The RegisterClient's useEffect will handle redirection to either
      // verify-phone or the main profile. We just need to sync data.
      return {
        ...prevData,
        ...baseStateFromSession,
        isGoogleSignup: isGoogleAcc,
      };
      // ============================= FIX ENDS HERE =============================
    });
  }, []);

  const proceedToEmailVerification = useCallback((emailToVerify: string) => {
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: true,
      emailForVerification: emailToVerify,
    }));
  }, []);

  const completeEmailVerification = useCallback(() => {
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      isCompletingProfile: true,
      step: 2,
    }));
  }, []);

  const exitEmailVerification = useCallback(() => {
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      step: 1,
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
  if (context === undefined) {
    throw new Error(
      'useRegistration must be used within a RegistrationProvider'
    );
  }
  return context;
};