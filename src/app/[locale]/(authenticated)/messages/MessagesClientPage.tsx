// =============================================================================
// User Messages Page — Two Tabs Layout with date grouping, infinite scroll,
// skeleton loading, staggered animations, contextual empty states
// File: src/app/[locale]/(authenticated)/messages/MessagesClientPage.tsx
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  Inbox,
  Zap,
  RefreshCw,
  MessageCircle,
  Bell,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type { FeedItem } from '@/types/messages';
import NotificationCard from '@/components/messages/NotificationCard';
import UserChatPanel from '@/components/messages/UserChatPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { isToday, isYesterday, format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import type { MessagesPageDict } from '@/types/dictionary';
import type { Locale } from '../../../../../i18n-config';

type FilterType = 'all' | 'action_required' | 'updates';
type MainTab = 'chats' | 'updates';

interface MessagesClientPageProps {
  dict: MessagesPageDict;
  locale: Locale;
}

// ==========================================
// Date Group Helper
// ==========================================

interface DateGroup {
  label: string;
  items: FeedItem[];
}

function groupByDate(items: FeedItem[], locale: Locale): DateGroup[] {
  const isHe = locale === 'he';
  const loc = isHe ? he : enUS;
  const groups: DateGroup[] = [];

  for (const item of items) {
    const date = new Date(item.timestamp);
    let label: string;

    if (isToday(date)) {
      label = isHe ? 'היום' : 'Today';
    } else if (isYesterday(date)) {
      label = isHe ? 'אתמול' : 'Yesterday';
    } else {
      label = format(date, isHe ? 'EEEE, d בMMMM' : 'EEEE, MMMM d', { locale: loc });
    }

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
  }

  return groups;
}

// ==========================================
// Skeleton Card Component
// ==========================================

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 animate-pulse">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="hidden sm:flex flex-col items-center gap-2">
          <div className="w-11 h-11 rounded-full bg-gray-200" />
          <div className="w-8 h-8 rounded-full bg-gray-200" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="h-3 bg-gray-100 rounded w-16 flex-shrink-0" />
          </div>
          <div className="h-6 bg-gray-100 rounded w-24" />
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="h-4 bg-gray-100 rounded w-20" />
            </div>
            <div className="h-9 bg-gray-200 rounded-full w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Tab animation variants
// ==========================================

const tabVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

// Stagger animation for feed items
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: 'easeOut',
    },
  }),
};

// ==========================================
// Component
// ==========================================

export default function MessagesClientPage({
  dict,
  locale,
}: MessagesClientPageProps) {
  const { data: session } = useSession();
  const [mainTab, setMainTab] = useState<MainTab>('chats');
  const directionRef = useRef(0);

  // Feed state
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Chat unread count
  const [chatUnread, setChatUnread] = useState(0);

  // Infinite scroll sentinel
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const userId = session?.user?.id;
  const isHe = locale === 'he';

  // ==========================================
  // Tab switching (with auto-refresh on updates tab)
  // ==========================================

  const switchTab = useCallback((tab: MainTab) => {
    directionRef.current = tab === 'updates' ? 1 : -1;
    setMainTab(tab);
  }, []);

  // ==========================================
  // Feed fetching
  // ==========================================

  const fetchFeed = useCallback(async (append = false, cursor?: string | null) => {
    if (!append) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      params.set('limit', '20');

      const response = await fetch(`/api/messages/feed?${params}`);
      if (!response.ok) throw new Error('Failed to fetch activity feed');
      const data = await response.json();

      if (data.success) {
        if (append) {
          setFeedItems(prev => [...prev, ...data.feed]);
        } else {
          setFeedItems(data.feed);
        }
        setHasMore(data.pagination?.hasMore || false);
        setNextCursor(data.pagination?.nextCursor || null);
      } else {
        throw new Error(data.error || 'API returned an error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && nextCursor) {
      fetchFeed(true, nextCursor);
    }
  }, [isLoadingMore, hasMore, nextCursor, fetchFeed]);

  // Chat unread callback
  const handleChatUnreadUpdate = useCallback((count: number) => {
    setChatUnread(count);
  }, []);

  // Initial fetch + auto-refresh on tab switch
  useEffect(() => {
    if (userId && mainTab === 'updates') {
      fetchFeed();
    } else if (!userId) {
      setIsLoading(false);
    }
  }, [userId, mainTab, fetchFeed]);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // ==========================================
  // Mark as read — batch mark visible unread items
  // ==========================================

  useEffect(() => {
    if (mainTab !== 'updates' || feedItems.length === 0) return;

    const unreadItems = feedItems.filter(item => !item.isRead).slice(0, 10);
    if (unreadItems.length === 0) return;

    // Mark as read in background after a short delay
    const timeout = setTimeout(async () => {
      for (const item of unreadItems) {
        try {
          // Extract clean ID from prefixed format
          const cleanId = item.id.replace(/^(suggestion-|inquiry-|availability-)/, '');
          await fetch('/api/messages/mark-as-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cleanId, type: item.type }),
          });
        } catch {
          // Silent failure — mark-as-read is best-effort
        }
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [mainTab, feedItems]);

  // ==========================================
  // Quick action handler
  // ==========================================

  const handleQuickAction = useCallback(async (suggestionId: string, action: 'approve' | 'decline' | 'interested') => {
    if (!userId) return;

    // Determine status based on action and party position
    const suggestion = feedItems.find(item =>
      item.payload.suggestion?.id === suggestionId
    )?.payload.suggestion;

    if (!suggestion) return;

    const isFirstParty = suggestion.firstPartyId === userId;
    let newStatus = '';

    if (action === 'approve') {
      newStatus = isFirstParty ? 'FIRST_PARTY_APPROVED' : 'SECOND_PARTY_APPROVED';
    } else if (action === 'decline') {
      newStatus = isFirstParty ? 'FIRST_PARTY_DECLINED' : 'SECOND_PARTY_DECLINED';
    } else if (action === 'interested') {
      newStatus = 'FIRST_PARTY_INTERESTED';
    }

    const response = await fetch(`/api/suggestions/${suggestionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast.error(errorData.error || (isHe ? 'שגיאה בעדכון' : 'Update failed'));
      throw new Error(errorData.error);
    }

    // Optimistic: remove the item from feed
    setFeedItems(prev => prev.filter(item => item.payload.suggestion?.id !== suggestionId));

    const actionLabel = action === 'approve'
      ? (isHe ? 'אישרת את ההצעה' : 'Suggestion approved')
      : action === 'decline'
        ? (isHe ? 'דחית את ההצעה' : 'Suggestion declined')
        : (isHe ? 'ההצעה נשמרה' : 'Suggestion saved');

    toast.success(actionLabel);
  }, [userId, feedItems, isHe]);

  // ==========================================
  // Filtered items
  // ==========================================

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return feedItems;
    if (activeFilter === 'action_required')
      return feedItems.filter((item) => item.type === 'ACTION_REQUIRED');
    // 'updates' filter — everything that is NOT action required
    return feedItems.filter((item) => item.type !== 'ACTION_REQUIRED');
  }, [feedItems, activeFilter]);

  const dateGroups = useMemo(
    () => groupByDate(filteredItems, locale),
    [filteredItems, locale]
  );

  const actionRequiredCount = feedItems.filter(
    (item) => item.type === 'ACTION_REQUIRED'
  ).length;

  const unreadCount = feedItems.filter(item => !item.isRead).length;

  if (!userId) {
    return <StandardizedLoadingSpinner className="h-[calc(100vh-80px)]" />;
  }

  // ==========================================
  // Contextual empty state
  // ==========================================

  function renderEmptyState() {
    const emptyStates = dict.emptyStates;
    const config = emptyStates?.[activeFilter] || emptyStates?.all || {
      title: dict.emptyState.title,
      description: dict.emptyState.descriptionAll,
    };

    const iconMap: Record<FilterType, React.ElementType> = {
      all: Inbox,
      action_required: CheckCircle2,
      updates: Sparkles,
    };
    const EmptyIcon = iconMap[activeFilter];

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center min-h-[350px] text-center p-8 bg-white/50 rounded-2xl shadow-inner border border-gray-200/50"
      >
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <EmptyIcon className="w-10 h-10 text-gray-300" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-700">
          {config.title}
        </h3>
        <p className="text-gray-500 mt-2 max-w-md text-sm sm:text-base">
          {config.description}
        </p>
      </motion.div>
    );
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-emerald-50/20"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            {dict.header?.title}
          </h1>
          <p className="text-sm sm:text-lg text-gray-600">
            {dict.header?.subtitle}
          </p>
        </header>

        {/* Main Tabs */}
        <div className="flex items-center justify-center gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 mb-6 sm:mb-8 max-w-md mx-auto">
          <button
            onClick={() => switchTab('chats')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200',
              mainTab === 'chats'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <MessageCircle className="w-4 h-4" />
            {isHe ? "צ'אטים" : 'Chats'}
            {chatUnread > 0 && (
              <Badge
                className={cn(
                  'text-xs px-1.5 py-0 border-0',
                  mainTab === 'chats'
                    ? 'bg-white/30 text-white'
                    : 'bg-teal-500 text-white animate-zoom-in'
                )}
              >
                {chatUnread}
              </Badge>
            )}
          </button>
          <button
            onClick={() => switchTab('updates')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200',
              mainTab === 'updates'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Bell className="w-4 h-4" />
            {isHe ? 'עדכונים' : 'Updates'}
            {(actionRequiredCount > 0 || unreadCount > 0) && (
              <Badge
                className={cn(
                  'text-xs px-1.5 py-0 border-0',
                  mainTab === 'updates'
                    ? 'bg-white/30 text-white'
                    : actionRequiredCount > 0
                      ? 'bg-orange-500 text-white animate-zoom-in'
                      : 'bg-purple-500 text-white'
                )}
              >
                {actionRequiredCount || unreadCount}
              </Badge>
            )}
          </button>
        </div>

        {/* Tab Content — animated */}
        <AnimatePresence mode="wait" custom={directionRef.current}>
          {mainTab === 'chats' && (
            <motion.div
              key="chats"
              custom={directionRef.current}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <UserChatPanel
                locale={locale}
                onUnreadUpdate={handleChatUnreadUpdate}
              />
            </motion.div>
          )}

          {mainTab === 'updates' && (
            <motion.div
              key="updates"
              custom={directionRef.current}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* Action Required Banner */}
              <AnimatePresence>
                {actionRequiredCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="mb-6 sm:mb-8"
                  >
                    <Alert className="bg-gradient-to-r from-orange-400 to-amber-400 text-white border-0 shadow-2xl rounded-2xl">
                      <Zap className="h-5 w-5 text-white" />
                      <AlertTitle className="font-bold text-base sm:text-lg">
                        {actionRequiredCount === 1
                          ? dict.actionBanner?.titleSingle
                          : dict.actionBanner?.titleMultiple?.replace(
                              '{{count}}',
                              actionRequiredCount.toString()
                            )}
                      </AlertTitle>
                      <AlertDescription className="text-white/90">
                        {dict.actionBanner?.description}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200">
                  <Button
                    variant={activeFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveFilter('all')}
                    className="rounded-full text-xs sm:text-sm"
                  >
                    {dict.filters?.all}
                  </Button>
                  <Button
                    variant={activeFilter === 'action_required' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveFilter('action_required')}
                    className="rounded-full relative text-xs sm:text-sm"
                  >
                    {dict.filters?.actionRequired}
                    {actionRequiredCount > 0 && (
                      <Badge className="absolute -top-1 -end-2 bg-orange-500 text-white text-[10px] px-1 animate-zoom-in">
                        {actionRequiredCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={activeFilter === 'updates' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveFilter('updates')}
                    className="rounded-full text-xs sm:text-sm"
                  >
                    {dict.filters?.updates}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchFeed()}
                  disabled={isLoading}
                  className="text-xs sm:text-sm"
                >
                  <RefreshCw
                    className={cn(
                      'w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5 sm:me-2',
                      isLoading && 'animate-spin'
                    )}
                  />
                  {dict.filters?.refresh}
                </Button>
              </div>

              {/* Error with retry */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl mb-6 border border-red-200"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchFeed()}
                    className="border-red-300 text-red-600 hover:bg-red-100 rounded-full"
                  >
                    <RefreshCw className="w-3.5 h-3.5 me-1.5" />
                    {dict.retryButton || (isHe ? 'נסה שוב' : 'Try Again')}
                  </Button>
                </motion.div>
              )}

              {/* Feed */}
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                renderEmptyState()
              ) : (
                <div className="space-y-6">
                  {dateGroups.map((group, groupIndex) => (
                    <div key={group.label}>
                      {/* Date Group Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[11px] sm:text-xs font-semibold text-gray-500 bg-white/80 px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                          {group.label}
                        </span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      {/* Items with staggered animation */}
                      <div className="space-y-3 sm:space-y-4">
                        {group.items.map((item, itemIndex) => (
                          <motion.div
                            key={item.id}
                            custom={groupIndex * 3 + itemIndex}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <NotificationCard
                              item={item}
                              userId={userId!}
                              dict={dict.notificationCard}
                              statusBadges={dict.statusBadges || {}}
                              locale={locale}
                              onQuickAction={handleQuickAction}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Infinite scroll sentinel */}
                  <div ref={loadMoreRef} className="py-4 text-center">
                    {isLoadingMore && (
                      <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {dict.loadingMore || (isHe ? 'טוען עוד...' : 'Loading more...')}
                      </div>
                    )}
                    {!hasMore && feedItems.length > 5 && (
                      <p className="text-xs text-gray-400">
                        {dict.noMoreItems || (isHe ? 'זה הכל!' : "That's all!")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
