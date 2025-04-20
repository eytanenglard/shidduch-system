"use client";

import { useState, useEffect } from "react";
import { useRegistration } from "../RegistrationContext";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Lock,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const BasicInfoStep: React.FC = () => {
  const { data, updateField, nextStep, prevStep } = useRegistration();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  // Form validation
  useEffect(() => {
    // Validate all fields
    const isEmailValid = validateEmail(data.email);
    const isPasswordValid =
      data.isGoogleSignup || (!passwordError && data.password.length >= 8);
    const isNameValid =
      data.firstName.trim().length > 0 && data.lastName.trim().length > 0;

    setIsFormValid(isEmailValid && isPasswordValid && isNameValid);
  }, [
    data.email,
    data.password,
    data.firstName,
    data.lastName,
    data.isGoogleSignup,
    passwordError,
  ]);

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    const isValid = email.trim() !== "" && emailRegex.test(email);

    if (!isValid && email.trim() !== "") {
      setEmailError("כתובת אימייל לא תקינה");
    } else {
      setEmailError("");
    }

    return isValid;
  };

  // Password validation
  const validatePassword = (password: string): boolean => {
    if (data.isGoogleSignup) return true; // Skip validation for Google signup

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    const isValid = passwordRegex.test(password);

    if (!isValid && password.trim() !== "") {
      setPasswordError(
        "הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר"
      );
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleContinue = () => {
    if (isFormValid) {
      nextStep();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
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
        className="text-xl font-bold text-gray-800 mb-4"
        variants={itemVariants}
      >
        קצת עליך
      </motion.h2>

      <motion.div variants={itemVariants} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            אימייל
          </label>
          <div className="relative">
            <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              id="email"
              value={data.email}
              onChange={(e) => updateField("email", e.target.value)}
              onBlur={() => validateEmail(data.email)}
              placeholder="you@example.com"
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                ${
                  emailError
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                }`}
              disabled={data.isGoogleSignup}
            />
            {emailError && (
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          {emailError && (
            <p className="text-red-500 text-xs mt-1">{emailError}</p>
          )}
        </div>

        {!data.isGoogleSignup && (
          <motion.div variants={itemVariants} className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              סיסמה
            </label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                value={data.password}
                onChange={(e) => updateField("password", e.target.value)}
                onBlur={() => validatePassword(data.password)}
                placeholder="לפחות 8 תווים"
                className={`w-full pr-10 pl-10 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                  ${
                    passwordError
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                  }`}
              />
              <button
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="absolute inset-y-0 left-0 flex items-center pl-3"
              >
                <span className="text-gray-500">
                  {passwordVisible ? "🙈" : "👁️"}
                </span>
              </button>
              {passwordError && (
                <div className="absolute inset-y-0 left-0 flex items-center pl-10 pointer-events-none">
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
                באנגלית ומספר
              </p>
            )}
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            שם פרטי
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              id="firstName"
              value={data.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="ישראל"
              className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
              disabled={data.isGoogleSignup}
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            שם משפחה
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              id="lastName"
              value={data.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="ישראלי"
              className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
              disabled={data.isGoogleSignup}
            />
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-4"
      >
        <Button
          onClick={prevStep}
          variant="outline"
          className="flex items-center gap-2 border-gray-300"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!isFormValid}
          className={`flex items-center gap-2 ${
            isFormValid
              ? "bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          המשך
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default BasicInfoStep;
