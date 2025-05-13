// src/app/contexts/NotificationContext.tsx
"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback, // הוסף useCallback
} from "react";
import { useSession } from "next-auth/react";
import type { Session } from "@/types/next-auth"; // ודא שהנתיב לטיפוסים שלך נכון
import type { NotificationCount } from "@/types/messages"; // ודא שהנתיב לטיפוסים שלך נכון

interface NotificationContextType {
  notifications: NotificationCount;
  refreshNotifications: () => Promise<void>;
  isLoadingNotifications: boolean; // הוסף מצב טעינה
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: { availabilityRequests: 0, messages: 0, total: 0 },
  refreshNotifications: async () => {},
  isLoadingNotifications: true, // ערך התחלתי
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
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true); // מצב טעינה

  const pollingInterval = useRef<NodeJS.Timeout | undefined>(); // שנה את הטיפוס כדי לאפשר undefined

  const fetchNotifications = useCallback(async () => {
    if (
      status !== "authenticated" ||
      !session?.user?.id ||
      !session?.user.isPhoneVerified
    ) {
      // console.log(
      //   "[NotificationContext] Skipping fetchNotifications: User session not ready or phone not verified.",
      //   { status, userId: session?.user?.id, isPhoneVerified: session?.user?.isPhoneVerified }
      // );
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
      setIsLoadingNotifications(false); // סיים טעינה גם אם לא קוראים ל-API
      return;
    }

    // console.log("[NotificationContext] Attempting to fetch notifications...");
    setIsLoadingNotifications(true);
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        // אם התגובה היא הפנייה (למשל 307), זה יגיע לכאן
        // console.warn(
        //   `[NotificationContext] Failed to fetch notifications. Status: ${response.status}`
        // );
        // במקרה של הפנייה, ה-response.json() ייכשל למטה, אז נצא כאן
        // או שנאפס נוטיפיקציות אם רוצים
        setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
        // החזר שגיאה ספציפית או אל תעשה כלום
        throw new Error(`Server responded with ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data);
      // console.log("[NotificationContext] Notifications fetched successfully:", data);
    } catch (error) {
      // console.error(
      //   "[NotificationContext] Error fetching or parsing notifications:",
      //   error
      // );
      // אם יש שגיאה (כולל JSON לא תקין), אפס נוטיפיקציות
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [status, session?.user?.id, session?.user?.isPhoneVerified]); // תלויות של useCallback

  useEffect(() => {
    // console.log("[NotificationContext] useEffect triggered. Status:", status, "User ID:", session?.user?.id, "Phone Verified:", session?.user?.isPhoneVerified);

    if (
      status === "authenticated" &&
      session?.user?.id &&
      session.user.isPhoneVerified
    ) {
      // console.log(
      //   "[NotificationContext] User is authenticated and phone verified. Setting up notifications fetch and polling."
      // );
      fetchNotifications(); // קריאה ראשונית

      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      pollingInterval.current = setInterval(fetchNotifications, 30000); // 30 שניות

      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
          pollingInterval.current = undefined;
          // console.log(
          //   "[NotificationContext] Cleared notification polling interval on cleanup."
          // );
        }
      };
    } else {
      // אם המשתמש לא מחובר, או שהסשן בטעינה, או שהטלפון לא מאומת
      // console.log(
      //   "[NotificationContext] Conditions not met for notifications. Clearing interval and resetting notifications.",
      //   { status, userId: session?.user?.id, isPhoneVerified: session?.user?.isPhoneVerified }
      // );
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = undefined;
      }
      setNotifications({ availabilityRequests: 0, messages: 0, total: 0 });
      // קבע את מצב הטעינה ל-false אם התנאים לא מתקיימים והאפקט רץ
      // כדי למנוע מצב טעינה תמידי אם המשתמש לא יאמת טלפון
      if (status !== "loading") {
        // רק אם הסשן לא באמצע טעינה
        setIsLoadingNotifications(false);
      }
    }
  }, [
    session?.user?.id,
    session?.user?.isPhoneVerified,
    status,
    fetchNotifications,
  ]); // הוסף fetchNotifications לתלויות

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
