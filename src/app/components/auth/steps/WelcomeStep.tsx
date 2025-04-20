"use client";

import { useState } from "react";
import { useRegistration } from "../RegistrationContext";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

const WelcomeStep: React.FC = () => {
  const { nextStep,  } = useRegistration();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);

      // Store this information for potential fallback
      localStorage.setItem("registration_started", "true");

      // Use NextAuth to handle Google sign-in
      // The redirect/callback will be handled by NextAuth
      await signIn("google", { callbackUrl: "/auth/google-callback" });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    nextStep();
  };

  return (
    <div className="space-y-6 text-center">
      {/* Welcome animation */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center animate-pulse">
            <Heart className="h-10 w-10 text-pink-500 fill-pink-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold animate-bounce">
            <span className="text-sm">👋</span>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800">ברוכים הבאים!</h2>

      <p className="text-gray-600 max-w-sm mx-auto">
        אנחנו שמחים שבחרת להצטרף אלינו. בואו נתחיל בתהליך הרשמה קצר ופשוט שיאפשר
        לנו להכיר אותך טוב יותר.
      </p>

      {/* Buttons */}
      <div className="space-y-4 mt-8">
        <Button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          variant="outline"
          size="lg"
          className="w-full relative border-2 border-gray-300 hover:border-gray-400 py-6 rounded-xl flex items-center justify-center gap-3 group"
        >
          {isGoogleLoading ? (
            <div className="animate-spin h-5 w-5 border-2 border-gray-500 rounded-full border-t-transparent" />
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-gray-700 font-medium">המשך עם Google</span>
            </>
          )}
        </Button>

        <Button
          onClick={handleEmailSignUp}
          size="lg"
          className="w-full py-6 rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 shadow-lg flex items-center justify-center gap-3 group relative overflow-hidden"
        >
          {/* Button background shimmer effect */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
          <Mail className="h-5 w-5 text-white" />
          <span className="text-white font-medium">המשך עם אימייל</span>
          <ArrowLeft className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
      </div>

      {/* Already have an account link */}
      <div className="mt-8 pt-4 border-t border-gray-200">
        <p className="text-gray-600 text-sm">
          כבר יש לך חשבון?{" "}
          <Link
            href="/auth/signin"
            className="text-cyan-600 font-medium hover:text-cyan-700 hover:underline"
          >
            התחברות
          </Link>
        </p>
      </div>
    </div>
  );
};

export default WelcomeStep;
