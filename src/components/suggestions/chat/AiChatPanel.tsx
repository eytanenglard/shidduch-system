// src/components/suggestions/chat/AiChatPanel.tsx
// =============================================================================
// Main AI Chat Panel - integrated into the suggestions page
// =============================================================================

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiChat } from './useAiChat';
import AiChatMessages from './AiChatMessages';
import AiChatInput from './AiChatInput';
import AiChatSearchResults from './AiChatSearchResults';

interface AiChatPanelProps {
  locale: 'he' | 'en';
}

export default function AiChatPanel({ locale }: AiChatPanelProps) {
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
  } = useAiChat({ locale });

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
                {isHebrew
                  ? 'דבר/י איתי כדי לדייק את ההצעות שלך'
                  : 'Chat with me to refine your suggestions'}
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
                    {isHebrew ? 'העוזר החכם' : 'Smart Assistant'}
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
