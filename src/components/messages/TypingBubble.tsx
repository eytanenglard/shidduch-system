// src/components/messages/TypingBubble.tsx
//
// WhatsApp-style typing indicator — shows as a chat bubble
// with animated bouncing dots.

'use client';

import React from 'react';

interface TypingBubbleProps {
  userName: string;
  locale: 'he' | 'en';
}

export default function TypingBubble({ userName, locale }: TypingBubbleProps) {
  const isHe = locale === 'he';

  return (
    <div className="flex justify-start mb-1">
      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[200px]">
        <p className="text-xs font-bold text-purple-600 mb-1.5">
          {userName}
        </p>
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '600ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: '150ms', animationDuration: '600ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
            style={{ animationDelay: '300ms', animationDuration: '600ms' }}
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">
          {isHe ? 'מקליד/ה...' : 'typing...'}
        </p>
      </div>
    </div>
  );
}
