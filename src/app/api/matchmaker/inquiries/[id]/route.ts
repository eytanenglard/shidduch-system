// src/app/api/matchmaker/inquiries/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AvailabilityService } from "@/lib/services/availabilityService";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> } // ✅ שינוי: התאמה ל-Next.js 15
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Not logged in" }, { status: 401 });
    }

    const performingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    if (!performingUser || !allowedRoles.includes(performingUser.role)) {
        return NextResponse.json(
            { error: 'Unauthorized - Matchmaker or Admin access required to view this inquiry' },
            { status: 403 }
        );
    }
    
    const params = await props.params; // ✅ שינוי: הוספת await
    const inquiry = await AvailabilityService.getInquiryById(params.id);
    
    if (!inquiry) {
        return NextResponse.json({ error: "Inquiry not found or access denied" }, { status: 404 });
    }
    
    return NextResponse.json(inquiry);
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    let message = "Failed to fetch inquiry";
    if (error instanceof Error) {
        message = error.message;
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}