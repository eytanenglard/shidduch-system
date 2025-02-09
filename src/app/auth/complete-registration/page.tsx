// src/app/auth/complete-registration/page.tsx
import CompleteRegistrationForm from "@/app/components/auth/CompleteRegistrationForm";
import Link from "next/link";

export default function CompleteRegistrationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            השלמת הרשמה למערכת
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            נא להשלים את פרטי החשבון שלך
          </p>
        </div>
        <CompleteRegistrationForm />
      </div>
    </div>
  );
}
