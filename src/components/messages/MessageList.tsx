// src/components/messages/MessageList.tsx

import React from 'react';
import type { UnifiedMessage } from '@/types/messages';
import MessageListItem from './MessageListItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';
import type { MessagesPageDict } from '@/types/dictionary';
import type { Locale } from '../../../i18n-config';
// הוסף את ה-Hook של הנוטיפיקציות
import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';

interface MessageListProps {
  messages: UnifiedMessage[];
  selectedMessageId: string | null;
  onSelectMessage: (message: UnifiedMessage) => void;
  dict: MessagesPageDict;
  locale: Locale;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  selectedMessageId,
  onSelectMessage,
  dict,
  locale,
}) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  
  // שימוש בקונטקסט כדי לרענן את ה-badge
  const { refreshNotifications } = useNotifications();

  if (!userId) return null;

  // פונקציה שתטפל בלחיצה
  const handleMessageSelect = async (message: UnifiedMessage) => {
    // 1. קריאה לפונקציה המקורית שפותחת את ההודעה ב-UI
    onSelectMessage(message);

    // 2. אם ההודעה לא מסומנת כנקראה, נסמן אותה בשרת
      if (!message.isRead) {
      try {
        await fetch('/api/messages/mark-as-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id: message.id, 
            type: message.type 
          }),
        });

        // 3. רענון הנוטיפיקציות כדי שה-Badge ב-Navbar יתעדכן
        refreshNotifications(); // פונקציה זו מגיעה מהקונטקסט
      } catch (error) {
        console.error('Failed to mark message as read', error);
      }
    }
  };

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">
          {dict.messageList.header}
        </h2>
        <p className="text-sm text-gray-500">
          {dict.messageList.subtitle.replace(
            '{{count}}',
            messages.length.toString()
          )}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {messages.map((message) => (
            <MessageListItem
              key={message.id}
              message={message}
              isSelected={message.id === selectedMessageId}
              onSelect={() => handleMessageSelect(message)} // שימוש בפונקציה החדשה
              userId={userId}
              dict={dict.messageListItem}
              locale={locale}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;
