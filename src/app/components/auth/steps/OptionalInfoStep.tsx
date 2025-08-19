// src/app/components/auth/steps/OptionalInfoStep.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  ArrowRight,
  Ruler,
  Briefcase,
  GraduationCap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

type SubmissionStatus =
  | 'idle'
  | 'savingProfile'
  | 'updatingSession'
  | 'sendingCode'
  | 'error';

const OptionalInfoStep: React.FC = () => {
  const { data, updateField, prevStep } = useRegistration();
  const router = useRouter();
  const { update: updateSessionHook, status: sessionStatus } = useSession();

  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    console.log(
      `[OptionalInfoStep] handleSubmit triggered. Current session status: ${sessionStatus}, RegistrationContext data:`,
      JSON.stringify(data, null, 2)
    );
    setSubmissionStatus('savingProfile');
    setError(null);

    try {
      const profileData = {
        // חשוב לוודא ששולחים את כל השדות שה-API מצפה להם, במיוחד firstName ו-lastName
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone, // ודא ש-data.phone מכיל ערך תקין מהשלב הקודם
        gender: data.gender, // ודא ש-data.gender מכיל ערך תקין
        birthDate: data.birthDate, // ודא ש-data.birthDate מכיל ערך תקין
        maritalStatus: data.maritalStatus, // ודא ש-data.maritalStatus מכיל ערך תקין
        height: data.height,
        occupation: data.occupation,
        education: data.education,
      };

      // בדיקה נוספת של הנתונים לפני השליחה
      if (
        !profileData.firstName ||
        !profileData.lastName ||
        !profileData.phone ||
        !profileData.gender ||
        !profileData.birthDate ||
        !profileData.maritalStatus
      ) {
        console.error(
          '[OptionalInfoStep] ERROR: Missing required profile data before sending to API. Data:',
          JSON.stringify(profileData, null, 2)
        );
        setError(
          'חסרים נתונים חיוניים להשלמת הפרופיל. אנא חזור לשלב הקודם ובדוק את הפרטים.'
        );
        setSubmissionStatus('error');
        return;
      }

      console.log(
        '[OptionalInfoStep] Submitting profile data to /api/auth/complete-profile:',
        JSON.stringify(profileData, null, 2)
      );

      const profileResponse = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
        credentials: 'include', // חשוב אם ה-API שלך מסתמך על עוגיות סשן
      });

      const profileResultText = await profileResponse.text();
      console.log(
        `[OptionalInfoStep] Raw response from /api/auth/complete-profile (Status: ${profileResponse.status}):`,
        profileResultText
      );

      if (!profileResponse.ok) {
        let errorMessage = `שגיאה ${profileResponse.status}`;
        try {
          const errorData = JSON.parse(profileResultText);
          errorMessage =
            errorData.error ||
            errorData.message || // נסה גם message
            `שגיאה ${profileResponse.status}: נתונים לא תקינים או בעיית שרת.`;
          console.error(
            '[OptionalInfoStep] API Error (complete-profile):',
            errorData
          );
        } catch (parseError) {
          errorMessage = `שגיאה ${profileResponse.status}: ${profileResponse.statusText}. Response: ${profileResultText}`;
          console.error(
            '[OptionalInfoStep] Failed to parse error JSON from /api/auth/complete-profile:',
            parseError
          );
        }
        throw new Error(errorMessage);
      }

      let profileResult;
      try {
        profileResult = JSON.parse(profileResultText);
      } catch (e) {
        console.error(
          '[OptionalInfoStep] Failed to parse success JSON from /api/auth/complete-profile. Text was:',
          profileResultText,
          'Error:',
          e
        );
        throw new Error('תגובה לא תקינה מהשרת לאחר שמירת פרופיל (לא JSON).');
      }

      console.log(
        '[OptionalInfoStep] Profile data saved successfully via API. API Response:',
        JSON.stringify(profileResult, null, 2)
      );

      if (profileResult?.user?.isProfileComplete !== true) {
        console.warn(
          '[OptionalInfoStep] WARNING: API /api/auth/complete-profile did NOT return user.isProfileComplete as true in its response. User object from API:',
          JSON.stringify(profileResult?.user, null, 2)
        );
        // זה לא בהכרח אומר שה-DB לא התעדכן, אבל זה מצביע על חוסר עקביות בתגובת ה-API או שה-API לא עדכן את הדגל.
      }

      console.log(
        "[OptionalInfoStep] Setting status to 'updatingSession' and calling updateSessionHook()..."
      );
      setSubmissionStatus('updatingSession');
      await updateSessionHook(); // גורם ל-NextAuth לרענן את הטוקן/סשן. ה-JWT callback בשרת יקרא מה-DB.
      console.log(
        '[OptionalInfoStep] updateSessionHook() presumably completed. The session and token should now be refreshed based on DB state.'
      );

      console.log(
        "[OptionalInfoStep] Setting status to 'sendingCode' and attempting to send phone verification code..."
      );
      setSubmissionStatus('sendingCode');

      const sendCodeResponse = await fetch('/api/auth/send-phone-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // גם אם אין body, header זה עדיין טוב
        // body: JSON.stringify({}), // אם ה-API דורש גוף כלשהו, אפשר לשלוח אובייקט ריק
        credentials: 'include',
      });
      const sendCodeResultText = await sendCodeResponse.text();
      console.log(
        `[OptionalInfoStep] Raw response from /api/auth/send-phone-code (Status: ${sendCodeResponse.status}):`,
        sendCodeResultText
      );

      if (!sendCodeResponse.ok) {
        let errorMessage = `שגיאה ${sendCodeResponse.status}`;
        try {
          const errorData = JSON.parse(sendCodeResultText);
          errorMessage =
            errorData.error ||
            errorData.message ||
            `שגיאה ${sendCodeResponse.status} בשליחת קוד אימות.`;
        } catch (e) {
          errorMessage = `שגיאה ${sendCodeResponse.status}: ${sendCodeResponse.statusText}. Response: ${sendCodeResultText}`;
          console.error(
            '[OptionalInfoStep] Failed to parse error JSON from /api/auth/send-phone-code:',
            e
          );
        }
        throw new Error(errorMessage);
      }

      let sendCodeResult;
      try {
        sendCodeResult = JSON.parse(sendCodeResultText);
      } catch (e) {
        console.error(
          '[OptionalInfoStep] Failed to parse success JSON from /api/auth/send-phone-code. Text was:',
          sendCodeResultText,
          'Error:',
          e
        );
        throw new Error('תגובה לא תקינה מהשרת לאחר שליחת קוד טלפון (לא JSON).');
      }

      console.log(
        '[OptionalInfoStep] Verification code sent successfully via API. API Response:',
        JSON.stringify(sendCodeResult, null, 2)
      );

      console.log(
        '[OptionalInfoStep] Successfully sent phone code. Navigating to /auth/verify-phone...'
      );
      // בשלב זה, הטוקן בעוגיה אמור להיות מעודכן עם isProfileComplete: true (לאחר ה-updateSessionHook).
      // ה-Middleware שיפעל עם הניווט יראה את הטוקן המעודכן.
      router.push('/auth/verify-phone');
    } catch (err) {
      console.error(
        '[OptionalInfoStep] Error during handleSubmit:',
        err instanceof Error ? err.stack : err // הדפס את ה-stack trace המלא אם זמין
      );
      setError(err instanceof Error ? err.message : 'אירעה שגיאה לא צפויה');
      setSubmissionStatus('error');
    }
    // אין צורך ב-finally להחזיר סטטוס ל-idle אם יש ניווט,
    // כי הקומפוננטה תעשה unmount.
    // אם נשארים בדף עקב שגיאה, הכפתור צריך להיות פעיל שוב (הסטטוס 'error' יאפשר זאת).
  };

  const getButtonText = (): string => {
    switch (submissionStatus) {
      case 'savingProfile':
        return 'שומר פרטים...';
      case 'updatingSession':
        return 'מעדכן סשן...';
      case 'sendingCode':
        return 'שולח קוד אימות...';
      case 'error': // במקרה של שגיאה, חזור לטקסט המקורי כדי לאפשר ניסיון חוזר
      case 'idle':
      default:
        // הטקסט הדינמי המקורי היה: data.isCompletingProfile ? "סיום והמשך לאימות" : "סיום והרשמה";
        // מכיוון שאנחנו ב-OptionalInfoStep, סביר להניח ש-isCompletingProfile יהיה true מהקונטקסט.
        return 'סיום והמשך לאימות';
    }
  };

  const isSubmitting =
    submissionStatus === 'savingProfile' ||
    submissionStatus === 'updatingSession' ||
    submissionStatus === 'sendingCode';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-xl font-bold text-gray-800 mb-1"
        variants={itemVariants}
      >
        מידע נוסף
      </motion.h2>
      <motion.p className="text-gray-600 text-sm mb-4" variants={itemVariants}>
        מידע זה יעזור לנו להתאים לך שידוכים מדויקים יותר. מומלץ למלא כמה שיותר
        פרטים.
      </motion.p>

      {error && submissionStatus === 'error' && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive" className="mb-4" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="space-y-4">
        {/* Height Field */}
        <div className="space-y-1">
          <label
            htmlFor="heightOptional"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <Ruler className="h-4 w-4 text-gray-400" />
            גובה (בסמ)
          </label>
          <Input
            type="number"
            id="heightOptional"
            min="120"
            max="220"
            value={data.height ?? ''} // השתמש ב- ?? "" כדי למנוע uncontrolled input אם הערך הוא undefined
            onChange={(e) =>
              updateField(
                'height',
                e.target.value === '' // אם השדה ריק, שלח undefined
                  ? undefined
                  : parseInt(e.target.value, 10) || undefined // אם לא ניתן להמיר למספר, שלח undefined
              )
            }
            placeholder="לדוגמה: 175"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none disabled:bg-gray-100"
            disabled={isSubmitting}
          />
        </div>

        {/* Occupation Field */}
        <div className="space-y-1">
          <label
            htmlFor="occupationOptional"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <Briefcase className="h-4 w-4 text-gray-400" />
            עיסוק
          </label>
          <Input
            type="text"
            id="occupationOptional"
            value={data.occupation ?? ''}
            onChange={(e) =>
              updateField('occupation', e.target.value || undefined)
            } // אם ריק, שלח undefined
            placeholder="לדוגמה: מהנדס תוכנה, מורה, סטודנט/ית"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none disabled:bg-gray-100"
            disabled={isSubmitting}
          />
        </div>

        {/* Education Field */}
        <div className="space-y-1">
          <label
            htmlFor="educationOptional"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <GraduationCap className="h-4 w-4 text-gray-400" />
            השכלה
          </label>
          <Input
            type="text"
            id="educationOptional"
            value={data.education ?? ''}
            onChange={(e) =>
              updateField('education', e.target.value || undefined)
            } // אם ריק, שלח undefined
            placeholder="לדוגמה: תואר ראשון במדעי המחשב"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none disabled:bg-gray-100"
            disabled={isSubmitting}
          />
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-6"
      >
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="flex items-center gap-2 border-gray-300"
          disabled={isSubmitting}
        >
          <ArrowRight className="h-4 w-4" />
          חזרה
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 flex items-center gap-2 min-w-[200px] justify-center px-4 py-2.5 disabled:opacity-70" // שיניתי קצת את העיצוב שיתאים לכפתורים אחרים
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />{' '}
              {/* התאמתי גודל אייקון */}
              <span>{getButtonText()}</span>
            </>
          ) : (
            <>
              <span>{getButtonText()}</span>
              <ArrowLeft className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default OptionalInfoStep;
