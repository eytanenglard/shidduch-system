// src/app/auth/reset-password/page.tsx
import ResetPasswordForm from "@/app/components/auth/ResetPasswordForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react"; // Import Suspense

// A wrapper component to allow useSearchParams in a Client Component
function ResetPasswordPageContent() {
    return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <Link
        href="/"
        className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
      >
        <ArrowLeft className="h-4 w-4 transform rtl:rotate-180" />
        חזרה לדף הבית
      </Link>
      {/* Wrap the client component that uses useSearchParams with Suspense */}
      <Suspense fallback={<div>טוען...</div>}>
        <ResetPasswordPageContent />
      </Suspense>
    </div>
  );
}