// src/app/api/matchmaker/inquiries/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { emailService } from '@/lib/email/emailService';
import { AvailabilityService } from '@/lib/services/availabilityService';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as 'pending' | 'completed' | 'expired' | undefined;
    const orderBy = searchParams.get("orderBy") as 'createdAt' | 'updatedAt' | undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const inquiries = await AvailabilityService.getAllInquiries(session.user.id, {
      status,
      orderBy,
      limit
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { firstPartyId, secondPartyId, note } = await req.json();

    const inquiry = await AvailabilityService.sendAvailabilityInquiry({
      matchmakerId: session.user.id,
      firstPartyId,
      secondPartyId,
      note
    });

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { error: "Failed to create inquiry" },
      { status: 500 }
    );
  }
}