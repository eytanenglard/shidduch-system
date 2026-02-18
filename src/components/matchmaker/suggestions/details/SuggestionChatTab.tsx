// src/components/matchmaker/suggestions/details/SuggestionChatTab.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Send,
  Loader2,
  MessageCircle,
  Bot,
  RefreshCw,
  CheckCheck,
} from 'lucide-react';
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
  sendingTo: string;
  senderLabels: { matchmaker: string; system: string };
  partyLabels: { partyA: string; partyB: string };
}

const defaultDict: ChatTabDict = {
  header: 'הודעות',
  noMessages: 'אין הודעות עדיין',
  noMessagesDescription: 'שלח/י הודעה ראשונה למועמד/ת',
  placeholder: 'כתוב/י הודעה...',
  sendError: 'שגיאה בשליחת ההודעה',
  sendingTo: 'שולח/ת ל:',
  senderLabels: { matchmaker: 'את/ה (שדכן/ית)', system: 'מערכת' },
  partyLabels: { partyA: "צד א'", partyB: "צד ב'" },
};

interface SuggestionChatTabProps {
  suggestionId: string;
  locale: Locale;
  dict?: ChatTabDict;
  defaultParty?: 'first' | 'second';
  hidePartyTabs?: boolean;
}

export default function SuggestionChatTab({
  suggestionId,
  locale,
  dict,
  defaultParty = 'first',
  hidePartyTabs = false,
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
  const [selectedParty, setSelectedParty] = useState<'first' | 'second'>(
    defaultParty
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHe = locale === 'he';

  // ==========================================
  // Selected party ID
  // ==========================================

  const getSelectedPartyId = useCallback(() => {
    return selectedParty === 'first'
      ? parties.firstParty?.id
      : parties.secondParty?.id;
  }, [selectedParty, parties]);

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
      console.error('[fetchMessages] Error:', error);
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
  // Filter messages by selected party
  // ==========================================

  const selectedPartyId = getSelectedPartyId();

  const filteredMessages = messages.filter((msg) => {
    if (msg.senderType === 'system') return true;
    if (msg.senderType === 'user') return msg.senderId === selectedPartyId;
    if (msg.senderType === 'matchmaker') {
      if (!msg.targetUserId) return true;
      return msg.targetUserId === selectedPartyId;
    }
    return true;
  });

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
  // Send with targetUserId
  // ==========================================

  const handleSend = async () => {
    const targetUserId = getSelectedPartyId();
    if (!newMessage.trim() || isSending || !targetUserId) {
      if (!targetUserId && !isLoading) {
        toast.error('לא נבחר נמען להודעה');
      }
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestionId}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: newMessage.trim(), targetUserId }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send');

      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        textareaRef.current?.focus();
      }
    } catch (error) {
      console.error('[handleSend] Error:', error);
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
    if (msg.senderType === 'matchmaker') return 'from-teal-500 to-teal-600';
    if (msg.senderType === 'system') return 'from-gray-400 to-slate-500';
    if (msg.isFirstParty) return 'from-teal-400 to-cyan-500';
    return 'from-amber-400 to-orange-500';
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex flex-col border-b bg-gray-50/50">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-teal-500" />
            <span className="font-medium text-gray-700">{t.header}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMessages}
            className="text-gray-500 hover:text-teal-600"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Party tabs */}
        {!hidePartyTabs && parties.firstParty && parties.secondParty && (
          <div className="flex border-t">
            <button
              onClick={() => setSelectedParty('first')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all border-b-2',
                selectedParty === 'first'
                  ? 'border-teal-500 text-teal-700 bg-teal-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              {parties.firstParty.name}
              {firstPartyUnread > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] border-0">
                  {firstPartyUnread}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setSelectedParty('second')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all border-b-2',
                selectedParty === 'second'
                  ? 'border-amber-500 text-amber-700 bg-amber-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {parties.secondParty.name}
              {secondPartyUnread > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] border-0">
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-teal-300" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">{t.noMessages}</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              {t.noMessagesDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-3" dir="ltr">
            {filteredMessages.map((msg) => {
              const isMatchmaker = msg.senderType === 'matchmaker';
              const isSystem = msg.senderType === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-gray-100 text-gray-500 text-[11px] px-3 py-1.5 rounded-full">
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
                    isMatchmaker ? 'flex-row-reverse' : 'flex-row'
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
                    dir={isHe ? 'rtl' : 'ltr'}
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                      isMatchmaker
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-tr-md'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-md'
                    )}
                  >
                    <span
                      className={cn(
                        'text-[11px] font-medium block mb-1',
                        isMatchmaker ? 'text-teal-100' : 'text-gray-400'
                      )}
                    >
                      {getSenderLabel(msg)}
                    </span>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-1.5',
                        isMatchmaker ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px]',
                          isMatchmaker ? 'text-teal-200' : 'text-gray-400'
                        )}
                      >
                        {format(new Date(msg.createdAt), 'HH:mm', {
                          locale: isHe ? he : enUS,
                        })}
                      </span>
                      {isMatchmaker && (
                        <CheckCheck
                          className={cn(
                            'w-3.5 h-3.5',
                            msg.isRead ? 'text-teal-200' : 'text-teal-300/50'
                          )}
                        />
                      )}
                      {!msg.isRead && !isMatchmaker && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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
        {/* Sending to banner */}
        {selectedPartyId && (
          <div
            className={cn(
              'flex items-center gap-2 mb-2.5 px-3 py-2 rounded-lg text-xs',
              selectedParty === 'first'
                ? 'bg-teal-50 border border-teal-100'
                : 'bg-amber-50 border border-amber-100'
            )}
          >
            <div
              className={cn(
                'w-2 h-2 rounded-full flex-shrink-0',
                selectedParty === 'first' ? 'bg-teal-400' : 'bg-amber-400'
              )}
            />
            <span className="text-gray-600">
              {t.sendingTo || (isHe ? 'שולח/ת ל:' : 'Sending to:')}{' '}
              <span
                className={cn(
                  'font-semibold',
                  selectedParty === 'first' ? 'text-teal-700' : 'text-amber-700'
                )}
              >
                {selectedParty === 'first'
                  ? parties.firstParty?.name
                  : parties.secondParty?.name}
              </span>
            </span>
          </div>
        )}

        {/* Warning if no parties */}
        {!selectedPartyId && !isLoading && (
          <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            ⚠️{' '}
            {isHe
              ? 'לא נמצאו פרטי הצדדים - לא ניתן לשלוח הודעה'
              : 'No party details found - cannot send message'}
          </div>
        )}

        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-teal-400 focus:ring-teal-400/20"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending || !selectedPartyId}
            size="icon"
            className="rounded-xl h-11 w-11 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md transition-all disabled:opacity-40"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 rtl:-scale-x-100" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
