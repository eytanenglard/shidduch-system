// src/components/suggestions/chat/AiChatPanel.tsx
// =============================================================================
// Main AI Chat Panel - integrated into the suggestions page
// =============================================================================

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, X, AlertCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAiChat } from './useAiChat';
import AiChatMessages from './AiChatMessages';
import AiChatInput from './AiChatInput';
import AiChatSearchResults from './AiChatSearchResults';

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
}

export default function AiChatPanel({ locale, suggestionId, proactiveMessage, initialOpen, title, subtitle, onOpenChange, panelRef, embedded }: AiChatPanelProps) {
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
    // Smart assistant
    phase,
    actionButtons,
    executeChatAction,
    isGeneralChat,
    isLoadingDiscovery,
  } = useAiChat({ locale, suggestionId, proactiveMessage, initialOpen });

  const [isEscalating, setIsEscalating] = useState(false);

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

  const panelTitle = title || (isHebrew ? 'העוזר החכם' : 'Smart Assistant');
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
              'bg-violet-50',
              'border border-violet-200/50 hover:border-violet-300',
              'flex items-center gap-3 transition-all hover:shadow-sm',
              'group cursor-pointer'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className={cn('flex-1', isHebrew ? 'text-right' : 'text-left')}>
              <h3 className="text-sm font-semibold text-violet-800">
                {isHebrew ? 'העוזר החכם שלך' : 'Your Smart Assistant'}
              </h3>
              <p className="text-xs text-violet-600/70">
                {panelSubtitle}
              </p>
            </div>
            <MessageCircle className="w-5 h-5 text-violet-400 group-hover:text-violet-600 transition-colors" />
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
                'rounded-xl border border-violet-200 bg-gray-50 overflow-hidden',
                'shadow-sm',
              )}
            >
              {/* Header */}
              <div className="bg-violet-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white/90" />
                  <h3 className="text-sm font-semibold text-white">
                    {panelTitle}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/90">
                    AI
                  </span>
                  {phaseLabel && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 border border-white/20">
                      {phaseLabel}
                    </span>
                  )}
                </div>
                {!embedded && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
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
              <div className={cn('flex flex-col', isGeneralChat ? 'h-[550px]' : 'h-[450px]')}>
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
                  isGeneralChat={isGeneralChat}
                  actionButtons={actionButtons}
                  onChatAction={executeChatAction}
                  isLoadingDiscovery={isLoadingDiscovery}
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

              {/* Escalation button (only for suggestion-specific chats) */}
              {suggestionId && !escalated && messages.length >= 2 && (
                <div className="px-4 py-2 border-t border-gray-200">
                  <button
                    onClick={handleEscalate}
                    disabled={isEscalating}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-colors disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {isEscalating
                      ? (isHebrew ? 'מעביר...' : 'Transferring...')
                      : (isHebrew ? 'העבר לשדכנית' : 'Transfer to matchmaker')}
                  </button>
                </div>
              )}

              {/* Privacy notice */}
              <div className="px-4 py-1.5 bg-gray-100 border-t border-gray-200">
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
    </div>
  );
}
