// src/app/api/mobile/analytics/events/route.ts
// ==========================================
// NeshamaTech Mobile - Analytics Events API
// POST /api/mobile/analytics/events
// Receives batched analytics events from the mobile app
// ==========================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

// ==========================================
// POST - Receive batched analytics events
// ==========================================
export async function POST(req: NextRequest) {
  try {
    // Auth is optional — we still want to track anonymous events (app_opened before login)
    let userId: string | null = null;
    try {
      const authResult = await verifyMobileToken(req);
      if (authResult?.userId) {
        userId = authResult.userId;
      }
    } catch {
      // Anonymous event — no auth required
    }

    const body = await req.json();
    const { events } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return corsJson(req, { success: true, received: 0 });
    }

    // Cap at 50 events per batch to prevent abuse
    const batch = events.slice(0, 50);

    // Build records for batch insert
    const records = batch.map((event: any) => ({
      userId: event.properties?.userId || userId,
      event: String(event.event || "unknown").slice(0, 100),
      properties: event.properties || {},
      platform: event.properties?.platform || null,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    }));

    // Batch insert — fire and forget style (don't slow down the client)
    await prisma.analyticsEvent.createMany({
      data: records,
      skipDuplicates: true,
    });

    return corsJson(req, {
      success: true,
      received: records.length,
    });
  } catch (error) {
    console.error("[mobile/analytics/events] Error:", error);
    // Always return success to the client — analytics should never block UX
    return corsJson(req, { success: true, received: 0 });
  }
}

// ==========================================
// OPTIONS - CORS preflight
// ==========================================
export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}