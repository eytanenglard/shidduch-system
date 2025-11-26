// src/components/HomePage/components/TestimonialCard.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';

export interface TestimonialCardProps {
  text: string;
  author: string;
  result?: string;
  color: 'cyan' | 'green' | 'orange' | 'pink';
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  text,
  author,
  result,
  color,
}) => {
  // Mapping old prop names to new Palette:
  // cyan -> Teal (Hero primary)
  // green -> Emerald (Growth/Success)
  // orange -> Orange/Amber (Hero secondary)
  // pink -> Rose (Warmth/Emotion)
  const colorClasses = {
    cyan: {
      gradient1: 'from-teal-100/80 to-teal-50/50',
      gradient2: 'from-teal-50/50 to-teal-100/80',
      avatar: 'from-teal-500 to-teal-600',
      result: 'text-teal-600',
      iconBg: 'bg-teal-50',
    },
    green: {
      gradient1: 'from-emerald-100/80 to-emerald-50/50',
      gradient2: 'from-emerald-50/50 to-emerald-100/80',
      avatar: 'from-emerald-500 to-emerald-600',
      result: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    orange: {
      gradient1: 'from-orange-100/80 to-amber-50/50',
      gradient2: 'from-amber-50/50 to-orange-100/80',
      avatar: 'from-orange-500 to-orange-600',
      result: 'text-orange-600',
      iconBg: 'bg-orange-50',
    },
    pink: {
      gradient1: 'from-rose-100/80 to-pink-50/50',
      gradient2: 'from-pink-50/50 to-rose-100/80',
      avatar: 'from-rose-500 to-rose-600',
      result: 'text-rose-600',
      iconBg: 'bg-rose-50',
    },
  };

  return (
    <Card className="group relative overflow-hidden border border-white/60 bg-white/70 backdrop-blur-md shadow-lg hover:shadow-2xl hover:border-teal-100 transition-all duration-500 h-full rounded-2xl">
      {/* Background Orbs */}
      <div
        className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${colorClasses[color].gradient1} opacity-60 rounded-full blur-2xl transition-all duration-500 group-hover:scale-110`}
      />
      <div
        className={`absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br ${colorClasses[color].gradient2} opacity-40 rounded-full blur-2xl transition-all duration-500 group-hover:scale-110`}
      />

      <CardContent className="relative p-8 h-full flex flex-col z-10">
        {/* Quote Icon */}
        <div
          aria-hidden="true"
          className="mb-4 text-5xl font-serif text-gray-200/80 group-hover:text-gray-300 transition-colors duration-300"
        >
          ❝
        </div>
        
        <p className="text-gray-700 leading-relaxed text-lg mb-8 flex-grow font-medium">
          {text}
        </p>

        <div className="flex flex-col mt-auto">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[color].avatar} flex items-center justify-center text-white text-lg font-bold shadow-md transform group-hover:scale-105 transition-transform duration-300`}
            >
              {author[0]}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base">{author}</p>
              {result && (
                <div
                  className={`mt-1 text-xs font-semibold ${colorClasses[color].result} flex items-center gap-1`}
                >
                   <Heart className="w-3 h-3 fill-current" />
                   <span>{result}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;