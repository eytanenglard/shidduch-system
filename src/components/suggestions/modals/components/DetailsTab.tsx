'use client';

import React from 'react';
import MiniTimeline from '../../timeline/MiniTimeline';
import AiChatPanel from '../../chat/AiChatPanel';
import SuggestionChat from '@/components/messages/SuggestionChat';
import type { DetailsTabProps } from '../types/modal.types';

const DetailsTab: React.FC<DetailsTabProps> = ({
  suggestionId,
  statusHistory,
  matchmakerFirstName,
  locale,
  dict,
}) => {
  const detailsDict = dict.modal.detailsTab;

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Mini Timeline — full width */}
      <MiniTimeline
        statusHistory={statusHistory}
        dict={dict.timeline}
        locale={locale}
      />

      {/* Chats — side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Chat Assistant */}
        <AiChatPanel
          locale={locale}
          suggestionId={suggestionId}
          title={detailsDict.aiChatTitle}
          subtitle={detailsDict.aiChatSubtitle}
        />

        {/* Chat with matchmaker */}
        <SuggestionChat
          suggestionId={suggestionId}
          locale={locale}
          compact
          heightClass="h-[450px] min-h-[350px]"
          header={{
            title: detailsDict.chatTitle.replace(
              '{{name}}',
              matchmakerFirstName || detailsDict.chatTitleFallback
            ),
            subtitle: detailsDict.chatSubtitle,
          }}
        />
      </div>
    </div>
  );
};

export default DetailsTab;
