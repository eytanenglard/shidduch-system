// FILENAME: src/app/components/messages/MessageListItem.tsx

import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials, getRelativeCloudinaryPath } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { UnifiedMessage } from '@/types/messages';
import { CheckCircle, Zap, MessageCircle, Info, Heart } from 'lucide-react';

interface MessageListItemProps {
  message: UnifiedMessage;
  isSelected: boolean;
  onSelect: () => void;
  userId: string;
}

// קומפוננטת עזר לבחירת אייקון וצבע
const MessageIcon: React.FC<{ type: UnifiedMessage['type'] }> = ({ type }) => {
  switch (type) {
    case 'ACTION_REQUIRED':
      return <Zap className="w-3 h-3 text-orange-500 fill-current" />;
    case 'MATCHMAKER_MESSAGE':
    case 'INQUIRY_RESPONSE':
      return <MessageCircle className="w-3 h-3 text-blue-500 fill-current" />;
    case 'STATUS_UPDATE':
      return <Info className="w-3 h-3 text-cyan-500" />;
    case 'NEW_SUGGESTION':
      return <Heart className="w-3 h-3 text-pink-500 fill-current" />;
    default:
      return null;
  }
};

const MessageListItem: React.FC<MessageListItemProps> = ({
  message,
  isSelected,
  onSelect,
  userId,
}) => {
  // במידה ואין payload או suggestion, לא נציג את הפריט
  const suggestion = message.payload?.suggestion;
  if (!suggestion) return null;

  // זיהוי הצד השני בהצעה
  const otherParty =
    suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty;
  if (!otherParty) return null; // הגנה נוספת

  const isActionRequired = message.type === 'ACTION_REQUIRED';
  const mainImage = otherParty.images?.find((img) => img.isMain);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-right p-3 rounded-xl transition-all duration-200 flex items-start gap-4',
        isSelected ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-gray-100'
      )}
    >
      {/* Avatar Section with Icon */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-12 h-12 border-2 border-white shadow-md">
          {mainImage?.url ? (
            <Image
              src={getRelativeCloudinaryPath(mainImage.url)}
              alt={otherParty.firstName}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <AvatarFallback
              className={cn(
                'font-bold text-white',
                isActionRequired
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-500'
              )}
            >
              {getInitials(`${otherParty.firstName} ${otherParty.lastName}`)}
            </AvatarFallback>
          )}
        </Avatar>
        {/* אייקון קטן המציין את סוג ההודעה */}
        <div className="absolute -bottom-1 -left-1 p-1 bg-white rounded-full shadow-lg">
          <MessageIcon type={message.type} />
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800 truncate">{message.title}</h3>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatDistanceToNow(new Date(message.timestamp), {
              addSuffix: true,
              locale: he,
            })}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">{message.description}</p>

        {/* תג "התאמה!" מיוחד */}
        {message.type === 'STATUS_UPDATE' &&
          suggestion.status === 'CONTACT_DETAILS_SHARED' && (
            <Badge className="mt-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-xs shadow-md">
              <CheckCircle className="w-3 h-3 ml-1" />
              התאמה!
            </Badge>
          )}
      </div>
    </button>
  );
};

export default MessageListItem;
