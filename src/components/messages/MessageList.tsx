// src/app/components/messages/MessageList.tsx
import React from 'react';
import type { UnifiedMessage } from '@/types/messages';
import MessageListItem from './MessageListItem'; // זה יתחיל לעבוד אחרי שתיצור את הקובץ הבא
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';

interface MessageListProps {
  messages: UnifiedMessage[];
  selectedMessageId: string | null;
  onSelectMessage: (message: UnifiedMessage) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, selectedMessageId, onSelectMessage }) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  if (!userId) return null; // הגנה למקרה שהסשן לא טעון

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">מרכז הפעילות</h2>
        <p className="text-sm text-gray-500">{messages.length} הצעות ועדכונים</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {messages.map((message) => (
            <MessageListItem
              key={message.id}
              message={message}
              isSelected={message.id === selectedMessageId}
              onSelect={() => onSelectMessage(message)}
              userId={userId}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;