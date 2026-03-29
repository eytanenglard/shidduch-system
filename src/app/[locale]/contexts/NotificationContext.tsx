// =============================================================================
// src/app/[locale]/contexts/NotificationContext.tsx
// =============================================================================
//
// Optimized notification polling:
//   - Uses lightweight countOnly endpoint for feed action counts
//   - Role-aware chat unread fetching
//   - AbortController to cancel stale requests
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
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
      setIsLoadingNotifications(false);
      return;
    }

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoadingNotifications(true);
    try {
      const userRole = (session.user as { role?: string }).role;
      const isMatchmaker = userRole === "MATCHMAKER" || userRole === "ADMIN";

      // === 1. Lightweight feed count (countOnly mode) ===
      const feedResponse = await fetch("/api/messages/feed?countOnly=true", {
        signal: controller.signal,
      });
      let actionRequiredCount = 0;
      if (feedResponse.ok) {
        const data = await feedResponse.json();
        if (data.success) {
          actionRequiredCount = data.actionRequiredCount || 0;
        }
      }

      // === 2. Chat unreads — role-specific ===
      let chatUnreadCount = 0;

      if (isMatchmaker) {
        const [suggestionRes, directRes] = await Promise.all([
          fetch("/api/matchmaker/chat/unread", { signal: controller.signal }),
          fetch("/api/matchmaker/direct-chats", { signal: controller.signal }),
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
        const chatsRes = await fetch("/api/messages/chats", {
          signal: controller.signal,
        });
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
      // Ignore abort errors
      if (error instanceof DOMException && error.name === 'AbortError') return;
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
      abortControllerRef.current?.abort();
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
