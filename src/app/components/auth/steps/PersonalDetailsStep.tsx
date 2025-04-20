"use client";

import { useState, useEffect } from "react";
import { useRegistration } from "../RegistrationContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Phone, Calendar, User } from "lucide-react";
import { Gender } from "@prisma/client";
import { motion } from "framer-motion";

const PersonalDetailsStep: React.FC = () => {
  const { data, updateField, nextStep, prevStep } = useRegistration();
  const [phoneError, setPhoneError] = useState("");
  const [ageError, setAgeError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  // Form validation
  useEffect(() => {
    // Validate all required fields
    const isPhoneValid = !phoneError && data.phone.length >= 10;
    const isBirthDateValid = !ageError && data.birthDate !== "";
    const isGenderValid = data.gender !== "";
    const isMaritalStatusValid = data.maritalStatus !== "";

    setIsFormValid(
      isPhoneValid && isBirthDateValid && isGenderValid && isMaritalStatusValid
    );
  }, [
    data.phone,
    data.birthDate,
    data.gender,
    data.maritalStatus,
    phoneError,
    ageError,
  ]);

  // Phone validation
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^0\d{9}$/;
    const isValid = phone.trim() !== "" && phoneRegex.test(phone);

    if (!isValid && phone.trim() !== "") {
      setPhoneError("מספר טלפון לא תקין (צריך להתחיל ב-0 ולהכיל 10 ספרות)");
    } else {
      setPhoneError("");
    }

    return isValid;
  };

  // Age validation
  const validateAge = (birthDate: string): boolean => {
    if (!birthDate) return false;

    const birthDateObj = new Date(birthDate);
    const age = Math.floor(
      (new Date().getTime() - birthDateObj.getTime()) / 31557600000
    );

    if (age < 18) {
      setAgeError("גיל מינימלי להרשמה הוא 18");
      return false;
    } else {
      setAgeError("");
      return true;
    }
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
        פרטים אישיים
      </motion.h2>

      <motion.div variants={itemVariants} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            טלפון נייד
          </label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="tel"
              id="phone"
              value={data.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              onBlur={() => validatePhone(data.phone)}
              placeholder="0501234567"
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                ${
                  phoneError
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                }`}
            />
          </div>
          {phoneError && (
            <p className="text-red-500 text-xs mt-1">{phoneError}</p>
          )}
        </div>

        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700"
          >
            מגדר
          </label>
          <div className="grid grid-cols-2 gap-4 mt-1">
            <button
              type="button"
              onClick={() => updateField("gender", Gender.MALE)}
              className={`flex items-center justify-center gap-3 py-3 rounded-lg border-2 transition-all
                ${
                  data.gender === Gender.MALE
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
            >
              <span className="text-2xl">👨</span>
              <span>זכר</span>
            </button>

            <button
              type="button"
              onClick={() => updateField("gender", Gender.FEMALE)}
              className={`flex items-center justify-center gap-3 py-3 rounded-lg border-2 transition-all
                ${
                  data.gender === Gender.FEMALE
                    ? "border-pink-500 bg-pink-50 text-pink-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
            >
              <span className="text-2xl">👩</span>
              <span>נקבה</span>
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="birthDate"
            className="block text-sm font-medium text-gray-700"
          >
            תאריך לידה
          </label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="date"
              id="birthDate"
              value={data.birthDate}
              onChange={(e) => {
                updateField("birthDate", e.target.value);
                validateAge(e.target.value);
              }}
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split("T")[0]
              }
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors
                ${
                  ageError
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
                }`}
            />
          </div>
          {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="maritalStatus"
            className="block text-sm font-medium text-gray-700"
          >
            מצב משפחתי
          </label>
          <div className="relative">
            <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              id="maritalStatus"
              value={data.maritalStatus}
              onChange={(e) => updateField("maritalStatus", e.target.value)}
              className="w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none appearance-none bg-white"
            >
              <option value="">בחר מצב משפחתי</option>
              <option value="רווק/ה">רווק/ה</option>
              <option value="גרוש/ה">גרוש/ה</option>
              <option value="אלמן/ה">אלמן/ה</option>
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

export default PersonalDetailsStep;
