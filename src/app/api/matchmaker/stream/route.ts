// =============================================================================
// src/app/api/matchmaker/stream/route.ts
// =============================================================================
// SSE endpoint for real-time chat events (matchmaker side).
// Same pattern as user stream but subscribes to matchmaker's channel.
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { consumeEvents, isSSEAvailable } from '@/lib/chatPubSub';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN) {
    return new Response('Forbidden', { status: 403 });
  }

  if (!isSSEAvailable()) {
    return new Response('SSE not available (Redis not configured)', { status: 503 });
  }

  const matchmakerId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let lastTimestamp = new Date().toISOString();
      let isOpen = true;

      const sendEvent = (eventType: string, data: unknown) => {
        if (!isOpen) return;
        try {
          const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          isOpen = false;
        }
      };

      sendEvent('connected', { userId: matchmakerId, timestamp: lastTimestamp });

      const pollInterval = setInterval(async () => {
        if (!isOpen) { clearInterval(pollInterval); return; }
        try {
          const events = await consumeEvents(matchmakerId, lastTimestamp);
          for (const event of events) {
            sendEvent(event.type, event.data);
            lastTimestamp = event.timestamp;
          }
        } catch (error) {
          console.error('[matchmaker/stream] Poll error:', error);
        }
      }, 2000);

      const heartbeatInterval = setInterval(() => {
        if (!isOpen) { clearInterval(heartbeatInterval); return; }
        sendEvent('heartbeat', { timestamp: new Date().toISOString() });
      }, 15000);

      const closeTimeout = setTimeout(() => {
        isOpen = false;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        try {
          sendEvent('reconnect', { reason: 'timeout' });
          controller.close();
        } catch { /* already closed */ }
      }, 5 * 60 * 1000);

      return () => {
        isOpen = false;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        clearTimeout(closeTimeout);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
