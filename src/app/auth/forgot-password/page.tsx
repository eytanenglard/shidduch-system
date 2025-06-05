// src/app/auth/forgot-password/page.tsx
import ForgotPasswordForm from "@/app/components/auth/ForgotPasswordForm";
import { ArrowLeft } from "lucide-react"; // Assuming you use lucide-react
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
        <Link
            href="/"
            className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
        >
            <ArrowLeft className="h-4 w-4 transform rtl:rotate-180" /> {/* Corrected for RTL if needed */}
            חזרה לדף הבית
        </Link>
      <ForgotPasswordForm />
    </div>
  );
}