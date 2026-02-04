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

// ============================================================================
// TYPES
// ============================================================================

export type SubmissionStatus =
  | 'idle'
  | 'acceptingTerms'
  | 'savingProfile'
  | 'uploadingPhotos'
  | 'sendingCode'
  | 'redirecting'
  | 'error';

export interface SubmissionState {
  isSubmitting: boolean;
  status: SubmissionStatus;
  loadingText: string;
  loadingSubtext?: string;
}

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

  // שדות UI
    origin: string; // ✨ הוסף שורה זו

  city: string;
  hasChildren: boolean;
  numberOfChildren: string;
  profession: string; // שים לב: ב-DB זה occupation, נמפה את זה כאן
  termsAccepted: boolean;

  // שדות ניהול מצב
  step: number;
  isGoogleSignup: boolean;
  language: 'he' | 'en';
  isCompletingProfile: boolean;
  isVerifyingEmailCode: boolean;
  emailForVerification: string | null;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

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
    origin: '', // ✨ הוסף שורה זו

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

const initialSubmissionState: SubmissionState = {
  isSubmitting: false,
  status: 'idle',
  loadingText: '',
  loadingSubtext: undefined,
};

// ============================================================================
// CONTEXT TYPE
// ============================================================================

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
  initializeFromSession: (sessionUser: SessionUserType) => Promise<void>; // שונה ל-Promise
  proceedToEmailVerification: (email: string) => void;
  completeEmailVerification: () => void;
  exitEmailVerification: () => void;

  // Submission state management
  submission: SubmissionState;
  startSubmission: (text: string, subtext?: string) => void;
  updateSubmission: (
    status: SubmissionStatus,
    text: string,
    subtext?: string
  ) => void;
  endSubmission: (error?: boolean) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const RegistrationContext = createContext<RegistrationContextType | undefined>(
  undefined
);

export const RegistrationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<RegistrationData>(initialRegistrationData);
  const [submission, setSubmission] = useState<SubmissionState>(
    initialSubmissionState
  );

  // ============================================================================
  // FORM FIELD HANDLERS
  // ============================================================================

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
    setSubmission(initialSubmissionState);
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

  // ============================================================================
  // SESSION INITIALIZATION (UPDATED & ASYNC)
  // ============================================================================

  const initializeFromSession = useCallback(
    async (sessionUser: SessionUserType) => {
      // 1. אתחול בסיסי עם מה שיש בסשן המצומצם (כדי שהUI יגיב מיד)
      const isGoogleAcc = !!(
        sessionUser.source === UserSource.REGISTRATION &&
        sessionUser.accounts?.some((acc) => acc.provider === 'google')
      );

      let baseData: Partial<RegistrationData> = {
        email: sessionUser.email || '',
        firstName: sessionUser.firstName || '',
        lastName: sessionUser.lastName || '',
        phone: sessionUser.phone || '',
        isGoogleSignup: isGoogleAcc,
        // ברירות מחדל למקרה שה-API ייכשל
        gender: '',
        termsAccepted: false,
      };

      try {
        // 2. קריאה ל-API החדש כדי לקבל את נתוני הפרופיל המלאים
        // זה פותר את בעיית ה-Cookie הגדול מדי
        const response = await fetch('/api/auth/registration-info');

        if (response.ok) {
          const fullUser = await response.json();
          const profile = fullUser.profile || {};

          console.log('Fetched full registration info:', fullUser);

          baseData = {
            ...baseData,
            // נתונים מהיוזר הראשי
            email: fullUser.email || baseData.email,
            firstName: fullUser.firstName || baseData.firstName,
            lastName: fullUser.lastName || baseData.lastName,
            phone: fullUser.phone || baseData.phone,
            termsAccepted: !!fullUser.termsAndPrivacyAcceptedAt,

            // נתונים מהפרופיל
            gender: profile.gender || '',
            birthDate: profile.birthDate
              ? new Date(profile.birthDate).toISOString().split('T')[0]
              : '',
            maritalStatus: profile.maritalStatus || '',
            height: profile.height ?? undefined,
            occupation: profile.occupation || '',
            education: profile.education || '',
            religiousLevel: profile.religiousLevel || '',
            city: profile.city || '',
            origin: profile.origin || '', // ✨ הוסף שורה זו

            // מיפוי שדות מותאם אישית
            profession: profile.occupation || '', // שימוש ב-occupation כשדה profession
            hasChildren: profile.hasChildrenFromPrevious || false,
            numberOfChildren: '', // אין שדה כזה ב-DB, מאתחלים לריק
          };
        } else {
          console.warn(
            'Failed to fetch registration info from API, falling back to basic session data'
          );
        }
      } catch (error) {
        console.error('Error fetching registration info:', error);
      }

      // 3. עדכון ה-State עם הנתונים הממוזגים והלוגיקה העסקית
      setData((prevData) => {
        const mergedData = {
          ...initialRegistrationData,
          ...prevData,
          ...baseData,
        };

        // תרחיש 1: אימות אימייל נדרש
        if (
          sessionUser.status === UserStatus.PENDING_EMAIL_VERIFICATION &&
          !isGoogleAcc &&
          !sessionUser.isVerified
        ) {
          return {
            ...mergedData,
            isVerifyingEmailCode: true,
            emailForVerification: mergedData.email,
            step: 1,
            isCompletingProfile: false,
            isGoogleSignup: false,
          };
        }

        // תרחיש 2: השלמת פרופיל נדרשת
        if (!sessionUser.isProfileComplete) {
          return {
            ...mergedData,
            isCompletingProfile: true,
            isGoogleSignup: isGoogleAcc,
            step: 2,
            isVerifyingEmailCode: false,
          };
        }

        // משתמש קיים ותקין
        return {
          ...mergedData,
          isGoogleSignup: isGoogleAcc,
        };
      });
    },
    []
  );

  // ============================================================================
  // EMAIL VERIFICATION HANDLERS
  // ============================================================================

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

  // ============================================================================
  // SUBMISSION STATE HANDLERS
  // ============================================================================

  const startSubmission = useCallback((text: string, subtext?: string) => {
    setSubmission({
      isSubmitting: true,
      status: 'savingProfile',
      loadingText: text,
      loadingSubtext: subtext,
    });
  }, []);

  const updateSubmission = useCallback(
    (status: SubmissionStatus, text: string, subtext?: string) => {
      setSubmission((prev) => ({
        ...prev,
        status,
        loadingText: text,
        loadingSubtext: subtext,
      }));
    },
    []
  );

  const endSubmission = useCallback((error?: boolean) => {
    setSubmission({
      isSubmitting: false,
      status: error ? 'error' : 'idle',
      loadingText: '',
      loadingSubtext: undefined,
    });
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

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
    // Submission
    submission,
    startSubmission,
    updateSubmission,
    endSubmission,
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
