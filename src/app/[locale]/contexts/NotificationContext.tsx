// src/app/contexts/NotificationContext.tsx
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
// --- START OF CHANGE: Import new types ---
import type { NotificationCount } from "@/types/messages"; // This type will now be defined in the new file
import type { FeedItem } from "@/types/messages";
// --- END OF CHANGE ---

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

  // --- FIX: Provide 'undefined' as the initial value for useRef ---
  const pollingInterval = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) {
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
      setIsLoadingNotifications(false);
      return;
    }

    setIsLoadingNotifications(true);
    try {
      // --- START OF CHANGE: Call the new API endpoint ---
      const response = await fetch("/api/messages/feed");
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      
      // --- START OF CHANGE: Calculate counts from the new feed ---
      if (data.success && Array.isArray(data.feed)) {
        const feed: FeedItem[] = data.feed;
        const actionRequiredCount = feed.filter(item => item.type === 'ACTION_REQUIRED').length;
        
        // כאן ניתן בעתיד להוסיף ספירה של הודעות שלא נקראו
        const unreadMessagesCount = 0; 
        
        const newNotifications: NotificationCount = {
          // availabilityRequests נשאר כאן למקרה שנרצה להשתמש בו בעתיד, כרגע הוא משולב ב-total
          availabilityRequests: actionRequiredCount, 
          messages: unreadMessagesCount,
          total: actionRequiredCount + unreadMessagesCount,
        };
        setNotifications(newNotifications);
      } else {
        // אם ה-API לא החזיר מבנה תקין
        setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
      }
      // --- END OF CHANGE ---
      
    } catch (error) {
      console.error("[NotificationContext] Error fetching notifications:", error);
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [status, session?.user?.id]);

  useEffect(() => {
    // The rest of the useEffect remains the same, it will now call the updated fetchNotifications
    if (status === "authenticated" && session?.user?.id) {
      fetchNotifications();
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      pollingInterval.current = setInterval(fetchNotifications, 60000); // Poll every 60 seconds
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