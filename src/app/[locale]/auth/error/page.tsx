// src/app/auth/error/page.tsx

import AuthError from '@/components/auth/AuthError';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function Loading() {
  return <Loader2 className="h-8 w-8 animate-spin text-gray-500" />;
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Suspense fallback={<Loading />}>
        <AuthError />
      </Suspense>
    </div>
  );
}
