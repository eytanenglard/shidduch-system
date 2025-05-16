// src/app/api/auth/complete-profile/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // ודא שהנתיב הזה נכון ומצביע על קובץ authOptions שלך
import prisma from '@/lib/prisma'; // ודא שהנתיב הזה נכון
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { Gender, UserStatus } from '@prisma/client'; // ייבוא Gender ו-UserStatus

// Zod Schema - כולל phone לאימות מהלקוח
const completeProfileSchema = z.object({
  // --- הוספת שם פרטי ושם משפחה ---
  firstName: z.string().min(1, "First name is required").max(100, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  // --- סוף הוספה ---
  phone: z.string().regex(/^0\d{9}$/, "Invalid phone number format (e.g., 0501234567)"),
  gender: z.nativeEnum(Gender),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
     message: "Invalid birth date format",
  }).refine((date) => {
      const age = Math.floor((new Date().getTime() - new Date(date).getTime()) / 31557600000);
      return age >= 18;
  }, { message: "Must be at least 18 years old" }),
  maritalStatus: z.string().min(1, "Marital status is required"),
  height: z.coerce.number().int().min(120).max(220).optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
});

export async function POST(req: Request) {
  console.log("--- [API /api/auth/complete-profile] POST Request Received ---");
  console.log(`[API /api/auth/complete-profile] Timestamp: ${new Date().toISOString()}`);

  const headersObject: { [key: string]: string } = {};
  req.headers.forEach((value, key) => {
    headersObject[key] = value;
  });
  console.log("[API /api/auth/complete-profile] Request Headers:", JSON.stringify(headersObject, null, 2));

  // !!! הסר את זה בסביבת Production !!!
  // console.log("[API /api/auth/complete-profile] DEBUG: NEXTAUTH_SECRET value (first 5 chars):", process.env.NEXTAUTH_SECRET?.substring(0, 5) || "NOT SET");

  try {
    console.log("[API /api/auth/complete-profile] Attempting to get session using getServerSession...");
    const session = await getServerSession(authOptions);

    console.log("[API /api/auth/complete-profile] Session object from getServerSession:", JSON.stringify(session, null, 2));

    if (!session || !session.user || !session.user.id) {
      console.error("[API /api/auth/complete-profile] ERROR: Unauthorized access attempt. Session or user.id is missing.");
      return NextResponse.json({ error: 'Unauthorized - Session not found or invalid' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[API /api/auth/complete-profile] User authenticated with ID: ${userId}`);
    console.log(`[API /api/auth/complete-profile] User email from session: ${session.user.email}`);

    if (session.user.isPhoneVerified) {
        console.warn(`[API /api/auth/complete-profile] User ${userId} phone is ALREADY verified according to session. Proceeding, but this might indicate a flow issue.`);
    }
    if (session.user.isProfileComplete) {
        console.warn(`[API /api/auth/complete-profile] User ${userId} profile is ALREADY complete according to session. Proceeding, but this might indicate a flow issue.`);
    }

    console.log("[API /api/auth/complete-profile] Attempting to parse request body...");
    let body;
    try {
        body = await req.json();
        console.log("[API /api/auth/complete-profile] Request body parsed successfully:", JSON.stringify(body, null, 2));
    } catch (parseError) {
        console.error("[API /api/auth/complete-profile] ERROR: Failed to parse request body as JSON:", parseError);
        return NextResponse.json({ error: 'Invalid request body - Must be JSON' }, { status: 400 });
    }

    console.log("[API /api/auth/complete-profile] Validating request body with Zod schema...");
    const validation = completeProfileSchema.safeParse(body);

    if (!validation.success) {
      console.error("[API /api/auth/complete-profile] ERROR: Request body validation failed.");
      console.error("[API /api/auth/complete-profile] Validation errors:", JSON.stringify(validation.error.flatten(), null, 2));
      return NextResponse.json({ error: 'Invalid input data', details: validation.error.flatten() }, { status: 400 });
    }
    console.log("[API /api/auth/complete-profile] Request body validated successfully.");

    const {
        // --- הוספת שם פרטי ושם משפחה ---
        firstName,
        lastName,
        // --- סוף הוספה ---
        phone,
        gender,
        birthDate,
        maritalStatus,
        height,
        occupation,
        education
    } = validation.data;

    console.log(`[API /api/auth/complete-profile] Attempting to update profile and user details for user ${userId} in a transaction.`);
    console.log("[API /api/auth/complete-profile] Data to be saved:", JSON.stringify(validation.data, null, 2));

    const updatedUser = await prisma.$transaction(async (tx) => {
      console.log(`[API /api/auth/complete-profile] Inside transaction for user ${userId}. Upserting profile...`);
      await tx.profile.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          gender: gender,
          birthDate: new Date(birthDate),
          maritalStatus: maritalStatus,
          height: height,
          occupation: occupation,
          education: education,
        },
        update: {
          gender: gender,
          birthDate: new Date(birthDate),
          maritalStatus: maritalStatus,
          height: height,
          occupation: occupation,
          education: education,
          updatedAt: new Date(),
        },
      });
      console.log(`[API /api/auth/complete-profile] Profile data upserted for user ${userId}.`);

      console.log(`[API /api/auth/complete-profile] Updating User record for user ${userId} (names, phone, isProfileComplete, status)...`);
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          // --- הוספת שם פרטי ושם משפחה ---
          firstName: firstName,
          lastName: lastName,
          // --- סוף הוספה ---
          phone: phone,
          isProfileComplete: true,
          // אם המשתמש מגיע לכאן, סביר להניח שאימות המייל הושלם (אם היה כזה).
          // לכן, הסטטוס צריך לעבור ל-PENDING_PHONE_VERIFICATION.
          // אם אימות הטלפון הוא אופציונלי או לא השלב הבא המיידי, ייתכן ו-ACTIVE הוא הסטטוס הנכון.
          status: UserStatus.PENDING_PHONE_VERIFICATION, // ודא שזה הסטטוס הנכון בהתאם לזרימה
          updatedAt: new Date(),
        },
         select: {
             id: true,
             email: true,
             firstName: true,
             lastName: true,
             isProfileComplete: true,
             isPhoneVerified: true,
             role: true,
             status: true,
             phone: true
         }
      });
      console.log(`[API /api/auth/complete-profile] User record updated for user ${userId}. New profile status: isProfileComplete=${user.isProfileComplete}, isPhoneVerified=${user.isPhoneVerified}, status=${user.status}`);
      return user;
    });

    console.log(`[API /api/auth/complete-profile] Profile completed successfully for user ${userId}.`);
    console.log("[API /api/auth/complete-profile] Returning success response with user data:", JSON.stringify({ message: "Profile completed successfully", user: updatedUser }, null, 2));
    return NextResponse.json({ message: "Profile completed successfully", user: updatedUser }, { status: 200 });

  } catch (error: unknown) {
    console.error("[API /api/auth/complete-profile] --- ERROR IN POST HANDLER ---");
    console.error("[API /api/auth/complete-profile] Error object:", error);

    if (error instanceof z.ZodError) {
        console.error("[API /api/auth/complete-profile] Zod validation error during processing:", JSON.stringify(error.flatten(), null, 2));
        return NextResponse.json({ error: 'Validation Error during processing', details: error.flatten() }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error(`[API /api/auth/complete-profile] Prisma Known Request Error - Code: ${error.code}`);
        console.error("[API /api/auth/complete-profile] Prisma Error Meta:", error.meta);
        console.error("[API /api/auth/complete-profile] Prisma Error Message:", error.message);
        if (error.code === 'P2002') {
            const target = error.meta?.target as string[] | undefined;
            if (target?.includes('phone') && target?.includes('User')) {
                 return NextResponse.json({ error: 'מספר טלפון זה כבר רשום במערכת.' }, { status: 409 });
            } else {
                 return NextResponse.json({ error: `Unique constraint violation on ${target?.join(', ')}.` }, { status: 409 });
            }
        }
        return NextResponse.json({ error: 'Database error occurred (Prisma Known Request Error)' }, { status: 500 });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        console.error("[API /api/auth/complete-profile] Prisma Validation Error:", error.message);
        return NextResponse.json({ error: 'Database validation error (Prisma Validation Error).' }, { status: 400 });
    }

    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    console.error(`[API /api/auth/complete-profile] Fallback error message: ${errorMessage}`);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    console.log("--- [API /api/auth/complete-profile] POST Request Finished ---");
  }
}