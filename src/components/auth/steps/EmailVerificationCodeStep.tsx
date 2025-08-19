// src/app/components/auth/steps/EmailVerificationCodeStep.tsx
'use client';

import { useState, useRef, KeyboardEvent, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react'; // נשאר רק signIn, useSession לא בשימוש ישיר כאן
import { useRegistration } from '../RegistrationContext';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, MailCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';

const OTP_LENGTH = 6;

const EmailVerificationCodeStep: React.FC = () => {
  const {
    data: registrationData,
    exitEmailVerification: goBackToBasicInfo,
    completeEmailVerification, // הוספת הפונקציה מהקונטקסט
  } = useRegistration();

  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');

    if (value.length > 1 && index < OTP_LENGTH) {
      const chars = value.split('');
      let currentIdx = index;
      const newOtp = [...otp];

      for (
        let i = 0;
        i < chars.length && currentIdx < OTP_LENGTH;
        i++, currentIdx++
      ) {
        newOtp[currentIdx] = chars[i];
      }
      setOtp(newOtp);
      const nextFocusIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
      if (inputRefs.current[nextFocusIndex] && chars.length > 0) {
        setTimeout(() => inputRefs.current[nextFocusIndex]?.focus(), 0);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otp];
      if (newOtp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1]?.focus();
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== OTP_LENGTH) {
      setApiError(`הקוד חייב להכיל ${OTP_LENGTH} ספרות.`);
      return;
    }

    setIsLoading(true);
    setApiError(null);
    setResendMessage(null);

    try {
      // 1. Verify the code with the backend
      console.log(
        'CLIENT LOG: Submitting OTP to API. Email:',
        registrationData.emailForVerification
      );
      const response = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registrationData.emailForVerification,
          code: enteredCode,
        }),
      });

      const result = await response.json();
      console.log('CLIENT LOG: API response for /verify-email-code:', result);

      if (!response.ok || !result.success || !result.authToken) {
        throw new Error(
          result.error || 'שגיאה באימות הקוד מה-API או שלא הוחזר טוקן התחברות.'
        );
      }

      const authToken = result.authToken;
      console.log(
        'CLIENT LOG: Email code verified with API. AuthToken received. Attempting auto-signin...'
      );

      // 2. Attempt auto-signin with the received authToken
      const signInResult = await signIn('email-verified-autologin', {
        authToken: authToken,
        redirect: false, // חשוב! אנחנו נטפל בהפניה ידנית
      });

      console.log('CLIENT LOG: Auto-signin attempt result:', signInResult);

      if (signInResult?.ok) {
        // ההתחברות האוטומטית הצליחה, והסשן נוצר/עודכן
        console.log(
          'CLIENT LOG: Auto-signin successful. Calling completeEmailVerification and navigating to /auth/register.'
        );
        completeEmailVerification(); // <-- קריאה לפונקציה מהקונטקסט
        router.push('/auth/register');
        // אין צורך לקרוא ל-setIsLoading(false) כאן כי הקומפוננטה תעשה unmount
      } else {
        // ההתחברות האוטומטית נכשלה
        console.error('CLIENT LOG: Auto-signin failed.', signInResult?.error);
        setApiError(
          `אימות המייל הצליח, אך נתקלנו בבעיה בהתחברות האוטומטית: ${
            signInResult?.error || 'שגיאה לא ידועה'
          }. אנא נסה להתחבר ידנית.`
        );
        setIsLoading(false); // אפשר למשתמש לנסות שוב או לנקוט פעולה אחרת
      }
    } catch (error) {
      console.error(
        'CLIENT LOG: Error during email verification process or auto-signin:',
        error
      );
      setApiError(
        error instanceof Error
          ? error.message
          : 'אירעה שגיאה בלתי צפויה בתהליך האימות'
      );
      setOtp(new Array(OTP_LENGTH).fill(''));
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus();
      }
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setApiError(null);
    setResendMessage(null);

    try {
      console.log(
        'CLIENT LOG: Requesting to resend verification code for email:',
        registrationData.emailForVerification
      );
      const response = await fetch('/api/auth/resend-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registrationData.emailForVerification }),
      });
      const result = await response.json();
      console.log(
        'CLIENT LOG: API response for /resend-verification-code:',
        result
      );

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'שגיאה בשליחה חוזרת של הקוד');
      }
      setResendMessage(result.message || 'קוד חדש נשלח בהצלחה.');
      setOtp(new Array(OTP_LENGTH).fill(''));
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('CLIENT LOG: Error during resend code:', error);
      setApiError(
        error instanceof Error ? error.message : 'אירעה שגיאה בשליחה חוזרת'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pasteData = e.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, OTP_LENGTH);

    if (pasteData.length > 0) {
      e.preventDefault();
      const newOtp = new Array(OTP_LENGTH).fill('');
      for (let i = 0; i < pasteData.length; i++) {
        newOtp[i] = pasteData[i];
      }
      setOtp(newOtp);
      const focusIndex = Math.min(pasteData.length, OTP_LENGTH - 1);
      if (inputRefs.current[focusIndex]) {
        setTimeout(() => inputRefs.current[focusIndex]?.focus(), 0);
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      className="space-y-6 text-center p-4 sm:p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <MailCheck className="h-12 w-12 text-cyan-500 mx-auto mb-3" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          אימות כתובת מייל
        </h2>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          שלחנו קוד אימות בן {OTP_LENGTH} ספרות לכתובת{' '}
          <strong className="font-semibold text-gray-700">
            {registrationData.emailForVerification || 'האימייל שלך'}
          </strong>
          .
          <br />
          אנא הזן את הקוד שקיבלת.
        </p>
      </motion.div>

      {apiError && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        </motion.div>
      )}
      {resendMessage && !apiError && (
        <motion.div variants={itemVariants}>
          <Alert
            variant="default"
            className="bg-green-50 border-green-300 text-green-700"
            role="status" // status מתאים להודעות הצלחה, alert לשגיאות
          >
            <MailCheck className="h-4 w-4 text-green-600" />
            <AlertTitle>הודעה</AlertTitle>
            <AlertDescription>{resendMessage}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <form onSubmit={handleFormSubmit}>
        <motion.div
          variants={itemVariants}
          className="flex justify-center space-x-2 sm:space-x-3 rtl:space-x-reverse"
          dir="ltr"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <Input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) =>
                handleChange(e.target as HTMLInputElement, index)
              }
              onKeyDown={(e) =>
                handleKeyDown(e as KeyboardEvent<HTMLInputElement>, index)
              }
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-semibold border-2 border-gray-300 rounded-md focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors disabled:bg-gray-100 appearance-none"
              disabled={isLoading || isResending}
              aria-label={`OTP digit ${index + 1}`}
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          ))}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4 mt-6">
          <Button
            type="submit"
            disabled={
              isLoading || isResending || otp.join('').length !== OTP_LENGTH
            }
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>מאמת ומתחבר...</span>
              </>
            ) : (
              'אמת קוד והמשך להשלמת פרופיל'
            )}
          </Button>
        </motion.div>
      </form>

      <motion.div
        variants={itemVariants}
        className="text-sm text-gray-500 mt-2"
      >
        לא קיבלת קוד?{' '}
        <Button
          type="button"
          variant="link"
          onClick={handleResendCode}
          disabled={isLoading || isResending}
          className="p-0 h-auto text-cyan-600 hover:text-cyan-700 disabled:text-gray-400"
        >
          {isResending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-1 rtl:mr-1 rtl:ml-0" />
              <span>שולח קוד חדש...</span>
            </>
          ) : (
            'שלח קוד חדש'
          )}
        </Button>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6">
        <Button
          type="button"
          onClick={goBackToBasicInfo}
          variant="outline"
          className="flex items-center gap-2 border-gray-300 text-sm"
          disabled={isLoading || isResending}
        >
          <ArrowRight className="h-4 w-4" /> חזור למילוי פרטים
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default EmailVerificationCodeStep;
