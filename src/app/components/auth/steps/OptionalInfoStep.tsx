// src/app/components/auth/steps/OptionalInfoStep.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegistration } from "../RegistrationContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Ruler,
  Briefcase,
  GraduationCap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

// Define the possible states during form submission
type SubmissionStatus = "idle" | "savingProfile" | "sendingCode" | "error"; // שינוי saving ל-savingProfile

const OptionalInfoStep: React.FC = () => {
  const { data, updateField, prevStep } = useRegistration();
  const router = useRouter();

  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmissionStatus("savingProfile"); // Start saving profile data
    setError(null);

    try {
      // --- Step 1: Save Profile Data ---
      const profileData = {
        // Data from previous steps (PersonalDetailsStep)
        phone: data.phone, // Phone is needed for User update inside complete-profile API
        gender: data.gender,
        birthDate: data.birthDate,
        maritalStatus: data.maritalStatus,
        // Data from this step (OptionalInfoStep)
        height: data.height,
        occupation: data.occupation,
        education: data.education,
      };

      console.log("OptionalInfoStep: Submitting profile data:", profileData);

      const profileResponse = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
        credentials: "include", // <-- *** הוספנו את זה ***
      });

      if (!profileResponse.ok) {
        let errorMessage = `שגיאה ${profileResponse.status}`;
        try {
          const errorData = await profileResponse.json();
          errorMessage =
            errorData.error ||
            `שגיאה ${profileResponse.status}: נתונים לא תקינים או בעיית שרת.`;
          console.error(
            "OptionalInfoStep: API Error Details (complete-profile):",
            errorData
          );
        } catch (parseError) {
          errorMessage = `שגיאה ${profileResponse.status}: ${profileResponse.statusText}`;
          console.error(
            "OptionalInfoStep: Failed to parse error response (complete-profile):",
            parseError
          );
        }
        throw new Error(errorMessage); // זרוק שגיאה כדי להפסיק את התהליך
      }

      const profileResult = await profileResponse.json();
      console.log(
        "OptionalInfoStep: Profile data saved successfully:",
        profileResult
      );

      // --- Step 2: Send Phone Verification Code ---
      setSubmissionStatus("sendingCode");
      console.log(
        "OptionalInfoStep: Attempting to send phone verification code..."
      );

      const sendCodeResponse = await fetch("/api/auth/send-phone-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Content-Type עדיין חשוב, גם אם אין body
        // body: JSON.stringify({}), // שלח אובייקט ריק אם ה-API דורש body כלשהו
        credentials: "include", // <-- *** הוספנו את זה ***
      });

      if (!sendCodeResponse.ok) {
        let errorMessage = `שגיאה ${sendCodeResponse.status}`;
        try {
          const errorData = await sendCodeResponse.json();
          errorMessage =
            errorData.error ||
            `שגיאה ${sendCodeResponse.status}: לא ניתן היה לשלוח קוד אימות.`;
          console.error(
            "OptionalInfoStep: API Error Details (send-phone-code):",
            errorData
          );
        } catch (parseError) {
          errorMessage = `שגיאה ${sendCodeResponse.status}: ${sendCodeResponse.statusText}`;
          console.error(
            "OptionalInfoStep: Failed to parse error response (send-phone-code):",
            parseError
          );
        }
        throw new Error(errorMessage); // זרוק שגיאה
      }

      const sendCodeResult = await sendCodeResponse.json();
      console.log(
        "OptionalInfoStep: Verification code sent successfully:",
        sendCodeResult
      );

      // --- Step 3: Redirect to Verification Page ---
      console.log("OptionalInfoStep: Redirecting to /auth/verify-phone...");
      router.push("/auth/verify-phone"); // נווט לדף אימות הטלפון
    } catch (err) {
      console.error(
        "OptionalInfoStep: Error during profile completion or OTP sending:",
        err
      );
      setError(err instanceof Error ? err.message : "אירעה שגיאה לא צפויה");
      setSubmissionStatus("error"); // עדכן סטטוס לשגיאה
    }
    // אין צורך ב-finally להחזרת סטטוס ל-idle אם יש ניווט,
    // אבל אם נשארים בדף עקב שגיאה, הכפתור צריך להיות פעיל שוב.
    // הסטטוס 'error' יאפשר להציג את השגיאה, אבל לא ימנע לחיצה חוזרת אם צריך.
  };

  // --- Animation Variants ---
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
  // --- End Animation Variants ---

  // --- Helper to get button text based on status ---
  const getButtonText = (): string => {
    switch (submissionStatus) {
      case "savingProfile":
        return "שומר פרטים...";
      case "sendingCode":
        return "שולח קוד אימות...";
      case "error":
        // במקרה של שגיאה, חזור לטקסט המקורי כדי לאפשר ניסיון חוזר
        return data.isCompletingProfile ? "סיום והמשך לאימות" : "סיום והרשמה";
      case "idle":
      default:
        return data.isCompletingProfile ? "סיום והמשך לאימות" : "סיום והרשמה"; // טקסט דינמי בהתאם למצב
    }
  };
  // --- End Helper ---

  const isSubmitting =
    submissionStatus === "savingProfile" || submissionStatus === "sendingCode";

  // --- Render Component ---
  return (
    <motion.div
      className="space-y-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Title and Description */}
      <motion.h2
        className="text-xl font-bold text-gray-800 mb-1"
        variants={itemVariants}
      >
        מידע נוסף (אופציונלי)
      </motion.h2>
      <motion.p className="text-gray-600 text-sm mb-4" variants={itemVariants}>
        מידע זה יעזור לנו להתאים לך שידוכים מדויקים יותר. כל השדות הבאים הם
        אופציונליים אך מומלצים.
      </motion.p>

      {/* Display Error Alert if exists */}
      {error &&
        submissionStatus === "error" && ( // הצג שגיאה רק אם הסטטוס הוא error
          <motion.div variants={itemVariants}>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>שגיאה</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

      {/* Form Fields Container */}
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
            value={data.height ?? ""}
            onChange={(e) =>
              updateField(
                "height",
                e.target.value
                  ? parseInt(e.target.value, 10) || undefined
                  : undefined
              )
            }
            placeholder="לדוגמה: 175"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none disabled:bg-gray-100"
            disabled={isSubmitting} // Disable during submission
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
            value={data.occupation ?? ""}
            onChange={(e) => updateField("occupation", e.target.value)}
            placeholder="לדוגמה: מהנדס תוכנה, מורה, סטודנט/ית"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none disabled:bg-gray-100"
            disabled={isSubmitting} // Disable during submission
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
            value={data.education ?? ""}
            onChange={(e) => updateField("education", e.target.value)}
            placeholder="לדוגמה: תואר ראשון במדעי המחשב"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none disabled:bg-gray-100"
            disabled={isSubmitting} // Disable during submission
          />
        </div>
      </motion.div>
      {/* End Form Fields Container */}

      {/* Navigation Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-6"
      >
        {/* Back Button */}
        <Button
          type="button"
          onClick={prevStep}
          variant="outline"
          className="flex items-center gap-2 border-gray-300"
          disabled={isSubmitting} // Disable button while submitting
        >
          <ArrowRight className="h-4 w-4" /> {/* RTL: Right arrow for back */}
          חזרה
        </Button>

        {/* Submit/Complete Button */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting} // Disable button while submitting
          className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 flex items-center gap-2 min-w-[180px] justify-center px-4 py-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>{getButtonText()}</span> {/* טקסט דינמי */}
            </>
          ) : (
            <>
              <span>{getButtonText()}</span> {/* טקסט דינמי */}
              <ArrowLeft className="h-4 w-4 ml-2" />{" "}
              {/* RTL: Left arrow for continue */}
            </>
          )}
        </Button>
      </motion.div>
      {/* End Navigation Buttons */}
    </motion.div>
  );
};

export default OptionalInfoStep;
