// src/app/api/suggestions/[id]/withdraw/route.ts
// ════════════════════════════════════════════════════════════════
// Withdraw/cancel an approved suggestion by the first party.
// Two modes:
//   1. "grace_period" — within GRACE_PERIOD_MINUTES of approval,
//      silently reverts to PENDING_FIRST_PARTY (no matchmaker notification).
//   2. "before_second_party" — after grace period but before matchmaker
//      sent it to the second party. Transitions to FIRST_PARTY_DECLINED
//      and notifies the matchmaker.
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus, UserRole } from "@prisma/client";
import { z } from "zod";
import { statusTransitionService } from "@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { getDictionary } from "@/lib/dictionaries";
import type { EmailDictionary } from "@/types/dictionary";

const GRACE_PERIOD_MINUTES = 5;

const withdrawSchema = z.object({
  type: z.enum(["grace_period", "before_second_party"]),
});

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.CANDIDATE) {
      return NextResponse.json(
        { success: false, error: "Only candidates can withdraw" },
        { status: 403 }
      );
    }

    // 2. Validate body
    const body = await req.json();
    const validationResult = withdrawSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { type } = validationResult.data;
    const params = await props.params;
    const suggestionId = params.id;

    // 3. Load suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // 4. Only first party can withdraw
    if (suggestion.firstPartyId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Only the first party can withdraw" },
        { status: 403 }
      );
    }

    // 5. Must be FIRST_PARTY_APPROVED
    if (suggestion.status !== MatchSuggestionStatus.FIRST_PARTY_APPROVED) {
      return NextResponse.json(
        { success: false, error: "Can only withdraw from FIRST_PARTY_APPROVED status" },
        { status: 400 }
      );
    }

    // 6. Ensure second party hasn't been contacted yet
    if (suggestion.secondPartySent) {
      return NextResponse.json(
        { success: false, error: "Cannot withdraw — suggestion already sent to second party" },
        { status: 400 }
      );
    }

    // 7. Load dictionaries
    const [heDict, enDict] = await Promise.all([
      getDictionary('he'),
      getDictionary('en'),
    ]);
    const dictionaries = {
      he: heDict.email as EmailDictionary,
      en: enDict.email as EmailDictionary,
    };

    const firstPartyLang = (suggestion.firstParty as any).language || 'he';
    const secondPartyLang = (suggestion.secondParty as any).language || 'he';
    const matchmakerLang = (suggestion.matchmaker as any).language || 'he';

    if (type === "grace_period") {
      // ─── Grace period: revert silently ───
      const approvedAt = suggestion.firstPartyResponded || suggestion.lastStatusChange;
      if (!approvedAt) {
        return NextResponse.json(
          { success: false, error: "Cannot determine approval time" },
          { status: 400 }
        );
      }

      const elapsedMs = Date.now() - new Date(approvedAt).getTime();
      const gracePeriodMs = GRACE_PERIOD_MINUTES * 60 * 1000;

      if (elapsedMs > gracePeriodMs) {
        return NextResponse.json(
          { success: false, error: "Grace period expired", gracePeriodExpired: true },
          { status: 400 }
        );
      }

      // Revert to PENDING_FIRST_PARTY — no notifications
      const updatedSuggestion = await statusTransitionService.transitionStatus(
        suggestion,
        MatchSuggestionStatus.PENDING_FIRST_PARTY,
        dictionaries,
        "המועמד/ת חזר/ה בו/ה מהאישור (בתוך חלון החרטה)",
        {
          sendNotifications: false,
          skipValidation: true,
        },
        { firstParty: firstPartyLang, secondParty: secondPartyLang, matchmaker: matchmakerLang }
      );

      // Reset firstPartyResponded since they effectively haven't responded yet
      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          firstPartyResponded: null,
          matchmakerNotifiedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        type: "grace_period",
        message: "האישור בוטל בהצלחה",
        suggestion: {
          id: updatedSuggestion.id,
          status: updatedSuggestion.status,
          lastStatusChange: updatedSuggestion.lastStatusChange,
        },
      });
    } else {
      // ─── Before second party: decline with matchmaker notification ───
      const updatedSuggestion = await statusTransitionService.transitionStatus(
        suggestion,
        MatchSuggestionStatus.FIRST_PARTY_DECLINED,
        dictionaries,
        "המועמד/ת חזר/ה בו/ה מהאישור",
        {
          sendNotifications: true,
          notifyParties: ['matchmaker'],
          skipValidation: true,
        },
        { firstParty: firstPartyLang, secondParty: secondPartyLang, matchmaker: matchmakerLang }
      );

      return NextResponse.json({
        success: true,
        type: "before_second_party",
        message: "ההצעה בוטלה. השדכן/ית עודכן/ה",
        suggestion: {
          id: updatedSuggestion.id,
          status: updatedSuggestion.status,
          lastStatusChange: updatedSuggestion.lastStatusChange,
        },
      });
    }
  } catch (error) {
    console.error("Error withdrawing suggestion:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to withdraw", details: errorMessage },
      { status: 500 }
    );
  }
}
