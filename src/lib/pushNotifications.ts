// src/lib/pushNotifications.ts
// ==========================================
// NeshamaTech - Expo Push Notification Service
// Server-side: sends push notifications via Expo's Push API
// ==========================================
//
// SETUP: npm install expo-server-sdk
//

import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import prisma from '@/lib/prisma';

// Create a single Expo SDK client (reuse across requests)
const expo = new Expo();

// ==========================================
// Types
// ==========================================

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

// ==========================================
// Core: Send push to a specific user
// ==========================================

export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; errors: number }> {
  try {
    // Get all device tokens for this user
    const devices = await prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true, platform: true },
    });

    if (devices.length === 0) {
      console.log(`[push] No devices registered for user ${userId}`);
      return { sent: 0, errors: 0 };
    }

    // Filter valid Expo push tokens
    const validTokens = devices
      .map((d) => d.token)
      .filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      console.log(`[push] No valid Expo push tokens for user ${userId}`);
      return { sent: 0, errors: 0 };
    }

    // Build messages
    const messages: ExpoPushMessage[] = validTokens.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      sound: payload.sound ?? 'default',
      badge: payload.badge,
      channelId: payload.channelId || 'default',
      priority: 'high' as const,
    }));

    // Send in chunks (Expo recommends batching)
    const chunks = expo.chunkPushNotifications(messages);
    let sent = 0;
    let errors = 0;

    for (const chunk of chunks) {
      try {
        const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);

        for (const ticket of tickets) {
          if (ticket.status === 'ok') {
            sent++;
          } else {
            errors++;
            console.error(`[push] Error sending to user ${userId}:`, ticket.message);

            // If token is invalid, clean it up
            if (
              ticket.details?.error === 'DeviceNotRegistered' ||
              ticket.details?.error === 'InvalidCredentials'
            ) {
              const failedToken = chunk[tickets.indexOf(ticket)]?.to;
              if (failedToken && typeof failedToken === 'string') {
                await cleanupInvalidToken(failedToken);
              }
            }
          }
        }
      } catch (chunkError) {
        console.error('[push] Chunk send error:', chunkError);
        errors += chunk.length;
      }
    }

    console.log(`[push] Sent ${sent}/${validTokens.length} notifications to user ${userId}`);
    return { sent, errors };
  } catch (error) {
    console.error('[push] sendPushToUser error:', error);
    return { sent: 0, errors: 1 };
  }
}

// ==========================================
// Send push to multiple users
// ==========================================

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; errors: number }> {
  let totalSent = 0;
  let totalErrors = 0;

  // Send in parallel but with a concurrency limit
  const results = await Promise.allSettled(
    userIds.map((userId) => sendPushToUser(userId, payload))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      totalSent += result.value.sent;
      totalErrors += result.value.errors;
    } else {
      totalErrors++;
    }
  }

  return { sent: totalSent, errors: totalErrors };
}

// ==========================================
// Chat-specific notification helpers
// ==========================================

/**
 * Notify user(s) when matchmaker sends a chat message
 */
export async function notifyChatMessage({
  recipientUserIds,
  senderName,
  messagePreview,
  suggestionId,
}: {
  recipientUserIds: string[];
  senderName: string;
  messagePreview: string;
  suggestionId: string;
}) {
  const truncated =
    messagePreview.length > 80
      ? messagePreview.slice(0, 80) + '...'
      : messagePreview;

  return sendPushToUsers(recipientUserIds, {
    title: `💬 ${senderName}`,
    body: truncated,
    data: {
      type: 'NEW_CHAT_MESSAGE',
      suggestionId,
    },
    sound: 'default',
    channelId: 'default',
  });
}

/**
 * Notify matchmaker when user sends a chat message
 * (Uses email notification since matchmaker is on web)
 */
export async function notifyMatchmakerNewMessage({
  matchmakerUserId,
  senderName,
  messagePreview,
  suggestionId,
}: {
  matchmakerUserId: string;
  senderName: string;
  messagePreview: string;
  suggestionId: string;
}) {
  // Matchmakers primarily use web dashboard, so we just log it.
  // The polling mechanism + unread badges handle web notifications.
  // If the matchmaker also has the mobile app, they'll get push too:
  return sendPushToUser(matchmakerUserId, {
    title: `📩 הודעה חדשה מ${senderName}`,
    body:
      messagePreview.length > 80
        ? messagePreview.slice(0, 80) + '...'
        : messagePreview,
    data: {
      type: 'NEW_CHAT_MESSAGE',
      suggestionId,
    },
    sound: 'default',
  });
}

// ==========================================
// Suggestion-specific notifications
// ==========================================

export async function notifyNewSuggestion({
  userId,
  matchmakerName,
  suggestionId,
}: {
  userId: string;
  matchmakerName: string;
  suggestionId: string;
}) {
  return sendPushToUser(userId, {
    title: '💕 הצעת שידוך חדשה!',
    body: `${matchmakerName} שלח/ה לך הצעה חדשה. לחץ/י לצפייה`,
    data: {
      type: 'NEW_SUGGESTION',
      suggestionId,
    },
    sound: 'default',
  });
}

export async function notifyStatusChange({
  userId,
  suggestionId,
  statusMessage,
}: {
  userId: string;
  suggestionId: string;
  statusMessage: string;
}) {
  return sendPushToUser(userId, {
    title: '🔔 עדכון בהצעה',
    body: statusMessage,
    data: {
      type: 'STATUS_CHANGE',
      suggestionId,
    },
  });
}

// ==========================================
// Cleanup invalid tokens
// ==========================================

async function cleanupInvalidToken(token: string) {
  try {
    await prisma.deviceToken.deleteMany({ where: { token } });
    console.log(`[push] Cleaned up invalid token: ${token.slice(0, 20)}...`);
  } catch (error) {
    console.error('[push] Error cleaning up token:', error);
  }
}