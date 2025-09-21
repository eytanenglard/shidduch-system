// src/app/testimonial/[token]/page.tsx
import { TestimonialSubmissionForm } from './TestimonialSubmissionForm';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { token: string };
}

// --- פונקציית אימות הטוקן (Token Validation) - גרסה חדשה ---
async function validateToken(
  token: string
): Promise<{ profileId: string; userName: string } | null> {
  try {
    // Search for a request that matches the token, is still PENDING, and has NOT expired.
    const request = await prisma.testimonialRequest.findUnique({
      where: {
        token: token,
        status: 'PENDING', // Must be unused
        expiresAt: {
          gt: new Date(), // Must not be expired
        },
      },
      // Include related user data to get the name
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

    // If no such request exists, the link is invalid
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

// --- רכיב העמוד (Page Component) - נשאר כמעט זהה ---
export default async function TestimonialPage({ params }: PageProps) {
  const validationResult = await validateToken(params.token);

  if (!validationResult) {
    return notFound();
  }

  const { userName } = validationResult; // We don't need profileId here

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
        {/* Pass the token to the form for submission */}
        <TestimonialSubmissionForm token={params.token} userName={userName} />
      </div>
    </main>
  );
}