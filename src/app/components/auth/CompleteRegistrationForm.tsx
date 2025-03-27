"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Gender } from "@prisma/client";

interface CompleteRegistrationData {
  phone: string;
  gender: Gender;
  birthDate: string;
  maritalStatus?: string;
  height?: number;
  occupation?: string;
  education?: string;
  userId?: string;
  email?: string; // הוספנו אימייל למקרה שאין זיהוי לפי מזהה
}

export default function CompleteRegistrationForm() {
  const router = useRouter();
  const {
    data: session,
    update,
    status,
  } = useSession({
    required: false, // שינוי ל-false כדי לטפל במקרה שאין סשן
  });

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState("");

  // נסיון לקבל מידע על המשתמש מהסשן או מקורות אחרים
  useEffect(() => {
    const checkUserData = async () => {
      if (status === "loading") return;

      if (session?.user) {
        console.log("Session info:", {
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          hasProfile: !!session.user.profile,
          birthDate: session.user.profile?.birthDate,
          isProfileComplete: session.user.isProfileComplete, // בדיקה האם הפרופיל הושלם
        });

        // בדיקה לפי שדה isProfileComplete במקום רק לפי birthDate
        if (session.user.isProfileComplete) {
          console.log(
            "User already has a complete profile, redirecting to profile"
          );
          router.push("/profile");
          return;
        }
      } else {
        // אם אין סשן, נסה לקבל מידע ממקורות אחרים
        console.log(
          "No session found, trying to get user info from other sources"
        );
        setFallbackMode(true);

        // בדיקה אם יש מידע בלוקל סטורג'
        const lastEmail = localStorage.getItem("last_google_user_email");
        if (lastEmail) {
          setFallbackEmail(lastEmail);
        } else {
          // אם אין מידע במקורות אחרים, שלח לדף ההתחברות
          console.log("No user information found, redirecting to sign in");
          router.push("/auth/signin");
        }
      }
    };

    checkUserData();
  }, [session, status, router]);

  // טעינה
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      const data: CompleteRegistrationData = {
        phone: formData.get("phone") as string,
        gender: formData.get("gender") as Gender,
        birthDate: formData.get("birthDate") as string,
        maritalStatus: formData.get("maritalStatus") as string,
        height: formData.get("height")
          ? Number(formData.get("height"))
          : undefined,
        occupation: formData.get("occupation") as string,
        education: formData.get("education") as string,
      };

      // הוספת מזהה משתמש או אימייל לפי מה שזמין
      if (session?.user?.id) {
        data.userId = session.user.id;
      } else if (session?.user?.email) {
        data.email = session.user.email;
      } else if (fallbackEmail) {
        data.email = fallbackEmail;
      }

      console.log("Submitting form data:", data);

      // שליחת בקשה לעדכון פרופיל
      const response = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error completing registration:", result);
        throw new Error(result.error || "אירעה שגיאה בהשלמת הפרופיל");
      }

      console.log("Profile completed successfully:", result);

      // בדיקה שה-isProfileComplete הועבר מהשרת ובאמת מסומן כ-true
      if (result.user && result.user.isProfileComplete) {
        console.log("Profile marked as complete on the server");
      } else {
        console.warn(
          "Server response doesn't confirm profile is complete",
          result
        );
      }

      // אם היינו במצב פתרון חלופי, נסה להתחבר עם המשתמש שנוצר
      if (fallbackMode && result.user) {
        try {
          // נשמור את המזהה החדש למקרה שנצטרך אותו
          if (result.user.id) {
            localStorage.setItem(
              "completed_registration_user_id",
              result.user.id
            );
          }

          // הפניה לדף הפרופיל
          router.push("/profile");
          router.refresh();
          return;
        } catch (loginError) {
          console.error(
            "Error logging in after profile completion:",
            loginError
          );
        }
      }

      // עדכון הסשן עם הפרטים החדשים (אם יש סשן)
      if (session) {
        await update();
        console.log("Session updated, redirecting to profile page");
      }

      // הפנייה לדף הפרופיל
      router.push("/profile");
      router.refresh();
    } catch (error) {
      console.error("Form submission error:", error);
      setError(
        error instanceof Error ? error.message : "אירעה שגיאה בהשלמת הפרופיל"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-6">השלמת פרטי הרשמה</h2>

      {fallbackMode && (
        <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-yellow-800">
            השלמת הרישום מתבצעת במצב מיוחד. אנא וודא שהאימייל שלך תקין.
          </p>
          {fallbackEmail && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                אימייל שזוהה: {fallbackEmail}
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-gray-600 mb-4">
        כדי להשלים את תהליך ההרשמה, אנא מלא את הפרטים הבאים:
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* אם במצב fallback, הוסף שדה אימייל */}
        {fallbackMode && !fallbackEmail && (
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
              onChange={(e) => setFallbackEmail(e.target.value)}
            />
          </div>
        )}

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
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "שומר..." : "השלם הרשמה"}
        </button>
      </form>
    </div>
  );
}
