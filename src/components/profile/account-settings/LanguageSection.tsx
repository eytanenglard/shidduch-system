// src/components/profile/account-settings/LanguageSection.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Language } from '@prisma/client';
import type { AccountSettingsWithSessionProps } from './types';

const LanguageSection: React.FC<AccountSettingsWithSessionProps> = ({
  user,
  dict,
  locale,
  onSessionUpdate,
}) => {
  const { data: session } = useSession();

  const [preferredLanguage, setPreferredLanguage] = useState<Language>(
    user.language || Language.he
  );
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      if (
        session.user.language &&
        session.user.language !== preferredLanguage
      ) {
        setPreferredLanguage(session.user.language);
      }
    }
  }, [session?.user]);

  const handleLanguageChange = async (newLanguage: Language) => {
    const previousLanguage = preferredLanguage;
    setPreferredLanguage(newLanguage);
    setIsLanguageLoading(true);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLanguage }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update language.');
      }

      await onSessionUpdate();

      toast.success(dict.toasts.languageUpdateSuccess);
    } catch (error) {
      setPreferredLanguage(previousLanguage);
      toast.error(
        error instanceof Error
          ? error.message
          : dict.toasts.languageUpdateError
      );
    } finally {
      setIsLanguageLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {dict.sections.language.label}
        </p>
      </div>
      <div className="relative ms-4">
        <select
          id="language-select"
          value={preferredLanguage}
          onChange={(e) =>
            handleLanguageChange(e.target.value as Language)
          }
          disabled={isLanguageLoading}
          className="appearance-none rounded-lg border border-border bg-background px-3 py-2 pe-9 text-sm font-medium shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <option value="he">עברית</option>
          <option value="en">English</option>
        </select>
        {isLanguageLoading ? (
          <Loader2 className="absolute top-1/2 end-2.5 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground pointer-events-none" />
        ) : (
          <ChevronDown className="absolute top-1/2 end-2.5 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default LanguageSection;
