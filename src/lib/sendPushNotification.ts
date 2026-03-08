// =============================================================================
// src/lib/sendPushNotification.ts
// =============================================================================
//
// Helper to send Expo Push Notifications to a user's registered devices.
// Called from chat routes when a new message is created.
//
// Uses Expo's push notification service (no Firebase needed for delivery).
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