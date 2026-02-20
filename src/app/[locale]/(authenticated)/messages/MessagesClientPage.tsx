// =============================================================================
// 25. User Messages Page — Two Tabs Layout
// File: src/app/[locale]/(authenticated)/messages/MessagesClientPage.tsx
// =============================================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Inbox, Zap, RefreshCw, MessageCircle, Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type { FeedItem } from '@/types/messages';
import NotificationCard from '@/components/messages/NotificationCard';
import UserChatPanel from '@/components/messages/UserChatPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { MessagesPageDict } from '@/types/dictionary';
import type { Locale } from '../../../../../i18n-config';

type FilterType = 'all' | 'action_required' | 'updates';
type MainTab = 'chats' | 'updates';

interface MessagesClientPageProps {
  dict: MessagesPageDict;
  locale: Locale;
}

export default function MessagesClientPage({
  dict,
  locale,
}: MessagesClientPageProps) {
  const { data: session } = useSession();
  const [mainTab, setMainTab] = useState<MainTab>('chats');

  // ==========================================
  // Feed state (for updates tab)
  // ==========================================
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Chat unread count — delegated from UserChatPanel
  const [chatUnread, setChatUnread] = useState(0);

  const userId = session?.user?.id;
  const isHe = locale === 'he';

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/messages/feed');
      if (!response.ok) throw new Error('Failed to fetch activity feed');
      const data = await response.json();
      if (data.success) {
        setFeedItems(data.feed);
      } else {
        throw new Error(data.error || 'API returned an error');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Callback for UserChatPanel to report unread count
  const handleChatUnreadUpdate = useCallback((count: number) => {
    setChatUnread(count);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchFeed();
    } else {
      setIsLoading(false);
    }
  }, [userId, fetchFeed]);

  const filteredItems = React.useMemo(() => {
    if (activeFilter === 'all') return feedItems;
    if (activeFilter === 'action_required')
      return feedItems.filter((item) => item.type === 'ACTION_REQUIRED');
    if (activeFilter === 'updates')
      return feedItems.filter(
        (item) =>
          item.type === 'STATUS_UPDATE' || item.type === 'NEW_SUGGESTION'
      );
    return feedItems;
  }, [feedItems, activeFilter]);

  const actionRequiredCount = feedItems.filter(
    (item) => item.type === 'ACTION_REQUIRED'
  ).length;

  if (!userId) {
    return <StandardizedLoadingSpinner className="h-[calc(100vh-80px)]" />;
  }

  // ==========================================
  // Render
  // ==========================================

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-emerald-50/20"
      dir={isHe ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            {dict.header?.title || (isHe ? 'מרכז ההודעות' : 'Message Center')}
          </h1>
          <p className="text-lg text-gray-600">
            {dict.header?.subtitle ||
              (isHe
                ? 'כל השיחות והעדכונים שלך במקום אחד'
                : 'All your chats and updates in one place')}
          </p>
        </header>

        {/* Main Tabs */}
        <div className="flex items-center justify-center gap-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gray-200 mb-8 max-w-md mx-auto">
          <button
            onClick={() => setMainTab('chats')}
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
                    : 'bg-teal-500 text-white animate-pulse'
                )}
              >
                {chatUnread}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setMainTab('updates')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200',
              mainTab === 'updates'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Bell className="w-4 h-4" />
            {isHe ? 'עדכונים' : 'Updates'}
            {actionRequiredCount > 0 && (
              <Badge
                className={cn(
                  'text-xs px-1.5 py-0 border-0',
                  mainTab === 'updates'
                    ? 'bg-white/30 text-white'
                    : 'bg-orange-500 text-white animate-pulse'
                )}
              >
                {actionRequiredCount}
              </Badge>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {mainTab === 'chats' && (
          <UserChatPanel
            locale={locale}
            onUnreadUpdate={handleChatUnreadUpdate}
          />
        )}

        {mainTab === 'updates' && (
          <div>
            {/* Action Required Banner */}
            <AnimatePresence>
              {actionRequiredCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className="mb-8"
                >
                  <Alert className="bg-gradient-to-r from-orange-400 to-amber-400 text-white border-0 shadow-2xl rounded-2xl">
                    <Zap className="h-5 w-5 text-white" />
                    <AlertTitle className="font-bold text-lg">
                      {actionRequiredCount === 1
                        ? dict.actionBanner?.titleSingle
                        : dict.actionBanner?.titleMultiple?.replace(
                            '{{count}}',
                            actionRequiredCount.toString()
                          )}
                    </AlertTitle>
                    <AlertDescription>
                      {dict.actionBanner?.description}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <div className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200">
                <Button
                  variant={activeFilter === 'all' ? 'default' : 'ghost'}
                  onClick={() => setActiveFilter('all')}
                  className="rounded-full"
                >
                  {dict.filters?.all || (isHe ? 'הכל' : 'All')}
                </Button>
                <Button
                  variant={
                    activeFilter === 'action_required' ? 'default' : 'ghost'
                  }
                  onClick={() => setActiveFilter('action_required')}
                  className="rounded-full relative"
                >
                  {dict.filters?.actionRequired ||
                    (isHe ? 'דורש תגובה' : 'Action Required')}
                  {actionRequiredCount > 0 && (
                    <Badge className="absolute -top-1 -right-2 bg-orange-500 text-white animate-pulse">
                      {actionRequiredCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant={activeFilter === 'updates' ? 'default' : 'ghost'}
                  onClick={() => setActiveFilter('updates')}
                  className="rounded-full"
                >
                  {dict.filters?.updates || (isHe ? 'עדכונים' : 'Updates')}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={fetchFeed}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn(
                    'w-4 h-4',
                    isHe ? 'ml-2' : 'mr-2',
                    isLoading && 'animate-spin'
                  )}
                />
                {dict.filters?.refresh || (isHe ? 'רענון' : 'Refresh')}
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                {error}
              </div>
            )}

            {/* Feed — CSS animations instead of AnimatePresence */}
            {isLoading ? (
              <StandardizedLoadingSpinner className="h-64" />
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/50 rounded-2xl shadow-inner border border-gray-200/50">
                <Inbox className="w-20 h-20 text-gray-300 mb-6" />
                <h3 className="text-2xl font-bold text-gray-700">
                  {dict.emptyState?.title ||
                    (isHe ? 'אין עדכונים' : 'No updates')}
                </h3>
                <p className="text-gray-500 mt-2 max-w-md">
                  {activeFilter === 'all'
                    ? dict.emptyState?.descriptionAll
                    : dict.emptyState?.descriptionFiltered}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <NotificationCard
                      item={item}
                      userId={userId!}
                      dict={dict.notificationCard}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
