// src/app/components/auth/ConsentCheckbox.tsx
"use client";

import React from "react";
import Link from "next/link";

interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (isChecked: boolean) => void;
  error?: string | null;
}

const ConsentCheckbox: React.FC<ConsentCheckboxProps> = ({
  checked,
  onChange,
  error,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2 rtl:space-x-reverse">
        <input
          type="checkbox"
          id="termsConsent"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={`mt-1 h-4 w-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500 ${
            error ? "border-red-500" : ""
          }`}
        />
        <label htmlFor="termsConsent" className="text-sm text-gray-700">
          קראתי ואני מאשר/ת את{" "}
          <Link
            href="/legal/terms-of-service"
            target="_blank"
            className="font-medium text-cyan-600 hover:text-cyan-700 underline"
          >
            תנאי השימוש
          </Link>{" "}
          ואת{" "}
          <Link
            href="/legal/privacy-policy"
            target="_blank"
            className="font-medium text-cyan-600 hover:text-cyan-700 underline"
          >
            מדיניות הפרטיות
          </Link>{" "}
          של Matchpoint, ומסכים/ה לאיסוף, עיבוד ושמירת המידע האישי שלי, לרבות
          מידע רגיש, בהתאם למפורט בהם, ולהעברת המידע שלי לשרתים שעשויים להיות
          ממוקמים מחוץ לגבולות ישראל.
        </label>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ConsentCheckbox;