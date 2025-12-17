// src/components/auth/steps/WelcomeStep.tsx
'use client';

import { useState } from 'react';
import { useRegistration } from '../RegistrationContext';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Heart, ArrowLeft, Mail, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

interface WelcomeStepProps {
  dict: RegisterStepsDict['steps']['welcome'];
  locale: 'he' | 'en';
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ dict, locale }) => {
  const { nextStep } = useRegistration();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isRTL = locale === 'he';

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      localStorage.setItem('registration_started', 'true');
      await signIn('google', undefined, { hl: locale });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    nextStep();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className="space-y-8 text-center isolate"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ touchAction: 'manipulation' }}
    >
      {/* --- Icon Header --- */}
      <motion.div variants={itemVariants} className="flex justify-center mb-6">
        <div className="relative">
          {/* UPDATED: Glow Effect (Rose/Orange) - Moved to negative z-index */}
          <div
            className="absolute inset-0 bg-rose-200/60 rounded-full blur-xl animate-pulse -z-10"
            aria-hidden="true"
          ></div>

          {/* UPDATED: Card Background (White/Rose/Orange) */}
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white to-rose-50 border border-rose-100 flex items-center justify-center shadow-xl transform rotate-3 transition-transform hover:rotate-6 duration-500">
            {/* UPDATED: Icon Color (Rose to match the "Personal" principle) */}
            <Heart className="h-10 w-10 text-rose-500 fill-rose-500 drop-shadow-sm" />
          </div>

          {/* UPDATED: Decorative Element (Teal - for contrast) */}
          <motion.div
            className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-lg font-bold shadow-lg border-2 border-white"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            👋
          </motion.div>
        </div>
      </motion.div>

      {/* --- Title & Subtitle --- */}
      <motion.div variants={itemVariants} className="space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
          {dict.title}
        </h2>
        <p className="text-gray-600 max-w-sm mx-auto text-lg leading-relaxed">
          {dict.subtitle}
        </p>
      </motion.div>

      {/* --- Action Buttons --- */}
      <motion.div variants={itemVariants} className="space-y-4 mt-8">
        {/* Google Button */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          variant="outline"
          size="lg"
          className="w-full relative z-20 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 py-7 rounded-2xl flex items-center justify-center gap-3 group transition-all duration-300 shadow-sm hover:shadow-md"
        >
          {isGoogleLoading ? (
            <Loader2 className="animate-spin h-5 w-5 text-gray-500" />
          ) : (
            <>
              {/* Google SVG remains standard colors */}
              <svg
                className="h-6 w-6 flex-shrink-0 transition-transform group-hover:scale-110 duration-300"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
              <span className="text-gray-700 font-semibold text-base">
                {dict.googleButton}
              </span>
            </>
          )}
        </Button>

        {/* Email Button */}
        <Button
          onClick={handleEmailSignUp}
          size="lg"
          // UPDATED: Gradient (Teal -> Orange -> Amber)
          className="w-full relative z-20 py-7 rounded-2xl bg-gradient-to-r from-teal-500 via-orange-500 to-amber-500 hover:from-teal-600 hover:via-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group overflow-hidden"
        >
          {/* Shine Effect */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></span>

          <Mail className="h-5 w-5 text-white" />
          <span className="font-semibold text-base tracking-wide">
            {dict.emailButton}
          </span>
          {isRTL ? (
            <ArrowLeft className="h-5 w-5 text-white opacity-70 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300" />
          ) : (
            <ArrowRight className="h-5 w-5 text-white opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
          )}
        </Button>
      </motion.div>

      {/* --- Footer Links --- */}
      <motion.div
        variants={itemVariants}
        className="pt-6 border-t border-gray-100 relative z-20"
      >
        <p className="text-gray-500 text-sm">
          {dict.signInPrompt} {/* UPDATED: Link Gradient (Teal -> Orange) */}
          <Link
            href="/auth/signin"
            className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-orange-600 hover:from-teal-700 hover:to-orange-700 hover:underline transition-all"
          >
            {dict.signInLink}
          </Link>
        </p>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  );
};

export default WelcomeStep;
