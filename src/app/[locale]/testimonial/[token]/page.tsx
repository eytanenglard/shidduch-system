// src/app/testimonial/[token]/page.tsx
import { jwtVerify, JWTPayload } from 'jose'; // <-- שינוי 1: ייבוא JWTPayload
import { TestimonialSubmissionForm } from './TestimonialSubmissionForm';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';

// --- ממשקים (Interfaces) ---
// --- שינוי 2: הרחבת JWTPayload מבטיחה תאימות ---
interface TokenPayload extends JWTPayload {
  profileId: string;
  userId: string;
}

interface PageProps {
  params: { token: string };
}

// --- פונקציית אימות הטוקן (Token Validation) ---
async function validateToken(
  token: string
): Promise<{ profileId: string; userName: string } | null> {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
  if (!secret) {
    console.error('FATAL: NEXTAUTH_SECRET is not defined.');
    return null;
  }

  try {
    // --- שינוי 3: פירוק האימות וההגדרה (Casting) לשני שלבים ---
    // שלב א': אימות הטוקן ללא גנריקה
    const verificationResult = await jwtVerify(token, secret);

    // שלב ב': המרה בטוחה של המטען לטיפוס המוגדר שלנו
    const payload = verificationResult.payload as TokenPayload;
    const { profileId, userId } = payload;
    // --- סוף השינוי ---

    const user = await prisma.user.findUnique({
      where: { id: userId }, // עכשיו TypeScript יודע ש-userId הוא string
      select: { firstName: true, lastName: true },
    });

    if (!user) return null;

    return { profileId, userName: `${user.firstName} ${user.lastName}` };
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}

// --- רכיב העמוד (Page Component) - ללא שינוי ---
export default async function TestimonialPage({ params }: PageProps) {
  const validationResult = await validateToken(params.token);

  if (!validationResult) {
    return notFound();
  }

  const { profileId, userName } = validationResult;

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
        <TestimonialSubmissionForm token={params.token} userName={userName} />
      </div>
    </main>
  );
}
