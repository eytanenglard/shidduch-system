// src/components/messages/MessageListItem.tsx

import React from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials, getRelativeCloudinaryPath } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import type { UnifiedMessage } from '@/types/messages';
import { CheckCircle, Zap, MessageCircle, Info, Heart } from 'lucide-react';
import type { MessageListItemDict } from '@/types/dictionary';
import type { Locale } from '../../../i18n-config';

interface MessageListItemProps {
  message: UnifiedMessage;
  isSelected: boolean;
  onSelect: () => void;
  userId: string;
  dict: MessageListItemDict;
  locale: Locale;
}

// Komponent pomocniczy do wyboru ikony i koloru na podstawie typu wiadomości
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
  dict,
  locale,
}) => {
  // Jeśli nie ma payloadu lub sugestii, nie renderujemy elementu
  const suggestion = message.payload?.suggestion;
  if (!suggestion) return null;

  // Identyfikacja drugiej strony w sugestii
  const otherParty =
    suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty;
  if (!otherParty) return null; // Dodatkowe zabezpieczenie

  const isActionRequired = message.type === 'ACTION_REQUIRED';
  const mainImage = otherParty.images?.find((img) => img.isMain);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full p-3 rounded-xl transition-all duration-200 flex items-start gap-4',
        locale === 'he' ? 'text-right' : 'text-left',
        isSelected ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-gray-100'
      )}
    >
      {/* Sekcja awatara z ikoną */}
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
        {/* Mała ikona wskazująca typ wiadomości */}
        <div
          className={cn(
            'absolute -bottom-1 p-1 bg-white rounded-full shadow-lg',
            locale === 'he' ? '-left-1' : '-right-1'
          )}
        >
          <MessageIcon type={message.type} />
        </div>
      </div>

      {/* Sekcja treści */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-800 truncate">{message.title}</h3>
          <span className="text-xs text-gray-400 flex-shrink-0">
            {formatDistanceToNow(new Date(message.timestamp), {
              addSuffix: true,
              locale: locale === 'he' ? he : enUS,
            })}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">{message.description}</p>

        {/* Specjalna odznaka "Dopasowanie!" */}
        {message.type === 'STATUS_UPDATE' &&
          suggestion.status === 'CONTACT_DETAILS_SHARED' && (
            <Badge className="mt-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-xs shadow-md">
              <CheckCircle
                className={cn('w-3 h-3', locale === 'he' ? 'ml-1' : 'mr-1')}
              />
              {dict.matchBadge}
            </Badge>
          )}
      </div>
    </button>
  );
};

export default MessageListItem;
