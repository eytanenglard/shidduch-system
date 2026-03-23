// =============================================================================
// src/app/api/matchmaker/inbox/route.ts
// =============================================================================
//
// Unified inbox for matchmakers — aggregates DirectMessage + SuggestionMessage
// into a single sorted stream. Supports filters, search, pagination, and
// todo status updates.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import type { InboxItem, InboxResponse } from '@/types/inbox';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const matchmakerId = session.user.id;
    const { searchParams } = new URL(req.url);
    const filter = (searchParams.get('filter') || 'all') as string;
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '30')));

    // =========================================================================
    // 1. Fetch suggestion-based threads
    // =========================================================================
    const suggestions = await prisma.matchSuggestion.findMany({
      where: {
        matchmakerId,
        category: { not: 'HISTORY' },
      },
      select: {
        id: true,
        status: true,
        firstPartyId: true,
        secondPartyId: true,
        firstParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            images: { where: { isMain: true }, take: 1, select: { url: true } },
          },
        },
        secondParty: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            images: { where: { isMain: true }, take: 1, select: { url: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            senderType: true,
            senderId: true,
            todoStatus: true,
            archivedAt: true,
          },
        },
      },
      orderBy: { lastActivity: 'desc' },
    });

    // Unread counts per suggestion
    const unreadCounts = await prisma.suggestionMessage.groupBy({
      by: ['suggestionId'],
      where: {
        senderType: 'USER',
        isRead: false,
        suggestion: { matchmakerId },
      },
      _count: { id: true },
    });
    const unreadMap = new Map(unreadCounts.map((u) => [u.suggestionId, u._count.id]));

    // Todo counts per suggestion (latest message's todoStatus)
    const todoCounts = await prisma.suggestionMessage.groupBy({
      by: ['suggestionId'],
      where: {
        todoStatus: 'TODO',
        suggestion: { matchmakerId },
      },
      _count: { id: true },
    });
    const todoMap = new Map(todoCounts.map((t) => [t.suggestionId, t._count.id]));

    // Build suggestion inbox items
    const suggestionItems: InboxItem[] = suggestions
      .filter((s) => s.messages.length > 0) // Only show suggestions with messages
      .map((s) => {
        const lastMsg = s.messages[0];
        const firstName = `${s.firstParty.firstName} ${s.firstParty.lastName}`;
        const secondName = `${s.secondParty.firstName} ${s.secondParty.lastName}`;

        return {
          id: `suggestion:${s.id}`,
          threadType: 'suggestion' as const,
          firstParty: {
            id: s.firstParty.id,
            name: firstName,
            imageUrl: s.firstParty.images[0]?.url || null,
          },
          secondParty: {
            id: s.secondParty.id,
            name: secondName,
            imageUrl: s.secondParty.images[0]?.url || null,
          },
          suggestionId: s.id,
          suggestionStatus: s.status,
          lastMessage: lastMsg.content,
          lastMessageTime: lastMsg.createdAt.toISOString(),
          lastMessageIsFromUser: lastMsg.senderType === 'USER',
          unreadCount: unreadMap.get(s.id) || 0,
          todoStatus: (todoMap.get(s.id) || 0) > 0 ? 'TODO' as const : 'NONE' as const,
          isArchived: !!lastMsg.archivedAt,
        };
      });

    // =========================================================================
    // 2. Fetch direct chat threads
    // =========================================================================
    const [sentTo, receivedFrom] = await Promise.all([
      prisma.directMessage.findMany({
        where: { senderId: matchmakerId },
        select: { receiverId: true },
        distinct: ['receiverId'],
      }),
      prisma.directMessage.findMany({
        where: { receiverId: matchmakerId },
        select: { senderId: true },
        distinct: ['senderId'],
      }),
    ]);

    const directUserIds = [
      ...new Set([
        ...sentTo.map((m) => m.receiverId),
        ...receivedFrom.map((m) => m.senderId),
      ]),
    ];

    let directItems: InboxItem[] = [];

    if (directUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: directUserIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          images: { where: { isMain: true }, take: 1, select: { url: true } },
        },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      // Unread counts
      const directUnread = await prisma.directMessage.groupBy({
        by: ['senderId'],
        where: {
          receiverId: matchmakerId,
          senderId: { in: directUserIds },
          isRead: false,
        },
        _count: { id: true },
      });
      const directUnreadMap = new Map(directUnread.map((u) => [u.senderId, u._count.id]));

      // Todo counts
      const directTodo = await prisma.directMessage.groupBy({
        by: ['senderId'],
        where: {
          receiverId: matchmakerId,
          senderId: { in: directUserIds },
          todoStatus: 'TODO',
        },
        _count: { id: true },
      });
      const directTodoMap = new Map(directTodo.map((t) => [t.senderId, t._count.id]));

      // Last messages per user
      const allDirectMessages = await prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: matchmakerId, receiverId: { in: directUserIds } },
            { senderId: { in: directUserIds }, receiverId: matchmakerId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          content: true,
          createdAt: true,
          senderId: true,
          receiverId: true,
          archivedAt: true,
        },
      });

      const lastMsgMap = new Map<string, typeof allDirectMessages[0]>();
      for (const msg of allDirectMessages) {
        const uid = msg.senderId === matchmakerId ? msg.receiverId : msg.senderId;
        if (!lastMsgMap.has(uid)) {
          lastMsgMap.set(uid, msg);
        }
      }

      directItems = directUserIds
        .filter((uid) => lastMsgMap.has(uid))
        .map((uid) => {
          const user = userMap.get(uid);
          const lm = lastMsgMap.get(uid)!;
          const name = user ? `${user.firstName} ${user.lastName}` : 'Unknown';

          return {
            id: `direct:${uid}`,
            threadType: 'direct' as const,
            candidate: {
              id: uid,
              name,
              imageUrl: user?.images[0]?.url || null,
            },
            lastMessage: lm.content,
            lastMessageTime: lm.createdAt.toISOString(),
            lastMessageIsFromUser: lm.senderId !== matchmakerId,
            unreadCount: directUnreadMap.get(uid) || 0,
            todoStatus: (directTodoMap.get(uid) || 0) > 0 ? 'TODO' as const : 'NONE' as const,
            isArchived: !!lm.archivedAt,
          };
        });
    }

    // =========================================================================
    // 3. Merge, filter, sort, paginate
    // =========================================================================
    let allItems = [...suggestionItems, ...directItems];

    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      allItems = allItems.filter((item) => {
        if (item.candidate?.name.toLowerCase().includes(q)) return true;
        if (item.firstParty?.name.toLowerCase().includes(q)) return true;
        if (item.secondParty?.name.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    // Count totals before filtering
    const totalUnread = allItems.reduce((sum, i) => sum + i.unreadCount, 0);
    const totalTodo = allItems.filter((i) => i.todoStatus === 'TODO').length;

    // Apply status filter
    if (filter === 'unread') {
      allItems = allItems.filter((i) => i.unreadCount > 0);
    } else if (filter === 'todo') {
      allItems = allItems.filter((i) => i.todoStatus === 'TODO');
    } else if (filter === 'archived') {
      allItems = allItems.filter((i) => i.isArchived);
    } else {
      // 'all' — hide archived by default
      allItems = allItems.filter((i) => !i.isArchived);
    }

    // Sort: unread from users first → todo → recency
    allItems.sort((a, b) => {
      // Unread messages from users (needs response) highest priority
      const aUrgent = a.unreadCount > 0 && a.lastMessageIsFromUser ? 1 : 0;
      const bUrgent = b.unreadCount > 0 && b.lastMessageIsFromUser ? 1 : 0;
      if (aUrgent !== bUrgent) return bUrgent - aUrgent;

      // Then by unread count
      if (a.unreadCount !== b.unreadCount) return b.unreadCount - a.unreadCount;

      // Then TODO items
      const aTodo = a.todoStatus === 'TODO' ? 1 : 0;
      const bTodo = b.todoStatus === 'TODO' ? 1 : 0;
      if (aTodo !== bTodo) return bTodo - aTodo;

      // Then by recency
      return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });

    const totalCount = allItems.length;

    // Paginate
    const start = (page - 1) * pageSize;
    const paginatedItems = allItems.slice(start, start + pageSize);

    const response: InboxResponse = {
      success: true,
      items: paginatedItems,
      totalUnread,
      totalTodo,
      totalCount,
      page,
      pageSize,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[matchmaker/inbox] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inbox' },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH — Update todo status or archive threads
// =============================================================================
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (
      session.user.role !== UserRole.MATCHMAKER &&
      session.user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { threadId, action, todoStatus } = body as {
      threadId: string;
      action: 'setTodo' | 'archive' | 'unarchive';
      todoStatus?: 'NONE' | 'TODO' | 'DONE';
    };

    if (!threadId) {
      return NextResponse.json({ error: 'threadId is required' }, { status: 400 });
    }

    const matchmakerId = session.user.id;
    const [type, id] = threadId.split(':');

    if (action === 'setTodo' && todoStatus) {
      if (type === 'suggestion') {
        // Update all unread USER messages in this suggestion
        await prisma.suggestionMessage.updateMany({
          where: {
            suggestionId: id,
            senderType: 'USER',
            suggestion: { matchmakerId },
          },
          data: { todoStatus },
        });
      } else if (type === 'direct') {
        // Update all unread messages from this user
        await prisma.directMessage.updateMany({
          where: {
            senderId: id,
            receiverId: matchmakerId,
          },
          data: { todoStatus },
        });
      }
    } else if (action === 'archive' || action === 'unarchive') {
      const archivedAt = action === 'archive' ? new Date() : null;

      if (type === 'suggestion') {
        await prisma.suggestionMessage.updateMany({
          where: {
            suggestionId: id,
            suggestion: { matchmakerId },
          },
          data: { archivedAt },
        });
      } else if (type === 'direct') {
        await prisma.directMessage.updateMany({
          where: {
            OR: [
              { senderId: id, receiverId: matchmakerId },
              { senderId: matchmakerId, receiverId: id },
            ],
          },
          data: { archivedAt },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[matchmaker/inbox] PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to update inbox item' },
      { status: 500 }
    );
  }
}
