// src/app/components/auth/steps/BasicInfoStep.tsx
"use client";

import { useState, useEffect } from "react";
import { useRegistration } from "../RegistrationContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return email.trim() !== "" && emailRegex.test(email);
};
const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
};

const BasicInfoStep: React.FC = () => {
  const { data, updateField, prevStep, proceedToEmailVerification } =
    useRegistration();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

    setIsFormValid(
      isEmailValid && isPasswordValid && isNameValid && !isLoading
    );
  }, [data.email, data.password, data.firstName, data.lastName, isLoading]);

  const handleEmailBlur = () => {
    if (data.email.trim() === "") {
      setEmailError(""); // No error if empty, required handled by form submit
    } else if (!isValidEmail(data.email)) {
      setEmailError("כתובת אימייל לא תקינה");
    } else {
      setEmailError("");
    }
  };
  const handlePasswordBlur = () => {
    if (data.password.trim() === "") {
      setPasswordError(""); // No error if empty
    } else if (!isValidPassword(data.password)) {
      setPasswordError(
        "הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר"
      );
    } else {
      setPasswordError("");
    }
  };

  const handleRegisterSubmit = async () => {
    // Final validation check before submission
    const isEmailValid = isValidEmail(data.email);
    const isPasswordValid = isValidPassword(data.password);
    const isFirstNameValid = data.firstName.trim().length > 0;
    const isLastNameValid = data.lastName.trim().length > 0;

    if (
      !isEmailValid ||
      !isPasswordValid ||
      !isFirstNameValid ||
      !isLastNameValid
    ) {
      setApiError("אנא מלא את כל השדות הנדרשים בצורה תקינה.");
      // Trigger blur to show individual field errors if not already shown
      if (!isEmailValid && data.email.trim() !== "") handleEmailBlur();
      else if (data.email.trim() === "") setEmailError("שדה אימייל הוא חובה");
      if (!isPasswordValid && data.password.trim() !== "") handlePasswordBlur();
      else if (data.password.trim() === "")
        setPasswordError("שדה סיסמה הוא חובה");
      if (!isFirstNameValid) setApiError((prev) => prev + " שם פרטי חסר."); // Example, better to highlight field
      if (!isLastNameValid) setApiError((prev) => prev + " שם משפחה חסר.");
      return;
    }
    if (emailError || passwordError) {
      // If there are specific field errors, don't submit
      setApiError("אנא תקן את השגיאות המסומנות.");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `שגיאה ${response.status}: ${response.statusText}`
        );
      }

      if (result.success && result.email) {
        proceedToEmailVerification(result.email);
      } else {
        console.error(
          "Registration API success but no email returned or success false:",
          result
        );
        setApiError(
          result.error || "אירעה שגיאה במעבר לשלב אימות המייל. אנא נסה שנית."
        );
      }
    } catch (error) {
      console.error("Registration API error:", error);
      setApiError(
        error instanceof Error ? error.message : "אירעה שגיאה בלתי צפויה בהרשמה"
      );
    } finally {
      setIsLoading(false);
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
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
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
        {/* Email Field */}
        <div className="space-y-1">
          <label
            htmlFor="emailBasic"
            className="block text-sm font-medium text-gray-700"
          >
            אימייל <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              id="emailBasic"
              value={data.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
              disabled={isLoading}
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                isLoading ? "bg-gray-100" : ""
              } ${
                emailError
                  ? "border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
              }`}
            />
            {emailError && !isLoading && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          {emailError && (
            <p className="text-red-500 text-xs mt-1">{emailError}</p>
          )}
        </div>

        {/* Password Field */}
        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="passwordBasic"
            className="block text-sm font-medium text-gray-700"
          >
            סיסמה <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type={passwordVisible ? "text" : "password"}
              id="passwordBasic"
              value={data.password}
              onChange={(e) => updateField("password", e.target.value)}
              onBlur={handlePasswordBlur}
              placeholder="לפחות 8 תווים"
              disabled={isLoading}
              required
              className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                isLoading ? "bg-gray-100" : ""
              } ${
                passwordError
                  ? "border-red-300 focus:ring-red-200"
                  : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setPasswordVisible(!passwordVisible)}
              className="absolute inset-y-0 left-0 flex items-center pl-3 focus:outline-none"
              aria-label={passwordVisible ? "הסתר סיסמה" : "הצג סיסמה"}
            >
              <span className="text-gray-500">
                {passwordVisible ? "🙈" : "👁️"}
              </span>
            </button>
            {passwordError && !isLoading && (
              <div className="absolute inset-y-0 left-10 flex items-center pl-3 pointer-events-none">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          {passwordError && (
            <p className="text-red-500 text-xs mt-1">{passwordError}</p>
          )}
          {!passwordError && (
            <p className="text-gray-500 text-xs mt-1">
              הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה באנגלית, אות קטנה
              באנגלית ומספר.
            </p>
          )}
        </motion.div>

        {/* First Name Field */}
        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="firstNameBasic"
            className="block text-sm font-medium text-gray-700"
          >
            שם פרטי <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              id="firstNameBasic"
              value={data.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="ישראל"
              disabled={isLoading}
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                isLoading ? "bg-gray-100" : ""
              } border-gray-300 focus:ring-cyan-200 focus:border-cyan-500`}
            />
          </div>
        </motion.div>

        {/* Last Name Field */}
        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="lastNameBasic"
            className="block text-sm font-medium text-gray-700"
          >
            שם משפחה <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              id="lastNameBasic"
              value={data.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="ישראלי"
              disabled={isLoading}
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                isLoading ? "bg-gray-100" : ""
              } border-gray-300 focus:ring-cyan-200 focus:border-cyan-500`}
            />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-4"
      >
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="flex items-center gap-2 border-gray-300"
          disabled={isLoading}
        >
          <ArrowRight className="h-4 w-4" /> חזרה
        </Button>

        <Button
          type="button"
          onClick={handleRegisterSubmit}
          disabled={!isFormValid || isLoading} // isFormValid כבר כולל את isLoading
          className={`flex items-center gap-2 min-w-[200px] justify-center ${
            isFormValid && !isLoading // בדוק שוב את התנאי כאן, כי isFormValid כבר תלוי ב-isLoading
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
              <span>צור חשבון והמשך לאימות</span>
              <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default BasicInfoStep;
