// src/app/components/auth/RegistrationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Gender, UserStatus, UserSource } from "@prisma/client";
import type { User as SessionUserType } from "@/types/next-auth";

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: Gender | ""; // "" for unselected, or actual Gender enum value
  birthDate: string;
  maritalStatus: string;
  height?: number;
  occupation?: string;
  education?: string;
  step: number;
  isGoogleSignup: boolean;
  isCompletingProfile: boolean;
  isVerifyingEmailCode: boolean;
  emailForVerification: string | null;
}

const initialRegistrationData: RegistrationData = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phone: "",
  gender: "", // Initialized as empty string
  birthDate: "",
  maritalStatus: "",
  height: undefined,
  occupation: "",
  education: "",
  step: 0,
  isGoogleSignup: false,
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

const RegistrationContext = createContext<RegistrationContextType>({
  data: initialRegistrationData,
  setData: () => console.warn("RegistrationProvider not found"),
  updateField: () => console.warn("RegistrationProvider not found"),
  nextStep: () => console.warn("RegistrationProvider not found"),
  prevStep: () => console.warn("RegistrationProvider not found"),
  goToStep: () => console.warn("RegistrationProvider not found"),
  resetForm: () => console.warn("RegistrationProvider not found"),
  setGoogleSignup: () => console.warn("RegistrationProvider not found"),
  initializeFromSession: () => console.warn("RegistrationProvider not found"),
  proceedToEmailVerification: () => console.warn("RegistrationProvider not found"),
  completeEmailVerification: () => console.warn("RegistrationProvider not found"),
  exitEmailVerification: () => console.warn("RegistrationProvider not found"),
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
      if (prev.isVerifyingEmailCode) return prev;
      const currentMaxStep = 3;
      if (prev.step === 1 && !prev.isCompletingProfile && !prev.isGoogleSignup) return prev;
      if (prev.step < currentMaxStep) return { ...prev, step: prev.step + 1 };
      if (prev.step === currentMaxStep) return { ...prev, step: 4 };
      return prev;
    });
  }, []);

  const prevStep = useCallback(() => {
    setData((prev) => {
      if (prev.isVerifyingEmailCode) {
        return { ...prev, isVerifyingEmailCode: false, emailForVerification: null, step: 1 };
      }
      if (prev.step > 0) {
        if (prev.step === 4) return { ...prev, step: 3 };
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
    (googleUserData: { email: string; firstName?: string; lastName?: string }) => {
      setData({
        ...initialRegistrationData,
        email: googleUserData.email,
        isGoogleSignup: true,
      });
    },
    []
  );

  const initializeFromSession = useCallback(
    (sessionUser: SessionUserType) => {
      // אנחנו משתמשים בצורת העדכון הפונקציונלית של setData
      // כדי לקבל גישה למצב הקודם של הקונטקסט (prevData).
      setData((prevData) => {
        const isGoogleAcc = !!(
          sessionUser.source === UserSource.REGISTRATION &&
          sessionUser.accounts?.some(acc => acc.provider === 'google')
        );

        // המרת מגדר מהסשן לטיפוס הנכון
        const sessionGender: Gender | "" = sessionUser.profile?.gender || "";

        // אובייקט זה תמיד יכיל את הנתונים המעודכנים ביותר מהסשן,
        // וישמש לעדכון שדות הטופס בקונטקסט.
        const baseStateFromSession = {
          email: sessionUser.email || "",
          firstName: sessionUser.firstName || "",
          lastName: sessionUser.lastName || "",
          phone: sessionUser.phone || "",
          gender: sessionGender,
          birthDate: sessionUser.profile?.birthDate
            ? new Date(sessionUser.profile.birthDate).toISOString().split("T")[0]
            : "",
          maritalStatus: sessionUser.profile?.maritalStatus || "",
          height: sessionUser.profile?.height ?? undefined,
          occupation: sessionUser.profile?.occupation || "",
          education: sessionUser.profile?.education || "",
        };

        // תרחיש 1: משתמש חדש עם אימייל/סיסמה צריך לאמת מייל.
        // זהו תחילתו של תהליך, ולכן זה בסדר לאפס את המצב לנקודת התחלה נקייה.
        if (
          sessionUser.status === UserStatus.PENDING_EMAIL_VERIFICATION &&
          !isGoogleAcc &&
          !sessionUser.isVerified
        ) {
          return {
            ...initialRegistrationData, // איפוס המצב
            ...baseStateFromSession,    // מילוי במידע הבסיסי מהסשן
            isVerifyingEmailCode: true,
            emailForVerification: sessionUser.email,
            step: 1,
            isCompletingProfile: false,
            isGoogleSignup: false,
          };
        }

        // תרחיש 2: המשתמש נכנס לתהליך השלמת פרופיל בפעם הראשונה
        // (למשל, אחרי התחברות עם גוגל, או אחרי אימות מייל).
        // גם זו התחלה של תהליך, ואיפוס המצב הוא תקין.
        if (!sessionUser.isProfileComplete) {
          return {
            ...initialRegistrationData, // איפוס המצב
            ...baseStateFromSession,    // מילוי במידע הבסיסי מהסשן
            isCompletingProfile: true,
            isGoogleSignup: isGoogleAcc,
            step: 2, // התחל משלב פרטים אישיים
            isVerifyingEmailCode: false,
          };
        }

        // תרחיש 3: הפרופיל הושלם, אך הטלפון עדיין לא אומת.
        // >>> זהו התיקון הקריטי <<<
        // מצב זה מתרחש אחרי שהמשתמש לחץ "שלח" ב-OptionalInfoStep.
        // כאן אסור לנו לאפס את נתוני הטופס.
        if (sessionUser.isProfileComplete && !sessionUser.isPhoneVerified) {
          return {
            ...prevData, // *** התיקון: שמור את נתוני הטופס הקיימים (גובה, עיסוק וכו') ***
            ...baseStateFromSession, // עדכן את השדות עם המידע העדכני ביותר מה-DB
            isCompletingProfile: true,
            isGoogleSignup: isGoogleAcc,
            step: 4, // זה יעביר נכון לרכיב CompleteStep
            isVerifyingEmailCode: false,
          };
        }
        
        // תרחיש ברירת מחדל: המשתמש מאומת אך לא מתאים לאף תרחיש "השלמה" ספציפי.
        // לדוגמה, בריענון עמוד. אנחנו רק רוצים לסנכרן את הקונטקסט עם הסשן
        // מבלי לאפס את כל המצב (כמו השלב הנוכחי בתהליך).
        return { 
            ...prevData, // שמור על המצב הקיים של הקונטקסט
            ...baseStateFromSession, // ועדכן אותו עם מידע טרי מהסשן
            isGoogleSignup: isGoogleAcc,
        };
      });
    },
    [] // התלויות ריקות כי setData מובטח להיות יציב ולא נעשה שימוש ב-state חיצוני אחר.
  );

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
  if (context === undefined || Object.keys(context).every(
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