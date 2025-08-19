// src/app/components/matchmaker/suggestions/services/notification/initNotifications.ts

import { notificationService } from './NotificationService';
import { emailAdapter } from './adapters/EmailAdapter';
import { whatsAppAdapter } from './adapters/WhatsAppAdapter';

// Define notification channel type
export type NotificationChannel = 'email' | 'whatsapp' | 'sms';

export type NotificationOptions = {
    channels: NotificationChannel[];
    notifyParties?: ('first' | 'second' | 'matchmaker')[];
    customMessage?: string;
  };

/**
 * Initializes the notification service by registering all available adapters
 * @returns The initialized notification service
 */
export function initNotificationService() {
  // Register adapters
  notificationService.registerAdapter(emailAdapter);
  notificationService.registerAdapter(whatsAppAdapter);
  
  console.log('Notification service initialized with email and WhatsApp adapters');
  
  return notificationService;
}