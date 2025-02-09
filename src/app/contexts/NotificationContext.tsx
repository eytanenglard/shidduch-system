// src/app/contexts/NotificationContext.tsx
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import type { Session } from "@/types/next-auth";
import type { NotificationCount } from "@/types/messages";

interface NotificationContextType {
  notifications: NotificationCount;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: { availabilityRequests: 0, messages: 0, total: 0 },
  refreshNotifications: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession() as { data: Session | null };
  const [notifications, setNotifications] = useState<NotificationCount>({
    availabilityRequests: 0,
    messages: 0,
    total: 0,
  });

  const pollingInterval = useRef<NodeJS.Timeout>();

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      // Initial fetch
      fetchNotifications();

      // Setup polling
      pollingInterval.current = setInterval(fetchNotifications, 30000);

      // Cleanup
      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [session?.user?.id]);

  const value = {
    notifications,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}
