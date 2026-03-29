// src/components/suggestions/chat/AiChatConversationRating.tsx
// =============================================================================
// Conversation rating — shown after meaningful interactions
// =============================================================================

'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AiChatConversationRatingProps {
  locale: 'he' | 'en';
  conversationId: string;
  onDismiss: () => void;
}

export default function AiChatConversationRating({
  locale,
  conversationId,
  onDismiss,
}: AiChatConversationRatingProps) {
  const isHebrew = locale === 'he';
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitted(true);

    try {
      await fetch('/api/ai-chat/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          conversationRating: rating,
        }),
      });
    } catch { /* non-critical */ }

    // Auto-dismiss after 2s
    setTimeout(onDismiss, 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mx-4 mb-2 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 relative"
      >
        <button
          onClick={onDismiss}
          className="absolute top-2 end-2 w-5 h-5 rounded-full hover:bg-violet-200 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>

        {submitted ? (
          <div className="text-center py-1">
            <p className="text-sm font-medium text-violet-700">
              {isHebrew ? 'תודה! הפידבק עוזר לי להשתפר 💜' : 'Thanks! Your feedback helps me improve 💜'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-medium text-violet-700 text-center mb-2">
              {isHebrew ? 'איך היתה השיחה?' : 'How was the conversation?'}
            </p>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-6 h-6 transition-colors',
                      (hoveredStar || rating) >= star
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300',
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleSubmit}
                className="w-full text-xs px-3 py-1.5 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors"
              >
                {isHebrew ? 'שלח' : 'Submit'}
              </motion.button>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
