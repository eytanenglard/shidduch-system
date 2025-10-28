// src/components/profile/account-settings.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Languages, User, Mail, Key, Shield, Clock, Eye, EyeOff, CheckCircle, XCircle, Bell, Settings, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useSession, signOut } from 'next-auth/react';
import { UserRole, UserStatus, Language } from '@prisma/client';
import type { AccountSettingsDict } from '@/types/dictionary';
import type { Locale } from '../../../i18n-config';

interface AccountSettingsProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    engagementEmailsConsent?: boolean; // שדה חדש
    promotionalEmailsConsent?: boolean; // שדה חדש
    language?: Language;
  };
  dict: AccountSettingsDict;
  locale: Locale;
}

const PASSWORD_MIN_LENGTH = 8;

const AccountSettings: React.FC<AccountSettingsProps> = ({ user: propUser, dict, locale }) => {
  const { data: session, status: sessionStatus, update: updateSession } = useSession();

  // States for consents
  const [engagementConsent, setEngagementConsent] = useState(propUser.engagementEmailsConsent || false);
  const [promotionalConsent, setPromotionalConsent] = useState(propUser.promotionalEmailsConsent || false);
  const [isEngagementLoading, setIsEngagementLoading] = useState(false);
  const [isPromotionalLoading, setIsPromotionalLoading] = useState(false);

  // Other states
  const [preferredLanguage, setPreferredLanguage] = useState<Language>(propUser.language || Language.he);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeStep, setPasswordChangeStep] = useState(1);
  const [, setShowVerificationInput] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      if (session.user.language && session.user.language !== preferredLanguage) {
        setPreferredLanguage(session.user.language);
      }
      if (typeof session.user.engagementEmailsConsent === 'boolean' && session.user.engagementEmailsConsent !== engagementConsent) {
        setEngagementConsent(session.user.engagementEmailsConsent);
      }
      if (typeof session.user.promotionalEmailsConsent === 'boolean' && session.user.promotionalEmailsConsent !== promotionalConsent) {
        setPromotionalConsent(session.user.promotionalEmailsConsent);
      }
    }
  }, [session?.user]);

  const canChangePassword = useMemo(() => {
    if (sessionStatus === 'authenticated' && session?.user?.accounts) {
      return session.user.accounts.some((acc) => acc.provider === 'credentials');
    }
    return false;
  }, [session, sessionStatus]);

  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      setPasswordRequirements({ length: false, uppercase: false, lowercase: false, number: false });
      return;
    }
    const requirements = {
      length: newPassword.length >= PASSWORD_MIN_LENGTH,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
    };
    setPasswordRequirements(requirements);
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(metRequirements * 25);
  }, [newPassword]);

  const validatePassword = (password: string) => {
    const { requirements } = dict.passwordDialog;
    if (password.length < PASSWORD_MIN_LENGTH) throw new Error(requirements.length.replace('{{count}}', String(PASSWORD_MIN_LENGTH)));
    if (!/[A-Z]/.test(password)) throw new Error(requirements.uppercase);
    if (!/[a-z]/.test(password)) throw new Error(requirements.lowercase);
    if (!/[0-9]/.test(password)) throw new Error(requirements.number);
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setShowVerificationInput(false);
    setIsChangingPassword(false);
    setPasswordChangeStep(1);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const sendVerificationEmail = async () => {
    setIsSendingVerification(true);
    try {
      const response = await fetch(`/api/auth/send-verification`, {
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
        icon: <Mail className="h-5 w-5 text-blue-500" />,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dict.toasts.sendVerificationError, {
        description: dict.toasts.sendVerificationDesc,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  const initiatePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(dict.toasts.fillAllFieldsError, { description: dict.toasts.fillAllFieldsDesc, icon: <AlertCircle className="h-5 w-5 text-red-500" /> });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(dict.toasts.passwordsMismatchError, { description: dict.toasts.passwordsMismatchDesc, icon: <AlertCircle className="h-5 w-5 text-red-500" /> });
      return;
    }
    try {
      validatePassword(newPassword);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dict.toasts.passwordValidationError, {
        description: dict.toasts.passwordValidationDesc,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/initiate-password-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: propUser.id, currentPassword, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate password change');
      }
      setPasswordChangeStep(2);
      setShowVerificationInput(true);
      toast.success(dict.toasts.verificationSentSuccess, {
        description: dict.toasts.verificationSentDesc,
        icon: <Mail className="h-5 w-5 text-blue-500" />,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dict.toasts.initiatePasswordError, {
        description: dict.toasts.initiatePasswordDesc,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completePasswordChange = async () => {
    if (!verificationCode || !/^\d{6}$/.test(verificationCode)) {
      toast.error(dict.toasts.invalidVerificationCode, {
        description: dict.toasts.invalidVerificationCodeDesc,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/complete-password-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: propUser.id, token: verificationCode, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete password change');
      }
      toast.success(dict.toasts.passwordUpdateSuccess, {
        description: dict.toasts.passwordUpdateSuccessDesc,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      resetPasswordForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dict.toasts.passwordUpdateError, {
        description: dict.toasts.passwordUpdateDesc,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== dict.deleteDialog.confirmationPhrase) {
      toast.error(dict.toasts.invalidDeleteConfirmation, {
        description: dict.toasts.invalidDeleteConfirmationDesc.replace('{{phrase}}', dict.deleteDialog.confirmationPhrase),
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/delete`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }
      toast.success(dict.toasts.deleteSuccess, {
        description: dict.toasts.deleteSuccessDesc,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : dict.toasts.deleteError, {
        description: dict.toasts.deleteErrorDesc,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentChange = async (consentType: 'engagement' | 'promotional', checked: boolean) => {
    const setLoading = consentType === 'engagement' ? setIsEngagementLoading : setIsPromotionalLoading;
    const setConsent = consentType === 'engagement' ? setEngagementConsent : setPromotionalConsent;
    const previousValue = consentType === 'engagement' ? engagementConsent : promotionalConsent;

    setLoading(true);
    setConsent(checked); // Optimistic UI update

    try {
      const response = await fetch('/api/user/consent-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentType, consentValue: checked }),
      });
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        setConsent(previousValue); // Revert on failure
        throw new Error(result.error || 'Failed to update preferences.');
      }
      
      toast.success(dict.toasts.consentUpdateSuccess, {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      
      await updateSession();
    } catch (error) {
      setConsent(previousValue); // Revert on failure
      toast.error(error instanceof Error ? error.message : dict.toasts.consentUpdateError, {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
    }
  };

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
      
      await updateSession();
      
      toast.success(dict.toasts.languageUpdateSuccess, {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      
    } catch (error) {
      setPreferredLanguage(previousLanguage);
      toast.error(error instanceof Error ? error.message : dict.toasts.languageUpdateError, {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setIsLanguageLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    const { passwordStrength: strengthDict } = dict;
    if (passwordStrength <= 25) return strengthDict.veryWeak;
    if (passwordStrength <= 50) return strengthDict.weak;
    if (passwordStrength <= 75) return strengthDict.medium;
    return strengthDict.strong;
  };

  if (!propUser) {
    return <div>{dict.loadingText}</div>;
  }

  const PasswordRequirement: React.FC<{ label: string; met: boolean }> = ({ label, met }) => (
    <li className={`flex items-center text-xs ${met ? 'text-green-600' : 'text-gray-500'}`}>
      {met ? <CheckCircle className="w-3.5 h-3.5 me-1.5" /> : <XCircle className="w-3.5 h-3.5 me-1.5" />}
      {label}
    </li>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir={locale === 'he' ? 'rtl' : 'ltr'}>
      <Card
        className={`shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-blue-600 overflow-hidden relative`}
        onMouseEnter={() => setActiveSection('main')}
        onMouseLeave={() => setActiveSection(null)}
      >
        <div className={`absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-0 transition-opacity duration-500 ${activeSection === 'main' ? 'opacity-60' : ''}`} />
        <CardHeader className="border-b pb-3 relative">
          <CardTitle className="text-xl flex items-center">
            <Settings className="w-5 h-5 text-blue-600 me-2" />
            {dict.cardHeader.title}
          </CardTitle>
          <CardDescription>{dict.cardHeader.description}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y relative">
          <div className="py-4">
            <h3 className="text-base font-semibold flex items-center mb-4">
              <User className="w-4 h-4 text-blue-600 me-2" />
              {dict.sections.personal.title}
            </h3>
            <div className="grid gap-3">
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{dict.sections.personal.fullNameLabel}</p>
                  <p className="text-base text-gray-800">{propUser.firstName || ''} {propUser.lastName || dict.sections.personal.fullNameNotSet}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{dict.sections.personal.emailLabel}</p>
                    <p className="text-base text-gray-800">{propUser.email}</p>
                  </div>
                  {!propUser.isVerified && (
                    <Button variant="outline" size="sm" onClick={sendVerificationEmail} disabled={isSendingVerification}>
                      {isSendingVerification ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Mail className="w-4 h-4 me-2" />}
                      {dict.sections.personal.sendVerificationButton}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="py-4">
            <h3 className="text-base font-semibold mb-4 flex items-center">
              <Languages className="w-4 h-4 text-blue-600 me-2" />
              {dict.sections.language.title}
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
              <div>
                <Label htmlFor="language-select" className="cursor-pointer text-start">
                  {dict.sections.language.label}
                </Label>
                <p className="text-xs text-gray-600 text-start">{dict.sections.language.description}</p>
              </div>
              <div className="relative">
                <select
                  id="language-select"
                  value={preferredLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  disabled={isLanguageLoading}
                  className="w-32 appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pe-8 text-sm shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="he">עברית</option>
                  <option value="en">English</option>
                </select>
                {isLanguageLoading && <Loader2 className="absolute top-1/2 end-10 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500 pointer-events-none" />}
              </div>
            </div>
          </div>

          <div className="py-4">
            <h3 className="text-base font-semibold mb-4 flex items-center">
              <Shield className="w-4 h-4 text-blue-600 me-2" />
              {dict.sections.status.title}
            </h3>
            <div className="grid gap-3">
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{dict.sections.status.permissionsLabel}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline">{dict.sections.status.roles[propUser.role]}</Badge>
                    <Badge>{dict.sections.status.statuses[propUser.status]}</Badge>
                    <Badge>{propUser.isVerified ? dict.sections.status.verification.verified : dict.sections.status.verification.notVerified}</Badge>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{dict.sections.status.timeInfoLabel}</p>
                  <p className="text-gray-800">{dict.sections.status.createdAt} {new Date(propUser.createdAt).toLocaleDateString(locale)}</p>
                  {propUser.lastLogin && <p className="text-gray-800">{dict.sections.status.lastLogin} {new Date(propUser.lastLogin).toLocaleDateString(locale)}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="py-4">
            <h3 className="text-base font-semibold mb-4 flex items-center">
              <Bell className="w-4 h-4 text-blue-600 me-2" />
              {dict.sections.communication.title}
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <Label htmlFor="engagement-switch" className="cursor-pointer text-start font-medium text-gray-800">
                    {dict.sections.communication.engagement.label}
                  </Label>
                  <p className="text-xs text-gray-600 text-start">{dict.sections.communication.engagement.description}</p>
                </div>
                <Switch
                  id="engagement-switch"
                  checked={engagementConsent}
                  onCheckedChange={(checked) => handleConsentChange('engagement', checked)}
                  disabled={isEngagementLoading}
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                <div>
                  <Label htmlFor="promotional-switch" className="cursor-pointer text-start font-medium text-gray-800">
                    {dict.sections.communication.promotional.label}
                  </Label>
                  <p className="text-xs text-gray-600 text-start">{dict.sections.communication.promotional.description}</p>
                </div>
                <Switch
                  id="promotional-switch"
                  checked={promotionalConsent}
                  onCheckedChange={(checked) => handleConsentChange('promotional', checked)}
                  disabled={isPromotionalLoading}
                />
              </div>
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-start">
                <h3 className="text-base font-semibold flex items-center">
                  <Key className="w-4 h-4 text-blue-600 me-2" />
                  {dict.sections.security.title}
                </h3>
                <p className="text-sm text-muted-foreground">{dict.sections.security.description}</p>
              </div>
              {sessionStatus !== 'loading' && canChangePassword && (
                <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)} disabled={isLoading}>
                  <Key className="w-4 h-4 me-2" />
                  {dict.sections.security.changePasswordButton}
                </Button>
              )}
            </div>
            <div className="grid gap-3">
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{dict.sections.security.accountVerificationLabel}</p>
                  <p className="text-base text-gray-800 flex items-center gap-1">
                    {propUser.isVerified ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    {propUser.isVerified ? dict.sections.status.verification.verified : dict.sections.status.verification.notVerified}
                  </p>
                </div>
              </div>
              {sessionStatus !== 'loading' && !canChangePassword && (
                <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{dict.sections.security.passwordManagementLabel}</p>
                    <p className="text-sm text-gray-600">
                      {session?.user?.accounts && session.user.accounts.length > 0
                        ? dict.sections.security.managedByProvider.replace('{{provider}}', session.user.accounts[0].provider)
                        : dict.sections.security.managedExternally}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="py-4 border-t border-dashed border-red-200">
            <div className="flex items-center justify-between">
              <div className="text-start">
                <h3 className="text-base font-semibold flex items-center text-red-600">
                  <Trash2 className="w-4 h-4 me-2" />
                  {dict.sections.delete.title}
                </h3>
                <p className="text-sm text-muted-foreground">{dict.sections.delete.description}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setIsDeletingAccount(true)} disabled={isLoading}>
                <Trash2 className="w-4 h-4 me-2" />
                {dict.sections.delete.deleteButton}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gradient-to-r from-gray-50 to-white border-t p-4 text-sm text-gray-500 relative">
          <div className="flex items-center">
            <Bell className="w-4 h-4 text-blue-600 me-2" />
            <span>{dict.cardFooter.notice}</span>
          </div>
        </CardFooter>
      </Card>

      {canChangePassword && (
        <Dialog open={isChangingPassword} onOpenChange={(open) => { if (!open) resetPasswordForm(); else setIsChangingPassword(true); }}>
          <DialogContent className="sm:max-w-md" dir={locale === 'he' ? 'rtl' : 'ltr'}>
            <DialogHeader className="text-start">
              <DialogTitle>{dict.passwordDialog.title}</DialogTitle>
              <DialogDescription>
                {passwordChangeStep === 1
                  ? dict.passwordDialog.step1Description
                  : dict.passwordDialog.step2Description.replace('{{email}}', propUser.email)}
              </DialogDescription>
            </DialogHeader>
            {passwordChangeStep === 1 ? (
              <div className="space-y-4 text-start">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{dict.passwordDialog.currentPasswordLabel}</Label>
                  <div className="relative">
                    <Input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                      <span className="sr-only">{showCurrentPassword ? dict.passwordDialog.hidePassword : dict.passwordDialog.showPassword}</span>
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{dict.passwordDialog.newPasswordLabel}</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowNewPassword(!showNewPassword)}>
                      <span className="sr-only">{showNewPassword ? dict.passwordDialog.hidePassword : dict.passwordDialog.showPassword}</span>
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{dict.passwordDialog.confirmPasswordLabel}</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    <Button variant="ghost" size="icon" className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <span className="sr-only">{showConfirmPassword ? dict.passwordDialog.hidePassword : dict.passwordDialog.showPassword}</span>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">{dict.passwordDialog.strengthLabel}</p>
                      <p className={`text-xs font-semibold ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>{getPasswordStrengthText()}</p>
                    </div>
                    <Progress value={passwordStrength} className={`h-1.5 ${getPasswordStrengthColor()}`} />
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <PasswordRequirement label={dict.passwordDialog.requirements.length.replace('{{count}}', String(PASSWORD_MIN_LENGTH))} met={passwordRequirements.length} />
                      <PasswordRequirement label={dict.passwordDialog.requirements.uppercase} met={passwordRequirements.uppercase} />
                      <PasswordRequirement label={dict.passwordDialog.requirements.lowercase} met={passwordRequirements.lowercase} />
                      <PasswordRequirement label={dict.passwordDialog.requirements.number} met={passwordRequirements.number} />
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-start">
                <Label htmlFor="verificationCode">{dict.passwordDialog.verificationCodeLabel}</Label>
                <Input id="verificationCode" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="123456" maxLength={6} />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={resetPasswordForm}>{dict.passwordDialog.cancelButton}</Button>
              <Button onClick={passwordChangeStep === 1 ? initiatePasswordChange : completePasswordChange} disabled={isLoading}>
                {isLoading ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                {passwordChangeStep === 1 ? dict.passwordDialog.continueButton : dict.passwordDialog.confirmButton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isDeletingAccount} onOpenChange={(open) => { if (!open) { setIsDeletingAccount(false); setDeleteConfirmText(''); } else { setIsDeletingAccount(true); } }}>
        <DialogContent className="sm:max-w-md" dir={locale === 'he' ? 'rtl' : 'ltr'}>
          <DialogHeader className="text-start">
            <DialogTitle>{dict.deleteDialog.title}</DialogTitle>
            <DialogDescription>{dict.deleteDialog.description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-start">
            <Label htmlFor="deleteConfirm">{dict.deleteDialog.confirmationLabel} <strong>{dict.deleteDialog.confirmationPhrase}</strong></Label>
            <Input id="deleteConfirm" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={dict.deleteDialog.confirmationPhrase} />
            {deleteConfirmText && deleteConfirmText !== dict.deleteDialog.confirmationPhrase && <p className="text-xs text-red-600">{dict.deleteDialog.mismatchWarning}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeletingAccount(false); setDeleteConfirmText(''); }}>{dict.deleteDialog.cancelButton}</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isLoading || deleteConfirmText !== dict.deleteDialog.confirmationPhrase}>
              {isLoading ? <><Loader2 className="me-2 h-4 w-4 animate-spin" />{dict.deleteDialog.deletingButton}</> : dict.deleteDialog.deleteButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountSettings;