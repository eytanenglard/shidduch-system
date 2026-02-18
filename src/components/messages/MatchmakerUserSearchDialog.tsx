// =============================================================================
// src/components/messages/MatchmakerUserSearchDialog.tsx
// =============================================================================
//
// Dialog for matchmaker to:
//   1. Search registered users
//   2. Select individuals or "Select All"
//   3. Write and broadcast a message
//
// Usage:
//   <MatchmakerUserSearchDialog
//     open={isOpen}
//     onClose={() => setIsOpen(false)}
//     onSent={() => { setIsOpen(false); refreshChats(); }}
//     locale={locale}
//   />
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Send,
  Loader2,
  Users,
  CheckCheck,
  X,
  UserSearch,
  Megaphone,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import type { Locale } from '../../../i18n-config';

// ==========================================
// Types
// ==========================================

interface SearchableUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender?: string;
  city?: string;
  availabilityStatus?: string;
}

interface MatchmakerUserSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  locale: Locale;
}

// ==========================================
// Dictionary
// ==========================================

const dict = {
  he: {
    title: 'שליחת הודעה למועמדים',
    description: 'חפש/י מועמדים ושלח/י הודעה ישירה',
    searchPlaceholder: 'חיפוש לפי שם או מייל...',
    selectAll: 'בחר הכל',
    deselectAll: 'בטל בחירה',
    selectedCount: 'נבחרו',
    users: 'מועמדים',
    messagePlaceholder: 'כתוב/י הודעה לשליחה...',
    send: 'שלח הודעה',
    sending: 'שולח...',
    sendToSelected: 'שלח ל-{{count}} מועמדים',
    sendToAll: 'שלח לכל המועמדים',
    noResults: 'לא נמצאו תוצאות',
    noResultsHint: 'נסה/י חיפוש אחר',
    successSingle: 'ההודעה נשלחה בהצלחה!',
    successMultiple: 'ההודעה נשלחה ל-{{count}} מועמדים!',
    errorSend: 'שגיאה בשליחת ההודעה',
    errorEmpty: 'יש לבחור לפחות מועמד אחד ולכתוב הודעה',
    loading: 'טוען...',
    available: 'פנוי/ה',
    dating: 'בתהליך',
    city: 'עיר',
  },
  en: {
    title: 'Send Message to Candidates',
    description: 'Search for candidates and send a direct message',
    searchPlaceholder: 'Search by name or email...',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    selectedCount: 'Selected',
    users: 'candidates',
    messagePlaceholder: 'Write a message to send...',
    send: 'Send Message',
    sending: 'Sending...',
    sendToSelected: 'Send to {{count}} candidates',
    sendToAll: 'Send to all candidates',
    noResults: 'No results found',
    noResultsHint: 'Try a different search term',
    successSingle: 'Message sent successfully!',
    successMultiple: 'Message sent to {{count}} candidates!',
    errorSend: 'Error sending message',
    errorEmpty: 'Select at least one candidate and write a message',
    loading: 'Loading...',
    available: 'Available',
    dating: 'In process',
    city: 'City',
  },
};

// ==========================================
// Component
// ==========================================

export default function MatchmakerUserSearchDialog({
  open,
  onClose,
  onSent,
  locale,
}: MatchmakerUserSearchDialogProps) {
  const t = dict[locale] || dict.he;
  const isHe = locale === 'he';

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<SearchableUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectAllMode, setSelectAllMode] = useState(false);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // ==========================================
  // Search users
  // ==========================================

  const searchUsers = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ q: query, limit: '100' });
      const res = await fetch(`/api/matchmaker/users/searchable?${params}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, open, searchUsers]);

  // Load all users on open
  useEffect(() => {
    if (open) {
      searchUsers('');
      setSelectedIds(new Set());
      setMessage('');
      setSelectAllMode(false);
    }
  }, [open, searchUsers]);

  // ==========================================
  // Selection handlers
  // ==========================================

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
        setSelectAllMode(false);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectAllMode) {
      setSelectedIds(new Set());
      setSelectAllMode(false);
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
      setSelectAllMode(true);
    }
  };

  // ==========================================
  // Send message
  // ==========================================

  const handleSend = async () => {
    if (selectedIds.size === 0 || !message.trim()) {
      toast.error(t.errorEmpty);
      return;
    }

    setIsSending(true);
    try {
      // If select-all mode and all visible users are selected, send to 'all'
      const sendToAll =
        selectAllMode && selectedIds.size === totalCount && searchQuery === '';

      const body = sendToAll
        ? { content: message.trim(), userIds: 'all' }
        : { content: message.trim(), userIds: Array.from(selectedIds) };

      const res = await fetch('/api/matchmaker/direct-chats/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed');
      }

      const data = await res.json();

      if (data.success) {
        const count = data.sentCount || selectedIds.size;
        if (count === 1) {
          toast.success(t.successSingle);
        } else {
          toast.success(t.successMultiple.replace('{{count}}', String(count)));
        }
        onSent();
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error(t.errorSend);
    } finally {
      setIsSending(false);
    }
  };

  // ==========================================
  // Helpers
  // ==========================================

  const getAvailabilityBadge = (status?: string) => {
    if (status === 'AVAILABLE')
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
          {t.available}
        </span>
      );
    if (status === 'DATING')
      return (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
          {t.dating}
        </span>
      );
    return null;
  };

  // ==========================================
  // Render
  // ==========================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-purple-50 to-pink-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-gray-800">
                {t.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {t.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b bg-gray-50/50">
          <div className="relative">
            <Search
              className={cn(
                'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400',
                isHe ? 'right-3' : 'left-3'
              )}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={cn(
                'rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200',
                isHe ? 'pr-10' : 'pl-10'
              )}
              dir={isHe ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Select All + Count */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Checkbox
                checked={selectAllMode}
                onCheckedChange={toggleSelectAll}
                className="border-purple-300 data-[state=checked]:bg-purple-500"
              />
              {selectAllMode ? t.deselectAll : t.selectAll}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              {selectedIds.size > 0 && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold">
                  {t.selectedCount}: {selectedIds.size}
                </Badge>
              )}
              <span>
                {totalCount} {t.users}
              </span>
            </div>
          </div>
        </div>

        {/* User List */}
        <ScrollArea className="flex-1 min-h-0 max-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className="text-sm text-gray-500 ms-2">{t.loading}</span>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <UserSearch className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">{t.noResults}</p>
              <p className="text-xs text-gray-400 mt-1">{t.noResultsHint}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((user) => {
                const isSelected = selectedIds.has(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={cn(
                      'w-full px-6 py-3 flex items-center gap-3 transition-colors text-start',
                      isSelected
                        ? 'bg-purple-50/60'
                        : 'hover:bg-gray-50/80'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleUser(user.id)}
                      className="border-gray-300 data-[state=checked]:bg-purple-500 flex-shrink-0"
                    />

                    <Avatar className="w-9 h-9 shadow-sm flex-shrink-0">
                      <AvatarFallback
                        className={cn(
                          'text-white text-xs font-bold bg-gradient-to-br',
                          user.gender === 'MALE'
                            ? 'from-blue-400 to-indigo-500'
                            : 'from-pink-400 to-rose-500'
                        )}
                      >
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {user.name}
                        </p>
                        {getAvailabilityBadge(user.availabilityStatus)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {user.city && <span>{user.city}</span>}
                        {user.city && user.email && <span>·</span>}
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCheck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Message Input + Send */}
        <div className="border-t bg-gray-50/30 p-4 space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.messagePlaceholder}
            className="min-h-[80px] max-h-[120px] resize-none rounded-xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
            dir={isHe ? 'rtl' : 'ltr'}
            rows={3}
          />

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500"
            >
              <X className="w-4 h-4 me-1" />
              {isHe ? 'ביטול' : 'Cancel'}
            </Button>

            <Button
              onClick={handleSend}
              disabled={
                selectedIds.size === 0 || !message.trim() || isSending
              }
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-md px-6"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                  {t.sending}
                </>
              ) : (
                <>
                  <Send className={cn('w-4 h-4 me-2', isHe && '-scale-x-100')} />
                  {selectAllMode && searchQuery === ''
                    ? t.sendToAll
                    : selectedIds.size > 0
                      ? t.sendToSelected.replace(
                          '{{count}}',
                          String(selectedIds.size)
                        )
                      : t.send}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}