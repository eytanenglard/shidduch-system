'use client';

import React from 'react';
import { MessageCircle, Phone, Mail, UserCircle2 } from 'lucide-react';
import MiniTimeline from '../../timeline/MiniTimeline';
import AiChatPanel from '../../chat/AiChatPanel';
import SuggestionChat from '@/components/messages/SuggestionChat';
import type { DetailsTabProps } from '../types/modal.types';

const CONTACT_SHARED_STATUSES = new Set([
  'CONTACT_DETAILS_SHARED',
  'AWAITING_FIRST_DATE_FEEDBACK',
  'MEETING_PENDING',
  'MEETING_SCHEDULED',
  'PROCEEDING_TO_SECOND_DATE',
  'DATING',
  'ENGAGED',
  'MARRIED',
  'ENDED_AFTER_FIRST_DATE',
]);

const DetailsTab: React.FC<DetailsTabProps> = ({
  suggestionId,
  statusHistory,
  matchmakerFirstName,
  status,
  targetPartyContact,
  locale,
  dict,
}) => {
  const detailsDict = dict.modal.detailsTab;
  const isHe = locale === 'he';
  const showContact = CONTACT_SHARED_STATUSES.has(status) && targetPartyContact;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Mini Timeline — full width */}
      <MiniTimeline
        statusHistory={statusHistory}
        dict={dict.timeline}
        locale={locale}
      />

      {/* Contact Details Card — shown after contact sharing */}
      {showContact && (
        <div
          className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden animate-in fade-in-0 slide-in-from-top-2 duration-300"
          dir={isHe ? 'rtl' : 'ltr'}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCircle2 className="w-4 h-4" />
              {detailsDict.contactTitle} — {targetPartyContact.firstName} {targetPartyContact.lastName}
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              {detailsDict.contactSubtitle}
            </p>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            {targetPartyContact.phone && (
              <a
                href={`tel:${targetPartyContact.phone}`}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500 text-white group-hover:scale-105 transition-transform">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                    {detailsDict.contactPhone}
                  </p>
                  <p className="text-sm font-semibold text-gray-800" dir="ltr">
                    {targetPartyContact.phone}
                  </p>
                </div>
              </a>
            )}
            <a
              href={`mailto:${targetPartyContact.email}`}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors group"
            >
              <div className="p-1.5 rounded-lg bg-blue-500 text-white group-hover:scale-105 transition-transform">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-blue-600 uppercase tracking-wider">
                  {detailsDict.contactEmail}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {targetPartyContact.email}
                </p>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Section header */}
      <div className="flex items-center gap-2.5" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="p-1.5 rounded-lg bg-teal-50">
          <MessageCircle className="w-4 h-4 text-teal-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">
            {detailsDict.sectionTitle}
          </h3>
          <p className="text-xs text-gray-500">
            {detailsDict.sectionSubtitle}
          </p>
        </div>
      </div>

      {/* Chats — side by side on desktop, matchmaker first on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Chat Assistant — embedded, always open */}
        <div className="order-2 lg:order-1">
          <AiChatPanel
            locale={locale}
            suggestionId={suggestionId}
            title={detailsDict.aiChatTitle}
            subtitle={detailsDict.aiChatSubtitle}
            initialOpen
            embedded
          />
        </div>

        {/* Chat with matchmaker — shown first on mobile */}
        <div className="order-1 lg:order-2">
          <SuggestionChat
            suggestionId={suggestionId}
            locale={locale}
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
    </div>
  );
};

export default DetailsTab;
