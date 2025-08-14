// src/components/profile/shared/QuoteBlock.tsx
import React from 'react';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuoteBlockProps {
  quote: string | null | undefined;
  source: string;
  className?: string;
}

const QuoteBlock: React.FC<QuoteBlockProps> = ({
  quote,
  source,
  className,
}) => {
  if (!quote || quote.trim().length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'p-6 rounded-xl bg-gradient-to-br from-rose-50 via-pink-50 to-red-50 border border-rose-200/50',
        className
      )}
    >
      <Quote className="w-8 h-8 text-rose-300 transform -scale-x-100" />
      <blockquote className="my-3 text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
        {quote}
      </blockquote>
      <p className="text-right text-sm font-semibold text-rose-500">
        — {source}
      </p>
    </div>
  );
};

export default QuoteBlock;
