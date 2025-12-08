// src/app/[locale]/unsubscribe/UnsubscribeClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { UnsubscribePageDict } from '@/types/dictionaries/auth';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

type Status = 'verifying' | 'success' | 'error';

interface UnsubscribeClientProps {
  dict: UnsubscribePageDict;
}

export default function UnsubscribeClient({ dict }: UnsubscribeClientProps) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState(dict.verifying);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage(dict.errorInvalidLink);
      return;
    }

    const unsubscribeUser = async () => {
      try {
        const response = await fetch('/api/user/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || dict.errorMessageDefault);
        }

        setStatus('success');
        setMessage(dict.successMessage);
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof Error ? err.message : dict.errorMessageDefault
        );
      }
    };

    unsubscribeUser();
  }, [searchParams, dict]);

  if (status === 'verifying') {
    return (
      <StandardizedLoadingSpinner
        text={dict.verifying}
        className="w-full max-w-md bg-white rounded-xl shadow-xl p-8"
      />
    );
  }

  const renderIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-12 w-12 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 text-center space-y-6">
      <div className="flex justify-center">{renderIcon()}</div>
      <h1 className="text-2xl font-bold text-gray-800">
        {status === 'success' && dict.successTitle}
        {status === 'error' && dict.errorTitle}
      </h1>
      <p className="text-gray-600">{message}</p>
      <Button asChild>
        <Link href="/">
          <Home className="mr-2 h-4 w-4" />
          {dict.backToHomeButton}
        </Link>
      </Button>
    </div>
  );
}
