// src/app/api/matchmaker/inquiries/[id]/respond/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AvailabilityService } from "@/lib/services/availabilityService";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAvailable, note } = await req.json();

    const updatedInquiry = await AvailabilityService.updateInquiryResponse({
      inquiryId: params.id,
      userId: session.user.id,
      isAvailable,
      note
    });

    return NextResponse.json(updatedInquiry);
  } catch (error) {
    console.error("Error updating inquiry response:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to update response"
      },
      { status: 500 }
    );
  }
}