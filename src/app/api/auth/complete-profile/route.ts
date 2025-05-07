// src/app/api/auth/complete-profile/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if needed
import prisma from '@/lib/prisma'; // Adjust path if needed
import { Prisma } from '@prisma/client'; // <-- Import Prisma namespace for error types
import { z } from 'zod';
import { Gender } from '@prisma/client'; // Import Gender enum

// Zod Schema - includes phone for validation from client
const completeProfileSchema = z.object({
  phone: z.string().regex(/^0\d{9}$/, "Invalid phone number format (e.g., 0501234567)"),
  gender: z.nativeEnum(Gender), // Use Prisma enum Gender
  birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
     message: "Invalid birth date format",
  }).refine((date) => { // Optional: Age validation (e.g., >= 18)
      const age = Math.floor((new Date().getTime() - new Date(date).getTime()) / 31557600000);
      return age >= 18;
  }, { message: "Must be at least 18 years old" }),
  maritalStatus: z.string().min(1, "Marital status is required"), // Assuming it's required in the form
  height: z.coerce.number().int().min(120).max(220).optional(), // coerce handles string-to-number
  occupation: z.string().optional(),
  education: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Get the session
    const session = await getServerSession(authOptions);

    // 2. Check for authentication
    if (!session?.user?.id) {
      console.error("API complete-profile: Unauthorized access attempt.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 3. Parse and validate the request body
    const body = await req.json();
    const validation = completeProfileSchema.safeParse(body);

    if (!validation.success) {
      console.error("API complete-profile: Validation failed.", validation.error.errors);
      return NextResponse.json({ error: 'Invalid input data', details: validation.error.flatten() }, { status: 400 });
    }

    // Destructure validated data
    const {
        phone, // Phone is needed for the User update
        gender,
        birthDate,
        maritalStatus,
        height,
        occupation,
        education
    } = validation.data;

    // 4. Perform database operations in a transaction
    console.log(`API complete-profile: Attempting to update profile and user phone for user ${userId}`);
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Upsert Profile (data relevant to Profile model, excluding phone)
      await tx.profile.upsert({
        where: { userId: userId },
        create: {
          userId: userId,
          gender: gender,
          birthDate: new Date(birthDate), // Convert string to Date
          maritalStatus: maritalStatus, // Ensure this matches your schema
          height: height,
          occupation: occupation,
          education: education,
          // Add any other default fields for Profile if needed
        },
        update: {
          gender: gender,
          birthDate: new Date(birthDate), // Convert string to Date
          maritalStatus: maritalStatus,
          height: height,
          occupation: occupation,
          education: education,
        },
      });
      console.log(`API complete-profile: Profile data upserted for user ${userId}`);

      // Update User (set phone and mark profile as complete)
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          phone: phone, // Update phone on the User model
          isProfileComplete: true,
          updatedAt: new Date(), // Update timestamp
        },
         select: { // Select only necessary fields to return
             id: true,
             email: true,
             firstName: true,
             lastName: true,
             isProfileComplete: true,
             role: true,
             status: true,
             phone: true // Include phone in selection if needed by client
         }
      });
      console.log(`API complete-profile: User record updated for user ${userId} (phone & isProfileComplete).`);
      return user;
    });

    // 5. Return success response
    console.log(`API complete-profile: Profile completed successfully for user ${userId}`);
    return NextResponse.json({ message: "Profile completed successfully", user: updatedUser }, { status: 200 });

  } catch (error: unknown) { // <-- Catch error as 'unknown' type
    console.error("API complete-profile: An error occurred:", error);

    // Type guards for specific error handling
    if (error instanceof z.ZodError) {
        console.error("API complete-profile: Zod validation error during processing.", error.flatten());
        return NextResponse.json({ error: 'Validation Error during processing', details: error.flatten() }, { status: 400 });
    }

    // Check if it's a known Prisma error (using the imported Prisma namespace)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error(`API complete-profile: Prisma Known Error - Code: ${error.code}`, error.meta);
        if (error.code === 'P2002') {
            // Example: Unique constraint failed (likely User.phone)
            // Check target field if available in meta
            const target = error.meta?.target as string[] | undefined;
            if (target?.includes('phone')) {
                 return NextResponse.json({ error: 'מספר טלפון זה כבר רשום במערכת.' }, { status: 409 }); // 409 Conflict
            } else {
                 return NextResponse.json({ error: 'Unique constraint violation.' }, { status: 409 });
            }
        }
        // Handle other Prisma known errors if needed
        return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
    }

    // Check for other Prisma error types if necessary
    if (error instanceof Prisma.PrismaClientValidationError) {
        console.error("API complete-profile: Prisma Validation Error.", error.message);
        return NextResponse.json({ error: 'Database validation error.' }, { status: 400 }); // Or 500 depending on context
    }

    // Fallback for generic errors
    let errorMessage = 'Internal Server Error';
    if (error instanceof Error) {
        errorMessage = error.message; // Get message from standard Error object
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}