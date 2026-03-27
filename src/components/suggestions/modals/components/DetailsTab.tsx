'use client';

import React, { useState, useCallback } from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  UserCircle2,
  Clock,
  Copy,
  Check,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

// WhatsApp icon — simple inline SVG to avoid adding a dependency
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silently
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-md hover:bg-black/5 transition-colors flex-shrink-0"
      title={label}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
      )}
    </button>
  );
}

const DetailsTab: React.FC<DetailsTabProps> = ({
  suggestionId,
  statusHistory,
  matchmakerFirstName,
  status,
  targetPartyContact,
  locale,
  dict,
  autoSendMessage,
  autoSendRequestType,
  onAutoSendComplete,
}) => {
  const detailsDict = dict.modal.detailsTab;
  const isHe = locale === 'he';
  const showContact = CONTACT_SHARED_STATUSES.has(status) && targetPartyContact;
  const statusTip = detailsDict.statusTips?.[status];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Status context tip */}
      {statusTip && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in-0 duration-300"
          dir={isHe ? 'rtl' : 'ltr'}
        >
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">{statusTip}</p>
        </div>
      )}

      {/* Timeline section header */}
      <div className="flex items-center gap-2.5" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="p-1.5 rounded-lg bg-orange-50">
          <Clock className="w-4 h-4 text-orange-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">
            {detailsDict.timelineTitle}
          </h3>
          <p className="text-xs text-gray-500">
            {detailsDict.timelineSubtitle}
          </p>
        </div>
      </div>

      {/* Mini Timeline */}
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
            {/* Phone — call */}
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
                <CopyButton text={targetPartyContact.phone} label={detailsDict.copied} />
              </a>
            )}

            {/* Phone — WhatsApp */}
            {targetPartyContact.phone && (
              <a
                href={`https://wa.me/${targetPartyContact.phone.replace(/[^0-9+]/g, '').replace(/^\+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-green-500 text-white group-hover:scale-105 transition-transform">
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-green-600 uppercase tracking-wider">
                    {detailsDict.contactWhatsApp}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {targetPartyContact.firstName}
                  </p>
                </div>
              </a>
            )}

            {/* Email */}
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
              <CopyButton text={targetPartyContact.email} label={detailsDict.copied} />
            </a>
          </div>
        </div>
      )}

      {/* Communication section header */}
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
        {/* AI Chat Assistant — embedded, always open, with starter questions */}
        <div className="order-2 lg:order-1">
          <AiChatPanel
            locale={locale}
            suggestionId={suggestionId}
            title={detailsDict.aiChatTitle}
            subtitle={detailsDict.aiChatSubtitle}
            initialOpen
            embedded
            starterQuestions={detailsDict.starterQuestions}
            autoSendMessage={autoSendMessage}
            autoSendRequestType={autoSendRequestType}
            onAutoSendComplete={onAutoSendComplete}
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
