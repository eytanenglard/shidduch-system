// src/components/matchmaker/inbox/InboxItem.tsx
'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageCircle,
  Users,
  MoreVertical,
  CheckSquare,
  Square,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import type { InboxItem as InboxItemType } from '@/types/inbox';

interface InboxItemProps {
  item: InboxItemType;
  isSelected: boolean;
  onSelect: () => void;
  onSetTodo: (status: 'TODO' | 'DONE' | 'NONE') => void;
  onArchive: () => void;
  onUnarchive: () => void;
  isHe: boolean;
}

function formatTime(dateStr: string, isHe: boolean) {
  const date = new Date(dateStr);
  const loc = isHe ? he : enUS;
  if (isToday(date)) return format(date, 'HH:mm', { locale: loc });
  if (isYesterday(date)) return isHe ? 'אתמול' : 'Yesterday';
  return format(date, 'dd/MM', { locale: loc });
}

const STATUS_LABELS: Record<string, { he: string; en: string; color: string }> = {
  PENDING_FIRST_PARTY: { he: "ממתין לצד א'", en: 'Pending A', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  PENDING_SECOND_PARTY: { he: "ממתין לצד ב'", en: 'Pending B', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  FIRST_PARTY_APPROVED: { he: "צד א' אישר", en: 'A Approved', color: 'bg-green-50 text-green-700 border-green-200' },
  SECOND_PARTY_APPROVED: { he: "צד ב' אישר", en: 'B Approved', color: 'bg-green-50 text-green-700 border-green-200' },
  CONTACT_DETAILS_SHARED: { he: 'פרטי קשר', en: 'Details Shared', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  DATING: { he: 'בדייט', en: 'Dating', color: 'bg-pink-50 text-pink-700 border-pink-200' },
};

export default function InboxItem({
  item,
  isSelected,
  onSelect,
  onSetTodo,
  onArchive,
  onUnarchive,
  isHe,
}: InboxItemProps) {
  const isDirect = item.threadType === 'direct';
  const displayName = isDirect
    ? item.candidate?.name || ''
    : `${item.firstParty?.name || ''} ↔ ${item.secondParty?.name || ''}`;

  const avatarName = isDirect ? item.candidate?.name : item.firstParty?.name;
  const avatarUrl = isDirect ? item.candidate?.imageUrl : item.firstParty?.imageUrl;

  const statusInfo = item.suggestionStatus
    ? STATUS_LABELS[item.suggestionStatus]
    : null;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 px-3 py-3 cursor-pointer transition-all border-b border-gray-50',
        'hover:bg-teal-50/40',
        isSelected && 'bg-teal-50/70 border-r-2 border-r-teal-500',
        item.todoStatus === 'TODO' && !isSelected && 'bg-amber-50/30'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <Avatar className="w-10 h-10 shadow-sm">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={avatarName || ''} />}
          <AvatarFallback
            className={cn(
              'text-white text-xs font-bold bg-gradient-to-br',
              isDirect
                ? 'from-purple-400 to-pink-500'
                : 'from-teal-400 to-cyan-500'
            )}
          >
            {getInitials(avatarName || '')}
          </AvatarFallback>
        </Avatar>
        {/* Thread type indicator */}
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm border-2 border-white',
            isDirect ? 'bg-purple-500' : 'bg-teal-500'
          )}
        >
          {isDirect ? (
            <MessageCircle className="w-2.5 h-2.5 text-white" />
          ) : (
            <Users className="w-2.5 h-2.5 text-white" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                'text-sm truncate',
                item.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
              )}
            >
              {displayName}
            </span>
            {item.todoStatus === 'TODO' && (
              <CheckSquare className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}
          </div>
          <span className="text-[11px] text-gray-400 flex-shrink-0">
            {formatTime(item.lastMessageTime, isHe)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={cn(
              'text-xs truncate',
              item.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'
            )}
          >
            {item.lastMessageIsFromUser && (
              <span className="text-teal-600 font-semibold">
                {isDirect ? (item.candidate?.name?.split(' ')[0] || '') : ''}{' '}
              </span>
            )}
            {item.lastMessage}
          </p>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {statusInfo && (
              <Badge
                variant="outline"
                className={cn('text-[9px] px-1.5 py-0 h-4 font-medium', statusInfo.color)}
              >
                {isHe ? statusInfo.he : statusInfo.en}
              </Badge>
            )}
            {item.unreadCount > 0 && (
              <Badge className="bg-teal-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-4 border-0">
                {item.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-md hover:bg-gray-100 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isHe ? 'start' : 'end'} className="w-40">
          {item.todoStatus !== 'TODO' ? (
            <DropdownMenuItem onClick={() => onSetTodo('TODO')}>
              <CheckSquare className="w-4 h-4 mr-2 text-amber-500" />
              {isHe ? 'סמן לטיפול' : 'Mark Todo'}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onSetTodo('DONE')}>
              <Square className="w-4 h-4 mr-2 text-green-500" />
              {isHe ? 'סמן כטופל' : 'Mark Done'}
            </DropdownMenuItem>
          )}
          {!item.isArchived ? (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="w-4 h-4 mr-2 text-gray-500" />
              {isHe ? 'העבר לארכיון' : 'Archive'}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onUnarchive}>
              <ArchiveRestore className="w-4 h-4 mr-2 text-gray-500" />
              {isHe ? 'שחזר מארכיון' : 'Unarchive'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
