// src/app/api/user/marketing-consent/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Zod schema for validation
const updateConsentSchema = z.object({
  marketingConsent: z.boolean({
    required_error: "Marketing consent status is required.",
    invalid_type_error: "Marketing consent must be a boolean.",
  }),
});

export async function PUT(req: Request) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Parse and validate request body
    const body = await req.json();
    const validationResult = updateConsentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const { marketingConsent } = validationResult.data;

    // 3. Update the user record in the database
    await prisma.user.update({
      where: { id: userId },
      data: {
        marketingConsent: marketingConsent,
      },
    });

    // 4. Return success response
    // The client will use useSession().update() to refresh the session token
    return NextResponse.json({ success: true, message: 'Marketing consent updated successfully.' });

  } catch (error) {
    console.error('Error updating marketing consent:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json(
      { success: false, error: "Internal server error.", details: errorMessage },
      { status: 500 }
    );
  }
}