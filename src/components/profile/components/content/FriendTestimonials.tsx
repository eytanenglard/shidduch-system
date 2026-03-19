'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Phone, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '../shared/EmptyState';
import type { ThemeType } from '../../constants/theme';
import type { UserProfile } from '@/types/next-auth';
import type { ProfileCardDisplayDict } from '@/types/dictionary';

interface FriendTestimonialsProps {
  profile: UserProfile;
  dict: ProfileCardDisplayDict;
  THEME: ThemeType;
  direction: 'ltr' | 'rtl';
}

const FriendTestimonials: React.FC<FriendTestimonialsProps> = ({
  profile,
  dict,
  THEME,
  direction,
}) => {
  const approvedTestimonials = (profile.testimonials || []).filter(
    (t) => t.status === 'APPROVED'
  );

  if (!profile.isFriendsSectionVisible || approvedTestimonials.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareQuote}
        title={dict.content.friendTestimonials.emptyState.title}
        description={dict.content.friendTestimonials.emptyState.description}
        variant="discovery"
        THEME={THEME}
      />
    );
  }

  return (
    <div className="space-y-4" dir={direction}>
      {approvedTestimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
        >
          <blockquote
            className={cn(
              'italic',
              // --- התיקון מתחיל כאן ---
              'whitespace-pre-wrap break-words break-all overflow-wrap-anywhere max-w-full',
              // --- התיקון מסתיים כאן ---
              direction === 'rtl' ? 'pr-4 border-r-4' : 'pl-4 border-l-4',
              THEME.colors.primary.main.includes('cyan')
                ? direction === 'rtl'
                  ? 'border-cyan-500'
                  : 'border-cyan-500'
                : THEME.colors.primary.main.includes('blue')
                  ? direction === 'rtl'
                    ? 'border-blue-500'
                    : 'border-blue-500'
                  : direction === 'rtl'
                    ? 'border-gray-500'
                    : 'border-gray-500',
              THEME.colors.primary.main.includes('cyan')
                ? 'text-cyan-800'
                : THEME.colors.primary.main.includes('blue')
                  ? 'text-blue-800'
                  : 'text-gray-800'
            )}
          >
            &quot;{testimonial.content}&quot;
          </blockquote>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <p className="text-sm font-semibold text-gray-800 text-start">
              {' '}
              - {testimonial.authorName},{' '}
              <span className="font-normal text-gray-600">
                {testimonial.relationship}
              </span>
            </p>
            {testimonial.isPhoneVisibleToMatch && testimonial.authorPhone && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className={cn(
                  'rounded-full',
                  `text-${THEME.colors.primary.main.includes('cyan') ? 'cyan' : 'blue'}-700`,
                  `border-${THEME.colors.primary.main.includes('cyan') ? 'cyan' : 'blue'}-300`,
                  `hover:bg-${THEME.colors.primary.main.includes('cyan') ? 'cyan' : 'blue'}-50`
                )}
              >
                <a href={`tel:${testimonial.authorPhone}`}>
                  <Phone className="w-3 h-3 me-2" />
                  {dict.content.friendTestimonials.callButton.replace(
                    '{{name}}',
                    testimonial.authorName.split(' ')[0]
                  )}
                </a>
              </Button>
            )}
          </div>
        </div>
      ))}
      {approvedTestimonials.some((t) => t.isPhoneVisibleToMatch) && (
        <p className="text-xs text-center text-gray-500 mt-4 px-4">
          {dict.content.friendTestimonials.callDisclaimer}
        </p>
      )}
    </div>
  );
};

export default FriendTestimonials;
