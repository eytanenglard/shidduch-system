// src/components/suggestions/chat/AiChatPanel.tsx
// =============================================================================
// Main AI Chat Panel - integrated into the suggestions page
// =============================================================================

'use client';

import React, { useCallback, useState } from 'react';
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
}

export default function AiChatPanel({ locale, suggestionId, proactiveMessage, initialOpen, title, subtitle }: AiChatPanelProps) {
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
  } = useAiChat({ locale, suggestionId, proactiveMessage, initialOpen });

  const [isEscalating, setIsEscalating] = useState(false);

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
    suggestionId
      ? (isHebrew ? 'שאל/י אותי על ההצעה הזו' : 'Ask me about this suggestion')
      : (isHebrew ? 'דבר/י איתי כדי לדייק את ההצעות שלך' : 'Chat with me to refine your suggestions')
  );

  return (
    <div className="mt-4">
      {/* Toggle Button (when closed) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'w-full rounded-xl p-4',
              'bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-violet-500/10',
              'border border-violet-200/50 hover:border-violet-300',
              'flex items-center gap-3 transition-all hover:shadow-md',
              'group cursor-pointer'
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
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

      {/* Chat Panel (when open) */}
      <AnimatePresence>
        {isOpen && (
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
                'shadow-lg',
              )}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white/90" />
                  <h3 className="text-sm font-semibold text-white">
                    {panelTitle}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white/90">
                    AI
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
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
              <div className="h-[400px] flex flex-col">
                <AiChatMessages
                  messages={messages}
                  isStreaming={isStreaming}
                  streamingContent={streamingContent}
                  isLoading={isLoading}
                  locale={locale}
                />

                {/* Search Results (shown after AI response with search) */}
                {searchResults.length > 0 && (
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
