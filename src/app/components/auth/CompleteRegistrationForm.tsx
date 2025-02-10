"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gender } from "@prisma/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompleteRegistrationFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    phone: string;
    firebaseUid: string;
  };
}

export default function CompleteRegistrationForm({
  initialData,
}: CompleteRegistrationFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (value: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(value)) {
      setPasswordError(
        "הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה, אות קטנה ומספר"
      );
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!validatePassword(password)) {
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      password: password,
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      phone: initialData.phone,
      firebaseUid: initialData.firebaseUid,
      gender: formData.get("gender") as Gender,
      birthDate: formData.get("birthDate"),
      maritalStatus: formData.get("maritalStatus"),
      height: formData.get("height")
        ? Number(formData.get("height"))
        : undefined,
      occupation: formData.get("occupation"),
      education: formData.get("education"),
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "אירעה שגיאה בהרשמה");
      }

      // העברה לדף אימות המייל
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(data.email as string)}`
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : "אירעה שגיאה בהרשמה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">השלמת פרטי הרשמה</h3>
        <p className="mt-1 text-sm text-gray-600">
          אימות הטלפון הושלם בהצלחה. אנא מלא את הפרטים הנוספים
        </p>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          אימייל
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          dir="ltr"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          סיסמה
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            validatePassword(e.target.value);
          }}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          dir="ltr"
        />
        <p className="mt-1 text-sm text-gray-500">
          הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה באנגלית, אות קטנה באנגלית
          ומספר
        </p>
        {passwordError && (
          <div className="text-red-500 text-sm">{passwordError}</div>
        )}
      </div>

      <div>
        <label
          htmlFor="gender"
          className="block text-sm font-medium text-gray-700"
        >
          מגדר
        </label>
        <select
          name="gender"
          id="gender"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">בחר מגדר</option>
          <option value="MALE">זכר</option>
          <option value="FEMALE">נקבה</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="birthDate"
          className="block text-sm font-medium text-gray-700"
        >
          תאריך לידה
        </label>
        <input
          type="date"
          name="birthDate"
          id="birthDate"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="maritalStatus"
          className="block text-sm font-medium text-gray-700"
        >
          מצב משפחתי
        </label>
        <select
          name="maritalStatus"
          id="maritalStatus"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">בחר מצב משפחתי</option>
          <option value="רווק/ה">רווק/ה</option>
          <option value="גרוש/ה">גרוש/ה</option>
          <option value="אלמן/ה">אלמן/ה</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="height"
          className="block text-sm font-medium text-gray-700"
        >
          גובה (בס"מ)
        </label>
        <input
          type="number"
          name="height"
          id="height"
          min="120"
          max="220"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="occupation"
          className="block text-sm font-medium text-gray-700"
        >
          עיסוק
        </label>
        <input
          type="text"
          name="occupation"
          id="occupation"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="education"
          className="block text-sm font-medium text-gray-700"
        >
          השכלה
        </label>
        <input
          type="text"
          name="education"
          id="education"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <button
        type="submit"
        disabled={isLoading || !!passwordError}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? "מבצע הרשמה..." : "השלם הרשמה"}
      </button>
    </form>
  );
}
