// =============================================================================
// src/app/[locale]/matchmaker/potential-matches/page.tsx
// דף התאמות פוטנציאליות
// =============================================================================

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import PotentialMatchesDashboard from '@/components/matchmaker/PotentialMatches';

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: 'התאמות פוטנציאליות | NeshamaTech',
  description: 'צפייה בהתאמות פוטנציאליות שנמצאו בסריקה הלילית',
};

// =============================================================================
// PAGE COMPONENT
// =============================================================================

interface PageProps {
  params: {
    locale: string;
  };
}

export default async function PotentialMatchesPage({ params }: PageProps) {
  // Authentication check
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/${params.locale}/login`);
  }

  // Authorization check - only matchmakers and admins
  if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
    redirect(`/${params.locale}/unauthorized`);
  }

  return (
    <PotentialMatchesDashboard locale={params.locale} />
  );
}
