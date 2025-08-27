// src/components/layout/UserDropdown.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, Settings, Lightbulb } from 'lucide-react';
import type { Session as NextAuthSession } from 'next-auth';
import type { UserImage } from '@/types/next-auth';
import { getRelativeCloudinaryPath } from '@/lib/utils';
import type { UserDropdownDict } from '@/types/dictionary';

// ✨ שלב 1: הגדרת ממשק (Interface) עבור ה-Props של הרכיב
// הוספנו את המאפיין 'locale' כדי שהרכיב ידע לקבל אותו
interface UserDropdownProps {
  session: NextAuthSession | null;
  mainProfileImage: UserImage | null;
  getInitials: () => string;
  handleSignOut: () => void;
  profileIconSize: string;
  dict?: UserDropdownDict;
  locale: 'he' | 'en'; // <-- הוספה של המאפיין החסר
}

// ✨ שלב 2: עדכון חתימת הרכיב כדי להשתמש בממשק החדש ולקבל את 'locale'
const UserDropdown = ({
  session,
  mainProfileImage,
  getInitials,
  handleSignOut,
  profileIconSize,
  dict,
  locale, // <-- קבלת ה-prop
}: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✨ שלב 3: קביעת הכיווניות על בסיס ה-locale שהתקבל
  // זה מבטיח שהכיווניות נכונה גם ברינדור השרת ומונע קפיצות בטעינה
  const isRtl = locale === 'he';

  useEffect(() => {
    // לוגיקה לסגירת התפריט בלחיצה מחוצה לו (ללא שינוי)
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

  const safeDict = dict || {
    openMenuAriaLabel: 'Open user menu',
    profileImageAlt: 'Profile picture',
    myProfile: 'My Profile',
    questionnaire: 'Matching Questionnaire',
    accountSettings: 'Account Settings',
    signOut: 'Sign Out',
  };

  if (!session?.user) {
    return null;
  }

  // ✨ שלב 4: שימוש במשתנה isRtl וב-locale כדי להתאים את ה-CSS והקישורים
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="onboarding-target-profile-dropdown"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="user-menu"
        aria-label={safeDict.openMenuAriaLabel}
        className={`relative ${profileIconSize} rounded-full flex items-center justify-center text-sm shadow-md transition-all duration-300 cursor-pointer group overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-white`}
      >
        <div className="absolute inset-0 rounded-full transition-all duration-300 group-hover:ring-2 group-hover:ring-cyan-400"></div>
        {mainProfileImage && mainProfileImage.url ? (
          <Image
            src={getRelativeCloudinaryPath(mainProfileImage.url)}
            alt={session.user.name || safeDict.profileImageAlt}
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
        <div
          id="user-menu"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="onboarding-target-profile-dropdown"
          // התאמת מיקום התפריט הנפתח לפי כיוון השפה
          className={`absolute mt-3 w-56 bg-white rounded-xl shadow-2xl z-20 border border-gray-100 ${
            isRtl ? 'origin-top-left left-0' : 'origin-top-right right-0'
          }`}
        >
          <div className="p-1" role="none">
            <div className="px-4 py-3 border-b border-gray-100">
              <p
                className="text-sm font-semibold text-gray-800 truncate"
                role="none"
              >
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate" role="none">
                {session.user.email}
              </p>
            </div>
            <div className="py-1" role="none">
              {/* בניית קישורים דינמיים עם תחילית השפה */}
              <Link
                href={`/${locale}/profile`}
                role="menuitem"
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {/* התאמת מיקום האייקון לפי כיוון השפה */}
                <User className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {safeDict.myProfile}
              </Link>
              <Link
                href={`/${locale}/questionnaire`}
                role="menuitem"
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Lightbulb className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {safeDict.questionnaire}
              </Link>
              <Link
                href={`/${locale}/settings`}
                role="menuitem"
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {safeDict.accountSettings}
              </Link>
            </div>
            <div className="py-1 border-t border-gray-100" role="none">
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                role="menuitem"
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {safeDict.signOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
