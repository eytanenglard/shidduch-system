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

  // לוג מפורט של כל ה-Headers, כולל הקוקיז
  const headersObject: { [key: string]: string } = {};
  req.headers.forEach((value, key) => {
    headersObject[key] = value;
  });
  console.log("[API /api/auth/complete-profile] Request Headers:", JSON.stringify(headersObject, null, 2));

  // בדיקה מפורשת של משתנה הסביבה NEXTAUTH_SECRET (למטרות דיבוג בלבד!)
  // !!! הסר את זה בסביבת Production !!!
  console.log("[API /api/auth/complete-profile] DEBUG: NEXTAUTH_SECRET value (first 5 chars):", process.env.NEXTAUTH_SECRET?.substring(0, 5) || "NOT SET");

  try {
    console.log("[API /api/auth/complete-profile] Attempting to get session using getServerSession...");
    const session = await getServerSession(authOptions); // ודא ש-authOptions מיובא נכון

    console.log("[API /api/auth/complete-profile] Session object from getServerSession:", JSON.stringify(session, null, 2));

    if (!session || !session.user || !session.user.id) {
      console.error("[API /api/auth/complete-profile] ERROR: Unauthorized access attempt. Session or user.id is missing.");
      console.error("[API /api/auth/complete-profile] Details:", {
        sessionExists: !!session,
        userExistsInSession: !!session?.user,
        userIdExistsInSession: !!session?.user?.id,
      });
      return NextResponse.json({ error: 'Unauthorized - Session not found or invalid' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[API /api/auth/complete-profile] User authenticated with ID: ${userId}`);
    console.log(`[API /api/auth/complete-profile] User email from session: ${session.user.email}`);

    // בדיקה אם הטלפון כבר מאומת (למרות שה-middleware אמור לכסות זאת)
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
        phone,
        gender,
        birthDate,
        maritalStatus,
        height,
        occupation,
        education
    } = validation.data;

    console.log(`[API /api/auth/complete-profile] Attempting to update profile and user phone for user ${userId} in a transaction.`);
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
          // שדות נוספים עם ערכי ברירת מחדל אם יש צורך (למשל, additionalLanguages: [])
        },
        update: {
          gender: gender,
          birthDate: new Date(birthDate),
          maritalStatus: maritalStatus,
          height: height,
          occupation: occupation,
          education: education,
          updatedAt: new Date(), // חשוב לעדכן גם כאן
        },
      });
      console.log(`[API /api/auth/complete-profile] Profile data upserted for user ${userId}.`);

      console.log(`[API /api/auth/complete-profile] Updating User record for user ${userId} (phone, isProfileComplete, status)...`);
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          phone: phone,
          isProfileComplete: true,
          // כאן המקום לשקול אם לעדכן את ה-status.
          // אם השלב הבא הוא אימות טלפון, הסטטוס צריך להיות PENDING_PHONE_VERIFICATION.
          // אם ה-middleware כבר מבטיח שרק משתמשים עם PENDING_PHONE_VERIFICATION מגיעים לכאן,
          // אז אולי אין צורך לשנות את הסטטוס כאן אלא רק לאחר אימות הטלפון.
          // עם זאת, אם הסטטוס היה PENDING_EMAIL_VERIFICATION, יש לעדכן אותו.
          // לפי הסכימה שלך, ברירת המחדל היא PENDING_PHONE_VERIFICATION.
          // אם אימות המייל כבר בוצע, נניח שהסטטוס כבר PENDING_PHONE_VERIFICATION.
          // status: UserStatus.PENDING_PHONE_VERIFICATION, // ודא שזה הסטטוס הנכון
          updatedAt: new Date(),
        },
         select: {
             id: true,
             email: true,
             firstName: true,
             lastName: true,
             isProfileComplete: true,
             isPhoneVerified: true, // חשוב להחזיר את זה כדי שהסשן יתעדכן
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
    console.error("[API /api/auth/complete-profile] Error object:", error); // לוג מלא של אובייקט השגיאה

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
            if (target?.includes('phone') && target?.includes('User')) { // יותר ספציפי
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