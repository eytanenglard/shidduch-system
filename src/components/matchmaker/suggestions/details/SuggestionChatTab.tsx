// src/components/matchmaker/suggestions/details/SuggestionChatTab.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Send, Loader2, MessageCircle, Bot, RefreshCw } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import type { Locale } from '../../../../../i18n-config';

// ==========================================
// Types
// ==========================================

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderType: 'user' | 'matchmaker' | 'system';
  senderName: string;
  targetUserId?: string | null;
  isRead: boolean;
  createdAt: string;
  isFirstParty?: boolean;
  isSecondParty?: boolean;
}

interface PartyInfo {
  id: string;
  name: string;
}

export interface ChatTabDict {
  header: string;
  noMessages: string;
  noMessagesDescription: string;
  placeholder: string;
  sendError: string;
  senderLabels: { matchmaker: string; system: string };
  partyLabels: { partyA: string; partyB: string };
}

const defaultDict: ChatTabDict = {
  header: 'הודעות',
  noMessages: 'אין הודעות עדיין',
  noMessagesDescription: 'שלח/י הודעה למועמד/ת',
  placeholder: 'כתוב/י הודעה...',
  sendError: 'שגיאה בשליחת ההודעה',
  senderLabels: { matchmaker: 'את/ה (שדכן)', system: 'מערכת' },
  partyLabels: { partyA: "צד א'", partyB: "צד ב'" },
};

interface SuggestionChatTabProps {
  suggestionId: string;
  locale: Locale;
  dict?: ChatTabDict;
  defaultParty?: 'first' | 'second'; // ✅ חדש - איזה צד לבחור כברירת מחדל
  hidePartyTabs?: boolean; // ✅ חדש - האם להסתיר את הטאבים
}

export default function SuggestionChatTab({
  suggestionId,
  locale,
  dict,
  defaultParty = 'first', // ✅ ברירת מחדל: צד ראשון
  hidePartyTabs = false, // ✅ ברירת מחדל: להציג טאבים
}: SuggestionChatTabProps) {
  const t = dict || defaultDict;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parties, setParties] = useState<{
    firstParty?: PartyInfo;
    secondParty?: PartyInfo;
  }>({});
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ מעודכן: משתמש ב-defaultParty
  const [selectedParty, setSelectedParty] = useState<'first' | 'second'>(
    defaultParty
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHe = locale === 'he';

  // ==========================================
  // Fetch messages
  // ==========================================

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/chat`
      );
      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        setParties(data.parties || {});
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [suggestionId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedParty]);

  useEffect(() => {
    if (unreadCount > 0) {
      fetch(`/api/matchmaker/suggestions/${suggestionId}/chat`, {
        method: 'PATCH',
      })
        .then(() => setUnreadCount(0))
        .catch(console.error);
    }
  }, [suggestionId, unreadCount]);

  // ==========================================
  // סינון הודעות לפי הצד הנבחר
  // ==========================================

  const selectedPartyId =
    selectedParty === 'first'
      ? parties.firstParty?.id
      : parties.secondParty?.id;

  const filteredMessages = messages.filter((msg) => {
    // הודעות מערכת - מראים תמיד
    if (msg.senderType === 'system') return true;

    // הודעות שהמועמד שלח - מראים רק אם הוא הצד הנבחר
    if (msg.senderType === 'user') {
      return msg.senderId === selectedPartyId;
    }

    // הודעות שהשדכן שלח - מראים רק אם מיועדות לצד הנבחר
    if (msg.senderType === 'matchmaker') {
      // הודעות ישנות בלי targetUserId - מראים לכולם (תאימות לאחור)
      if (!msg.targetUserId) return true;
      return msg.targetUserId === selectedPartyId;
    }

    return true;
  });

  // ספירת הודעות לא נקראות לכל צד
  const firstPartyUnread = messages.filter(
    (m) =>
      m.senderType === 'user' &&
      m.senderId === parties.firstParty?.id &&
      !m.isRead
  ).length;

  const secondPartyUnread = messages.filter(
    (m) =>
      m.senderType === 'user' &&
      m.senderId === parties.secondParty?.id &&
      !m.isRead
  ).length;

  // ==========================================
  // שליחה עם targetUserId
  // ==========================================

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !selectedPartyId) return;
    setIsSending(true);
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: newMessage.trim(),
            targetUserId: selectedPartyId,
          }),
        }
      );
      if (!response.ok) throw new Error('Failed to send');
      const data = await response.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        textareaRef.current?.focus();
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error(t.sendError);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ==========================================
  // Helpers
  // ==========================================

  const getSenderLabel = (msg: ChatMessage) => {
    if (msg.senderType === 'matchmaker') return t.senderLabels.matchmaker;
    if (msg.senderType === 'system') return t.senderLabels.system;
    if (msg.isFirstParty && parties.firstParty) return parties.firstParty.name;
    if (msg.isSecondParty && parties.secondParty)
      return parties.secondParty.name;
    return msg.senderName;
  };

  const getSenderColor = (msg: ChatMessage) => {
    if (msg.senderType === 'matchmaker') return 'from-purple-500 to-pink-500';
    if (msg.senderType === 'system') return 'from-gray-400 to-slate-500';
    if (msg.isFirstParty) return 'from-blue-500 to-cyan-500';
    return 'from-emerald-500 to-green-500';
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex flex-col border-b bg-gray-50/50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-500" />
            <span className="font-medium text-gray-700">{t.header}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMessages}
            className="text-gray-500 hover:text-purple-600"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* ✅ טאבים לבחירת צד - מוסתרים אם hidePartyTabs=true */}
        {!hidePartyTabs && parties.firstParty && parties.secondParty && (
          <div className="flex border-t">
            <button
              onClick={() => setSelectedParty('first')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all border-b-2',
                selectedParty === 'first'
                  ? 'border-blue-500 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              {parties.firstParty.name}
              {firstPartyUnread > 0 && (
                <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] border-0">
                  {firstPartyUnread}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setSelectedParty('second')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all border-b-2',
                selectedParty === 'second'
                  ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {parties.secondParty.name}
              {secondPartyUnread > 0 && (
                <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] border-0">
                  {secondPartyUnread}
                </Badge>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">{t.noMessages}</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {t.noMessagesDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-3">
            {filteredMessages.map((msg) => {
              const isMatchmaker = msg.senderType === 'matchmaker';
              const isSystem = msg.senderType === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-full">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2',
                    isMatchmaker
                      ? isHe
                        ? 'flex-row-reverse'
                        : 'flex-row'
                      : isHe
                        ? 'flex-row'
                        : 'flex-row-reverse'
                  )}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0 shadow-sm">
                    <AvatarFallback
                      className={cn(
                        'text-white text-xs font-bold bg-gradient-to-br',
                        getSenderColor(msg)
                      )}
                    >
                      {isMatchmaker ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        getInitials(msg.senderName)
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                      isMatchmaker
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5 mb-1',
                        isHe ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs font-medium',
                          isMatchmaker ? 'text-purple-100' : 'text-gray-500'
                        )}
                      >
                        {getSenderLabel(msg)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-sm leading-relaxed whitespace-pre-wrap',
                        isHe ? 'text-right' : 'text-left'
                      )}
                    >
                      {msg.content}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-1',
                        isHe ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px]',
                          isMatchmaker ? 'text-purple-200' : 'text-gray-400'
                        )}
                      >
                        {format(new Date(msg.createdAt), 'HH:mm', {
                          locale: isHe ? he : enUS,
                        })}
                      </span>
                      {!msg.isRead && !isMatchmaker && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-white p-3">
        {/* מציג למי ההודעה נשלחת */}
        {selectedPartyId && (
          <div
            className={cn(
              'flex items-center gap-1.5 mb-2 text-xs',
              isHe ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                selectedParty === 'first' ? 'bg-blue-400' : 'bg-emerald-400'
              )}
            />
            <span className="text-gray-500">
              {isHe ? 'שולח ל:' : 'Sending to:'}{' '}
              <span className="font-medium text-gray-700">
                {selectedParty === 'first'
                  ? parties.firstParty?.name
                  : parties.secondParty?.name}
              </span>
            </span>
          </div>
        )}

        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className={cn(
              'flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-purple-400',
              isHe ? 'text-right' : 'text-left'
            )}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending || !selectedPartyId}
            size="icon"
            className={cn(
              'rounded-xl h-11 w-11 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg',
              isHe ? 'rotate-180' : ''
            )}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
