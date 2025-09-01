// src/app/components/messages/MessageList.tsx
import React from 'react';
import type { UnifiedMessage } from '@/types/messages';
import MessageListItem from './MessageListItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';
import type { MessagesPageDict } from '@/types/dictionary';
import type { Locale } from '../../../i18n-config';

interface MessageListProps {
  messages: UnifiedMessage[];
  selectedMessageId: string | null;
  onSelectMessage: (message: UnifiedMessage) => void;
  dict: MessagesPageDict; // קבלת המילון המלא
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

  if (!userId) return null;

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
              onSelect={() => onSelectMessage(message)}
              userId={userId}
              dict={dict.messageListItem} // העברת החלק הרלוונטי
              locale={locale}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;
