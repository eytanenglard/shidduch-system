// src/components/auth/RegistrationContext.tsx

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
  religiousLevel?: string;
  
  // שדות חדשים שהוספו לתיקון השגיאות
  city: string;
  hasChildren: boolean;
  numberOfChildren: string;
  profession: string;
  termsAccepted: boolean;

  // שדות ניהול מצב
  step: number;
  isGoogleSignup: boolean;
  language: 'he' | 'en'; 
  isCompletingProfile: boolean;
  isVerifyingEmailCode: boolean;
  emailForVerification: string | null;
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
  religiousLevel: '',

  // אתחול שדות חדשים
  city: '',
  hasChildren: false,
  numberOfChildren: '',
  profession: '',
  termsAccepted: false,

  step: 0,
  isGoogleSignup: false,
  language: 'he',
  isCompletingProfile: false,
  isVerifyingEmailCode: false,
  emailForVerification: null,
};

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

      // המרת נתונים מהסשן למבנה הנתונים של הטופס
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
        
        // מיפוי שדות חדשים מהפרופיל (אם קיימים בטיפוס של הסשן, אחרת ברירת מחדל)
        city: (sessionUser.profile as any)?.city || '',
        profession: (sessionUser.profile as any)?.profession || '',
        numberOfChildren: (sessionUser.profile as any)?.numberOfChildren || '',
        hasChildren: (sessionUser.profile as any)?.hasChildren || false,
        termsAccepted: !!sessionUser.termsAndPrivacyAcceptedAt,
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
          step: 1,
          isCompletingProfile: false,
          isGoogleSignup: false,
        };
      }

      // Scenario 2: User needs to start the profile completion process.
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
      return {
        ...prevData,
        ...baseStateFromSession,
        isGoogleSignup: isGoogleAcc,
      };
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