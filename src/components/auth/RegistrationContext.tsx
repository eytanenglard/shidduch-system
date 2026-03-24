// src/components/auth/RegistrationContext.tsx

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  useCallback,
} from 'react';
import { Gender, UserStatus, UserSource, ReligiousJourney } from '@prisma/client';
import type { User as SessionUserType } from '@/types/next-auth';

// ============================================================================
// DEBUG UTILITY — prints only in development
// ============================================================================

const isDev = process.env.NODE_ENV === 'development';
const debugLog = (label: string, ...args: unknown[]) => {
  if (isDev) console.log(`[RegistrationContext][${label}]`, ...args);
};

// ============================================================================
// STEP CONSTANTS — replaces magic numbers throughout the codebase
// ============================================================================

export const STEPS = {
  WELCOME: 0,
  BASIC_INFO: 1,
  PERSONAL_DETAILS: 2,
  OPTIONAL_INFO: 3,
  COMPLETE: 4,
} as const;

export type StepNumber = (typeof STEPS)[keyof typeof STEPS];

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
  // Core user fields
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
  religiousJourney?: ReligiousJourney;
  origin: string;
  city: string;
  hasChildren: boolean;
  numberOfChildren?: number;
  termsAccepted: boolean;

  // State management fields
  step: StepNumber;
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
  religiousJourney: undefined,
  origin: '',
  city: '',
  hasChildren: false,
  numberOfChildren: undefined,
  termsAccepted: false,

  step: STEPS.WELCOME,
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
  goToStep: (step: StepNumber) => void;
  resetForm: () => void;
  setGoogleSignup: (googleUserData: {
    email: string;
    firstName?: string;
    lastName?: string;
  }) => void;
  initializeFromSession: (sessionUser: SessionUserType) => Promise<void>;
  proceedToEmailVerification: (email: string) => void;
  completeEmailVerification: () => void;
  exitEmailVerification: () => void;

  // Submission state management
  submission: SubmissionState;
  startSubmission: (
    status: SubmissionStatus,
    text: string,
    subtext?: string
  ) => void;
  updateSubmission: (
    status: SubmissionStatus,
    text: string,
    subtext?: string
  ) => void;
  endSubmission: (error?: boolean) => void;
}

// ============================================================================
// HELPER: Fetch full registration info from API
// ============================================================================

interface FullRegistrationInfo {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  termsAndPrivacyAcceptedAt?: string | null;
  profile?: {
    gender?: Gender;
    birthDate?: string;
    maritalStatus?: string;
    height?: number;
    occupation?: string;
    education?: string;
    religiousLevel?: string;
    religiousJourney?: ReligiousJourney;
    city?: string;
    origin?: string;
    hasChildrenFromPrevious?: boolean;
  };
}

async function fetchFullRegistrationInfo(): Promise<FullRegistrationInfo | null> {
  try {
    const response = await fetch('/api/auth/registration-info');
    if (!response.ok) {
      debugLog(
        'fetchFullRegistrationInfo',
        'API returned non-OK:',
        response.status
      );
      return null;
    }
    const data = await response.json();
    debugLog('fetchFullRegistrationInfo', 'Fetched:', data);
    return data;
  } catch (error) {
    debugLog('fetchFullRegistrationInfo', 'Error:', error);
    return null;
  }
}

// ============================================================================
// HELPER: Build base registration data from session + API
// ============================================================================

function buildBaseData(
  sessionUser: SessionUserType,
  fullInfo: FullRegistrationInfo | null,
  isGoogleAcc: boolean
): Partial<RegistrationData> {
  const baseFromSession: Partial<RegistrationData> = {
    email: sessionUser.email || '',
    firstName: sessionUser.firstName || '',
    lastName: sessionUser.lastName || '',
    phone: sessionUser.phone || '',
    isGoogleSignup: isGoogleAcc,
    gender: '',
    termsAccepted: false,
  };

  if (!fullInfo) return baseFromSession;

  const profile = fullInfo.profile || {};

  return {
    ...baseFromSession,
    email: fullInfo.email || baseFromSession.email,
    firstName: fullInfo.firstName || baseFromSession.firstName,
    lastName: fullInfo.lastName || baseFromSession.lastName,
    phone: fullInfo.phone || baseFromSession.phone,
    termsAccepted: !!fullInfo.termsAndPrivacyAcceptedAt,
    gender: profile.gender || '',
    birthDate: profile.birthDate
      ? new Date(profile.birthDate).toISOString().split('T')[0]
      : '',
    maritalStatus: profile.maritalStatus || '',
    height: profile.height ?? undefined,
    occupation: profile.occupation || '',
    education: profile.education || '',
    religiousLevel: profile.religiousLevel || '',
    religiousJourney: profile.religiousJourney || undefined,
    city: profile.city || '',
    origin: profile.origin || '',
    hasChildren: profile.hasChildrenFromPrevious || false,
  };
}

// ============================================================================
// HELPER: Determine initial state based on user status
// ============================================================================

function determineInitialState(
  mergedData: RegistrationData,
  sessionUser: SessionUserType,
  isGoogleAcc: boolean
): RegistrationData {
  // Scenario 1: Email verification required
  if (
    sessionUser.status === UserStatus.PENDING_EMAIL_VERIFICATION &&
    !isGoogleAcc &&
    !sessionUser.isVerified
  ) {
    debugLog('determineInitialState', 'Scenario 1: Email verification needed');
    return {
      ...mergedData,
      isVerifyingEmailCode: true,
      emailForVerification: mergedData.email,
      step: STEPS.BASIC_INFO,
      isCompletingProfile: false,
      isGoogleSignup: false,
    };
  }

  // Scenario 2: Profile completion required
  if (!sessionUser.isProfileComplete) {
    debugLog('determineInitialState', 'Scenario 2: Profile completion needed');
    return {
      ...mergedData,
      isCompletingProfile: true,
      isGoogleSignup: isGoogleAcc,
      step: STEPS.PERSONAL_DETAILS,
      isVerifyingEmailCode: false,
    };
  }

  // Scenario 3: User is fully set up
  debugLog('determineInitialState', 'Scenario 3: User fully set up');
  return {
    ...mergedData,
    isGoogleSignup: isGoogleAcc,
  };
}

// ============================================================================
// DRAFT PERSISTENCE — saves form progress to localStorage
// ============================================================================

const DRAFT_KEY = 'neshamatech_registration_draft';
const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const PERSISTABLE_FIELDS: (keyof RegistrationData)[] = [
  'firstName', 'lastName', 'phone', 'gender', 'birthDate',
  'maritalStatus', 'height', 'occupation', 'education',
  'religiousLevel', 'origin', 'city', 'hasChildren', 'numberOfChildren',
];

function saveDraft(data: RegistrationData): void {
  try {
    const draft: Record<string, unknown> = {};
    for (const field of PERSISTABLE_FIELDS) {
      if (data[field] !== undefined && data[field] !== '' && data[field] !== null) {
        draft[field] = data[field];
      }
    }
    if (Object.keys(draft).length === 0) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      data: draft,
      savedAt: Date.now(),
    }));
  } catch {
    // Silently fail (private browsing, storage full, etc.)
  }
}

function loadDraft(): Partial<RegistrationData> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    debugLog('loadDraft', 'Loaded draft from localStorage');
    return parsed.data as Partial<RegistrationData>;
  } catch {
    return null;
  }
}

/** Clear the registration draft — call on successful submit */
export function clearRegistrationDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
    debugLog('clearRegistrationDraft', 'Draft cleared');
  } catch {
    // Silently fail
  }
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
    setData((prev) => ({ ...prev, step: (prev.step + 1) as StepNumber }));
  }, []);

  const prevStep = useCallback(() => {
    setData((prev) => ({
      ...prev,
      step: (prev.step > 0 ? prev.step - 1 : 0) as StepNumber,
    }));
  }, []);

  const goToStep = useCallback((stepNum: StepNumber) => {
    setData((prev) => ({ ...prev, step: stepNum }));
  }, []);

  const resetForm = useCallback(() => {
    debugLog('resetForm', 'Resetting form and submission state');
    clearRegistrationDraft();
    setData(initialRegistrationData);
    setSubmission(initialSubmissionState);
  }, []);

  const setGoogleSignup = useCallback(
    (googleUserData: {
      email: string;
      firstName?: string;
      lastName?: string;
    }) => {
      // Merge with existing data instead of replacing everything
      setData((prev) => ({
        ...prev,
        email: googleUserData.email || prev.email,
        firstName: googleUserData.firstName || prev.firstName,
        lastName: googleUserData.lastName || prev.lastName,
        isGoogleSignup: true,
      }));
    },
    []
  );

  // ============================================================================
  // SESSION INITIALIZATION — clean async flow
  // ============================================================================

  const initializeFromSession = useCallback(
    async (sessionUser: SessionUserType) => {
      debugLog('initializeFromSession', 'Starting with user:', {
        email: sessionUser.email,
        isProfileComplete: sessionUser.isProfileComplete,
        status: sessionUser.status,
      });

      const isGoogleAcc = !!(
        sessionUser.source === UserSource.REGISTRATION &&
        sessionUser.accounts?.some((acc) => acc.provider === 'google')
      );

      // 1. Fetch full data from API
      const fullInfo = await fetchFullRegistrationInfo();

      // 2. Build base data from session + API response
      const baseData = buildBaseData(sessionUser, fullInfo, isGoogleAcc);

      // 2.5. Load draft from localStorage (lower priority than API data)
      const draft = loadDraft();

      // 3. Update state with merged data + business logic
      // Priority: API data > draft > existing state > defaults
      setData((prevData) => {
        const mergedData: RegistrationData = {
          ...initialRegistrationData,
          ...prevData,
          ...(draft || {}),
          ...baseData,
        };

        return determineInitialState(mergedData, sessionUser, isGoogleAcc);
      });
    },
    []
  );

  // ============================================================================
  // EMAIL VERIFICATION HANDLERS
  // ============================================================================

  const proceedToEmailVerification = useCallback((emailToVerify: string) => {
    debugLog('proceedToEmailVerification', emailToVerify);
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: true,
      emailForVerification: emailToVerify,
    }));
  }, []);

  const completeEmailVerification = useCallback(() => {
    debugLog('completeEmailVerification', 'Email verified, moving to profile');
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      isCompletingProfile: true,
      step: STEPS.PERSONAL_DETAILS,
    }));
  }, []);

  const exitEmailVerification = useCallback(() => {
    debugLog('exitEmailVerification', 'Going back to basic info');
    setData((prev) => ({
      ...prev,
      isVerifyingEmailCode: false,
      emailForVerification: null,
      step: STEPS.BASIC_INFO,
    }));
  }, []);

  // ============================================================================
  // SUBMISSION STATE HANDLERS
  // ============================================================================

  const startSubmission = useCallback(
    (status: SubmissionStatus, text: string, subtext?: string) => {
      setSubmission({
        isSubmitting: true,
        status,
        loadingText: text,
        loadingSubtext: subtext,
      });
    },
    []
  );

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
  // AUTO-SAVE DRAFT (debounced, 1s)
  // ============================================================================

  const saveDraftTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only save when user is actively filling a form (not on initial render)
    if (data.step === STEPS.WELCOME && !data.isCompletingProfile) return;

    if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
    saveDraftTimerRef.current = setTimeout(() => {
      saveDraft(data);
    }, 1000);

    return () => {
      if (saveDraftTimerRef.current) clearTimeout(saveDraftTimerRef.current);
    };
  }, [data]);

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
