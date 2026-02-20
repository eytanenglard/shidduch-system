// src/app/[locale]/(authenticated)/matchmaker/messages/MatchmakerMessagesClientPage.tsx
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, ClipboardCheck, Megaphone } from 'lucide-react';
import MessagesPage from '@/components/messages/MessagesPage';
import MatchmakerChatPanel from '@/components/messages/MatchmakerChatPanel';
import type { MatchmakerChatPanelHandle } from '@/components/messages/MatchmakerChatPanel';
import MatchmakerUserSearchDialog from '@/components/messages/MatchmakerUserSearchDialog';
import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';
import type { Locale } from '../../../../../../i18n-config';

// ==========================================
// Dictionary
// ==========================================

interface MatchmakerMessagesDict {
  header: { title: string; subtitle: string };
  tabs: { chat: string; availability: string };
}

const defaultDict: MatchmakerMessagesDict = {
  header: {
    title: 'מרכז הודעות',
    subtitle: 'נהל/י תקשורת עם מועמדים ובקשות זמינות',
  },
  tabs: { chat: "צ'אט עם מועמדים", availability: 'בקשות זמינות' },
};

// ==========================================
// Main Component
// ==========================================

interface Props {
  locale: Locale;
  dict?: MatchmakerMessagesDict;
}

export default function MatchmakerMessagesClientPage({ locale, dict }: Props) {
  const t = dict || defaultDict;
  const { data: session } = useSession();
  const isHe = locale === 'he';

  // Search dialog state
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);

  // שינוי 1: Unread count — מתעדכן דרך callback מ-MatchmakerChatPanel
  const [totalUnread, setTotalUnread] = useState(0);

  // Ref to call refresh on MatchmakerChatPanel without remounting
  const chatPanelRef = useRef<MatchmakerChatPanelHandle>(null);

  const handleUnreadUpdate = useCallback((total: number) => {
    setTotalUnread(total);
  }, []);

  const handleBroadcastSent = useCallback(() => {
    setSearchDialogOpen(false);
    chatPanelRef.current?.refresh();
  }, []);

  if (!session?.user) {
    return <StandardizedLoadingSpinner className="h-[calc(100vh-80px)]" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/40 via-white to-amber-50/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-700 via-teal-600 to-amber-600 bg-clip-text text-transparent mb-3">
            {t.header.title}
          </h1>
          <p className="text-base text-gray-500">{t.header.subtitle}</p>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="chat">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <TabsList className="bg-white/90 backdrop-blur-sm rounded-2xl p-1.5 shadow-md border border-gray-100 h-auto">
              <TabsTrigger
                value="chat"
                className="rounded-xl px-6 py-3 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all relative gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {t.tabs.chat}
                {totalUnread > 0 && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 min-w-[20px] h-5 border-0 shadow-sm">
                    {totalUnread}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="availability"
                className="rounded-xl px-6 py-3 text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all gap-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                {t.tabs.availability}
              </TabsTrigger>
            </TabsList>

            {/* Broadcast Button */}
            <Button
              onClick={() => setSearchDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-md px-5 py-2.5 h-auto gap-2"
            >
              <Megaphone className="w-4 h-4" />
              {isHe ? 'שלח הודעה' : 'Send Message'}
            </Button>
          </div>

          <TabsContent value="chat" className="mt-0">
            {/* שינוי 3: העברת onUnreadUpdate ל-MatchmakerChatPanel */}
            <MatchmakerChatPanel
              ref={chatPanelRef}
              locale={locale}
              onUnreadUpdate={handleUnreadUpdate}
            />
          </TabsContent>
          <TabsContent value="availability" className="mt-0">
            <MessagesPage />
          </TabsContent>
        </Tabs>
      </div>

      {/* Search & Broadcast Dialog */}
      <MatchmakerUserSearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSent={handleBroadcastSent}
        locale={locale}
      />
    </div>
  );
}
