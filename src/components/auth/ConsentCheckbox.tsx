// src/components/auth/ConsentCheckbox.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
  error?: string | null;
  dict: RegisterStepsDict['consentCheckbox'];
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  checked,
  onChange,
  error,
  dict,
}) => {
  const textParts = dict.text.split(/\{termsLink\}|\{privacyLink\}/);

  // Handle click on the container (but not on links)
  const handleContainerClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on a link
    if ((e.target as HTMLElement).tagName === 'A') {
      return;
    }
    onChange(!checked);
  };

  // Handle keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      // Don't toggle if focus is on a link
      if ((e.target as HTMLElement).tagName === 'A') {
        return;
      }
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className="space-y-2">
      {/* FIX: Made entire row clickable with larger touch target */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleContainerClick}
        onKeyDown={handleKeyDown}
        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer touch-manipulation active:bg-gray-100/50 hover:bg-gray-50/50 transition-colors select-none ${
          error ? 'bg-red-50/50' : ''
        }`}
      >
        {/* FIX: Larger checkbox container for easier touch */}
        <div className="flex items-center justify-center w-6 h-6 shrink-0 mt-0.5">
          <input
            type="checkbox"
            id="termsConsent"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className={`h-5 w-5 text-teal-600 border-2 border-gray-300 rounded focus:ring-teal-500 focus:ring-2 touch-manipulation cursor-pointer ${
              error ? 'border-red-500' : ''
            }`}
          />
        </div>

        {/* Label text with inline links */}
        <span className="text-sm text-gray-700 leading-relaxed flex-1">
          {textParts[0]}
          <Link
            href="/legal/terms-of-service"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2 touch-manipulation inline-block py-1"
          >
            {dict.termsLink}
          </Link>
          {textParts[1]}
          <Link
            href="/legal/privacy-policy"
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2 touch-manipulation inline-block py-1"
          >
            {dict.privacyLink}
          </Link>
          {textParts[2]}
        </span>
      </div>

      {error && <p className="text-xs text-red-500 pr-9">{error}</p>}
    </div>
  );
};

export default ConsentCheckbox;
