// src/app/components/auth/steps/PersonalDetailsStep.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // הוספת update
import { useRegistration } from "../RegistrationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  ArrowRight,
  Phone,
  Calendar,
  Users,
  Edit3,
  Loader2, // הוספת אייקון טעינה
  AlertCircle, // הוספת אייקון לשגיאות
} from "lucide-react";
import { Gender } from "@prisma/client";
import { motion } from "framer-motion";
import ConsentCheckbox from "../ConsentCheckbox"; // ייבוא קומפוננטת ההסכמה
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // ייבוא רכיבי Alert

const PersonalDetailsStep: React.FC = () => {
  const { data: registrationState, updateField, nextStep, prevStep } = useRegistration();
  const { data: session, update: updateSessionHook } = useSession(); // שימוש ב-update מה-hook

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [ageError, setAgeError] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  // State עבור הסכמה
  const [consentChecked, setConsentChecked] = useState(
    !!session?.user?.termsAndPrivacyAcceptedAt // אתחול לפי הסשן
  );
  const [consentError, setConsentError] = useState<string | null>(null);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [generalApiError, setGeneralApiError] = useState<string | null>(null);

  const userHasAlreadyConsented = !!session?.user?.termsAndPrivacyAcceptedAt;

  // פונקציות ולידציה (נשארות זהות)
  const validateFirstName = (name: string): boolean => {
    const isValid = name.trim() !== "";
    setFirstNameError(isValid ? "" : "שם פרטי הוא שדה חובה");
    return isValid;
  };
  const validateLastName = (name: string): boolean => {
    const isValid = name.trim() !== "";
    setLastNameError(isValid ? "" : "שם משפחה הוא שדה חובה");
    return isValid;
  };
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^0\d{9}$/;
    const isValid = phoneRegex.test(phone);
    setPhoneError(
      isValid
        ? ""
        : phone.trim() === ""
        ? "מספר טלפון הוא שדה חובה"
        : "מספר טלפון לא תקין (10 ספרות, מתחיל ב-0)"
    );
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
      setAgeError("תאריך לידה לא תקין");
      return false;
    }
    setAgeError("");
    return true;
  };

  useEffect(() => {
    // אם המשתמש כבר אישר בעבר, נסמן את התיבה
    if (userHasAlreadyConsented) {
        setConsentChecked(true);
    }
  }, [userHasAlreadyConsented]);


  useEffect(() => {
    const isFirstNameValid = registrationState.firstName.trim() !== "" && !firstNameError;
    const isLastNameValid = registrationState.lastName.trim() !== "" && !lastNameError;
    const isPhoneValid =
      registrationState.phone.trim() !== "" &&
      /^0\d{9}$/.test(registrationState.phone) &&
      !phoneError;
    const isBirthDateValid = registrationState.birthDate !== "" && !ageError;
    const isGenderValid = registrationState.gender !== "";
    const isMaritalStatusValid = registrationState.maritalStatus !== "";

    // תקינות הטופס תלויה גם באישור התנאים (אם טרם אושרו)
    const consentRequirementMet = userHasAlreadyConsented || consentChecked;

    setIsFormValid(
      isFirstNameValid &&
        isLastNameValid &&
        isPhoneValid &&
        isBirthDateValid &&
        isGenderValid &&
        isMaritalStatusValid &&
        consentRequirementMet // הוספת דרישת הסכמה
    );
  }, [
    registrationState.firstName,
    registrationState.lastName,
    registrationState.phone,
    registrationState.birthDate,
    registrationState.gender,
    registrationState.maritalStatus,
    firstNameError,
    lastNameError,
    phoneError,
    ageError,
    consentChecked, // הוספת תלות
    userHasAlreadyConsented,
  ]);

  const handleContinue = async () => {
    setGeneralApiError(null); // איפוס שגיאה כללית
    setConsentError(null); // איפוס שגיאת הסכמה

    // ולידציות שדות
    const fnValid = validateFirstName(registrationState.firstName);
    const lnValid = validateLastName(registrationState.lastName);
    const pValid = validatePhone(registrationState.phone);
    const ageValid = validateAge(registrationState.birthDate);
    const genderValid = registrationState.gender !== "";
    const maritalValid = registrationState.maritalStatus !== "";

    if (!fnValid || !lnValid || !pValid || !ageValid || !genderValid || !maritalValid) {
      return; // עצור אם יש שגיאות בשדות
    }

    // בדיקה וטיפול בהסכמה אם נדרש
    if (!userHasAlreadyConsented) {
      if (!consentChecked) {
        setConsentError("חובה לאשר את תנאי השימוש ומדיניות הפרטיות.");
        return;
      }
      setIsSubmittingConsent(true);
      try {
        const consentResponse = await fetch("/api/user/accept-terms", {
          method: "POST",
        });
        const consentResult = await consentResponse.json();
        if (!consentResponse.ok || !consentResult.success) {
          throw new Error(consentResult.error || "שגיאה באישור התנאים.");
        }
        // לאחר אישור מוצלח, עדכן את הסשן (אם צריך)
        await updateSessionHook(); // קריאה לפונקציית העדכון מה-hook
        console.log("Terms accepted via API, session should be updated.");
      } catch (error) {
        setGeneralApiError(
          error instanceof Error ? error.message : "אירעה שגיאה באישור התנאים."
        );
        setIsSubmittingConsent(false);
        return;
      } finally {
        setIsSubmittingConsent(false);
      }
    }

    // אם הגענו לכאן, כל הולידציות עברו וההסכמה (אם נדרשה) טופלה
    nextStep(); // עבור לשלב הבא (OptionalInfoStep)
  };

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

      {generalApiError && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{generalApiError}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="space-y-4">
        {/* First Name Field */}
        <div className="space-y-1">
          <label htmlFor="firstNamePersonal" className="block text-sm font-medium text-gray-700">
            שם פרטי <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              id="firstNamePersonal"
              value={registrationState.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              onBlur={() => validateFirstName(registrationState.firstName)}
              placeholder="לדוגמה: ישראל"
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                firstNameError ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
              }`}
              disabled={isSubmittingConsent}
            />
          </div>
          {firstNameError && <p className="text-red-500 text-xs mt-1">{firstNameError}</p>}
        </div>

        {/* Last Name Field */}
        <div className="space-y-1">
          <label htmlFor="lastNamePersonal" className="block text-sm font-medium text-gray-700">
            שם משפחה <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Edit3 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              id="lastNamePersonal"
              value={registrationState.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              onBlur={() => validateLastName(registrationState.lastName)}
              placeholder="לדוגמה: ישראלי"
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                lastNameError ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
              }`}
              disabled={isSubmittingConsent}
            />
          </div>
          {lastNameError && <p className="text-red-500 text-xs mt-1">{lastNameError}</p>}
        </div>

        {/* Phone Field */}
        <div className="space-y-1">
          <label htmlFor="phonePersonal" className="block text-sm font-medium text-gray-700">
            טלפון נייד <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="tel"
              id="phonePersonal"
              value={registrationState.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              onBlur={() => validatePhone(registrationState.phone)}
              placeholder="0501234567"
              required
              maxLength={10}
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                phoneError ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
              }`}
              disabled={isSubmittingConsent}
            />
          </div>
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        </div>

        {/* Gender Field */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            מגדר <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {([
              { value: Gender.MALE, label: "זכר", icon: "👨" },
              { value: Gender.FEMALE, label: "נקבה", icon: "👩" },
            ] as const).map((genderOption) => (
              <button
                key={genderOption.value}
                type="button"
                onClick={() => updateField("gender", genderOption.value)}
                disabled={isSubmittingConsent}
                className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all duration-200 ease-in-out transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed ${
                  registrationState.gender === genderOption.value
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
          {registrationState.gender === "" && <p className="text-red-500 text-xs mt-1">יש לבחור מגדר</p>}
        </div>

        {/* Birth Date Field */}
        <div className="space-y-1">
          <label htmlFor="birthDatePersonal" className="block text-sm font-medium text-gray-700">
            תאריך לידה <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="date"
              id="birthDatePersonal"
              value={registrationState.birthDate}
              onChange={(e) => {
                updateField("birthDate", e.target.value);
                validateAge(e.target.value);
              }}
              onBlur={() => validateAge(registrationState.birthDate)}
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
              required
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                ageError ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
              }`}
              disabled={isSubmittingConsent}
            />
          </div>
          {ageError && <p className="text-red-500 text-xs mt-1">{ageError}</p>}
        </div>

        {/* Marital Status Field */}
        <div className="space-y-1">
          <label htmlFor="maritalStatusPersonal" className="block text-sm font-medium text-gray-700">
            מצב משפחתי <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              id="maritalStatusPersonal"
              value={registrationState.maritalStatus}
              onChange={(e) => updateField("maritalStatus", e.target.value)}
              required
              disabled={isSubmittingConsent}
              className={`w-full pr-10 pl-3 py-3 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${
                registrationState.maritalStatus === "" && false // Not a real error condition for select, just placeholder
                  ? "border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:ring-cyan-200 focus:border-cyan-500"
              }`}
            >
              <option value="" disabled>בחר/י מצב משפחתי...</option>
              <option value="רווק/ה">רווק/ה</option>
              <option value="גרוש/ה">גרוש/ה</option>
              <option value="אלמן/ה">אלמן/ה</option>
            </select>
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {registrationState.maritalStatus === "" && <p className="text-red-500 text-xs mt-1">יש לבחור מצב משפחתי</p>}
        </div>
      </motion.div>

      {/* Consent Checkbox - מוצג רק אם המשתמש טרם אישר */}
      {!userHasAlreadyConsented && (
        <motion.div variants={itemVariants} className="mt-6 pt-4 border-t border-gray-100">
          <ConsentCheckbox
            checked={consentChecked}
            onChange={(isChecked) => {
              setConsentChecked(isChecked);
              if (isChecked) setConsentError(null);
            }}
            error={consentError}
          />
        </motion.div>
      )}

      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center pt-5 mt-6 border-t border-gray-200"
      >
        <Button
          onClick={prevStep}
          variant="outline"
          className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={isSubmittingConsent || (registrationState.step === 0 && !registrationState.isCompletingProfile)}
        >
          <ArrowRight className="h-4 w-4" />
          חזרה
        </Button>

        <Button
          onClick={handleContinue}
          disabled={!isFormValid || isSubmittingConsent}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300
            ${
              isFormValid && !isSubmittingConsent
                ? "bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 shadow-lg hover:shadow-xl transform hover:scale-105"
                : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {isSubmittingConsent ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>מאשר תנאים...</span>
            </>
          ) : (
            <>
              <span>המשך לשלב הבא</span>
              <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PersonalDetailsStep;