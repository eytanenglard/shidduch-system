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

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2 rtl:space-x-reverse">
        <input
          type="checkbox"
          id="termsConsent"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={`mt-1 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 ${error ? 'border-red-500' : ''}`}
        />
        <label htmlFor="termsConsent" className="text-sm text-gray-700">
          {textParts[0]}
          <Link
            href="/legal/terms-of-service"
            target="_blank"
            className="font-medium text-cyan-600 hover:text-cyan-700 underline"
          >
            {dict.termsLink}
          </Link>
          {textParts[1]}
          <Link
            href="/legal/privacy-policy"
            target="_blank"
            className="font-medium text-cyan-600 hover:text-cyan-700 underline"
          >
            {dict.privacyLink}
          </Link>
          {textParts[2]}
        </label>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ConsentCheckbox;
