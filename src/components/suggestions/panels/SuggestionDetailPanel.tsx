// src/components/suggestions/panels/SuggestionDetailPanel.tsx

'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  User,
  Quote,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Bot,
  Sparkles,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn, getRelativeCloudinaryPath, calculateAge } from '@/lib/utils';
import { ProfileCard } from '@/components/profile';
import MiniTimeline from '../timeline/MiniTimeline';
import AiChatPanel from '../chat/AiChatPanel';
import { UserAiAnalysisDialog } from '../dialogs/UserAiAnalysisDialog';
import PanelHeader from './PanelHeader';
import PanelActions from './PanelActions';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type {
  SuggestionsDictionary,
  ProfileCardDict,
} from '@/types/dictionary';

interface SuggestionDetailPanelProps {
  suggestion: ExtendedMatchSuggestion | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onActionRequest: (
    suggestion: ExtendedMatchSuggestion,
    action: 'approve' | 'decline' | 'interested'
  ) => void;
  onInquiry?: (suggestion: ExtendedMatchSuggestion) => void;
  onWithdraw?: (suggestion: ExtendedMatchSuggestion) => void;
  isUserInActiveProcess?: boolean;
  actionLoading?: string | null;
  locale: 'he' | 'en';
  dict: {
    suggestions: SuggestionsDictionary;
    profileCard: ProfileCardDict;
  };
}

const SuggestionDetailPanel: React.FC<SuggestionDetailPanelProps> = ({
  suggestion,
  userId,
  isOpen,
  onClose,
  onActionRequest,
  onInquiry,
  onWithdraw,
  isUserInActiveProcess = false,
  actionLoading,
  locale,
  dict,
}) => {
  const isRtl = locale === 'he';
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true,
    aiAnalysis: false,
    timeline: false,
    chat: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isFirstParty = suggestion
    ? suggestion.firstPartyId === userId
    : false;
  const targetParty = suggestion
    ? isFirstParty
      ? suggestion.secondParty
      : suggestion.firstParty
    : null;

  const mainImage = targetParty?.images?.find((img) => img.isMain);
  const allImages = targetParty?.images || [];
  const age = calculateAge(targetParty?.profile?.birthDate ?? null);

  const questionnaire = useMemo(() => {
    return targetParty?.questionnaireResponses?.[0] ?? null;
  }, [targetParty]);

  if (!suggestion || !targetParty) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isRtl ? 'left' : 'right'}
        size="wide"
        className="p-0 flex flex-col w-full sm:w-3/4"
      >
        {/* Visually hidden title for accessibility */}
        <SheetTitle className="sr-only">
          {targetParty.firstName} - {locale === 'he' ? 'פרטי הצעה' : 'Suggestion Details'}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {locale === 'he' ? 'פרטים מלאים על ההצעה' : 'Full suggestion details'}
        </SheetDescription>

        {/* Header */}
        <PanelHeader
          suggestion={suggestion}
          userId={userId}
          onClose={onClose}
          dict={dict.suggestions.card}
          locale={locale}
        />

        {/* Scrollable content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 space-y-4">
            {/* Photo */}
            {mainImage?.url && (
              <div className="relative w-full max-h-[300px] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={getRelativeCloudinaryPath(mainImage.url)}
                  alt={targetParty.firstName}
                  width={672}
                  height={300}
                  className="w-full h-auto max-h-[300px] object-cover"
                />
              </div>
            )}

            {/* Key info chips */}
            <div className="flex flex-wrap gap-2">
              {targetParty.profile?.city && (
                <Badge variant="outline" className="text-xs font-normal text-gray-600 border-gray-200">
                  <MapPin className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
                  {targetParty.profile.city}
                </Badge>
              )}
              {targetParty.profile?.occupation && (
                <Badge variant="outline" className="text-xs font-normal text-gray-600 border-gray-200">
                  <Briefcase className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
                  {targetParty.profile.occupation}
                </Badge>
              )}
              {targetParty.profile?.education && (
                <Badge variant="outline" className="text-xs font-normal text-gray-600 border-gray-200">
                  <GraduationCap className={cn('w-3 h-3', isRtl ? 'ml-1' : 'mr-1')} />
                  {targetParty.profile.education}
                </Badge>
              )}
              {targetParty.profile?.religiousLevel && (
                <Badge variant="outline" className="text-xs font-normal text-gray-600 border-gray-200">
                  {targetParty.profile.religiousLevel}
                </Badge>
              )}
            </div>

            {/* Matchmaker's note */}
            {(isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes) && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-2">
                  <Quote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 scale-x-[-1]" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {locale === 'he' ? 'הערה מהשדכן/ית' : "Matchmaker's note"}
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      {isFirstParty ? suggestion.firstPartyNotes : suggestion.secondPartyNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Matching reason */}
            {suggestion.matchingReason && (
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                <p className="text-xs font-medium text-teal-600 mb-1">
                  {dict.suggestions.card.whySpecial}
                </p>
                <p className="text-sm text-teal-800 leading-relaxed">
                  {suggestion.matchingReason}
                </p>
              </div>
            )}

            {/* Profile section (collapsible) */}
            <CollapsibleSection
              title={locale === 'he' ? 'פרופיל מלא' : 'Full Profile'}
              isExpanded={expandedSections.profile}
              onToggle={() => toggleSection('profile')}
            >
              {targetParty.profile && (
                <ProfileCard
                  profile={targetParty.profile}
                  isProfileComplete={targetParty.isProfileComplete}
                  images={allImages}
                  questionnaire={questionnaire}
                  viewMode="candidate"
                  dict={dict.profileCard}
                  locale={locale}
                />
              )}
            </CollapsibleSection>

            {/* AI Analysis section (collapsible) */}
            <CollapsibleSection
              title={locale === 'he' ? 'ניתוח AI' : 'AI Analysis'}
              icon={<Bot className="w-4 h-4 text-violet-500" />}
              isExpanded={expandedSections.aiAnalysis}
              onToggle={() => toggleSection('aiAnalysis')}
            >
              <div className="flex flex-col items-center py-4 gap-3">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  {locale === 'he'
                    ? 'גלה תובנות מבוססות AI על ההתאמה שלכם'
                    : 'Discover AI-powered insights about your match'}
                </p>
                <UserAiAnalysisDialog
                  suggestedUserId={targetParty.id}
                  isDemo={false}
                  locale={locale}
                  dict={dict.suggestions.aiAnalysis}
                />
              </div>
            </CollapsibleSection>

            {/* Timeline (collapsible) */}
            <CollapsibleSection
              title={locale === 'he' ? 'ציר זמן' : 'Timeline'}
              isExpanded={expandedSections.timeline}
              onToggle={() => toggleSection('timeline')}
            >
              <MiniTimeline
                statusHistory={suggestion.statusHistory}
                locale={locale}
                dict={dict.suggestions.timeline}
              />
            </CollapsibleSection>

            {/* AI Chat (collapsible) */}
            <CollapsibleSection
              title={locale === 'he' ? 'שאל את העוזר החכם' : 'Ask Smart Assistant'}
              icon={<Bot className="w-4 h-4 text-teal-500" />}
              isExpanded={expandedSections.chat}
              onToggle={() => toggleSection('chat')}
            >
              <AiChatPanel
                suggestionId={suggestion.id}
                locale={locale}
              />
            </CollapsibleSection>
          </div>
        </ScrollArea>

        {/* Actions */}
        <PanelActions
          suggestion={suggestion}
          userId={userId}
          isUserInActiveProcess={isUserInActiveProcess}
          onApprove={(s) => onActionRequest(s, 'approve')}
          onDecline={(s) => onActionRequest(s, 'decline')}
          onInterested={(s) => onActionRequest(s, 'interested')}
          onInquiry={onInquiry}
          onWithdraw={onWithdraw}
          isLoading={actionLoading}
          dict={dict.suggestions.card}
          locale={locale}
        />
      </SheetContent>
    </Sheet>
  );
};

// --- Collapsible Section Helper ---
interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
}) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-start"
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
    {isExpanded && <div className="p-4">{children}</div>}
  </div>
);

export default SuggestionDetailPanel;
