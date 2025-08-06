// src/components/layout/UserDropdown.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, Settings, Lightbulb } from 'lucide-react';
import type { Session as NextAuthSession } from 'next-auth';
import type { UserImage } from '@/types/next-auth';
import { getRelativeCloudinaryPath } from '@/lib/utils';

const UserDropdown = ({
  session,
  mainProfileImage,
  getInitials,
  handleSignOut,
  profileIconSize,
}: {
  session: NextAuthSession | null;
  mainProfileImage: UserImage | null;
  getInitials: () => string;
  handleSignOut: () => void;
  profileIconSize: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- התחל שינוי ---
  // 1. הוספת state למעקב אחרי כיוון השפה
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    // 2. קביעת הכיווניות רק כשהרכיב נטען בצד הלקוח
    // כך אנו נמנעים משגיאות בצד השרת
    setIsRTL(document.documentElement.dir === 'rtl');

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // --- סיים שינוי ---

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="onboarding-target-profile-dropdown"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative ${profileIconSize} rounded-full flex items-center justify-center text-sm shadow-md transition-all duration-300 cursor-pointer group overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-white`}
        title={session.user.name || 'פרופיל'}
      >
        <div className="absolute inset-0 rounded-full transition-all duration-300 group-hover:ring-2 group-hover:ring-cyan-400"></div>
        {mainProfileImage && mainProfileImage.url ? (
          <Image
            src={getRelativeCloudinaryPath(mainProfileImage.url)}
            alt={session.user.name || 'תמונת פרופיל'}
            fill
            className="object-cover rounded-full"
            sizes="(max-width: 768px) 40px, 40px"
          />
        ) : (
          <span className="font-semibold text-lg text-cyan-700 bg-cyan-100 w-full h-full flex items-center justify-center rounded-full">
            {getInitials()}
          </span>
        )}
      </button>

      {isOpen && (
        // --- התחל שינוי ---
        // 3. שינוי הלוגיקה של המיקום וה-transform-origin
        <div
          className={`absolute mt-3 w-56 bg-white rounded-xl shadow-2xl z-20 border border-gray-100 ${
            isRTL ? 'origin-top-left left-0' : 'origin-top-right right-0'
          }`}
        >
          {/* --- סיים שינוי --- */}
          <div className="p-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
            <div className="py-1">
              <Link
                href="/profile"
                className="flex items-center w-full text-right px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className="ml-2 h-4 w-4" />
                פרופיל אישי
              </Link>
              <Link
                href="/questionnaire"
                className="flex items-center w-full text-right px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Lightbulb className="ml-2 h-4 w-4" />
                שאלון התאמה
              </Link>
              <Link
                href="/settings"
                className="flex items-center w-full text-right px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="ml-2 h-4 w-4" />
                הגדרות חשבון
              </Link>
            </div>
            <div className="py-1 border-t border-gray-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                className="w-full text-right flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="ml-2 h-4 w-4" />
                התנתקות
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
