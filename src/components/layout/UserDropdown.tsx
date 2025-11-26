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

interface UserDropdownProps {
  session: NextAuthSession | null;
  mainProfileImage: UserImage | null;
  getInitials: () => string;
  handleSignOut: () => void;
  profileIconSize: string;
  dict?: UserDropdownDict;
  locale: 'he' | 'en';
}

const UserDropdown = ({
  session,
  mainProfileImage,
  getInitials,
  handleSignOut,
  profileIconSize,
  dict,
  locale,
}: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === 'he';

  useEffect(() => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="onboarding-target-profile-dropdown"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="user-menu"
        aria-label={safeDict.openMenuAriaLabel}
        // שינוי: Cyan -> Teal, הוספת Focus ring בצבע Teal
        className={`relative ${profileIconSize} rounded-full flex items-center justify-center text-sm shadow-md transition-all duration-300 cursor-pointer group overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 focus:ring-offset-white`}
      >
        {/* שינוי: Hover Ring בצבע Teal */}
        <div className="absolute inset-0 rounded-full transition-all duration-300 group-hover:ring-2 group-hover:ring-teal-400"></div>
        {mainProfileImage && mainProfileImage.url ? (
          <Image
            src={getRelativeCloudinaryPath(mainProfileImage.url)}
            alt={session.user.name || safeDict.profileImageAlt}
            fill
            className="object-cover rounded-full"
            sizes="(max-width: 768px) 40px, 40px"
          />
        ) : (
          // שינוי: Placeholder עם גרדיאנט עדין (Teal -> Orange) במקום Cyan שטוח
          <span className="font-semibold text-lg text-teal-800 bg-gradient-to-br from-teal-100 to-orange-100 w-full h-full flex items-center justify-center rounded-full">
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
          className={`absolute mt-3 w-56 bg-white rounded-xl shadow-2xl z-20 border border-gray-100 ${
            isRtl ? 'origin-top-left left-0' : 'origin-top-right right-0'
          }`}
        >
          <div className="p-1" role="none">
            {/* Header של התפריט - רקע עדין מאוד */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
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
              {/* שינוי: Hover Links ל-Teal */}
              <Link
                href={`/${locale}/profile`}
                role="menuitem"
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <User className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {safeDict.myProfile}
              </Link>
              <Link
                href={`/${locale}/questionnaire`}
                role="menuitem"
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Lightbulb className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {safeDict.questionnaire}
              </Link>
              <Link
                href={`/${locale}/settings`}
                role="menuitem"
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-teal-50 hover:text-teal-700 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Settings className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {safeDict.accountSettings}
              </Link>
            </div>
            <div className="py-1 border-t border-gray-100" role="none">
              {/* שינוי: יציאה באדום/Rose עדין כדי להתאים ל-Rose ב-Hero */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleSignOut();
                }}
                role="menuitem"
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
