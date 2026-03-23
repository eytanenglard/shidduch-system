// src/components/matchmaker/inbox/MatchmakerInbox.tsx
//
// Unified inbox for matchmakers — 2-column layout:
// Left: inbox list with filters. Right: active chat.

'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Inbox, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import InboxFilters from './InboxFilters';
import InboxItemComponent from './InboxItem';
import QuickReplyPicker from './QuickReplyPicker';
import TemplateManager from './TemplateManager';
import SuggestionChatTab from '@/components/matchmaker/suggestions/details/SuggestionChatTab';
import type { Locale } from '../../../../i18n-config';
import type { InboxItem, InboxFilter, InboxResponse } from '@/types/inbox';

// ==========================================
// Types
// ==========================================

export interface MatchmakerInboxHandle {
  refresh: () => void;
}

export interface MatchmakerInboxProps {
  locale: Locale;
  onUnreadUpdate?: (total: number) => void;
}

// ==========================================
// DirectChatView (inline sub-component)
// ==========================================

interface ChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'matchmaker' | 'system';
  senderId: string;
  createdAt: string;
}

function DirectChatView({
  userId,
  locale,
}: {
  userId: string;
  locale: Locale;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const userScrolledUpRef = useRef(false);
  const isHe = locale === 'he';

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/matchmaker/direct-chats/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading direct messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMessages();
    fetch(`/api/matchmaker/direct-chats/${userId}`, { method: 'PATCH' }).catch(console.error);

    let interval: NodeJS.Timeout | null = null;
    const startPolling = () => {
      if (interval) clearInterval(interval);
      interval = setInterval(loadMessages, 12000);
    };
    const stopPolling = () => {
      if (interval) { clearInterval(interval); interval = null; }
    };
    const handleVisibility = () => {
      if (document.hidden) stopPolling();
      else { loadMessages(); startPolling(); }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { stopPolling(); document.removeEventListener('visibilitychange', handleVisibility); };
  }, [loadMessages, userId]);

  // Auto-scroll
  useEffect(() => {
    if (messages.length > prevCountRef.current && !userScrolledUpRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevCountRef.current = messages.length;
  }, [messages]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    userScrolledUpRef.current = scrollHeight - scrollTop - clientHeight > 50;
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    const content = newMessage.trim();
    setIsSending(true);

    // Optimistic update
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderType: 'matchmaker',
      senderId: '',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');

    try {
      const res = await fetch(`/api/matchmaker/direct-chats/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? data.message : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      toast.error(isHe ? 'שגיאה בשליחה' : 'Send error');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-purple-300" />
            </div>
            <p className="text-sm text-gray-500">
              {isHe ? 'אין הודעות עדיין. שלח/י הודעה ראשונה!' : 'No messages yet.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderType === 'matchmaker';
            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
                    isMine
                      ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={cn('text-[10px] mt-1', isMine ? 'text-purple-200' : 'text-gray-400')}>
                    {new Date(msg.createdAt).toLocaleTimeString(isHe ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t bg-gray-50/50 p-3">
        <div className="flex items-center gap-2">
          <QuickReplyPicker
            onSelect={(content) => setNewMessage(content)}
            isHe={isHe}
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={isHe ? 'כתוב/י הודעה...' : 'Type a message...'}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
            dir={isHe ? 'rtl' : 'ltr'}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 text-white px-4 h-10 shadow-sm transition-all"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="text-sm font-medium">{isHe ? 'שלח' : 'Send'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Main Component
// ==========================================

const MatchmakerInbox = forwardRef<MatchmakerInboxHandle, MatchmakerInboxProps>(
  function MatchmakerInbox({ locale, onUnreadUpdate }, ref) {
    const [items, setItems] = useState<InboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<InboxFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [totalUnread, setTotalUnread] = useState(0);
    const [totalTodo, setTotalTodo] = useState(0);
    const [templateManagerOpen, setTemplateManagerOpen] = useState(false);

    const isHe = locale === 'he';
    const onUnreadUpdateRef = useRef(onUnreadUpdate);
    useEffect(() => { onUnreadUpdateRef.current = onUnreadUpdate; }, [onUnreadUpdate]);

    // ==========================================
    // Data fetching
    // ==========================================
    const loadInbox = useCallback(async () => {
      try {
        const params = new URLSearchParams({
          filter: activeFilter,
          ...(searchQuery && { search: searchQuery }),
        });
        const res = await fetch(`/api/matchmaker/inbox?${params}`);
        if (!res.ok) throw new Error('Failed');
        const data: InboxResponse = await res.json();

        if (data.success) {
          setItems(data.items);
          setTotalUnread(data.totalUnread);
          setTotalTodo(data.totalTodo);
          onUnreadUpdateRef.current?.(data.totalUnread);
        }
      } catch (error) {
        console.error('Error loading inbox:', error);
      } finally {
        setIsLoading(false);
      }
    }, [activeFilter, searchQuery]);

    useImperativeHandle(ref, () => ({ refresh: loadInbox }), [loadInbox]);

    // Polling
    useEffect(() => {
      setIsLoading(true);
      loadInbox();

      let interval: NodeJS.Timeout | null = null;
      const startPolling = () => {
        if (interval) clearInterval(interval);
        interval = setInterval(loadInbox, 30000);
      };
      const stopPolling = () => {
        if (interval) { clearInterval(interval); interval = null; }
      };
      const handleVisibility = () => {
        if (document.hidden) stopPolling();
        else { loadInbox(); startPolling(); }
      };

      startPolling();
      document.addEventListener('visibilitychange', handleVisibility);
      return () => { stopPolling(); document.removeEventListener('visibilitychange', handleVisibility); };
    }, [loadInbox]);

    // ==========================================
    // Actions
    // ==========================================
    const handleSetTodo = async (threadId: string, todoStatus: 'TODO' | 'DONE' | 'NONE') => {
      try {
        await fetch('/api/matchmaker/inbox', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId, action: 'setTodo', todoStatus }),
        });
        loadInbox();
      } catch {
        toast.error(isHe ? 'שגיאה בעדכון' : 'Update error');
      }
    };

    const handleArchive = async (threadId: string) => {
      try {
        await fetch('/api/matchmaker/inbox', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId, action: 'archive' }),
        });
        if (selectedItemId === threadId) setSelectedItemId(null);
        loadInbox();
      } catch {
        toast.error(isHe ? 'שגיאה' : 'Error');
      }
    };

    const handleUnarchive = async (threadId: string) => {
      try {
        await fetch('/api/matchmaker/inbox', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId, action: 'unarchive' }),
        });
        loadInbox();
      } catch {
        toast.error(isHe ? 'שגיאה' : 'Error');
      }
    };

    // ==========================================
    // Selected item
    // ==========================================
    const selectedItem = items.find((i) => i.id === selectedItemId);

    // ==========================================
    // Render
    // ==========================================
    return (
    <>
      <Card className="shadow-lg border-0 overflow-hidden bg-white/90 backdrop-blur-sm">
        <div className="flex h-[650px]">
          {/* ======== LEFT COLUMN: Inbox List ======== */}
          <div
            className={cn(
              'border-gray-100 flex flex-col',
              selectedItemId
                ? 'hidden md:flex md:w-[380px] md:border-r'
                : 'w-full md:w-[380px] md:border-r'
            )}
          >
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-teal-50 to-amber-50/40 border-b py-3 px-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-sm">
                    <Inbox className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base">
                    {isHe ? 'תיבת דואר' : 'Inbox'}
                  </CardTitle>
                </div>
                {totalUnread > 0 && (
                  <Badge className="bg-amber-500 text-white border-0 px-2.5 py-0.5 text-xs shadow-sm">
                    {totalUnread} {isHe ? 'חדשות' : 'new'}
                  </Badge>
                )}
              </div>
              <InboxFilters
                activeFilter={activeFilter}
                onFilterChange={(f) => { setActiveFilter(f); setIsLoading(true); }}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalUnread={totalUnread}
                totalTodo={totalTodo}
                isHe={isHe}
              />
            </CardHeader>

            {/* List */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6 text-teal-300" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {activeFilter === 'unread'
                      ? isHe ? 'אין הודעות שלא נקראו' : 'No unread messages'
                      : activeFilter === 'todo'
                        ? isHe ? 'אין פריטים לטיפול' : 'No todo items'
                        : activeFilter === 'archived'
                          ? isHe ? 'אין פריטים בארכיון' : 'No archived items'
                          : isHe ? 'אין הודעות עדיין' : 'No messages yet'}
                  </p>
                </div>
              ) : (
                <div className="group">
                  {items.map((item) => (
                    <InboxItemComponent
                      key={item.id}
                      item={item}
                      isSelected={selectedItemId === item.id}
                      onSelect={() => setSelectedItemId(item.id)}
                      onSetTodo={(status) => handleSetTodo(item.id, status)}
                      onArchive={() => handleArchive(item.id)}
                      onUnarchive={() => handleUnarchive(item.id)}
                      isHe={isHe}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* ======== RIGHT COLUMN: Chat View ======== */}
          <div
            className={cn(
              'flex-1 flex flex-col',
              !selectedItemId && 'hidden md:flex'
            )}
          >
            {!selectedItem ? (
              // Empty state
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center mb-4">
                  <MessageCircle className="w-8 h-8 text-teal-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {isHe ? 'בחר/י שיחה' : 'Select a conversation'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isHe
                    ? 'בחר/י שיחה מהרשימה כדי להתחיל'
                    : 'Choose a conversation from the list to start'}
                </p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
                  {/* Back button (mobile) */}
                  <button
                    onClick={() => setSelectedItemId(null)}
                    className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                  >
                    <svg className="w-5 h-5 rtl:-scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {selectedItem.threadType === 'direct'
                        ? selectedItem.candidate?.name
                        : `${selectedItem.firstParty?.name} ↔ ${selectedItem.secondParty?.name}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedItem.threadType === 'direct'
                        ? isHe ? 'שיחה ישירה' : 'Direct Chat'
                        : selectedItem.suggestionStatus
                          ? isHe ? 'צ\'אט הצעה' : 'Suggestion Chat'
                          : ''}
                    </p>
                  </div>
                </div>

                {/* Chat content */}
                <div className="flex-1 overflow-hidden">
                  {selectedItem.threadType === 'direct' && selectedItem.candidate ? (
                    <DirectChatView
                      userId={selectedItem.candidate.id}
                      locale={locale}
                    />
                  ) : selectedItem.suggestionId ? (
                    <SuggestionChatTab
                      suggestionId={selectedItem.suggestionId}
                      locale={locale}
                    />
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <TemplateManager
        open={templateManagerOpen}
        onClose={() => setTemplateManagerOpen(false)}
        isHe={isHe}
      />
    </>
    );
  }
);

export default MatchmakerInbox;
