import SignInForm from "@/app/components/auth/SignInForm";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            התחברות למערכת
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            או{" "}
            <Link
              href="/auth/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              הרשמה למערכת
            </Link>
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
