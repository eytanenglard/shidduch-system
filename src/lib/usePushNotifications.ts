// src/hooks/usePushNotifications.ts
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { notificationsApi } from '../services/api';

// ✅ תיקון 1: הגדרת טיפוס מקומי במקום לייבא מ-types
interface PushNotificationData {
  type?: string;
  suggestionId?: string;
  [key: string]: unknown;
}

// ✅ תיקון 2: הוספת shouldShowBanner + shouldShowList (גרסה חדשה של expo-notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // ✅ תיקון 3: Subscription type עודכן בגרסאות חדשות
const notificationListener = useRef<Notifications.EventSubscription>(null);
const responseListener = useRef<Notifications.EventSubscription>(null);
  const router = useRouter();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        registerTokenWithServer(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      }
    );

    // ✅ תיקון 4: שימוש ב-.remove() במקום removeNotificationSubscription
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    // ✅ תיקון 5: cast דרך unknown
    const data = response.notification.request.content.data as unknown as PushNotificationData;

    if (data?.type === 'NEW_CHAT_MESSAGE' && data?.suggestionId) {
      router.push('/chat/matchmaker');
    } else if (data?.type === 'NEW_SUGGESTION' && data?.suggestionId) {
      router.push(`/suggestions/${data.suggestionId}` as any);
    } else if (data?.type === 'STATUS_CHANGE' && data?.suggestionId) {
      router.push(`/suggestions/${data.suggestionId}` as any);
    } else {
      router.push('/(tabs)/suggestions');
    }
  };

  const registerTokenWithServer = async (token: string) => {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      await notificationsApi.registerDevice(token, platform);
      setIsRegistered(true);
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  };

  const unregister = async () => {
    if (expoPushToken) {
      try {
        await notificationsApi.unregisterDevice(expoPushToken);
        setIsRegistered(false);
        setExpoPushToken(null);
      } catch (error) {
        console.error('Error unregistering push token:', error);
      }
    }
  };

  return {
    expoPushToken,
    notification,
    isRegistered,
    unregister,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F43F5E',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission for push notifications was denied');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    token = tokenData.data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  return token;
}

export default usePushNotifications;