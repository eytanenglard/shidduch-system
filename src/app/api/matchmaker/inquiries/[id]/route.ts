// src/app/api/matchmaker/inquiries/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AvailabilityService } from "@/lib/services/availabilityService";
import prisma from "@/lib/prisma"; // Added prisma
import { UserRole } from "@prisma/client"; // Added UserRole
export const dynamic = 'force-dynamic';
export async function GET(
  req: Request, // req is not used, consider removing if not planned for future use
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    // ---- START OF CHANGE ----
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Not logged in" }, { status: 401 });
    }

    // Fetch user role for permission check
    const performingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    const allowedRoles: UserRole[] = [UserRole.MATCHMAKER, UserRole.ADMIN];
    // Additionally, a user involved in the inquiry should be able to see it.
    // This needs more context on how AvailabilityService.getInquiryById checks permissions.
    // For now, limiting to Matchmaker/Admin.
    // You might need to adjust this if users (CANDIDATE) should see their own inquiries via this route.
    if (!performingUser || !allowedRoles.includes(performingUser.role)) {
        // Before returning 403, check if the user is part of the inquiry if that's a requirement
        // For simplicity, the original request was about ADMIN access to MATCHMAKER functions.
        return NextResponse.json(
            { error: 'Unauthorized - Matchmaker or Admin access required to view this inquiry' },
            { status: 403 }
        );
    }
    // ---- END OF CHANGE ----

    const inquiry = await AvailabilityService.getInquiryById(params.id);
    
    // Potentially, AvailabilityService.getInquiryById already handles ownership/role checks.
    // If so, the above check might be redundant or could be simplified.
    // If 'inquiry' is null and no error was thrown, it means not found or no permission from service.
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