// src/components/suggestions/chat/AiChatPanel.tsx
// =============================================================================
// Main AI Chat Panel - integrated into the suggestions page
// =============================================================================

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, X, AlertCircle, UserCheck, HelpCircle, Brain, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAiChat } from './useAiChat';
import AiChatMessages from './AiChatMessages';
import AiChatInput from './AiChatInput';
import AiChatSearchResults from './AiChatSearchResults';
import AiChatHowItWorks from './AiChatHowItWorks';
import AiChatLearnedPreferences from './AiChatLearnedPreferences';
import AiChatConversationRating from './AiChatConversationRating';

interface AiChatPanelProps {
  locale: 'he' | 'en';
  suggestionId?: string;
  proactiveMessage?: string;
  initialOpen?: boolean;
  title?: string;
  subtitle?: string;
  onOpenChange?: (open: boolean) => void;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  /** When true, removes outer margin, hides close button, and always stays open */
  embedded?: boolean;
  /** Pre-built question chips shown before any messages are sent */
  starterQuestions?: string[];
  /** Auto-send a message when chat is ready (after history loads) */
  autoSendMessage?: string | null;
  /** Request type for auto-send (e.g. 'profile_summary' for deep context) */
  autoSendRequestType?: 'profile_summary';
  /** Called after auto-send fires, so parent can clear the pending message */
  onAutoSendComplete?: () => void;
}

export default function AiChatPanel({ locale, suggestionId, proactiveMessage, initialOpen, title, subtitle, onOpenChange, panelRef, embedded, starterQuestions, autoSendMessage, autoSendRequestType, onAutoSendComplete }: AiChatPanelProps) {
  const isHebrew = locale === 'he';
  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    isOpen,
    setIsOpen,
    sendMessage,
    searchResults,
    escalated,
    conversationId,
    pendingActions,
    actionExecuting,
    executeAction,
    quickReplies,
    rateMessage,
    reactToMessage,
    // Smart assistant
    phase,
    actionButtons,
    executeChatAction,
    isGeneralChat,
    isLoadingDiscovery,
    historyLoaded,
    weeklyUsage,
    candidateCounter,
    showRejectionPicker,
    setShowRejectionPicker,
  } = useAiChat({ locale, suggestionId, proactiveMessage, initialOpen });

  const [isEscalating, setIsEscalating] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showLearnedPrefs, setShowLearnedPrefs] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(false);
  const autoSendFired = React.useRef(false);

  // Auto-send message when chat is ready (history loaded, not streaming)
  useEffect(() => {
    if (autoSendMessage && historyLoaded && !isLoading && !isStreaming && !autoSendFired.current) {
      autoSendFired.current = true;
      sendMessage(autoSendMessage, autoSendRequestType);
      onAutoSendComplete?.();
    }
  }, [autoSendMessage, historyLoaded, isLoading, isStreaming, sendMessage, autoSendRequestType, onAutoSendComplete]);

  // Reset the auto-send guard when the message changes
  useEffect(() => {
    if (!autoSendMessage) {
      autoSendFired.current = false;
    }
  }, [autoSendMessage]);

  // Notify parent when open state changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleEscalate = useCallback(async () => {
    if (!suggestionId || !conversationId || isEscalating) return;
    setIsEscalating(true);
    try {
      const res = await fetch('/api/ai-chat/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, suggestionId }),
      });
      if (!res.ok) throw new Error('Escalation failed');
      toast.success(
        isHebrew ? 'השיחה הועברה לשדכנית' : 'Conversation transferred to matchmaker',
        { description: isHebrew ? 'תקבל/י תשובה בהקדם' : "You'll get a response soon" }
      );
    } catch {
      toast.error(isHebrew ? 'שגיאה בהעברת השיחה' : 'Failed to transfer conversation');
    } finally {
      setIsEscalating(false);
    }
  }, [suggestionId, conversationId, isHebrew, isEscalating]);

  const handleShareWithMatchmaker = useCallback(async () => {
    if (!conversationId || isSharing) return;
    setIsSharing(true);
    try {
      const res = await fetch('/api/ai-chat/summaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
      if (!res.ok) throw new Error('Share failed');
      toast.success(
        isHebrew ? 'סיכום השיחה נשלח לשדכנית' : 'Chat summary sent to matchmaker',
        { description: isHebrew ? 'השדכנית שלך תקבל את התובנות מהשיחה' : 'Your matchmaker will receive the conversation insights' }
      );
    } catch {
      toast.error(isHebrew ? 'שגיאה בשליחת הסיכום' : 'Failed to send summary');
    } finally {
      setIsSharing(false);
    }
  }, [conversationId, isHebrew, isSharing]);

  const panelTitle = title || (isHebrew ? 'נשמה' : 'Neshama');
  const panelSubtitle = subtitle || (
    isGeneralChat
      ? (isHebrew ? 'שוחח/י איתי כדי למצוא התאמות טובות' : 'Chat with me to find great matches')
      : (isHebrew ? 'שאל/י אותי על ההצעה הזו' : 'Ask me about this suggestion')
  );

  // Phase indicator for general chat
  const phaseLabel = isGeneralChat && phase ? {
    discovery: isHebrew ? 'דיוק' : 'Discovery',
    searching: isHebrew ? 'חיפוש...' : 'Searching...',
    presenting: isHebrew ? 'הצגת מועמד/ת' : 'Presenting',
    discussing: isHebrew ? 'דיון' : 'Discussing',
  }[phase] : null;

  return (
    <div className={embedded ? '' : 'mt-4'} ref={panelRef}>
      {/* Toggle Button (when closed, hidden in embedded mode) */}
      <AnimatePresence>
        {!isOpen && !embedded && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'w-full rounded-xl p-4',
              'bg-gradient-to-r from-violet-50 via-purple-50/50 to-violet-50',
              'border border-violet-200/50 hover:border-violet-300',
              'flex items-center gap-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]',
              'group cursor-pointer relative overflow-hidden'
            )}
          >
            <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-violet-400/10 blur-2xl pointer-events-none" />
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className={cn('flex-1 relative', isHebrew ? 'text-right' : 'text-left')}>
              <h3 className="text-sm font-semibold text-violet-800">
                {isHebrew ? 'נשמה' : 'Neshama'}
              </h3>
              <p className="text-xs text-violet-600/70">
                {panelSubtitle}
              </p>
            </div>
            <MessageCircle className="w-5 h-5 text-violet-400 group-hover:text-violet-600 transition-colors relative" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel (when open, or always when embedded) */}
      <AnimatePresence>
        {(isOpen || embedded) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'rounded-xl border border-violet-200/60 bg-gray-50 overflow-hidden',
                'shadow-md',
              )}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 px-4 py-3 flex items-center justify-between overflow-hidden">
                {/* Subtle animated shimmer in header */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 animate-shimmer pointer-events-none" />
                <div className="flex items-center gap-2 relative">
                  <Sparkles className="w-4 h-4 text-white/90" />
                  <h3 className="text-sm font-semibold text-white">
                    {panelTitle}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm">
                    AI
                  </span>
                  {phaseLabel && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm">
                      {phaseLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 relative">
                  {/* Candidate counter badge */}
                  {isGeneralChat && candidateCounter && candidateCounter.total > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400/20 text-white/90 font-medium backdrop-blur-sm border border-emerald-300/30">
                      {candidateCounter.shown}/{candidateCounter.total} {isHebrew ? 'התאמות' : 'matches'}
                    </span>
                  )}
                  {/* Weekly usage badge — show remaining, with warning color when low */}
                  {isGeneralChat && weeklyUsage && (
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm',
                      weeklyUsage.remaining <= 1
                        ? 'bg-amber-400/25 text-amber-100 border border-amber-300/30'
                        : 'bg-white/15 text-white/90',
                    )}>
                      {weeklyUsage.remaining > 0
                        ? `${weeklyUsage.remaining} ${isHebrew ? 'נותרו' : 'left'}`
                        : (isHebrew ? 'המכסה מלאה' : 'Limit reached')}
                    </span>
                  )}
                  {/* Learned preferences button */}
                  {isGeneralChat && (
                    <button
                      onClick={() => setShowLearnedPrefs(true)}
                      className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                      title={isHebrew ? 'מה למדתי עלייך' : 'What I learned'}
                    >
                      <Brain className="w-4 h-4 text-white/80" />
                    </button>
                  )}
                  {/* How it works button */}
                  {isGeneralChat && (
                    <button
                      onClick={() => setShowHowItWorks(true)}
                      className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                      title={isHebrew ? 'איך זה עובד?' : 'How it works?'}
                    >
                      <HelpCircle className="w-4 h-4 text-white/80" />
                    </button>
                  )}
                  {!embedded && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Escalation Notice */}
              {escalated && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700 font-medium">
                    {isHebrew
                      ? 'השיחה הועברה לשדכנית שלך. תקבל/י תשובה בהקדם.'
                      : 'Conversation transferred to your matchmaker. You\'ll get a response soon.'}
                  </p>
                </div>
              )}

              {/* Messages Area */}
              <div className={cn('flex flex-col', isGeneralChat ? 'h-[min(550px,65vh)]' : 'h-[min(450px,55vh)]')}>
                <AiChatMessages
                  messages={messages}
                  isStreaming={isStreaming}
                  streamingContent={streamingContent}
                  isLoading={isLoading}
                  locale={locale}
                  pendingActions={pendingActions}
                  actionExecuting={actionExecuting}
                  onAction={executeAction}
                  quickReplies={quickReplies}
                  onQuickReply={sendMessage}
                  onRateMessage={rateMessage}
                  onReactToMessage={reactToMessage}
                  isGeneralChat={isGeneralChat}
                  phase={phase}
                  actionButtons={actionButtons}
                  onChatAction={executeChatAction}
                  isLoadingDiscovery={isLoadingDiscovery}
                  showRejectionPicker={showRejectionPicker}
                  onRejectWithCategory={(category, freeText) => {
                    executeChatAction('not_for_me', { rejectionCategory: category, feedback: freeText });
                  }}
                  onCancelRejection={() => setShowRejectionPicker(false)}
                />

                {/* Legacy search results (for suggestion-specific chats only) */}
                {!isGeneralChat && searchResults.length > 0 && (
                  <div className="px-4 pb-2">
                    <AiChatSearchResults results={searchResults} locale={locale} />
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="px-4 pb-2">
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </div>
                  </div>
                )}

                {/* Starter question chips — shown before any messages */}
                {starterQuestions && starterQuestions.length > 0 && messages.length === 0 && !isStreaming && !isLoading && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gradient-to-b from-white to-violet-50/30">
                    <p className="text-[10px] font-medium text-violet-500 mb-1.5 uppercase tracking-wider">
                      {isHebrew ? 'שאלות לדוגמה' : 'Try asking'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {starterQuestions.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="text-xs px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm text-violet-700 border border-violet-200/60 hover:bg-violet-100 hover:border-violet-300 hover:shadow-sm hover:scale-[1.03] transition-all duration-200 text-start"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <AiChatInput
                  onSend={sendMessage}
                  isStreaming={isStreaming}
                  locale={locale}
                  placeholder={
                    isGeneralChat && phase === 'presenting'
                      ? (isHebrew ? 'מה דעתך?' : 'What do you think?')
                      : isGeneralChat && phase === 'discussing'
                        ? (isHebrew ? 'שאל/י על ההתאמה...' : 'Ask about the match...')
                        : undefined
                  }
                />
              </div>

              {/* Conversation rating — after 6+ user messages */}
              {!ratingDismissed && conversationId && !isStreaming
                && messages.filter((m) => m.role === 'user').length >= 6
                && (
                <AiChatConversationRating
                  locale={locale}
                  conversationId={conversationId}
                  onDismiss={() => setRatingDismissed(true)}
                />
              )}

              {/* Action buttons row */}
              {messages.length >= 2 && (
                <div className="px-4 py-2 border-t border-gray-200/60 flex gap-2">
                  {/* Escalation button (suggestion-specific chats) */}
                  {suggestionId && !escalated && (
                    <button
                      onClick={handleEscalate}
                      disabled={isEscalating}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-violet-700 bg-violet-50/80 hover:bg-violet-100 border border-violet-200/60 transition-all duration-200 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {isEscalating
                        ? (isHebrew ? 'מעביר...' : 'Transferring...')
                        : (isHebrew ? 'העבר לשדכנית' : 'Transfer to matchmaker')}
                    </button>
                  )}
                  {/* Share with matchmaker button (general chat) */}
                  {isGeneralChat && conversationId && (
                    <button
                      onClick={handleShareWithMatchmaker}
                      disabled={isSharing}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-teal-700 bg-teal-50/80 hover:bg-teal-100 border border-teal-200/60 transition-all duration-200 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {isSharing
                        ? (isHebrew ? 'שולח...' : 'Sharing...')
                        : (isHebrew ? 'שתף עם השדכנית' : 'Share with matchmaker')}
                    </button>
                  )}
                </div>
              )}

              {/* Privacy notice */}
              <div className="px-4 py-1.5 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 border-t border-gray-200/60">
                <p className="text-[10px] text-gray-400 text-center">
                  {isHebrew
                    ? '🔒 השיחות נשמרות ומשמשות לשיפור ההצעות שלך. פרטיות מלאה.'
                    : '🔒 Conversations are saved and used to improve your suggestions. Full privacy.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How it works dialog */}
      {showHowItWorks && (
        <AiChatHowItWorks
          locale={locale}
          open={showHowItWorks}
          onOpenChange={setShowHowItWorks}
        />
      )}

      {/* Learned preferences dialog */}
      {showLearnedPrefs && (
        <AiChatLearnedPreferences
          locale={locale}
          open={showLearnedPrefs}
          onOpenChange={setShowLearnedPrefs}
        />
      )}
    </div>
  );
}
