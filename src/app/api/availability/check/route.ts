// src/app/api/availability/check/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AvailabilityService } from "@/lib/services/availabilityService";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clientId } = await req.json();

    const result = await AvailabilityService.sendAvailabilityInquiry({
      matchmakerId: session.user.id,
      firstPartyId: clientId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}