// =============================================================================
// src/app/api/mobile/matchmaker/broadcast/route.ts
// =============================================================================
//
// POST — Send broadcast message to multiple candidates
//
// Supports:
//   - type: 'direct' → creates DirectMessage for each recipient (isBroadcast=true)
//   - type: 'system' → creates UserAlert for each recipient
//
//   - targetMode: 'all'      → all active candidates
//   - targetMode: 'filtered' → candidates matching filters (gender/city/status/etc.)
//   - targetMode: 'selected' → specific userIds
//
// Also sends push notifications to all recipients.
// =============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';
import { sendPushToUser } from '@/lib/sendPushNotification';

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const matchmakerId = auth.userId;
    const body = await req.json();

    const {
      content,
      type,        // 'direct' | 'system'
      targetMode,  // 'all' | 'filtered' | 'selected'
      userIds,     // for targetMode='selected'
      filters,     // for targetMode='filtered': { gender?, city?, availabilityStatus?, religiousLevel? }
    } = body;

    // =========================================================================
    // Validation
    // =========================================================================
    if (!content?.trim()) {
      return corsError(req, 'Message content is required', 400);
    }

    if (!type || !['direct', 'system'].includes(type)) {
      return corsError(req, 'Invalid type. Must be "direct" or "system"', 400);
    }

    if (!targetMode || !['all', 'filtered', 'selected'].includes(targetMode)) {
      return corsError(req, 'Invalid targetMode. Must be "all", "filtered", or "selected"', 400);
    }

    if (targetMode === 'selected' && (!userIds || !Array.isArray(userIds) || userIds.length === 0)) {
      return corsError(req, 'userIds array is required for "selected" targetMode', 400);
    }

    // =========================================================================
    // Resolve target users
    // =========================================================================
    let recipientIds: string[] = [];

    if (targetMode === 'selected') {
      // Validate that all userIds exist and are candidates
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: userIds },
          role: 'CANDIDATE',
        },
        select: { id: true },
      });
      recipientIds = validUsers.map((u) => u.id);
    } else {
      // Build query for 'all' or 'filtered'
      const where: any = {
        role: 'CANDIDATE',
        status: 'ACTIVE',
      };

      if (targetMode === 'filtered' && filters) {
        const profileFilter: any = {};
        if (filters.gender) profileFilter.gender = filters.gender;
        if (filters.city) {
          profileFilter.city = { contains: filters.city, mode: 'insensitive' };
        }
        if (filters.availabilityStatus) {
          profileFilter.availabilityStatus = filters.availabilityStatus;
        }
        if (filters.religiousLevel) {
          profileFilter.religiousLevel = {
            contains: filters.religiousLevel,
            mode: 'insensitive',
          };
        }

        if (Object.keys(profileFilter).length > 0) {
          where.profile = { is: profileFilter };
        }
      }

      const users = await prisma.user.findMany({
        where,
        select: { id: true },
      });
      recipientIds = users.map((u) => u.id);
    }

    if (recipientIds.length === 0) {
      return corsJson(req, {
        success: true,
        sent: 0,
        message: 'No matching recipients found',
      });
    }

    // Safety limit
    const MAX_RECIPIENTS = 500;
    if (recipientIds.length > MAX_RECIPIENTS) {
      return corsError(
        req,
        `Too many recipients (${recipientIds.length}). Maximum is ${MAX_RECIPIENTS}. Use more specific filters.`,
        400
      );
    }

    // =========================================================================
    // Get matchmaker name for push
    // =========================================================================
    const matchmaker = await prisma.user.findUnique({
      where: { id: matchmakerId },
      select: { firstName: true, lastName: true },
    });
    const matchmakerName = matchmaker
      ? `${matchmaker.firstName} ${matchmaker.lastName}`
      : 'NeshamaTech';

    // =========================================================================
    // Send messages
    // =========================================================================
    const trimmedContent = content.trim();
    let sentCount = 0;

    if (type === 'direct') {
      // Create DirectMessage for each recipient with isBroadcast=true
      // Batch create for performance
      const messages = recipientIds.map((userId) => ({
        senderId: matchmakerId,
        receiverId: userId,
        content: trimmedContent,
        isBroadcast: true,
      }));

      const result = await prisma.directMessage.createMany({
        data: messages,
      });
      sentCount = result.count;

      // Send push notifications (non-blocking, in batches)
      const PUSH_BATCH_SIZE = 20;
      for (let i = 0; i < recipientIds.length; i += PUSH_BATCH_SIZE) {
        const batch = recipientIds.slice(i, i + PUSH_BATCH_SIZE);
        Promise.all(
          batch.map((userId) =>
            sendPushToUser(userId, {
              title: `💬 ${matchmakerName}`,
              body:
                trimmedContent.length > 80
                  ? trimmedContent.slice(0, 80) + '…'
                  : trimmedContent,
              data: {
                type: 'NEW_DIRECT_MESSAGE',
                screen: 'chat/matchmaker',
              },
            })
          )
        ).catch(console.error);
      }
    } else {
      // type === 'system' — Create UserAlert for each recipient
      const alerts = recipientIds.map((userId) => ({
        userId,
        type: 'BROADCAST_MESSAGE' as const,
        severity: 'INFO' as const,
        title: `הודעה מ${matchmakerName}`,
        message: trimmedContent,
        data: { broadcastBy: matchmakerId } as any,
      }));

      const result = await prisma.userAlert.createMany({
        data: alerts,
      });
      sentCount = result.count;

      // Send push notifications (non-blocking, in batches)
      const PUSH_BATCH_SIZE = 20;
      for (let i = 0; i < recipientIds.length; i += PUSH_BATCH_SIZE) {
        const batch = recipientIds.slice(i, i + PUSH_BATCH_SIZE);
        Promise.all(
          batch.map((userId) =>
            sendPushToUser(userId, {
              title: `📢 ${matchmakerName}`,
              body:
                trimmedContent.length > 80
                  ? trimmedContent.slice(0, 80) + '…'
                  : trimmedContent,
              data: {
                type: 'BROADCAST_MESSAGE',
                screen: 'notifications',
              },
            })
          )
        ).catch(console.error);
      }
    }

    console.log(
      `[broadcast] Matchmaker ${matchmakerId} sent ${type} broadcast to ${sentCount} recipients (mode: ${targetMode})`
    );

    return corsJson(req, {
      success: true,
      sent: sentCount,
      type,
      targetMode,
      message: `הודעה נשלחה ל-${sentCount} מועמדים`,
    });
  } catch (error) {
    console.error('[mobile/matchmaker/broadcast] Error:', error);
    return corsError(req, 'Internal server error', 500);
  }
}