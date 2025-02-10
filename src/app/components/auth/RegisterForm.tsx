"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gender } from "@prisma/client";

interface RegistrationFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string; // הוספת שדה טלפון
  gender: Gender;
  birthDate: string;
  maritalStatus?: string;
  height?: number;
  occupation?: string;
  education?: string;
}

export default function RegisterForm() {
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
    const data: RegistrationFormData = {
      email: formData.get("email") as string,
      password: password,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string, // הוספת שדה טלפון
      gender: formData.get("gender") as Gender,
      birthDate: formData.get("birthDate") as string,
      maritalStatus: formData.get("maritalStatus") as string,
      height: formData.get("height")
        ? Number(formData.get("height"))
        : undefined,
      occupation: formData.get("occupation") as string,
      education: formData.get("education") as string,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "אירעה שגיאה בהרשמה");
      }

      // העברה לדף אימות המייל
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "אירעה שגיאה בהרשמה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto">
      <div>
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700"
        >
          שם פרטי
        </label>
        <input
          type="text"
          name="firstName"
          id="firstName"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700"
        >
          שם משפחה
        </label>
        <input
          type="text"
          name="lastName"
          id="lastName"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        />
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
        />
      </div>

      {/* הוספת שדה טלפון */}
      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-gray-700"
        >
          טלפון נייד
        </label>
        <input
          type="tel"
          name="phone"
          id="phone"
          required
          pattern="[0-9]{10}"
          placeholder="0501234567"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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
          required
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
          גובה (בס&quot;מ)
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

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={isLoading || !!passwordError}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? "נרשם..." : "הרשמה"}
      </button>
    </form>
  );
}
