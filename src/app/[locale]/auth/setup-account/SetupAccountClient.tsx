// src/app/[locale]/auth/setup-account/SetupAccountClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, KeyRound } from 'lucide-react';
import type { SetupAccountDict } from '@/types/dictionaries/auth';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

interface SetupAccountClientProps {
  dict: SetupAccountDict;
}

export default function SetupAccountClient({ dict }: SetupAccountClientProps) {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError(dict.errors.linkInvalid);
    }
  }, [searchParams, dict.errors.linkInvalid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(dict.errors.passwordLength);
      return;
    }
    if (password !== confirmPassword) {
      setError(dict.errors.passwordsMismatch);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/complete-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || dict.errors.default);

      setSuccess(true);
      toast.success(dict.success.title);

      setTimeout(() => {
        window.location.assign('/profile');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.errors.unexpected);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <StandardizedLoadingSpinner
          text={dict.success.title}
          subtext={dict.success.description}
          className="bg-white rounded-xl shadow-lg p-8"
        />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{dict.title}</CardTitle>
        <CardDescription>{dict.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
          <div className="text-red-500 text-center p-4 bg-red-50 rounded-md">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">{dict.newPasswordLabel}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                {dict.passwordHint}
              </p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">
                {dict.confirmPasswordLabel}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <CardFooter className="p-0 pt-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                {isLoading ? dict.submitButtonLoading : dict.submitButton}
              </Button>
            </CardFooter>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
