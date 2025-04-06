import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole, MatchSuggestionStatus } from "@prisma/client";
import { StatusTransitionService } from "@/app/components/matchmaker/suggestions/services/suggestions/StatusTransitionService";
import { initNotificationService } from "@/app/components/matchmaker/suggestions/services/notification/initNotifications";
import { NotificationContent } from "@/app/components/matchmaker/suggestions/services/notification/NotificationService";

// Initialize the notification service
const notificationService = initNotificationService();

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verify user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify matchmaker permissions
    if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const suggestionId = params.id;

    // Verify suggestion exists
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        firstParty: {
          include: { profile: true }
        },
        secondParty: {
          include: { profile: true }
        },
        matchmaker: true
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { success: false, error: "Suggestion not found" },
        { status: 404 }
      );
    }

    // Verify matchmaker permissions for sharing contact details
    if (
      suggestion.matchmakerId !== session.user.id &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { success: false, error: "You are not authorized to share contact details for this suggestion" },
        { status: 403 }
      );
    }

    // Verify suggestion is in appropriate status for sharing contact details
    if (
      suggestion.status !== MatchSuggestionStatus.FIRST_PARTY_APPROVED &&
      suggestion.status !== MatchSuggestionStatus.SECOND_PARTY_APPROVED &&
      suggestion.status !== MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL
    ) {
      return NextResponse.json({
        success: false,
        error: "Suggestion is not in a valid status for sharing contact details"
      }, { status: 400 });
    }

    // Update suggestion status to CONTACT_DETAILS_SHARED
    const statusTransitionService = StatusTransitionService.getInstance();
    const updatedSuggestion = await statusTransitionService.transitionStatus(
      suggestion,
      MatchSuggestionStatus.CONTACT_DETAILS_SHARED,
      `פרטי קשר שותפו בין ${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName} ל${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName} ע"י ${session.user.firstName} ${session.user.lastName}`
    );

    // Format contact details
    const formatUserDetails = (user: typeof suggestion.firstParty | typeof suggestion.secondParty) => {
      const details = [
        `שם: ${user.firstName} ${user.lastName}`,
        `אימייל: ${user.email}`,
      ];
    
      if (user.phone) {
        details.push(`טלפון: ${user.phone}`);
      }
    
      return details.join('\n');
    };

    // Send custom contact sharing notification to both parties
    const firstPartyDetails = formatUserDetails(suggestion.firstParty);
    const secondPartyDetails = formatUserDetails(suggestion.secondParty);
    
    const notificationContent: NotificationContent = {
      subject: "פרטי קשר להצעת השידוך",
      body: `ברכות! שני הצדדים אישרו את הצעת השידוך.\n\nפרטי הקשר של הצד הראשון:\n${firstPartyDetails}\n\nפרטי הקשר של הצד השני:\n${secondPartyDetails}\n\nאנא צרו קשר בהקדם לתיאום פגישה ראשונה.\n\nבהצלחה!`,
      htmlBody: `<div dir="rtl"><h2>ברכות! שני הצדדים אישרו את הצעת השידוך.</h2><p>פרטי הקשר של הצד הראשון:</p><pre>${firstPartyDetails}</pre><p>פרטי הקשר של הצד השני:</p><pre>${secondPartyDetails}</pre><p>אנא צרו קשר בהקדם לתיאום פגישה ראשונה.</p><p>בהצלחה!</p></div>`
    };

    // Send to first party
    await notificationService.sendNotification(
      {
        email: suggestion.firstParty.email,
        phone: suggestion.firstParty.phone || undefined,
        name: `${suggestion.firstParty.firstName} ${suggestion.firstParty.lastName}`
      },
      notificationContent,
      { channels: ['email', 'whatsapp'] }
    );

    // Send to second party
    await notificationService.sendNotification(
      {
        email: suggestion.secondParty.email,
        phone: suggestion.secondParty.phone || undefined,
        name: `${suggestion.secondParty.firstName} ${suggestion.secondParty.lastName}`
      },
      notificationContent,
      { channels: ['email', 'whatsapp'] }
    );

    return NextResponse.json({
      success: true,
      message: "Contact details shared successfully",
      suggestion: updatedSuggestion
    });
  } catch (error) {
    console.error("Error sharing contact details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to share contact details" },
      { status: 500 }
    );
  }
}