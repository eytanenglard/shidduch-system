// src/app/components/auth/steps/PersonalDetailsStep.tsx
"use client";

import { useState, useEffect } from "react";
import { useRegistration } from "../RegistrationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Shadcn Input
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  Calendar,
  Users, // Icon for Marital Status, User is also good
  Edit3, // Icon for name fields
} from "lucide-react";
import { Gender } from "@prisma/client";
import { motion } from "framer-motion";

const PersonalDetailsStep: React.FC = () => {
  const { data, updateField, nextStep, prevStep } = useRegistration();

  // State for field-specific errors
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [ageError, setAgeError] = useState("");
  // General form validity
  const [isFormValid, setIsFormValid] = useState(false);

  // --- Validation Functions ---
  const validateFirstName = (name: string): boolean => {
    const isValid = name.trim() !== "";
    if (!isValid && name.trim() === "") {
      setFirstNameError("שם פרטי הוא שדה חובה");
    } else if (!isValid) {
      setFirstNameError("שם פרטי לא תקין"); // Generic, can be more specific
    } else {
      setFirstNameError("");
    }
    return isValid;
  };

  const validateLastName = (name: string): boolean => {
    const isValid = name.trim() !== "";
    if (!isValid && name.trim() === "") {
      setLastNameError("שם משפחה הוא שדה חובה");
    } else if (!isValid) {
      setLastNameError("שם משפחה לא תקין");
    } else {
      setLastNameError("");
    }
    return isValid;
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^0\d{9}$/; // Starts with 0, exactly 10 digits
    const isValid = phoneRegex.test(phone);
    if (phone.trim() !== "" && !isValid) {
      setPhoneError("מספר טלפון לא תקין (צריך להתחיל ב-0 ולהכיל 10 ספרות)");
    } else if (phone.trim() === "") {
      setPhoneError("מספר טלפון הוא שדה חובה");
    } else {
      setPhoneError("");
    }
    return isValid;
  };

  const validateAge = (birthDate: string): boolean => {
    if (!birthDate) {
      setAgeError("תאריך לידה הוא שדה חובה");
      return false;
    }
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDifference = today.getMonth() - birthDateObj.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDateObj.getDate())
    ) {
      age--;
    }

    if (age < 18) {
      setAgeError("גיל מינימלי להרשמה הוא 18");
      return false;
    } else if (age > 120) {
      setAgeError("נראה שתאריך הלידה שהזנת אינו תקין");
      return false;
    } else {
      setAgeError("");
      return true;
    }
  };

  // --- Form Validation Effect ---
  useEffect(() => {
    // Trigger validation on initial load or when data changes, to correctly set isFormValid
    const isFirstNameCurrentlyValid =
      data.firstName.trim() !== "" && !firstNameError;
    const isLastNameCurrentlyValid =
      data.lastName.trim() !== "" && !lastNameError;
    const isPhoneCurrentlyValid =
      data.phone.trim() !== "" && /^0\d{9}$/.test(data.phone) && !phoneError;
    const isBirthDateCurrentlyValid = data.birthDate !== "" && !ageError; // Age validation updates ageError
    const isGenderValid = data.gender !== "";
    const isMaritalStatusValid = data.maritalStatus !== "";

    setIsFormValid(
      isFirstNameCurrentlyValid &&
        isLastNameCurrentlyValid &&
        isPhoneCurrentlyValid &&
        isBirthDateCurrentlyValid &&
        isGenderValid &&
        isMaritalStatusValid
    );
  }, [
    data.firstName,
    data.lastName,
    data.phone,
    data.birthDate,
    data.gender,
    data.maritalStatus,
    firstNameError,
    lastNameError,
    phoneError,
    ageError,
  ]);

  const handleContinue = () => {
    // Run all validations before proceeding
    const fnValid = validateFirstName(data.firstName);
    const lnValid = validateLastName(data.lastName);
    const pValid = validatePhone(data.phone);
    const ageValid = validateAge(data.birthDate);
    const genderValid = data.gender !== "";
    const maritalValid = data.maritalStatus !== "";

    if (
      fnValid &&
      lnValid &&
      pValid &&
      ageValid &&
      genderValid &&
      maritalValid
    ) {
      nextStep();
    } else {
      // Optionally, scroll to the first error or set a general form error message
      console.log("Form is not valid. Please check the fields.");
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2
        className="text-xl font-semibold text-gray-800 mb-4"
        variants={itemVariants}
      >
        פרטים אישיים חיוניים
      </motion.h2>
      <motion.p className="text-sm text-gray-500 mb-5" variants={itemVariants}>
        אנו צריכים פרטים אלו כדי להמשיך בתהליך ההרשמה שלך.
      </motion.p>

      <motion.div variants={itemVariants} className="space-y-4">
        {/* First Name Field */}
        <div className="space-y-1">
          <label
            htmlFor="firstNamePersonal"
            className="block text-sm font-medium text-gray-700"
          >
            שם פרטי <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              id="firstNamePersonal"
              value={data.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              onBlur={() => validateFirstName(data.firstName)}
              placeholder="לדוגמה: ישראל"
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                ${
                  firstNameError
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                }`}
            />
          </div>
          {firstNameError && (
            <p className="text-red-500 text-xs mt-1">{firstNameError}</p>
          )}
        </div>

        {/* Last Name Field */}
        <div className="space-y-1">
          <label
            htmlFor="lastNamePersonal"
            className="block text-sm font-medium text-gray-700"
          >
            שם משפחה <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              id="lastNamePersonal"
              value={data.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              onBlur={() => validateLastName(data.lastName)}
              placeholder="לדוגמה: ישראלי"
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                ${
                  lastNameError
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                }`}
            />
          </div>
          {lastNameError && (
            <p className="text-red-500 text-xs mt-1">{lastNameError}</p>
          )}
        </div>

        {/* Phone Field */}
        <div className="space-y-1">
          <label
            htmlFor="phonePersonal"
            className="block text-sm font-medium text-gray-700"
          >
            טלפון נייד <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="tel"
              id="phonePersonal"
              value={data.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              onBlur={() => validatePhone(data.phone)}
              placeholder="0501234567"
              required
              maxLength={10}
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                ${
                  phoneError
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                }`}
            />
          </div>
          {phoneError && (
            <p className="text-red-500 text-xs mt-1">{phoneError}</p>
          )}
        </div>

        {/* Gender Field */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            מגדר <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {(
              [
                { value: Gender.MALE, label: "זכר", icon: "👨" },
                { value: Gender.FEMALE, label: "נקבה", icon: "👩" },
              ] as const
            ).map((genderOption) => (
              <button
                key={genderOption.value}
                type="button"
                onClick={() => updateField("gender", genderOption.value)}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all duration-200 ease-in-out transform hover:scale-105
                  ${
                    data.gender === genderOption.value
                      ? genderOption.value === Gender.MALE
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700 shadow-md"
                        : "border-pink-500 bg-pink-50 text-pink-700 shadow-md"
                      : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                  }`}
              >
                <span className="text-xl">{genderOption.icon}</span>
                <span className="font-medium">{genderOption.label}</span>
              </button>
            ))}
          </div>
          {data.gender === "" && ( // Simple check if gender not selected, for general form guidance
            <p className="text-red-500 text-xs mt-1">יש לבחור מגדר</p>
          )}
        </div>

        {/* Birth Date Field */}
        <div className="space-y-1">
          <label
            htmlFor="birthDatePersonal"
            className="block text-sm font-medium text-gray-700"
          >
            תאריך לידה <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="date"
              id="birthDatePersonal"
              value={data.birthDate}
              onChange={(e) => {
                updateField("birthDate", e.target.value);
                validateAge(e.target.value); // Validate on change for immediate feedback
              }}
              onBlur={() => validateAge(data.birthDate)} // Also validate on blur
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split("T")[0]
              } // Minimum age 18
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                ${
                  ageError
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                }`}
            />
          </div>
          {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
        </div>

        {/* Marital Status Field */}
        <div className="space-y-1">
          <label
            htmlFor="maritalStatusPersonal"
            className="block text-sm font-medium text-gray-700"
          >
            מצב משפחתי <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              id="maritalStatusPersonal"
              value={data.maritalStatus}
              onChange={(e) => updateField("maritalStatus", e.target.value)}
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white transition-colors
                ${
                  data.maritalStatus === "" && false // Could add specific error state if needed
                    ? "border-red-400 focus:ring-red-200"
                    : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                }`}
            >
              <option value="" disabled>
                בחר/י מצב משפחתי...
              </option>
              <option value="רווק/ה">רווק/ה</option>
              <option value="גרוש/ה">גרוש/ה</option>
              <option value="אלמן/ה">אלמן/ה</option>
              {/* Consider adding 'לא רלוונטי' or other options if applicable */}
            </select>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {data.maritalStatus === "" && ( // Simple check if marital status not selected
            <p className="text-red-500 text-xs mt-1">יש לבחור מצב משפחתי</p>
          )}
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center pt-5 mt-6 border-t border-gray-200"
      >
        <Button
          onClick={prevStep}
          variant="outline"
          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={data.step === 0 && !data.isCompletingProfile} // Disable if it's the very first step (WelcomeStep leads here for completion)
        >
          <ArrowRight className="h-4 w-4" />
          חזרה
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!isFormValid}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300
            ${
              isFormValid
                ? "bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          המשך לשלב הבא
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PersonalDetailsStep;
