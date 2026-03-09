// =============================================================================
// src/lib/sendPushNotification.ts
// =============================================================================
//
// Helper to send Expo Push Notifications to a user's registered devices.
// Called from chat routes when a new message is created.
//
// Uses Expo's push notification service (no Firebase needed for delivery).
//
// UPDATED: Added pushSuggestionStatusChange, pushContactsShared,
//          pushSuggestionStatusToMatchmaker
// =============================================================================

import prisma from '@/lib/prisma';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
  sound?: 'default' | null;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

/**
 * Send push notification to all devices registered for a user.
 *
 * @param userId  The target user's ID
 * @param payload The notification content
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  try {
    // 1. Get all device tokens for this user
    const deviceTokens = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (deviceTokens.length === 0) {
      console.log(`[push] No device tokens for user ${userId}, skipping`);
      return;
    }

    const tokens = deviceTokens.map((dt) => dt.token);

    // 2. Build Expo push messages
    const messages = tokens.map((pushToken) => ({
      to: pushToken,
      sound: payload.sound ?? 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      badge: payload.badge,
      priority: 'high' as const,
      channelId: 'default',
    }));

    // 3. Send via Expo Push API (batch)
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error(
        `[push] Expo API returned ${response.status}:`,
        await response.text()
      );
      return;
    }

    const result = await response.json();
    const tickets: ExpoPushTicket[] = result.data || [];

    // 4. Clean up invalid tokens
    const invalidTokenIndices: number[] = [];
    tickets.forEach((ticket, i) => {
      if (
        ticket.status === 'error' &&
        ticket.details?.error === 'DeviceNotRegistered'
      ) {
        invalidTokenIndices.push(i);
      }
    });

    if (invalidTokenIndices.length > 0) {
      const tokensToRemove = invalidTokenIndices.map((i) => tokens[i]);
      console.log(
        `[push] Removing ${tokensToRemove.length} invalid token(s) for user ${userId}`
      );
      await prisma.deviceToken.deleteMany({
        where: {
          userId,
          token: { in: tokensToRemove },
        },
      });
    }

    console.log(
      `[push] Sent ${messages.length} notification(s) to user ${userId}`
    );
  } catch (error) {
    // Push notifications should never break the main flow
    console.error('[push] Error sending push notification:', error);
  }
}

// =============================================================================
// Convenience functions for specific notification types
// =============================================================================

/**
 * Send push when matchmaker sends a direct message to a user
 */
export async function pushDirectMessage(
  userId: string,
  matchmakerName: string,
  messagePreview: string
): Promise<void> {
  await sendPushToUser(userId, {
    title: `💬 ${matchmakerName}`,
    body:
      messagePreview.length > 100
        ? messagePreview.slice(0, 100) + '…'
        : messagePreview,
    data: {
      type: 'NEW_DIRECT_MESSAGE',
      screen: 'chat/matchmaker',
    },
  });
}

/**
 * Send push when matchmaker sends a suggestion-related message to a user
 */
export async function pushSuggestionMessage(
  userId: string,
  matchmakerName: string,
  messagePreview: string,
  suggestionId: string
): Promise<void> {
  await sendPushToUser(userId, {
    title: `💬 ${matchmakerName}`,
    body:
      messagePreview.length > 100
        ? messagePreview.slice(0, 100) + '…'
        : messagePreview,
    data: {
      type: 'NEW_CHAT_MESSAGE',
      suggestionId,
      screen: 'chat/matchmaker',
    },
  });
}

/**
 * Send push when a user sends a message to the matchmaker (for matchmaker's device)
 */
export async function pushUserMessageToMatchmaker(
  matchmakerId: string,
  userName: string,
  messagePreview: string,
  context?: { suggestionId?: string; isDirect?: boolean }
): Promise<void> {
  await sendPushToUser(matchmakerId, {
    title: `📩 ${userName}`,
    body:
      messagePreview.length > 100
        ? messagePreview.slice(0, 100) + '…'
        : messagePreview,
    data: {
      type: context?.isDirect
        ? 'NEW_DIRECT_MESSAGE'
        : 'NEW_CHAT_MESSAGE',
      ...(context?.suggestionId
        ? { suggestionId: context.suggestionId }
        : {}),
      screen: 'matchmaker-inbox',
    },
  });
}

// =============================================================================
// NEW: Status change & contact sharing notifications
// =============================================================================

/**
 * Hebrew-friendly status labels for push notification body text
 */
const STATUS_LABELS_HE: Record<string, string> = {
  DRAFT: 'טיוטה',
  PENDING_FIRST_PARTY: 'ממתין לצד א׳',
  FIRST_PARTY_APPROVED: 'צד א׳ אישר/ה',
  FIRST_PARTY_INTERESTED: 'צד א׳ מעוניין/ת',
  FIRST_PARTY_DECLINED: 'צד א׳ דחה/תה',
  PENDING_SECOND_PARTY: 'ממתין לצד ב׳',
  SECOND_PARTY_APPROVED: 'צד ב׳ אישר/ה',
  SECOND_PARTY_DECLINED: 'צד ב׳ דחה/תה',
  AWAITING_MATCHMAKER_APPROVAL: 'ממתין לאישור השדכן',
  CONTACT_DETAILS_SHARED: 'פרטי הקשר שותפו',
  AWAITING_FIRST_DATE_FEEDBACK: 'ממתין לפידבק מהפגישה',
  THINKING_AFTER_DATE: 'חושב/ת אחרי פגישה',
  PROCEEDING_TO_SECOND_DATE: 'ממשיכים לפגישה שנייה',
  ENDED_AFTER_FIRST_DATE: 'הסתיים לאחר פגישה ראשונה',
  MEETING_PENDING: 'ממתין לפגישה',
  MEETING_SCHEDULED: 'פגישה נקבעה',
  MATCH_APPROVED: 'ההתאמה אושרה',
  MATCH_DECLINED: 'ההתאמה נדחתה',
  DATING: 'בתהליך היכרות',
  ENGAGED: 'מאורסים! 🎉',
  MARRIED: 'נישואים! 💍',
  EXPIRED: 'פג תוקף',
  CLOSED: 'נסגר',
  CANCELLED: 'בוטל',
};

/**
 * Send push notification to a user when the matchmaker changes a suggestion's status.
 * For example: matchmaker sends suggestion to party B → party B gets notified.
 */
export async function pushSuggestionStatusChange(
  userId: string,
  matchmakerName: string,
  newStatus: string,
  suggestionId: string
): Promise<void> {
  const statusLabel = STATUS_LABELS_HE[newStatus] || newStatus;

  // Choose title and body based on status
  let title = '📋 עדכון הצעת שידוך';
  let body = `${matchmakerName} עדכן/ה את סטטוס ההצעה: ${statusLabel}`;

  // Special cases for more user-friendly messages
  switch (newStatus) {
    case 'PENDING_FIRST_PARTY':
    case 'PENDING_SECOND_PARTY':
      title = '💌 הצעת שידוך חדשה!';
      body = `${matchmakerName} שלח/ה לך הצעת שידוך חדשה. היכנס/י לצפייה`;
      break;
    case 'CONTACT_DETAILS_SHARED':
      title = '📱 פרטי קשר שותפו!';
      body = `${matchmakerName} שיתף/ה את פרטי הקשר. בהצלחה!`;
      break;
    case 'MATCH_APPROVED':
      title = '🎉 ההתאמה אושרה!';
      body = `מזל טוב! ${matchmakerName} אישר/ה את ההתאמה`;
      break;
    case 'ENGAGED':
      title = '💍 מזל טוב על האירוסין!';
      body = 'שמחים איתכם! מאחלים המון אושר';
      break;
    case 'MARRIED':
      title = '🎊 מזל טוב על הנישואין!';
      body = 'שמחים שהיינו חלק מהסיפור שלכם!';
      break;
  }

  await sendPushToUser(userId, {
    title,
    body,
    data: {
      type: 'SUGGESTION_STATUS_CHANGE',
      suggestionId,
      newStatus,
      screen: 'suggestions',
    },
  });
}

/**
 * Send push notification to both parties when contact details are shared.
 * Includes the other party's name and phone in the notification data
 * so the app can deep-link or display inline.
 */
export async function pushContactsShared(
  userId: string,
  matchmakerName: string,
  otherPartyName: string,
  phone: string,
  suggestionId: string
): Promise<void> {
  await sendPushToUser(userId, {
    title: '📱 פרטי קשר שותפו!',
    body: `${matchmakerName} שיתף/ה את פרטי הקשר של ${otherPartyName}. בהצלחה!`,
    data: {
      type: 'CONTACTS_SHARED',
      suggestionId,
      otherPartyName,
      phone,
      screen: 'suggestions',
    },
  });
}

/**
 * Send push to the matchmaker when a user changes their suggestion status
 * (e.g., user approves, declines, or marks as interested).
 * This notifies the matchmaker's mobile device so they can act quickly.
 */
export async function pushSuggestionStatusToMatchmaker(
  matchmakerId: string,
  userName: string,
  newStatus: string,
  suggestionId: string
): Promise<void> {
  const statusLabel = STATUS_LABELS_HE[newStatus] || newStatus;

  let title = `📋 ${userName}`;
  let body = `עדכון סטטוס: ${statusLabel}`;

  // Special cases for matchmaker-facing messages
  switch (newStatus) {
    case 'FIRST_PARTY_APPROVED':
      title = `✅ ${userName} אישר/ה!`;
      body = 'צד א׳ אישר את ההצעה — שלח לצד ב׳';
      break;
    case 'FIRST_PARTY_INTERESTED':
      title = `⭐ ${userName} מעוניין/ת`;
      body = 'צד א׳ שמר/ה את ההצעה לגיבוי';
      break;
    case 'FIRST_PARTY_DECLINED':
      title = `❌ ${userName} דחה/תה`;
      body = 'צד א׳ דחה את ההצעה';
      break;
    case 'SECOND_PARTY_APPROVED':
      title = `✅ ${userName} אישר/ה!`;
      body = 'צד ב׳ אישר — שתף פרטי קשר!';
      break;
    case 'SECOND_PARTY_DECLINED':
      title = `❌ ${userName} דחה/תה`;
      body = 'צד ב׳ דחה את ההצעה';
      break;
  }

  await sendPushToUser(matchmakerId, {
    title,
    body,
    data: {
      type: 'SUGGESTION_STATUS_CHANGE',
      suggestionId,
      newStatus,
      screen: 'matchmaker-dashboard',
    },
  });
}