// src/components/profile/account-settings/ConsentTogglesSection.tsx

'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import type { AccountSettingsWithSessionProps } from './types';

interface ConsentTogglesSectionProps extends AccountSettingsWithSessionProps {
  sectionMode: 'firstParty' | 'email';
}

const ConsentTogglesSection: React.FC<ConsentTogglesSectionProps> = ({
  user,
  dict,
  locale,
  onSessionUpdate,
  sectionMode,
}) => {
  const { data: session } = useSession();

  // Email consent states
  const [engagementConsent, setEngagementConsent] = useState(
    user.engagementEmailsConsent || false
  );
  const [promotionalConsent, setPromotionalConsent] = useState(
    user.promotionalEmailsConsent || false
  );
  const [isEngagementLoading, setIsEngagementLoading] = useState(false);
  const [isPromotionalLoading, setIsPromotionalLoading] = useState(false);

  // First party consent state
  const [wantsToBeFirstParty, setWantsToBeFirstParty] = useState<boolean>(
    user.wantsToBeFirstParty ?? true
  );
  const [isFirstPartyLoading, setIsFirstPartyLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      if (
        typeof session.user.engagementEmailsConsent === 'boolean' &&
        session.user.engagementEmailsConsent !== engagementConsent
      ) {
        setEngagementConsent(session.user.engagementEmailsConsent);
      }
      if (
        typeof session.user.promotionalEmailsConsent === 'boolean' &&
        session.user.promotionalEmailsConsent !== promotionalConsent
      ) {
        setPromotionalConsent(session.user.promotionalEmailsConsent);
      }
    }
  }, [session?.user]);

  const handleConsentChange = async (
    consentType: 'engagement' | 'promotional',
    checked: boolean
  ) => {
    const setLoading =
      consentType === 'engagement'
        ? setIsEngagementLoading
        : setIsPromotionalLoading;
    const setConsent =
      consentType === 'engagement'
        ? setEngagementConsent
        : setPromotionalConsent;
    const previousValue =
      consentType === 'engagement' ? engagementConsent : promotionalConsent;

    setLoading(true);
    setConsent(checked);

    try {
      const response = await fetch('/api/user/consent-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentType, consentValue: checked }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setConsent(previousValue);
        throw new Error(result.error || 'Failed to update preferences.');
      }

      toast.success(dict.toasts.consentUpdateSuccess);
      await onSessionUpdate();
    } catch (error) {
      setConsent(previousValue);
      toast.error(
        error instanceof Error ? error.message : dict.toasts.consentUpdateError
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFirstPartyChange = async (newValue: boolean) => {
    const previous = wantsToBeFirstParty;
    setIsFirstPartyLoading(true);
    setWantsToBeFirstParty(newValue);

    try {
      const response = await fetch('/api/profile/first-party-preference', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wantsToBeFirstParty: newValue }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setWantsToBeFirstParty(previous);
        throw new Error(result.error || 'Failed to update preference.');
      }

      toast.success(
        newValue
          ? dict.toasts.firstPartyEnabled
          : dict.toasts.firstPartyDisabled
      );
    } catch (error) {
      setWantsToBeFirstParty(previous);
      toast.error(
        error instanceof Error
          ? error.message
          : dict.toasts.firstPartyError
      );
    } finally {
      setIsFirstPartyLoading(false);
    }
  };

  if (sectionMode === 'firstParty') {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Yes option */}
          <button
            onClick={() =>
              !isFirstPartyLoading && handleFirstPartyChange(true)
            }
            disabled={isFirstPartyLoading}
            className={cn(
              'relative flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 text-start',
              wantsToBeFirstParty
                ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50',
              isFirstPartyLoading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isFirstPartyLoading && wantsToBeFirstParty ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  wantsToBeFirstParty
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40'
                )}
              >
                {wantsToBeFirstParty && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            )}
            <span>{dict.sections.matchPreferences.yesOption}</span>
          </button>

          {/* No option */}
          <button
            onClick={() =>
              !isFirstPartyLoading && handleFirstPartyChange(false)
            }
            disabled={isFirstPartyLoading}
            className={cn(
              'relative flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 text-start',
              !wantsToBeFirstParty
                ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50',
              isFirstPartyLoading && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isFirstPartyLoading && !wantsToBeFirstParty ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  !wantsToBeFirstParty
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40'
                )}
              >
                {!wantsToBeFirstParty && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            )}
            <span>{dict.sections.matchPreferences.noOption}</span>
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {wantsToBeFirstParty
            ? dict.sections.matchPreferences.yesDescription
            : dict.sections.matchPreferences.noDescription}
        </p>
      </div>
    );
  }

  // Email communication toggles
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-3 border-b border-border/40">
        <div className="min-w-0 flex-1 me-4">
          <Label
            htmlFor="engagement-switch"
            className="cursor-pointer text-sm font-medium text-foreground"
          >
            {dict.sections.communication.engagement.label}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dict.sections.communication.engagement.description}
          </p>
        </div>
        <Switch
          id="engagement-switch"
          checked={engagementConsent}
          onCheckedChange={(checked) =>
            handleConsentChange('engagement', checked)
          }
          disabled={isEngagementLoading}
        />
      </div>
      <div className="flex items-center justify-between py-3">
        <div className="min-w-0 flex-1 me-4">
          <Label
            htmlFor="promotional-switch"
            className="cursor-pointer text-sm font-medium text-foreground"
          >
            {dict.sections.communication.promotional.label}
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dict.sections.communication.promotional.description}
          </p>
        </div>
        <Switch
          id="promotional-switch"
          checked={promotionalConsent}
          onCheckedChange={(checked) =>
            handleConsentChange('promotional', checked)
          }
          disabled={isPromotionalLoading}
        />
      </div>
    </div>
  );
};

export default ConsentTogglesSection;
