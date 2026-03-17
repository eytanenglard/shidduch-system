// src/app/api/mobile/suggestions/[id]/withdraw/route.ts
// ════════════════════════════════════════════════════════════════
// Mobile endpoint: Withdraw/cancel an approved suggestion.
// Same logic as web withdraw route, with mobile auth + CORS.
// ════════════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { MatchSuggestionStatus } from "@prisma/client";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";
import { statusTransitionService } from "@/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { getDictionary } from "@/lib/dictionaries";
import type { EmailDictionary } from "@/types/dictionary";
import { pushSuggestionStatusToMatchmaker } from "@/lib/sendPushNotification";

const GRACE_PERIOD_MINUTES = 5;

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const suggestionId = params.id;

    const auth = await verifyMobileToken(req);
    if (!auth) {
      return corsError(req, "Unauthorized", 401);
    }

    const userId = auth.userId;

    const body = await req.json();
    const { type } = body as { type: "grace_period" | "before_second_party" };

    if (!type || !["grace_period", "before_second_party"].includes(type)) {
      return corsError(req, "Invalid type. Must be 'grace_period' or 'before_second_party'", 400);
    }

    // Load suggestion
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: { include: { profile: true } },
        secondParty: { include: { profile: true } },
        matchmaker: true,
      },
    });

    if (!suggestion) {
      return corsError(req, "Suggestion not found", 404);
    }

    if (suggestion.firstPartyId !== userId) {
      return corsError(req, "Only the first party can withdraw", 403);
    }

    if (suggestion.status !== MatchSuggestionStatus.FIRST_PARTY_APPROVED) {
      return corsError(req, "Can only withdraw from FIRST_PARTY_APPROVED status", 400);
    }

    if (suggestion.secondPartySent) {
      return corsError(req, "Cannot withdraw — suggestion already sent to second party", 400);
    }

    // Load dictionaries
    const [heDict, enDict] = await Promise.all([
      getDictionary('he'),
      getDictionary('en'),
    ]);
    const dictionaries = {
      he: heDict.email as EmailDictionary,
      en: enDict.email as EmailDictionary,
    };

    const languagePrefs = {
      firstParty: (suggestion.firstParty as any).language || 'he',
      secondParty: (suggestion.secondParty as any).language || 'he',
      matchmaker: (suggestion.matchmaker as any).language || 'he',
    };

    if (type === "grace_period") {
      const approvedAt = suggestion.firstPartyResponded || suggestion.lastStatusChange;
      if (!approvedAt) {
        return corsError(req, "Cannot determine approval time", 400);
      }

      const elapsedMs = Date.now() - new Date(approvedAt).getTime();
      const gracePeriodMs = GRACE_PERIOD_MINUTES * 60 * 1000;

      if (elapsedMs > gracePeriodMs) {
        return corsJson(req, {
          success: false,
          error: "Grace period expired",
          gracePeriodExpired: true,
        }, 400);
      }

      const updatedSuggestion = await statusTransitionService.transitionStatus(
        suggestion,
        MatchSuggestionStatus.PENDING_FIRST_PARTY,
        dictionaries,
        "המועמד/ת חזר/ה בו/ה מהאישור (בתוך חלון החרטה)",
        {
          sendNotifications: false,
          skipValidation: true,
        },
        languagePrefs
      );

      await prisma.matchSuggestion.update({
        where: { id: suggestionId },
        data: {
          firstPartyResponded: null,
          matchmakerNotifiedAt: null,
        },
      });

      return corsJson(req, {
        success: true,
        type: "grace_period",
        message: "האישור בוטל בהצלחה",
        data: {
          id: updatedSuggestion.id,
          status: updatedSuggestion.status,
          lastStatusChange: updatedSuggestion.lastStatusChange,
        },
      });
    } else {
      // before_second_party
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
        languagePrefs
      );

      // Push notification to matchmaker
      try {
        const respondingUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        const userName = respondingUser
          ? `${respondingUser.firstName} ${respondingUser.lastName}`
          : 'מועמד/ת';

        pushSuggestionStatusToMatchmaker(
          suggestion.matchmakerId,
          userName,
          MatchSuggestionStatus.FIRST_PARTY_DECLINED,
          suggestionId
        ).catch((err) =>
          console.error('[mobile/withdraw] Push to matchmaker error (non-fatal):', err)
        );
      } catch (pushError) {
        console.error('[mobile/withdraw] Push error (non-fatal):', pushError);
      }

      return corsJson(req, {
        success: true,
        type: "before_second_party",
        message: "ההצעה בוטלה. השדכן/ית עודכן/ה",
        data: {
          id: updatedSuggestion.id,
          status: updatedSuggestion.status,
          lastStatusChange: updatedSuggestion.lastStatusChange,
        },
      });
    }
  } catch (error) {
    console.error("[mobile/suggestions/[id]/withdraw] Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}
