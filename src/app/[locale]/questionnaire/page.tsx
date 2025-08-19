// src/app/questionnaire/page.tsx

import QuestionnairePage from '@/components/questionnaire/QuestionnairePage';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// רכיב זמני שיוצג בזמן שהשאלון נטען
function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
      <p className="ml-4 rtl:mr-4 text-lg text-gray-700">טוען שאלון...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <QuestionnairePage />
    </Suspense>
  );
}
