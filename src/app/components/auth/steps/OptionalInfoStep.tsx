// src/app/components/auth/steps/OptionalInfoStep.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter for redirection
import { useRegistration } from "../RegistrationContext"; // Your registration context hook
import { Button } from "@/components/ui/button"; // Shadcn UI Button
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Shadcn UI Alert
import { Input } from "@/components/ui/input"; // Assuming Shadcn UI Input
import {
  ArrowLeft,
  ArrowRight,
  Ruler,
  Briefcase,
  GraduationCap,
  Loader2, // Spinner icon
  AlertCircle, // Error icon
} from "lucide-react";
import { motion } from "framer-motion"; // For animations

// Define the possible states during form submission
type SubmissionStatus = "idle" | "saving" | "sendingCode" | "error";

const OptionalInfoStep: React.FC = () => {
  // Get data and update functions from the registration context
  const { data, updateField, prevStep } = useRegistration();
  const router = useRouter(); // Initialize the router hook

  // State for loading indicators and error messages
  const [submissionStatus, setSubmissionStatus] =
    useState<SubmissionStatus>("idle");
  const [error, setError] = useState<string | null>(null); // Store error messages

  // --- Form Submission Handler ---
  const handleSubmit = async () => {
    setSubmissionStatus("saving"); // Start saving profile data
    setError(null); // Clear previous errors

    // --- Step 1: Save Profile Data ---
    try {
      // Prepare data payload for the profile API
      const profileData = {
        // Data from previous steps (PersonalDetailsStep)
        phone: data.phone,
        gender: data.gender,
        birthDate: data.birthDate,
        maritalStatus: data.maritalStatus,
        // Data from this step (OptionalInfoStep)
        height: data.height,
        occupation: data.occupation,
        education: data.education,
      };

      console.log("Submitting profile data:", profileData);

      // Call the API to save/update the profile details
      const profileResponse = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      // Handle non-successful profile save response
      if (!profileResponse.ok) {
        let errorMessage = "אירעה שגיאה בשמירת פרטי הפרופיל";
        try {
          const errorData = await profileResponse.json();
          // Use specific error from API if available
          errorMessage =
            errorData.error ||
            `שגיאה ${profileResponse.status}: ${profileResponse.statusText}`;
          console.error("API Error Details (complete-profile):", errorData);
        } catch (parseError) {
          // Fallback if error response is not JSON
          errorMessage = `שגיאה ${profileResponse.status}: ${profileResponse.statusText}`;
          console.error(
            "Failed to parse error response (complete-profile):",
            parseError
          );
        }
        // Throw error to be caught below, stopping the process
        throw new Error(errorMessage);
      }

      const profileResult = await profileResponse.json(); // Get success response if needed
      console.log("Profile data saved successfully:", profileResult);

      // --- Step 2: Send Phone Verification Code ---
      setSubmissionStatus("sendingCode"); // Update status
      console.log("Attempting to send phone verification code...");

      // Call the API responsible for sending the OTP
      const sendCodeResponse = await fetch("/api/auth/send-phone-code", {
        method: "POST",
        // No body needed, API uses the session to get the user ID and phone
      });

      // Handle non-successful OTP send response
      if (!sendCodeResponse.ok) {
        let errorMessage = "אירעה שגיאה בשליחת קוד האימות לוואטסאפ";
        try {
          const errorData = await sendCodeResponse.json();
          errorMessage =
            errorData.error ||
            `שגיאה ${sendCodeResponse.status}: ${sendCodeResponse.statusText}`;
          console.error("API Error Details (send-phone-code):", errorData);
        } catch (parseError) {
          errorMessage = `שגיאה ${sendCodeResponse.status}: ${sendCodeResponse.statusText}`;
          console.error(
            "Failed to parse error response (send-phone-code):",
            parseError
          );
        }
        // Throw error to be caught, stopping redirection
        throw new Error(errorMessage);
      }

      const sendCodeResult = await sendCodeResponse.json(); // Get success response
      console.log("Verification code sent successfully:", sendCodeResult);

      // --- Step 3: Redirect to Verification Page ---
      // Both API calls were successful, navigate the user
      console.log("Redirecting to /auth/verify-phone...");
      router.push("/auth/verify-phone");
    } catch (err) {
      // Catch errors from either API call
      console.error("Error during profile completion or OTP sending:", err);
      // Set the error state to display the message to the user
      setError(err instanceof Error ? err.message : "אירעה שגיאה לא צפויה");
      setSubmissionStatus("error"); // Set status to error
    } finally {
      // Reset status only if there was an error, otherwise redirection happens
      // If status is saving or sendingCode and an error occurred, it will be set to 'error' above.
      if (submissionStatus === "error") {
        // If the process resulted in an error, reset to idle after handling
        // This might need adjustment based on UX - maybe keep error state until user interaction?
        // setSubmissionStatus('idle'); // Re-enable the button after error
      }
      // No need to reset if redirecting
    }
  };
  // --- End Form Submission Handler ---

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
      case "saving":
        return "שומר פרטים...";
      case "sendingCode":
        return "שולח קוד אימות...";
      case "error":
        return data.isCompletingProfile ? "סיום והמשך לאימות" : "סיום והרשמה"; // Show original text on error
      case "idle":
      default:
        return data.isCompletingProfile ? "סיום והמשך לאימות" : "סיום והרשמה";
    }
  };
  // --- End Helper ---

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
      {error && (
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
            htmlFor="height"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <Ruler className="h-4 w-4 text-gray-400" />
            גובה (בסמ)
          </label>
          <Input // Use Shadcn Input
            type="number"
            id="height"
            min="120"
            max="220"
            value={data.height ?? ""} // Use ?? for undefined/null -> empty string
            onChange={(e) =>
              updateField(
                "height",
                // Parse to number, handle empty string or invalid input
                e.target.value
                  ? parseInt(e.target.value, 10) || undefined
                  : undefined
              )
            }
            placeholder="לדוגמה: 175"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
            disabled={
              submissionStatus === "saving" ||
              submissionStatus === "sendingCode"
            } // Disable during submission
          />
        </div>

        {/* Occupation Field */}
        <div className="space-y-1">
          <label
            htmlFor="occupation"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <Briefcase className="h-4 w-4 text-gray-400" />
            עיסוק
          </label>
          <Input // Use Shadcn Input
            type="text"
            id="occupation"
            value={data.occupation ?? ""}
            onChange={(e) => updateField("occupation", e.target.value)}
            placeholder="לדוגמה: מהנדס תוכנה, מורה, סטודנט/ית"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
            disabled={
              submissionStatus === "saving" ||
              submissionStatus === "sendingCode"
            } // Disable during submission
          />
        </div>

        {/* Education Field */}
        <div className="space-y-1">
          <label
            htmlFor="education"
            className="block text-sm font-medium text-gray-700 flex items-center gap-1"
          >
            <GraduationCap className="h-4 w-4 text-gray-400" />
            השכלה
          </label>
          <Input // Use Shadcn Input
            type="text"
            id="education"
            value={data.education ?? ""}
            onChange={(e) => updateField("education", e.target.value)}
            placeholder="לדוגמה: תואר ראשון במדעי המחשב"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-200 focus:border-cyan-500 focus:outline-none"
            disabled={
              submissionStatus === "saving" ||
              submissionStatus === "sendingCode"
            } // Disable during submission
          />
        </div>
      </motion.div>
      {/* End Form Fields Container */}

      {/* Navigation Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex justify-between pt-4 mt-6" // Added top margin
      >
        {/* Back Button */}
        <Button
          type="button" // Explicitly set type
          onClick={prevStep}
          variant="outline"
          className="flex items-center gap-2 border-gray-300"
          // Disable button while saving profile or sending code
          disabled={
            submissionStatus === "saving" || submissionStatus === "sendingCode"
          }
        >
          <ArrowRight className="h-4 w-4" /> {/* RTL: Right arrow for back */}
          חזרה
        </Button>

        {/* Submit/Complete Button */}
        <Button
          type="button" // Explicitly set type
          onClick={handleSubmit}
          // Disable button while saving profile or sending code
          disabled={
            submissionStatus === "saving" || submissionStatus === "sendingCode"
          }
          className="bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 flex items-center gap-2 min-w-[180px] justify-center px-4 py-2" // Ensure minimum width and padding
        >
          {/* Show spinner and dynamic text when busy */}
          {submissionStatus === "saving" ||
          submissionStatus === "sendingCode" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>{getButtonText()}</span>
            </>
          ) : (
            // Show regular text and icon when idle or on error
            <>
              <span>{getButtonText()}</span>
              <ArrowLeft className="h-4 w-4 ml-2" />{" "}
              {/* RTL: Left arrow for continue */}
            </>
          )}
        </Button>
      </motion.div>
      {/* End Navigation Buttons */}
    </motion.div>
  );
  // --- End Render Component ---
};

export default OptionalInfoStep;
