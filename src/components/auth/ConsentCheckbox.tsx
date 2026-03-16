// src/components/auth/ConsentCheckbox.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import type { RegisterStepsDict } from '@/types/dictionaries/auth';

// ============================================================================
// TYPES
// ============================================================================

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
  error?: string | null;
  dict: RegisterStepsDict['consentCheckbox'];
  disabled?: boolean;
  id?: string;
}

// ============================================================================
// ANIMATION
// ============================================================================

const errorVariants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: 0.15 } },
};

// ============================================================================
// COMPONENT
// ============================================================================

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  checked,
  onChange,
  error,
  dict,
  disabled = false,
  id = 'termsConsent',
}) => {
  // Safely split the consent text around link placeholders
  // Handles cases where placeholders might be missing from the dictionary
  const renderConsentText = () => {
    const text = dict.text;
    const termsIndex = text.indexOf('{termsLink}');
    const privacyIndex = text.indexOf('{privacyLink}');

    // If placeholders are missing, render the text as-is with links appended
    if (termsIndex === -1 || privacyIndex === -1) {
      return (
        <span>
          {text}{' '}
          <Link
            href="/legal/terms-of-service"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            {dict.termsLink}
          </Link>{' '}
          <Link
            href="/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
            onClick={(e) => e.stopPropagation()}
          >
            {dict.privacyLink}
          </Link>
        </span>
      );
    }

    // Normal flow: split by placeholders
    const parts = text.split(/\{termsLink\}|\{privacyLink\}/);

    return (
      <span>
        {parts[0]}
        <Link
          href="/legal/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {dict.termsLink}
        </Link>
        {parts[1]}
        <Link
          href="/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {dict.privacyLink}
        </Link>
        {parts[2]}
      </span>
    );
  };

  return (
    <div className="space-y-2">
      {/* Main consent row — using gap instead of space-x for RTL safety */}
      <div
        className={`
          flex items-start gap-3 p-3 rounded-xl transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${
            checked
              ? 'bg-teal-50/50 border border-teal-200'
              : error
                ? 'bg-red-50/30 border border-red-200'
                : 'hover:bg-gray-50 border border-transparent'
          }
        `}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
        role="checkbox"
        aria-checked={checked}
        aria-required="true"
        aria-invalid={!!error}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        {/* Checkbox — larger touch target for mobile */}
        <div className="mt-0.5 shrink-0">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => {
              if (!disabled) onChange(e.target.checked);
            }}
            disabled={disabled}
            aria-required="true"
            className={`
              h-5 w-5 rounded
              text-teal-600 border-gray-300
              focus:ring-teal-500 focus:ring-2 focus:ring-offset-1
              transition-colors duration-150
              disabled:cursor-not-allowed
              ${error ? 'border-red-500' : ''}
            `}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Label text with links */}
        <label
          htmlFor={id}
          className={`
            text-sm leading-relaxed select-none
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
            ${checked ? 'text-gray-800' : 'text-gray-700'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {renderConsentText()}
        </label>
      </div>

      {/* Error message with animation */}
      <AnimatePresence>
        {error && (
          <motion.p
            variants={errorVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-xs text-red-500 font-medium pr-8 rtl:pr-8 ltr:pl-8"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConsentCheckbox;
