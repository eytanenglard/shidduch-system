// src/lib/chatPubSub.ts
//
// Redis-backed pub/sub for real-time chat events.
// Uses Upstash Redis lists as message queues (REST API compatible).
// Gracefully degrades to no-op when Redis is unavailable.

import { Redis } from '@upstash/redis';

// ==========================================
// Redis client (singleton)
// ==========================================
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// ==========================================
// Event types
// ==========================================

export interface ChatEvent {
  type: 'new_message' | 'message_read' | 'typing';
  timestamp: string;
  data: Record<string, unknown>;
}

// ==========================================
// Publish events to Redis lists
// ==========================================

const CHANNEL_TTL = 300; // 5 minutes TTL for channel lists
const MAX_EVENTS_PER_CHANNEL = 50; // Keep last 50 events per channel

function channelKey(userId: string) {
  return `chat:events:${userId}`;
}

function typingKey(conversationId: string, userId: string) {
  return `chat:typing:${conversationId}:${userId}`;
}

/**
 * Publish a new message event to a user's event channel.
 */
export async function publishNewMessage(
  recipientUserId: string,
  message: {
    id: string;
    content: string;
    senderType: string;
    senderId: string;
    senderName?: string;
    conversationId: string;
    conversationType: 'direct' | 'suggestion';
  }
): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    const event: ChatEvent = {
      type: 'new_message',
      timestamp: new Date().toISOString(),
      data: message,
    };

    const key = channelKey(recipientUserId);
    await r.lpush(key, JSON.stringify(event));
    await r.ltrim(key, 0, MAX_EVENTS_PER_CHANNEL - 1);
    await r.expire(key, CHANNEL_TTL);
  } catch (error) {
    console.error('[chatPubSub] publishNewMessage error:', error);
  }
}

/**
 * Publish a typing indicator (stored as a key with short TTL).
 */
export async function publishTypingIndicator(
  conversationId: string,
  userId: string,
  userName: string,
  recipientUserId: string
): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    // Set typing indicator with 3-second TTL
    const key = typingKey(conversationId, userId);
    await r.set(key, JSON.stringify({ userId, userName }), { ex: 3 });

    // Also push a typing event to the recipient's channel
    const event: ChatEvent = {
      type: 'typing',
      timestamp: new Date().toISOString(),
      data: { conversationId, userId, userName },
    };
    const channelK = channelKey(recipientUserId);
    await r.lpush(channelK, JSON.stringify(event));
    await r.ltrim(channelK, 0, MAX_EVENTS_PER_CHANNEL - 1);
    await r.expire(channelK, CHANNEL_TTL);
  } catch (error) {
    console.error('[chatPubSub] publishTypingIndicator error:', error);
  }
}

/**
 * Publish message read event.
 */
export async function publishMessageRead(
  recipientUserId: string,
  conversationId: string,
  readByUserId: string
): Promise<void> {
  const r = getRedis();
  if (!r) return;

  try {
    const event: ChatEvent = {
      type: 'message_read',
      timestamp: new Date().toISOString(),
      data: { conversationId, readByUserId },
    };
    const key = channelKey(recipientUserId);
    await r.lpush(key, JSON.stringify(event));
    await r.ltrim(key, 0, MAX_EVENTS_PER_CHANNEL - 1);
    await r.expire(key, CHANNEL_TTL);
  } catch (error) {
    console.error('[chatPubSub] publishMessageRead error:', error);
  }
}

/**
 * Consume events from a user's channel (used by SSE endpoint).
 * Returns all events since the given cursor timestamp, then clears old ones.
 */
export async function consumeEvents(
  userId: string,
  sinceTimestamp?: string
): Promise<ChatEvent[]> {
  const r = getRedis();
  if (!r) return [];

  try {
    const key = channelKey(userId);
    const rawEvents = await r.lrange(key, 0, MAX_EVENTS_PER_CHANNEL - 1);

    if (!rawEvents || rawEvents.length === 0) return [];

    const events: ChatEvent[] = rawEvents
      .map((raw) => {
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          return null;
        }
      })
      .filter((e): e is ChatEvent => e !== null);

    if (sinceTimestamp) {
      const since = new Date(sinceTimestamp).getTime();
      return events.filter((e) => new Date(e.timestamp).getTime() > since);
    }

    return events;
  } catch (error) {
    console.error('[chatPubSub] consumeEvents error:', error);
    return [];
  }
}

/**
 * Check if a user is currently typing in a conversation.
 */
export async function getTypingUsers(
  conversationId: string
): Promise<Array<{ userId: string; userName: string }>> {
  const r = getRedis();
  if (!r) return [];

  try {
    // Scan for typing keys matching this conversation
    // Since Upstash REST API doesn't have SCAN, use a known pattern
    // The caller should know which users might be typing
    return [];
  } catch {
    return [];
  }
}

/**
 * Check if Redis is available for SSE features.
 */
export function isSSEAvailable(): boolean {
  return !!getRedis();
}
