import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AvailabilityService } from "@/lib/services/availabilityService";

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// הגדרת טיפוס גנרי עבור הפרמטרים
type RouteSegment<T> = (
  request: NextRequest,
  params: { params: T }
) => Promise<NextResponse> | NextResponse;

// יצירת פונקציית הטיפול בבקשה
const handler: RouteSegment<{ id: string }> = async (request, { params }) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isAvailable, note } = await request.json();

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
};

// יצוא הפונקציה כ-POST handler
export const POST = handler;