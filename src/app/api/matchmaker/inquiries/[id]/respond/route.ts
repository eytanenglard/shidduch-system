// src/app/api/matchmaker/inquiries/[id]/respond/route.ts

import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AvailabilityService } from "@/lib/services/availabilityService";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteSegment<T> = (
  request: NextRequest,
  props: { params: Promise<T> }
) => Promise<NextResponse> | NextResponse;

const handler: RouteSegment<{ id: string }> = async (req, { params: paramsPromise }) => {
  try {
    const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { requests: 15, window: '1 h' });
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const params = await paramsPromise;
    const url = new URL(req.url);
    const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'he';

    const { isAvailable, note } = await req.json();

    if (typeof isAvailable !== 'boolean') {
        return NextResponse.json({ success: false, error: "Bad Request: 'isAvailable' must be a boolean." }, { status: 400 });
    }

    const updatedInquiry = await AvailabilityService.updateInquiryResponse({
      inquiryId: params.id,
      userId: session.user.id,
      isAvailable,
      note,
      locale: locale,
    });

    return NextResponse.json({ success: true, inquiry: updatedInquiry });

  } catch (error) {
    console.error("Error updating inquiry response:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Failed to update response";
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage
      },
      { status: 500 }
    );
  }
};

export const POST = handler;