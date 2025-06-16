// File: src/app/api/ai/update-all-profiles/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { updateUserAiProfile } from '@/lib/services/profileAiService'; // הפונקציה הקיימת שלך

export async function POST() {
  try {
    // 1. Authentication and Authorization (ADMIN ONLY)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized: Admin access required." }, { status: 403 });
    }

    console.log(`[AI Bulk Update] Initiated by admin: ${session.user.id}`);

    // 2. Fetch all active user IDs that have a profile
    const usersToUpdate = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        profile: {
          isNot: null,
        },
      },
      select: {
        id: true,
      },
    });

    const userIds = usersToUpdate.map(user => user.id);
    const totalUsers = userIds.length;

    if (totalUsers === 0) {
      return NextResponse.json({ success: true, message: "No active users with profiles found to update." });
    }

    // 3. Trigger background updates without waiting for them to complete
    // This makes the API endpoint respond immediately.
    // The actual processing will happen in the background.
    userIds.forEach(userId => {
      // We call the function but don't `await` it.
      // The `catch` is important to prevent unhandled promise rejections on the server.
      updateUserAiProfile(userId).catch(err => {
        console.error(`[AI Bulk Update] Background update failed for user ${userId}:`, err);
      });
    });

    const message = `AI profile update process has been initiated for ${totalUsers} users. The process will run in the background.`;
    console.log(`[AI Bulk Update] ${message}`);

    // 4. Return an immediate success response
    return NextResponse.json({ success: true, message });

  } catch (error) {
    console.error('[AI Bulk Update] A critical error occurred:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: "Internal server error.", details: errorMessage }, { status: 500 });
  }
}