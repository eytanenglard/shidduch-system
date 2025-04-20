"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RegistrationProvider, useRegistration } from './RegistrationContext';
import WelcomeStep from './steps/WelcomeStep';
import BasicInfoStep from './steps/BasicInfoStep';
import PersonalDetailsStep from './steps/PersonalDetailsStep';
import OptionalInfoStep from './steps/OptionalInfoStep';
import CompleteStep from './steps/CompleteStep';
import ProgressBar from './ProgressBar';
import { ArrowRight } from 'lucide-react';

// Wrapper component that uses the context
const RegisterStepsContent: React.FC = () => {
  const { data } = useRegistration();
  const router = useRouter();
  const { data: session } = useSession();

  // If user is already logged in, redirect to profile
  useEffect(() => {
    if (session?.user) {
      router.push('/profile');
    }
  }, [session, router]);

  // Render the current step
  const renderStep = () => {
    switch (data.step) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <PersonalDetailsStep />;
      case 3:
        return <OptionalInfoStep />;
      case 4:
        return <CompleteStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      {/* Back to home button */}
      <button 
        onClick={() => router.push('/')}
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לדף הבית
      </button>

      {/* Logo or branding */}
      <div className="mb-6">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-pink-500 text-3xl font-bold text-center mb-2">
          הרשמה למערכת
        </h1>
        <p className="text-gray-600 text-center max-w-md mx-auto">
          {data.step === 0 ? 'ברוכים הבאים! בואו נתחיל בצעדים פשוטים' : 
           data.step === 4 ? 'מצוין! הנה סיימנו את תהליך ההרשמה' :
           `שלב ${data.step} מתוך 3 - ממשיכים להתקדם`}
        </p>
      </div>

      {/* Progress bar (hidden on welcome and complete screens) */}
      {data.step > 0 && data.step < 4 && (
        <div className="w-full max-w-md mb-4">
          <ProgressBar currentStep={data.step} totalSteps={3} />
        </div>
      )}

      {/* Main content area */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
        <div className="p-6 sm:p-8">{renderStep()}</div>
      </div>
    </div>
  );
};

// Export with provider wrapper
export default function RegisterSteps() {
  return (
    <RegistrationProvider>
      <RegisterStepsContent />
    </RegistrationProvider>
  );
}