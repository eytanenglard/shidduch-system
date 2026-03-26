// src/components/profile/account-settings/PasswordSection.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import type { AccountSettingsBaseProps } from './types';

const PASSWORD_MIN_LENGTH = 8;

const PasswordSection: React.FC<AccountSettingsBaseProps> = ({
  user,
  dict,
  locale,
}) => {
  const { data: session, status: sessionStatus } = useSession();

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const canChangePassword = useMemo(() => {
    if (sessionStatus === 'authenticated' && session?.user?.accounts) {
      return session.user.accounts.some(
        (acc) => acc.provider === 'credentials'
      );
    }
    return false;
  }, [session, sessionStatus]);

  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      setPasswordRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
      });
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
    if (password.length < PASSWORD_MIN_LENGTH)
      throw new Error(
        requirements.length.replace('{{count}}', String(PASSWORD_MIN_LENGTH))
      );
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

  const initiatePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(dict.toasts.fillAllFieldsError, {
        description: dict.toasts.fillAllFieldsDesc,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(dict.toasts.passwordsMismatchError, {
        description: dict.toasts.passwordsMismatchDesc,
      });
      return;
    }
    try {
      validatePassword(newPassword);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : dict.toasts.passwordValidationError,
        { description: dict.toasts.passwordValidationDesc }
      );
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/initiate-password-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate password change');
      }
      setPasswordChangeStep(2);
      setShowVerificationInput(true);
      toast.success(dict.toasts.verificationSentSuccess, {
        description: dict.toasts.verificationSentDesc,
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : dict.toasts.initiatePasswordError,
        { description: dict.toasts.initiatePasswordDesc }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const completePasswordChange = async () => {
    if (!verificationCode || !/^\d{6}$/.test(verificationCode)) {
      toast.error(dict.toasts.invalidVerificationCode, {
        description: dict.toasts.invalidVerificationCodeDesc,
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/complete-password-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          token: verificationCode,
          newPassword,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete password change');
      }
      toast.success(dict.toasts.passwordUpdateSuccess, {
        description: dict.toasts.passwordUpdateSuccessDesc,
      });
      resetPasswordForm();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : dict.toasts.passwordUpdateError,
        { description: dict.toasts.passwordUpdateDesc }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return 'text-red-500';
    if (passwordStrength <= 50) return 'text-orange-500';
    if (passwordStrength <= 75) return 'text-amber-500';
    return 'text-green-500';
  };

  const getStrengthBg = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    const { passwordStrength: strengthDict } = dict;
    if (passwordStrength <= 25) return strengthDict.veryWeak;
    if (passwordStrength <= 50) return strengthDict.weak;
    if (passwordStrength <= 75) return strengthDict.medium;
    return strengthDict.strong;
  };

  return (
    <>
      {/* Inline security info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between py-3 border-b border-border/40">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {dict.sections.security.accountVerificationLabel}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-sm">
              {user.isVerified ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    {dict.sections.status.verification.verified}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    {dict.sections.status.verification.notVerified}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {dict.sections.security.passwordManagementLabel}
            </p>
            {sessionStatus !== 'loading' && !canChangePassword ? (
              <p className="text-sm text-muted-foreground mt-1">
                {session?.user?.accounts &&
                session.user.accounts.length > 0
                  ? dict.sections.security.managedByProvider.replace(
                      '{{provider}}',
                      session.user.accounts[0].provider
                    )
                  : dict.sections.security.managedExternally}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                {dict.sections.security.description}
              </p>
            )}
          </div>
          {sessionStatus !== 'loading' && canChangePassword && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChangingPassword(true)}
              disabled={isLoading}
              className="ms-4 text-xs h-8"
            >
              <Key className="w-3.5 h-3.5 me-1.5" />
              {dict.sections.security.changePasswordButton}
            </Button>
          )}
        </div>
      </div>

      {/* Password Dialog */}
      {canChangePassword && (
        <Dialog
          open={isChangingPassword}
          onOpenChange={(open) => {
            if (!open) resetPasswordForm();
            else setIsChangingPassword(true);
          }}
        >
          <DialogContent
            className="sm:max-w-md"
            dir={locale === 'he' ? 'rtl' : 'ltr'}
          >
            <DialogHeader className="text-start">
              <DialogTitle className="text-lg">
                {dict.passwordDialog.title}
              </DialogTitle>
              <DialogDescription>
                {passwordChangeStep === 1
                  ? dict.passwordDialog.step1Description
                  : dict.passwordDialog.step2Description.replace(
                      '{{email}}',
                      user.email
                    )}
              </DialogDescription>
            </DialogHeader>

            {/* Step indicator */}
            <div className="flex items-center gap-2 py-1">
              <div
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  passwordChangeStep >= 1 ? 'bg-primary' : 'bg-muted'
                )}
              />
              <div
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  passwordChangeStep >= 2 ? 'bg-primary' : 'bg-muted'
                )}
              />
            </div>

            {passwordChangeStep === 1 ? (
              <div className="space-y-4 text-start">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm">
                    {dict.passwordDialog.currentPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pe-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm">
                    {dict.passwordDialog.newPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pe-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm">
                    {dict.passwordDialog.confirmPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pe-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password strength */}
                {newPassword && (
                  <div className="rounded-lg border border-border/60 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        {dict.passwordDialog.strengthLabel}
                      </p>
                      <p
                        className={cn(
                          'text-xs font-semibold',
                          getStrengthColor()
                        )}
                      >
                        {getPasswordStrengthText()}
                      </p>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          getStrengthBg()
                        )}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {[
                        {
                          label: dict.passwordDialog.requirements.length.replace(
                            '{{count}}',
                            String(PASSWORD_MIN_LENGTH)
                          ),
                          met: passwordRequirements.length,
                        },
                        {
                          label: dict.passwordDialog.requirements.uppercase,
                          met: passwordRequirements.uppercase,
                        },
                        {
                          label: dict.passwordDialog.requirements.lowercase,
                          met: passwordRequirements.lowercase,
                        },
                        {
                          label: dict.passwordDialog.requirements.number,
                          met: passwordRequirements.number,
                        },
                      ].map(({ label, met }) => (
                        <li
                          key={label}
                          className={cn(
                            'flex items-center gap-1.5 text-xs transition-colors',
                            met
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-muted-foreground'
                          )}
                        >
                          {met ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
                          )}
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-start">
                <Label htmlFor="verificationCode" className="text-sm">
                  {dict.passwordDialog.verificationCodeLabel}
                </Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center text-lg tracking-[0.3em] font-mono"
                />
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={resetPasswordForm}
                className="text-sm"
              >
                {dict.passwordDialog.cancelButton}
              </Button>
              <Button
                onClick={
                  passwordChangeStep === 1
                    ? initiatePasswordChange
                    : completePasswordChange
                }
                disabled={isLoading}
                className="text-sm"
              >
                {isLoading && (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                )}
                {passwordChangeStep === 1
                  ? dict.passwordDialog.continueButton
                  : dict.passwordDialog.confirmButton}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PasswordSection;
