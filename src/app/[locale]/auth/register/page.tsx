// src/app/auth/register/page.tsx

import RegisterSteps from '@/components/auth/RegisterSteps';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// רכיב זמני שיוצג בזמן שהקומפוננטה הראשית נטענת
function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RegisterSteps />
    </Suspense>
  );
}
