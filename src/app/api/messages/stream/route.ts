// =============================================================================
// src/app/api/messages/stream/route.ts
// =============================================================================
// SSE endpoint for real-time chat events (user/candidate side).
// Polls Redis for events and streams them to the client.
// Falls back to 503 if Redis is unavailable.
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { consumeEvents, isSSEAvailable } from '@/lib/chatPubSub';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!isSSEAvailable()) {
    return new Response('SSE not available (Redis not configured)', { status: 503 });
  }

  const userId = session.user.id;
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
          // Stream closed
          isOpen = false;
        }
      };

      // Send initial connection event
      sendEvent('connected', { userId, timestamp: lastTimestamp });

      // Poll Redis for new events every 2 seconds
      const pollInterval = setInterval(async () => {
        if (!isOpen) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const events = await consumeEvents(userId, lastTimestamp);
          for (const event of events) {
            sendEvent(event.type, event.data);
            lastTimestamp = event.timestamp;
          }
        } catch (error) {
          console.error('[messages/stream] Poll error:', error);
        }
      }, 2000);

      // Send heartbeat every 15 seconds (Heroku 30s idle timeout)
      const heartbeatInterval = setInterval(() => {
        if (!isOpen) {
          clearInterval(heartbeatInterval);
          return;
        }
        sendEvent('heartbeat', { timestamp: new Date().toISOString() });
      }, 15000);

      // Auto-close after 5 minutes (client will auto-reconnect)
      const closeTimeout = setTimeout(() => {
        isOpen = false;
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        try {
          sendEvent('reconnect', { reason: 'timeout' });
          controller.close();
        } catch {
          // Already closed
        }
      }, 5 * 60 * 1000);

      // Cleanup function
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
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  });
}
