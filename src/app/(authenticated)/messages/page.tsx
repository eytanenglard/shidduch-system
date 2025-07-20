// src/app/(authenticated)/messages/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Inbox, Filter, Zap, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { FeedItem } from "@/types/messages";
import NotificationCard from "@/app/components/messages/NotificationCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type FilterType = 'all' | 'action_required' | 'updates';

// Main Page Component
export default function MessagesPage() {
  const { data: session } = useSession();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  const userId = session?.user?.id;

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/messages/feed');
      if (!response.ok) throw new Error("Failed to fetch activity feed");
      const data = await response.json();
      if (data.success) {
        setFeedItems(data.feed);
      } else {
        throw new Error(data.error || "API returned an error");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchFeed();
    } else {
      setIsLoading(false); // If no user, stop loading
    }
  }, [userId, fetchFeed]);

  const filteredItems = React.useMemo(() => {
    if (activeFilter === 'all') return feedItems;
    if (activeFilter === 'action_required') return feedItems.filter(item => item.type === 'ACTION_REQUIRED');
    if (activeFilter === 'updates') return feedItems.filter(item => item.type === 'STATUS_UPDATE' || item.type === 'NEW_SUGGESTION');
    return feedItems;
  }, [feedItems, activeFilter]);

  const actionRequiredCount = feedItems.filter(item => item.type === 'ACTION_REQUIRED').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/20 to-emerald-50/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-3">
            מרכז הפעילות שלי
          </h1>
          <p className="text-lg text-gray-600">
            כל העדכונים, ההודעות והפעולות שלך במקום אחד.
          </p>
        </header>
        
        {/* Action Banner */}
        <AnimatePresence>
          {actionRequiredCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="mb-8"
            >
              <Alert className="bg-gradient-to-r from-orange-400 to-amber-400 text-white border-0 shadow-2xl rounded-2xl">
                <Zap className="h-5 w-5 text-white" />
                <AlertTitle className="font-bold text-lg">
                  {actionRequiredCount === 1 ? 'פעולה אחת ממתינה לך!' : `${actionRequiredCount} פעולות ממתינות לך!`}
                </AlertTitle>
                <AlertDescription>
                  ישנן הצעות שממתינות לתשובתך. זה הזמן להתקדם במסע!
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters and Refresh */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
            <div className="flex items-center gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-full shadow-md border border-gray-200">
                <Button variant={activeFilter === 'all' ? 'default' : 'ghost'} onClick={() => setActiveFilter('all')} className="rounded-full">הכל</Button>
                <Button variant={activeFilter === 'action_required' ? 'default' : 'ghost'} onClick={() => setActiveFilter('action_required')} className="rounded-full relative">
                    דורש פעולה
                    {actionRequiredCount > 0 && <Badge className="absolute -top-1 -right-2 bg-orange-500 text-white animate-pulse">{actionRequiredCount}</Badge>}
                </Button>
                <Button variant={activeFilter === 'updates' ? 'default' : 'ghost'} onClick={() => setActiveFilter('updates')} className="rounded-full">עדכונים</Button>
            </div>
            <Button variant="outline" onClick={fetchFeed} disabled={isLoading}>
                <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
                רענן
            </Button>
        </div>

        {error && (
            <div className="text-center p-4 bg-red-50 text-red-700 rounded-lg">שגיאה: {error}</div>
        )}

        {/* Feed Content */}
        {filteredItems.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/50 rounded-2xl shadow-inner border border-gray-200/50">
              <Inbox className="w-20 h-20 text-gray-300 mb-6" />
              <h3 className="text-2xl font-bold text-gray-700">הכל שקט ורגוע</h3>
              <p className="text-gray-500 mt-2 max-w-md">
                {activeFilter === 'all' ? 'אין עדכונים חדשים כרגע. ברגע שתהיה התפתחות, היא תופיע כאן.' : `אין פריטים התואמים לסינון.`}
              </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <NotificationCard item={item} userId={userId!} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}