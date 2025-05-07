// src/app/components/auth/steps/BasicInfoStep.tsx
"use client";

import { useState, useEffect } from "react";
import { useRegistration } from "../RegistrationContext"; // Import context hook
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2, // Import Loader icon
  CheckCircle, // Import Check icon for success
} from "lucide-react";
import { motion } from "framer-motion";

// --- Helper validation functions נשארות זהות ---
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return email.trim() !== "" && emailRegex.test(email);
};
const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};
// --- End helper functions ---

const BasicInfoStep: React.FC = () => {
  // Use the registration context
  const { data, updateField, prevStep, setEmailVerificationPending } = useRegistration(); // קבל את הפונקציה החדשה
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  // --- State חדש לניהול קריאת API ---
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccessMessage, setApiSuccessMessage] = useState<string | null>(null); // להודעת הצלחה
  // ---

  // Form validation effect נשאר זהה
  useEffect(() => {
    const isEmailValid = isValidEmail(data.email);
    const isPasswordValid = isValidPassword(data.password);
    const isNameValid =
      data.firstName.trim().length > 0 && data.lastName.trim().length > 0;

    setEmailError(
      data.email.trim() !== "" && !isEmailValid ? "כתובת אימייל לא תקינה" : ""
    );
    setPasswordError(
      data.password.trim() !== "" && !isPasswordValid
        ? "הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר"
        : ""
    );

    // טופס תקף רק אם אנחנו לא בתהליך API
    setIsFormValid(isEmailValid && isPasswordValid && isNameValid && !isLoading && !apiSuccessMessage);
  }, [
    data.email,
    data.password,
    data.firstName,
    data.lastName,
    isLoading,
    apiSuccessMessage
  ]);

  // Event handlers for blur נשארים זהים
  const handleEmailBlur = () => {
    if (!isValidEmail(data.email) && data.email.trim() !== "") {
      setEmailError("כתובת אימייל לא תקינה");
    } else {
      setEmailError("");
    }
  };
  const handlePasswordBlur = () => {
    if (!isValidPassword(data.password) && data.password.trim() !== "") {
      setPasswordError(
        "הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר"
      );
    } else {
      setPasswordError("");
    }
  };


  // --- פונקציה חדשה לשליחת טופס ההרשמה הראשוני ---
  const handleRegisterSubmit = async () => {
    // ודא שהטופס תקף לפני השליחה
    const emailValid = isValidEmail(data.email);
    const passwordValid = isValidPassword(data.password);
    const namesValid =
      data.firstName.trim().length > 0 && data.lastName.trim().length > 0;

    handleEmailBlur(); // Show errors if fields were empty
    handlePasswordBlur();

    if (!emailValid || !passwordValid || !namesValid) {
        console.log("Form not valid for submission attempt");
        setApiError("אנא מלא את כל השדות הנדרשים בצורה תקינה."); // הגדר הודעת שגיאה כללית
        return;
    }

    setIsLoading(true);
    setApiError(null);
    setApiSuccessMessage(null); // אפס הודעת הצלחה קודמת

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `שגיאה ${response.status}: ${response.statusText}`);
        }

        // הצלחה! הצג הודעה ועדכן את הקונטקסט
        setApiSuccessMessage(result.message || "החשבון נוצר, אנא בדוק את המייל לאימות.");
        setEmailVerificationPending(true); // עדכן את הקונטקסט

    } catch (error) {
        console.error("Registration API error:", error);
        setApiError(error instanceof Error ? error.message : "אירעה שגיאה בלתי צפויה בהרשמה");
    } finally {
        setIsLoading(false);
    }
  };
  // ---

  // Animation variants נשארים זהים
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  // --- Render Component ---

  // הצג הודעת הצלחה אם קיימת
  if (apiSuccessMessage) {
      return (
          <motion.div
              className="space-y-5 text-center p-6 bg-green-50 rounded-lg border border-green-200"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
          >
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800">הרשמה ראשונית הושלמה!</h2>
              <p className="text-green-700">{apiSuccessMessage}</p>
              <p className="text-sm text-gray-600 mt-4">
                  לאחר אימות המייל, תוכל להתחבר ולהשלים את פרטי הפרופיל שלך.
              </p>
              {/* אפשר להוסיף כפתור לחזרה לדף הבית או התחברות */}
              <Button onClick={() => window.location.href = '/auth/signin'} variant="outline" className="mt-4">
                  חזרה להתחברות
              </Button>
          </motion.div>
      );
  }


  // אם אין הודעת הצלחה, הצג את הטופס הרגיל
  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      // אל תציג את הטופס אם אנחנו במצב השלמת פרופיל (לא אמור לקרות לפי הלוגיקה ב-RegisterSteps)
      // hidden={data.isCompletingProfile}
    >
        {/* הצג הודעת שגיאה כללית של ה-API אם קיימת */}
       {apiError && (
            <motion.div variants={itemVariants}>
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>שגיאה בהרשמה</AlertTitle>
                    <AlertDescription>{apiError}</AlertDescription>
                </Alert>
            </motion.div>
        )}

      <motion.h2
        className="text-xl font-bold text-gray-800 mb-4"
        variants={itemVariants}
      >
        פרטי חשבון
      </motion.h2>

      <motion.div variants={itemVariants} className="space-y-4">
        {/* --- Email Field --- */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">אימייל</label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email" id="email" value={data.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
              disabled={isLoading} // נטרל בזמן טעינה
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${isLoading ? 'bg-gray-100' : ''} ${emailError ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"}`}
            />
            {emailError && (<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><AlertCircle className="h-5 w-5 text-red-500" /></div>)}
          </div>
          {emailError && (<p className="text-red-500 text-xs mt-1">{emailError}</p>)}
        </div>

        {/* --- Password Field --- */}
          <motion.div variants={itemVariants} className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">סיסמה</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={passwordVisible ? "text" : "password"} id="password" value={data.password}
                onChange={(e) => updateField("password", e.target.value)}
                onBlur={handlePasswordBlur}
                placeholder="לפחות 8 תווים"
                 disabled={isLoading} // נטרל בזמן טעינה
                className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${isLoading ? 'bg-gray-100' : ''} ${passwordError ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"}`}
              />
              <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 left-0 flex items-center pl-3" aria-label={passwordVisible ? "הסתר סיסמה" : "הצג סיסמה"}>
                <span className="text-gray-500">{passwordVisible ? "🙈" : "👁️"}</span>
              </button>
              {passwordError && (<div className="absolute inset-y-0 left-10 flex items-center pl-3 pointer-events-none"><AlertCircle className="h-5 w-5 text-red-500" /></div>)}
            </div>
            {passwordError && (<p className="text-red-500 text-xs mt-1">{passwordError}</p>)}
            {!passwordError && (<p className="text-gray-500 text-xs mt-1">הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה באנגלית, אות קטנה באנגלית ומספר</p>)}
          </motion.div>

        {/* --- First Name Field --- */}
        <motion.div variants={itemVariants} className="space-y-1">
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">שם פרטי</label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text" id="firstName" value={data.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="ישראל"
               disabled={isLoading} // נטרל בזמן טעינה
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${isLoading ? 'bg-gray-100' : ''} border-gray-300 focus:ring-cyan-200 focus:border-cyan-500`}
            />
          </div>
        </motion.div>

        {/* --- Last Name Field --- */}
        <motion.div variants={itemVariants} className="space-y-1">
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">שם משפחה</label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text" id="lastName" value={data.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="ישראלי"
               disabled={isLoading} // נטרל בזמן טעינה
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${isLoading ? 'bg-gray-100' : ''} border-gray-300 focus:ring-cyan-200 focus:border-cyan-500`}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* --- Navigation Buttons --- */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-4"
      >
        {/* Back Button - נשאר זהה */}
          <Button
            onClick={prevStep}
            variant="outline"
            className="flex items-center gap-2 border-gray-300"
            disabled={isLoading} // נטרל בזמן טעינה
          >
            <ArrowRight className="h-4 w-4" /> חזרה
          </Button>

        {/* Submit Button */}
        <Button
          onClick={handleRegisterSubmit} // קרא לפונקציית ההרשמה
          disabled={!isFormValid || isLoading} // השתמש ב-isFormValid ו-isLoading
          className={`flex items-center gap-2 min-w-[150px] justify-center ${
            isFormValid && !isLoading
              ? "bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>יוצר חשבון...</span>
              </>
          ) : (
             <>
                <span>צור חשבון</span>
                <ArrowLeft className="h-4 w-4" />
             </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default BasicInfoStep;