"use client";

import { useState } from "react";
import { useRegistration } from "../RegistrationContext";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Ruler,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { motion } from "framer-motion";

const OptionalInfoStep: React.FC = () => {
  const { data, updateField, nextStep, prevStep } = useRegistration();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Construct registration data from context
      const registrationData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate,
        maritalStatus: data.maritalStatus,
        height: data.height,
        occupation: data.occupation,
        education: data.education,
      };

      // Choose the appropriate API endpoint based on isGoogleSignup
      const endpoint = data.isGoogleSignup
        ? "/api/auth/complete-profile" // For users who signed up with Google
        : "/api/auth/register"; // For standard email registration

      // Send the registration data to the backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "אירעה שגיאה בהרשמה");
      }

      // Move to completion step
      nextStep();
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "אירעה שגיאה בהרשמה");
    } finally {
      setIsSubmitting(false);
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
        className="text-xl font-bold text-gray-800 mb-1"
        variants={itemVariants}
      >
        מידע נוסף (אופציונלי)
      </motion.h2>

      <motion.p className="text-gray-600 text-sm mb-4" variants={itemVariants}>
        מידע זה יעזור לנו להתאים לך שידוכים מדויקים יותר. כל השדות הבאים הם
        אופציונליים.
      </motion.p>

      <motion.div variants={itemVariants} className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor="height"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <Ruler className="h-4 w-4 text-gray-400" />
            גובה (בסמ)
          </label>
          <input
            type="number"
            id="height"
            min="120"
            max="220"
            value={data.height || ""}
            onChange={(e) =>
              updateField(
                "height",
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            placeholder="לדוגמה: 175"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="occupation"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <Briefcase className="h-4 w-4 text-gray-400" />
            עיסוק
          </label>
          <input
            type="text"
            id="occupation"
            value={data.occupation || ""}
            onChange={(e) => updateField("occupation", e.target.value)}
            placeholder="לדוגמה: מהנדס תוכנה, מורה, סטודנט/ית"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1">
          <label
            htmlFor="education"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <GraduationCap className="h-4 w-4 text-gray-400" />
            השכלה
          </label>
          <input
            type="text"
            id="education"
            value={data.education || ""}
            onChange={(e) => updateField("education", e.target.value)}
            placeholder="לדוגמה: תואר ראשון במדעי המחשב"
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
          />
        </motion.div>

        {error && (
          <motion.div
            variants={itemVariants}
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-4"
      >
        <Button
          onClick={prevStep}
          variant="outline"
          className="flex items-center gap-2 border-gray-300"
          disabled={isSubmitting}
        >
          <ArrowRight className="h-4 w-4" />
          חזרה
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              מבצע רישום...
            </>
          ) : (
            <>
              סיום והרשמה
              <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default OptionalInfoStep;
