'use client';

import React from 'react';
import { Users } from 'lucide-react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import SuggestionChatTab from '@/components/matchmaker/suggestions/details/SuggestionChatTab';
import { cn } from '@/lib/utils';
import type { Locale } from '../../../../i18n-config';

interface SplitChatViewProps {
  suggestionId: string;
  locale: Locale;
  firstPartyName?: string;
  secondPartyName?: string;
}

export default function SplitChatView({
  suggestionId,
  locale,
  firstPartyName,
  secondPartyName,
}: SplitChatViewProps) {
  const isHe = locale === 'he';

  return (
    <div className="h-[600px] rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      <ResizablePanelGroup direction="horizontal">
        {/* First Party Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            {/* First Party Header */}
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2.5',
                'bg-gradient-to-r from-teal-500 to-teal-600',
                'text-white'
              )}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-teal-100">
                  {isHe ? "צד א'" : 'First Party'}
                </span>
                {firstPartyName && (
                  <span className="text-sm font-semibold truncate">
                    {firstPartyName}
                  </span>
                )}
              </div>
            </div>

            {/* First Party Chat */}
            <div className="flex-1 overflow-hidden">
              <SuggestionChatTab
                suggestionId={suggestionId}
                locale={locale}
                defaultParty="first"
                hidePartyTabs={true}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle withHandle />

        {/* Second Party Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="flex flex-col h-full">
            {/* Second Party Header */}
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2.5',
                'bg-gradient-to-r from-amber-400 to-orange-500',
                'text-white'
              )}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-amber-100">
                  {isHe ? "צד ב'" : 'Second Party'}
                </span>
                {secondPartyName && (
                  <span className="text-sm font-semibold truncate">
                    {secondPartyName}
                  </span>
                )}
              </div>
            </div>

            {/* Second Party Chat */}
            <div className="flex-1 overflow-hidden">
              <SuggestionChatTab
                suggestionId={suggestionId}
                locale={locale}
                defaultParty="second"
                hidePartyTabs={true}
              />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
