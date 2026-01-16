// =============================================================================
// src/app/matchmaker/potential-matches/page.tsx
// דף התאמות פוטנציאליות - נקודת הכניסה
// =============================================================================

import { Metadata } from 'next';
import PotentialMatchesDashboard from '@/components/matchmaker/PotentialMatches';

export const metadata: Metadata = {
  title: 'התאמות פוטנציאליות | NeshamaTech',
  description: 'צפייה וניהול התאמות פוטנציאליות שנמצאו בסריקה הלילית',
};

export default function PotentialMatchesPage() {
  return <PotentialMatchesDashboard />;
}
