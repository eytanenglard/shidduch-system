// src/app/[locale]/testimonial/[token]/page.tsx
import { TestimonialSubmissionForm } from './TestimonialSubmissionForm';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Locale } from '../../../../../i18n-config'; // ייבוא חסר

// ▼▼▼ כאן השינוי ▼▼▼
interface PageProps {
  params: Promise<{ token: string; locale: Locale }>; // הוספת locale והפיכה ל-Promise
}

async function validateToken(
  token: string
): Promise<{ profileId: string; userName: string } | null> {
  try {
    const request = await prisma.testimonialRequest.findUnique({
      where: {
        token: token,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        profile: {
          select: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!request || !request.profile.user) {
      return null;
    }

    const { user } = request.profile;
    return {
      profileId: request.profileId,
      userName: `${user.firstName} ${user.lastName}`,
    };
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}

export default async function TestimonialPage({ params }: PageProps) {
  const { token } = await params; // הוספת await
  const validationResult = await validateToken(token);

  if (!validationResult) {
    return notFound();
  }

  const { userName } = validationResult;

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            המלצה חמה על {userName}
          </h1>
          <p className="text-gray-600 mt-2">
            תודה רבה שהקדשת מזמנך! המילים החמות שלך יכולות לעשות את כל ההבדל.
          </p>
        </div>
        <TestimonialSubmissionForm token={token} userName={userName} />
      </div>
    </main>
  );
}