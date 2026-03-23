// src/app/api/matchmaker/smart-alerts/route.ts
// =============================================================================
// Smart Alerts API for matchmakers (Phase 8 — MatchmakerAlert model)
//
// GET    — Fetch non-dismissed alerts with pagination
// PATCH  — Dismiss a single alert by ID
// DELETE — Dismiss all alerts for the matchmaker
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// =============================================================================
// GET — Fetch non-dismissed alerts (paginated)
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role: UserRole };
    if (
      user.role !== UserRole.MATCHMAKER &&
      user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const includeDismissed = searchParams.get("includeDismissed") === "true";

    const where = {
      matchmakerId: user.id,
      ...(includeDismissed ? {} : { isDismissed: false }),
    };

    const [alerts, total] = await Promise.all([
      prisma.matchmakerAlert.findMany({
        where,
        orderBy: { createdAt: "desc" as const },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.matchmakerAlert.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Smart Alerts API] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH — Dismiss a single alert by ID
// =============================================================================

const dismissSchema = z.object({
  alertId: z.string().min(1),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role: UserRole };
    if (
      user.role !== UserRole.MATCHMAKER &&
      user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = dismissSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { alertId } = parsed.data;

    // Verify the alert belongs to this matchmaker
    const alert = await prisma.matchmakerAlert.findFirst({
      where: { id: alertId, matchmakerId: user.id },
      select: { id: true },
    });

    if (!alert) {
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    await prisma.matchmakerAlert.update({
      where: { id: alertId },
      data: { isDismissed: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Smart Alerts API] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to dismiss alert" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE — Dismiss all alerts for the matchmaker
// =============================================================================

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id: string; role: UserRole };
    if (
      user.role !== UserRole.MATCHMAKER &&
      user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const result = await prisma.matchmakerAlert.updateMany({
      where: {
        matchmakerId: user.id,
        isDismissed: false,
      },
      data: { isDismissed: true },
    });

    return NextResponse.json({
      success: true,
      dismissed: result.count,
    });
  } catch (error) {
    console.error("[Smart Alerts API] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to dismiss alerts" },
      { status: 500 }
    );
  }
}
