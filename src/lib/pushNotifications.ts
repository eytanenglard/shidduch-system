// src/lib/pushNotifications.ts
// ==========================================
// NeshamaTech - Expo Push Notification Service
// Server-side: sends push notifications via Expo's Push API
// ==========================================
//
// ✅ FIX: Uses plain fetch() instead of expo-server-sdk
//    This avoids node: module errors when bundled by Webpack
//    (expo-server-sdk uses undici which requires node:assert, node:buffer etc.)
//
// ❌ REMOVED: npm install expo-server-sdk  ← no longer needed
//

import prisma from '@/lib/prisma';

// ==========================================
// Constants
// ==========================================

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_CHUNK_SIZE = 100; // Expo recommends max 100 per request

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

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

// ==========================================
// Helper: validate Expo push token format
// ==========================================

function isExpoPushToken(token: string): boolean {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
  );
}

// ==========================================
// Helper: chunk array
// ==========================================

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ==========================================
// Core: Send push to Expo API via fetch
// ==========================================

async function sendToExpoApi(
  messages: Array<{
    to: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    sound?: string | null;
    badge?: number;
    channelId?: string;
    priority?: string;
  }>
): Promise<ExpoPushTicket[]> {
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      console.error(`[push] Expo API error: ${response.status} ${response.statusText}`);
      return messages.map(() => ({ status: 'error' as const, message: `HTTP ${response.status}` }));
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('[push] Expo API fetch error:', error);
    return messages.map(() => ({ status: 'error' as const, message: String(error) }));
  }
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
      .filter((token) => isExpoPushToken(token));

    if (validTokens.length === 0) {
      console.log(`[push] No valid Expo push tokens for user ${userId}`);
      return { sent: 0, errors: 0 };
    }

    // Build messages
    const messages = validTokens.map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
      sound: payload.sound ?? 'default',
      badge: payload.badge,
      channelId: payload.channelId || 'default',
      priority: 'high' as const,
    }));

    // Send in chunks
    const chunks = chunkArray(messages, MAX_CHUNK_SIZE);
    let sent = 0;
    let errors = 0;

    for (const chunk of chunks) {
      const tickets = await sendToExpoApi(chunk);

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
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
            const failedToken = chunk[i]?.to;
            if (failedToken) {
              await cleanupInvalidToken(failedToken);
            }
          }
        }
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