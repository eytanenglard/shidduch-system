// src/app/api/auth/complete-profile/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { Gender, UserStatus, Language } from '@prisma/client';

const normalizePhone = (val: unknown) => {
  if (typeof val !== 'string') return val;
  // אם מתחיל ב +9720, מחליפים ב +972
  if (val.startsWith('+9720')) {
    return val.replace('+9720', '+972');
  }
  return val;
};
// Zod Schema - כולל phone, שדות דיוור, ו-about
const completeProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),

 phone: z.preprocess(
    normalizePhone,
    z.string().refine(
      (phone) => /^\+[1-9]\d{1,14}$/.test(phone), 
      { message: "Invalid international phone number format (E.164 required)." }
    )
  ),
  gender: z.nativeEnum(Gender),
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
     message: "Invalid birth date format",
  }).refine((date) => {
      const age = Math.floor((new Date().getTime() - new Date(date).getTime()) / 31557600000);
      return age >= 18;
  }, { message: "Must be at least 18 years old" }),
  maritalStatus: z.string().min(1, "Marital status is required"),
  
  // הוספת שדה עיר כחובה
  city: z.string().min(1, "City is required"),

  height: z.coerce.number().int().min(120).max(220).optional(),
  occupation: z.string().optional(),
  education: z.string().optional(),
  religiousLevel: z.string().optional(),
  language: z.nativeEnum(Language).optional().default(Language.he),

  // שדות דיוור
  engagementEmailsConsent: z.boolean().optional().default(false),
  promotionalEmailsConsent: z.boolean().optional().default(false),

  // ========== הוספה: שדה הסיפור שלי ==========
  about: z.string().max(2000, "About text is too long").optional(),
});

export async function POST(req: Request) {
  console.log("--- [API /api/auth/complete-profile] POST Request Received ---");
  console.log(`[API /api/auth/complete-profile] Timestamp: ${new Date().toISOString()}`);

  const headersObject: { [key: string]: string } = {};
  req.headers.forEach((value, key) => {
    headersObject[key] = value;
  });

  try {
    console.log("[API /api/auth/complete-profile] Attempting to get session using getServerSession...");
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      console.error("[API /api/auth/complete-profile] ERROR: Unauthorized access attempt. Session or user.id is missing.");
      return NextResponse.json({ error: 'Unauthorized - Session not found or invalid' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`[API /api/auth/complete-profile] User authenticated with ID: ${userId}`);

    // קריאת הגוף
    console.log("[API /api/auth/complete-profile] Attempting to parse request body...");
    let body;
    try {
        body = await req.json();
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

    // חילוץ המשתנים מהוולידציה
    const {
        firstName,
        lastName,
        phone,
        gender,
        birthDate,
        maritalStatus,
        city, // חילוץ העיר
        height,
        occupation,
        education,
        religiousLevel,
        language,
        engagementEmailsConsent,
        promotionalEmailsConsent,
        about,  // ========== הוספה ==========
    } = validation.data;

    console.log(`[API /api/auth/complete-profile] Consents received -> Engagement: ${engagementEmailsConsent}, Promotional: ${promotionalEmailsConsent}`);
    console.log(`[API /api/auth/complete-profile] About text length: ${about?.length || 0} characters`);
    console.log(`[API /api/auth/complete-profile] City received: ${city}`);

    console.log(`[API /api/auth/complete-profile] Attempting to update profile and user details for user ${userId} in a transaction.`);

    const updatedUser = await prisma.$transaction(async (tx) => {
      
      // 1. עדכון/יצירת הפרופיל (טבלת Profile)
      console.log(`[API /api/auth/complete-profile] Inside transaction. Upserting profile...`);
      await tx.profile.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          gender: gender,
          birthDate: new Date(birthDate),
          maritalStatus: maritalStatus,
          city: city, // שמירת העיר
          height: height,
          occupation: occupation,
          education: education,
          religiousLevel: religiousLevel,
          about: about,  // ========== הוספה ==========

          // הגדרות ברירת מחדל
          isProfileVisible: true,
          availabilityStatus: 'AVAILABLE',
        },
        update: {
          gender: gender,
          birthDate: new Date(birthDate),
          maritalStatus: maritalStatus,
          city: city, // עדכון העיר
          height: height,
          occupation: occupation,
          education: education,
          religiousLevel: religiousLevel,
          about: about,  // ========== הוספה ==========

          updatedAt: new Date(),
        },
      });
      console.log(`[API /api/auth/complete-profile] Profile data upserted.`);

      // 2. בדיקה האם יש לעדכן את תאריך אישור התנאים
      const currentUser = await tx.user.findUnique({ 
          where: { id: userId }, 
          select: { termsAndPrivacyAcceptedAt: true } 
      });
      
      const termsDateToSet = currentUser?.termsAndPrivacyAcceptedAt ? undefined : new Date();
      if (termsDateToSet) {
          console.log(`[API /api/auth/complete-profile] User accepts terms now. Setting timestamp.`);
      }

      // 3. עדכון המשתמש (טבלת User)
      console.log(`[API /api/auth/complete-profile] Updating User record (names, phone, status, consents)...`);
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          isProfileComplete: true,
          language: language,

          // מעבירים את הסטטוס למצב הבא (אימות טלפון)
          status: UserStatus.PENDING_PHONE_VERIFICATION,
          updatedAt: new Date(),
          
          // עדכון שדות הדיוור
          engagementEmailsConsent: engagementEmailsConsent,
          promotionalEmailsConsent: promotionalEmailsConsent,
          
          // עדכון תאריך אישור תנאים (אם רלוונטי)
          ...(termsDateToSet && { termsAndPrivacyAcceptedAt: termsDateToSet }),
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
             phone: true,
             engagementEmailsConsent: true,
             promotionalEmailsConsent: true
         }
      });
      
      console.log(`[API /api/auth/complete-profile] User updated. Consents saved as: Engagement=${user.engagementEmailsConsent}, Promo=${user.promotionalEmailsConsent}`);
      return user;
    });

    console.log(`[API /api/auth/complete-profile] Profile completed successfully for user ${userId}.`);
    return NextResponse.json({ message: "Profile completed successfully", user: updatedUser }, { status: 200 });

  } catch (error: unknown) {
    console.error("[API /api/auth/complete-profile] --- ERROR IN POST HANDLER ---");
    console.error("[API /api/auth/complete-profile] Error object:", error);

    if (error instanceof z.ZodError) {
        console.error("[API /api/auth/complete-profile] Zod validation error:", JSON.stringify(error.flatten(), null, 2));
        return NextResponse.json({ error: 'Validation Error during processing', details: error.flatten() }, { status: 400 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error(`[API /api/auth/complete-profile] Prisma Error Code: ${error.code}`);
        if (error.code === 'P2002') {
            const target = error.meta?.target as string[] | undefined;
            if (target?.includes('phone')) {
                 return NextResponse.json({ error: 'מספר טלפון זה כבר רשום במערכת.' }, { status: 409 });
            } else {
                 return NextResponse.json({ error: `Unique constraint violation on ${target?.join(', ')}.` }, { status: 409 });
            }
        }
        return NextResponse.json({ error: 'Database error occurred (Prisma Known Request Error)' }, { status: 500 });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        console.error("[API /api/auth/complete-profile] Prisma Validation Error:", error.message);
        return NextResponse.json({ error: 'Database validation error.' }, { status: 400 });
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