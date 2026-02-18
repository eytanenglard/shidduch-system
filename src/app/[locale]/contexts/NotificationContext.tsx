// =============================================================================
// src/app/[locale]/contexts/NotificationContext.tsx
// =============================================================================
//
// UPDATED: Role-aware notification fetching
//
// Changes from current version:
//   1. For MATCHMAKER/ADMIN: fetches both suggestion chat + direct chat unreads
//   2. For CANDIDATE: fetches /api/messages/chats which includes both types
//   3. Fixes bug where matchmaker-only endpoint was called for all users
// =============================================================================

"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";
import type { NotificationCount } from "@/types/messages";
import type { FeedItem } from "@/types/messages";

interface NotificationContextType {
  notifications: NotificationCount;
  refreshNotifications: () => Promise<void>;
  isLoadingNotifications: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: { availabilityRequests: 0, messages: 0, total: 0 },
  refreshNotifications: async () => {},
  isLoadingNotifications: true,
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession() as {
    data: Session | null;
    status: string;
  };
  const [notifications, setNotifications] = useState<NotificationCount>({
    availabilityRequests: 0,
    messages: 0,
    total: 0,
  });
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  const pollingInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
      setIsLoadingNotifications(false);
      return;
    }

    setIsLoadingNotifications(true);
    try {
      const userRole = (session.user as { role?: string }).role;
      const isMatchmaker = userRole === "MATCHMAKER" || userRole === "ADMIN";

      // === 1. Feed (action required items) — same for all roles ===
      const feedResponse = await fetch("/api/messages/feed");
      let actionRequiredCount = 0;
      if (feedResponse.ok) {
        const data = await feedResponse.json();
        if (data.success && Array.isArray(data.feed)) {
          const feed: FeedItem[] = data.feed;
          actionRequiredCount = feed.filter(
            (item) => item.type === "ACTION_REQUIRED"
          ).length;
        }
      }

      // === 2. Chat unreads — role-specific ===
      let chatUnreadCount = 0;

      if (isMatchmaker) {
        // Matchmaker: fetch suggestion chat unreads + direct chat unreads
        const [suggestionRes, directRes] = await Promise.all([
          fetch("/api/matchmaker/chat/unread"),
          fetch("/api/matchmaker/direct-chats"),
        ]);

        if (suggestionRes.ok) {
          const chatData = await suggestionRes.json();
          if (chatData.success) {
            chatUnreadCount += chatData.totalUnread || 0;
          }
        }

        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData.success) {
            chatUnreadCount += directData.totalUnread || 0;
          }
        }
      } else {
        // Candidate: /api/messages/chats returns totalUnread (both direct + suggestion)
        const chatsRes = await fetch("/api/messages/chats");
        if (chatsRes.ok) {
          const chatsData = await chatsRes.json();
          if (chatsData.success) {
            chatUnreadCount = chatsData.totalUnread || 0;
          }
        }
      }

      const newNotifications: NotificationCount = {
        availabilityRequests: actionRequiredCount,
        messages: chatUnreadCount,
        total: actionRequiredCount + chatUnreadCount,
      };
      setNotifications(newNotifications);
    } catch (error) {
      console.error(
        "[NotificationContext] Error fetching notifications:",
        error
      );
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchNotifications();
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(fetchNotifications, 60000);
    } else {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
      if (status !== "loading") setIsLoadingNotifications(false);
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [session?.user?.id, status, fetchNotifications]);

  const value = {
    notifications,
    refreshNotifications: fetchNotifications,
    isLoadingNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}