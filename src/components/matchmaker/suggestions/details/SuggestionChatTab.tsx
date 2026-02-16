// src/components/matchmaker/suggestions/details/SuggestionChatTab.tsx
// ==========================================
// NeshamaTech - Chat Tab for SuggestionDetailsDialog
// Shows chat messages between matchmaker and parties
// Allows matchmaker to send messages
// ==========================================

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Send, Loader2, MessageCircle, User, Bot, RefreshCw } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
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
  isRead: boolean;
  createdAt: string;
  isFirstParty?: boolean;
  isSecondParty?: boolean;
}

interface PartyInfo {
  id: string;
  name: string;
}

interface SuggestionChatTabProps {
  suggestionId: string;
  locale: Locale;
}

// ==========================================
// Component
// ==========================================

export default function SuggestionChatTab({
  suggestionId,
  locale,
}: SuggestionChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parties, setParties] = useState<{ firstParty?: PartyInfo; secondParty?: PartyInfo }>({});
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isHe = locale === 'he';

  // ==========================================
  // Fetch Messages
  // ==========================================

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/matchmaker/suggestions/${suggestionId}/chat`);
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

  // Initial load + polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read when tab opens
  useEffect(() => {
    if (unreadCount > 0) {
      fetch(`/api/matchmaker/suggestions/${suggestionId}/chat`, {
        method: 'PATCH',
      }).then(() => setUnreadCount(0)).catch(console.error);
    }
  }, [suggestionId, unreadCount]);

  // ==========================================
  // Send Message
  // ==========================================

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/matchmaker/suggestions/${suggestionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!response.ok) throw new Error('Failed to send');
      const data = await response.json();

      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        textareaRef.current?.focus();
      }
    } catch (error) {
      console.error('Send error:', error);
      toast.error(isHe ? 'שגיאה בשליחת ההודעה' : 'Failed to send message');
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
    if (msg.senderType === 'matchmaker') return isHe ? 'את/ה (שדכן)' : 'You (Matchmaker)';
    if (msg.senderType === 'system') return isHe ? 'מערכת' : 'System';
    if (msg.isFirstParty && parties.firstParty) return parties.firstParty.name;
    if (msg.isSecondParty && parties.secondParty) return parties.secondParty.name;
    return msg.senderName;
  };

  const getSenderColor = (msg: ChatMessage) => {
    if (msg.senderType === 'matchmaker') return 'from-purple-500 to-pink-500';
    if (msg.senderType === 'system') return 'from-gray-400 to-slate-500';
    if (msg.isFirstParty) return 'from-blue-500 to-cyan-500';
    return 'from-emerald-500 to-green-500';
  };

  const getPartyLabel = (msg: ChatMessage) => {
    if (msg.isFirstParty) return isHe ? 'צד א\'' : 'Party A';
    if (msg.isSecondParty) return isHe ? 'צד ב\'' : 'Party B';
    return null;
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
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          <span className="font-medium text-gray-700">
            {isHe ? 'הודעות' : 'Messages'}
          </span>
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length}
            </Badge>
          )}
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

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">
              {isHe ? 'אין הודעות עדיין' : 'No messages yet'}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {isHe
                ? 'שלח/י הודעה למועמדים בהקשר של ההצעה הזו'
                : 'Send a message to the candidates about this suggestion'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-3">
            {messages.map((msg) => {
              const isMatchmaker = msg.senderType === 'matchmaker';
              const isSystem = msg.senderType === 'system';
              const partyLabel = getPartyLabel(msg);

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
                    isMatchmaker ? (isHe ? 'flex-row-reverse' : 'flex-row') : (isHe ? 'flex-row' : 'flex-row-reverse')
                  )}
                >
                  {/* Avatar */}
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

                  {/* Bubble */}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                      isMatchmaker
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    )}
                  >
                    {/* Sender info */}
                    <div className={cn(
                      'flex items-center gap-1.5 mb-1',
                      isHe ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      <span className={cn(
                        'text-xs font-medium',
                        isMatchmaker ? 'text-purple-100' : 'text-gray-500'
                      )}>
                        {getSenderLabel(msg)}
                      </span>
                      {partyLabel && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0',
                            isMatchmaker
                              ? 'border-purple-300 text-purple-100'
                              : msg.isFirstParty
                              ? 'border-blue-300 text-blue-600'
                              : 'border-emerald-300 text-emerald-600'
                          )}
                        >
                          {partyLabel}
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <p className={cn(
                      'text-sm leading-relaxed whitespace-pre-wrap',
                      isHe ? 'text-right' : 'text-left'
                    )}>
                      {msg.content}
                    </p>

                    {/* Time */}
                    <div className={cn(
                      'flex items-center gap-1 mt-1',
                      isHe ? 'flex-row-reverse' : 'flex-row'
                    )}>
                      <span className={cn(
                        'text-[10px]',
                        isMatchmaker ? 'text-purple-200' : 'text-gray-400'
                      )}>
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

      {/* Input Area */}
      <div className="border-t bg-white p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isHe ? 'כתוב/י הודעה...' : 'Type a message...'}
            className={cn(
              'flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-purple-400',
              isHe ? 'text-right' : 'text-left'
            )}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
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

        {/* Party labels hint */}
        {parties.firstParty && parties.secondParty && (
          <div className={cn(
            'flex items-center gap-3 mt-2 text-xs text-gray-400',
            isHe ? 'flex-row-reverse' : 'flex-row'
          )}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              {isHe ? 'צד א\'' : 'Party A'}: {parties.firstParty.name}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {isHe ? 'צד ב\'' : 'Party B'}: {parties.secondParty.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
