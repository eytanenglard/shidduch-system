// src/components/profile/account-settings.tsx

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Clock,
  Bell,
  Key,
  Globe,
  Heart,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  Link2,
  Download,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import type { AccountSettingsDict } from '@/types/dictionary';
import type { Locale } from '../../../i18n-config';
import type { AccountSettingsUser } from './account-settings/types';
import PasswordSection from './account-settings/PasswordSection';
import ConsentTogglesSection from './account-settings/ConsentTogglesSection';
import LanguageSection from './account-settings/LanguageSection';
import DeleteAccountDialog from './account-settings/DeleteAccountDialog';

interface AccountSettingsProps {
  user: AccountSettingsUser;
  dict: AccountSettingsDict;
  locale: Locale;
}

/* ── Animation variants ── */
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/* ── Reusable section wrapper ── */
const SettingsSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
}> = ({ icon, title, description, children, variant = 'default' }) => (
  <motion.section
    variants={sectionVariants}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow-sm',
      variant === 'danger'
        ? 'border-red-200 dark:border-red-900/50'
        : 'border-border'
    )}
  >
    <div className="px-5 py-4 border-b border-border/60">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg',
            variant === 'danger'
              ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {icon}
        </div>
        <div>
          <h3
            className={cn(
              'text-sm font-semibold',
              variant === 'danger' && 'text-red-700 dark:text-red-400'
            )}
          >
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
    <div className="px-5 py-4">{children}</div>
  </motion.section>
);

/* ── Info row: label + value ── */
const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
  isLast?: boolean;
}> = ({ label, value, action, isLast }) => (
  <div
    className={cn(
      'flex items-center justify-between py-3',
      !isLast && 'border-b border-border/40'
    )}
  >
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="text-sm text-foreground mt-0.5">{value}</div>
    </div>
    {action && <div className="ms-4 flex-shrink-0">{action}</div>}
  </div>
);

/* ── Provider icon helper ── */
const ProviderIcon: React.FC<{ provider: string }> = ({ provider }) => {
  switch (provider) {
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
      );
    case 'apple':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.32 2.32-2.13 4.45-3.74 4.25z" />
        </svg>
      );
    default:
      return <Mail className="w-5 h-5" />;
  }
};

/* ── User initials avatar ── */
const UserAvatar: React.FC<{
  firstName: string;
  lastName: string;
  image?: string | null;
}> = ({ firstName, lastName, image }) => {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

  if (image) {
    return (
      <img
        src={image}
        alt={`${firstName} ${lastName}`}
        className="w-16 h-16 rounded-full object-cover ring-2 ring-border"
      />
    );
  }

  return (
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center ring-2 ring-border">
      <span className="text-xl font-bold text-primary-foreground">
        {initials || '?'}
      </span>
    </div>
  );
};

const AccountSettings: React.FC<AccountSettingsProps> = ({
  user: propUser,
  dict,
  locale,
}) => {
  const { update: updateSession } = useSession();
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSessionUpdate = async () => {
    await updateSession();
  };

  const sendVerificationEmail = async () => {
    setIsSendingVerification(true);
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: propUser.email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification email');
      }
      toast.success(dict.toasts.verificationSentSuccess, {
        description: dict.toasts.verificationSentDesc,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : dict.toasts.sendVerificationError,
        { description: dict.toasts.sendVerificationDesc }
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/user/export-data', { method: 'GET' });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `neshamatech-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(dict.sections.privacy.exportSuccess);
    } catch {
      toast.error(dict.sections.privacy.exportError);
    } finally {
      setIsExporting(false);
    }
  };

  if (!propUser) {
    return <div>{dict.loadingText}</div>;
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-5 pb-8"
      dir={locale === 'he' ? 'rtl' : 'ltr'}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Profile Header ── */}
      <motion.div
        variants={sectionVariants}
        className="flex items-center gap-4 pt-1 pb-2"
      >
        <UserAvatar
          firstName={propUser.firstName}
          lastName={propUser.lastName}
          image={propUser.image}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold tracking-tight truncate">
            {propUser.firstName} {propUser.lastName}
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            {propUser.email}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 font-medium"
            >
              {dict.sections.status.roles[propUser.role]}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-2 py-0.5 font-medium',
                propUser.status === 'ACTIVE'
                  ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400'
                  : ''
              )}
            >
              {dict.sections.status.statuses[propUser.status]}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* ── Personal Info ── */}
      <SettingsSection
        icon={<User className="w-4 h-4" />}
        title={dict.sections.personal.title}
      >
        <InfoRow
          label={dict.sections.personal.fullNameLabel}
          value={
            <span className="font-medium">
              {propUser.firstName || ''}{' '}
              {propUser.lastName || dict.sections.personal.fullNameNotSet}
            </span>
          }
        />
        <InfoRow
          label={dict.sections.personal.emailLabel}
          value={
            <div className="flex items-center gap-2 flex-wrap">
              <span>{propUser.email}</span>
              {propUser.isVerified ? (
                <Badge
                  variant="outline"
                  className="border-green-200 bg-green-50 text-green-700 text-[10px] px-1.5 py-0 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                >
                  <CheckCircle2 className="w-3 h-3 me-1" />
                  {dict.sections.status.verification.verified}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-200 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                >
                  <XCircle className="w-3 h-3 me-1" />
                  {dict.sections.status.verification.notVerified}
                </Badge>
              )}
            </div>
          }
          action={
            !propUser.isVerified ? (
              <Button
                variant="outline"
                size="sm"
                onClick={sendVerificationEmail}
                disabled={isSendingVerification}
                className="text-xs h-8"
              >
                {isSendingVerification ? (
                  <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5 me-1.5" />
                )}
                {dict.sections.personal.sendVerificationButton}
              </Button>
            ) : undefined
          }
          isLast
        />
      </SettingsSection>

      {/* ── Connected Accounts ── */}
      {propUser.accounts && propUser.accounts.length > 0 && (
        <SettingsSection
          icon={<Link2 className="w-4 h-4" />}
          title={dict.sections.connectedAccounts.title}
          description={dict.sections.connectedAccounts.description}
        >
          <div className="space-y-2">
            {propUser.accounts.map((account, idx) => (
              <div
                key={`${account.provider}-${idx}`}
                className={cn(
                  'flex items-center gap-3 py-2.5',
                  idx < (propUser.accounts?.length ?? 0) - 1 &&
                    'border-b border-border/40'
                )}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted">
                  <ProviderIcon provider={account.provider} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {dict.sections.connectedAccounts.providers[
                      account.provider as keyof typeof dict.sections.connectedAccounts.providers
                    ] || account.provider}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dict.sections.connectedAccounts.connectedVia}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="border-green-200 bg-green-50 text-green-700 text-[10px] dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                >
                  <CheckCircle2 className="w-3 h-3 me-1" />
                  {dict.sections.status.verification.verified}
                </Badge>
              </div>
            ))}
          </div>
        </SettingsSection>
      )}

      {/* ── Language ── */}
      <SettingsSection
        icon={<Globe className="w-4 h-4" />}
        title={dict.sections.language.title}
        description={dict.sections.language.description}
      >
        <LanguageSection
          user={propUser}
          dict={dict}
          locale={locale}
          onSessionUpdate={handleSessionUpdate}
        />
      </SettingsSection>

      {/* ── Match Suggestion Preferences ── */}
      <SettingsSection
        icon={<Heart className="w-4 h-4" />}
        title={dict.sections.matchPreferences.title}
        description={dict.sections.matchPreferences.description}
      >
        <ConsentTogglesSection
          user={propUser}
          dict={dict}
          locale={locale}
          onSessionUpdate={handleSessionUpdate}
          sectionMode="firstParty"
        />
      </SettingsSection>

      {/* ── Notifications ── */}
      <SettingsSection
        icon={<Bell className="w-4 h-4" />}
        title={dict.sections.communication.title}
      >
        <ConsentTogglesSection
          user={propUser}
          dict={dict}
          locale={locale}
          onSessionUpdate={handleSessionUpdate}
          sectionMode="email"
        />
      </SettingsSection>

      {/* ── Account Status ── */}
      <SettingsSection
        icon={<Shield className="w-4 h-4" />}
        title={dict.sections.status.title}
      >
        <InfoRow
          label={dict.sections.status.timeInfoLabel}
          value={
            <div className="flex flex-col gap-0.5 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {dict.sections.status.createdAt}{' '}
                <span className="text-foreground">
                  {new Date(propUser.createdAt).toLocaleDateString(locale)}
                </span>
              </span>
              {propUser.lastLogin && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {dict.sections.status.lastLogin}{' '}
                  <span className="text-foreground">
                    {new Date(propUser.lastLogin).toLocaleDateString(locale)}
                  </span>
                </span>
              )}
            </div>
          }
          isLast
        />
      </SettingsSection>

      {/* ── Security ── */}
      <SettingsSection
        icon={<Key className="w-4 h-4" />}
        title={dict.sections.security.title}
        description={dict.sections.security.description}
      >
        <PasswordSection user={propUser} dict={dict} locale={locale} />
      </SettingsSection>

      {/* ── Privacy & Export Data ── */}
      <SettingsSection
        icon={<Download className="w-4 h-4" />}
        title={dict.sections.privacy.title}
        description={dict.sections.privacy.description}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              {dict.sections.privacy.exportDescription}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={isExporting}
            className="ms-4 text-xs h-8"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 me-1.5" />
            )}
            {isExporting
              ? dict.sections.privacy.exportLoading
              : dict.sections.privacy.exportButton}
          </Button>
        </div>
      </SettingsSection>

      {/* ── Danger Zone ── */}
      <SettingsSection
        icon={<AlertCircle className="w-4 h-4" />}
        title={dict.sections.delete.title}
        description={dict.sections.delete.description}
        variant="danger"
      >
        <DeleteAccountDialog user={propUser} dict={dict} locale={locale} />
      </SettingsSection>
    </motion.div>
  );
};

export default AccountSettings;
