"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RegistrationProvider, useRegistration } from '@/app/components/auth/RegistrationContext';
import RegisterSteps from '@/app/components/auth/RegisterSteps';
import { SessionProvider } from 'next-auth/react';

// Component to handle Google signup callback
const GoogleCallbackContent = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { setGoogleSignup } = useRegistration();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      // Wait for session to load
      if (status === 'loading') return;

      try {
        // Check if we have a valid session
        if (session?.user) {
          console.log('Google auth callback - got user session');
          
          // Check if user already has a complete profile
          const userHasProfile = session.user.isProfileComplete;
          
          if (userHasProfile) {
            console.log('User already has a complete profile, redirecting to profile');
            router.push('/profile');
            return;
          }
          
          // Extract user data from session to pre-fill the registration form
          const userData = {
            email: session.user.email || '',
            firstName: session.user.firstName || '',
            lastName: session.user.lastName || '',
            // Initialize these to empty values to be filled by the user
            phone: '',
            gender: '' as const, // שימוש ב-as const במקום as ''
            birthDate: '',
            maritalStatus: '',
          };
          
          console.log('Initializing registration flow with Google data');
          setGoogleSignup(userData);
          setIsLoading(false);
        } else {
          // No session found, something went wrong with Google auth
          console.error('No session found after Google authentication');
          setError('ההתחברות דרך Google נכשלה, אנא נסה שוב או השתמש בהרשמה רגילה.');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error in Google callback:', error);
        setError('אירעה שגיאה בתהליך ההרשמה עם Google.');
        setIsLoading(false);
      }
    };

    handleGoogleCallback();
  }, [session, status, router, setGoogleSignup]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
        <div className="mb-4 w-16 h-16 border-4 border-t-4 border-cyan-500 border-t-pink-500 rounded-full animate-spin"></div>
        <h2 className="text-xl font-medium text-gray-700">מתחבר עם Google...</h2>
        <p className="text-gray-500 mt-2">אנא המתן בעת שאנחנו מעבדים את הפרטים שלך</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 className="text-xl font-bold text-center">שגיאת התחברות</h2>
          </div>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/auth/register')}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-lg"
            >
              נסה להירשם שוב
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
            >
              חזרה לדף הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If we're here, we have Google user data and we're continuing the registration flow
  return <RegisterSteps />;
};

// Export the page with providers
export default function GoogleCallbackPage() {
  return (
    <SessionProvider>
      <RegistrationProvider>
        <GoogleCallbackContent />
      </RegistrationProvider>
    </SessionProvider>
  );
}