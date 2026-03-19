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
      />
    );
  }

  return (
    <div className="space-y-4" dir={direction}>
      {approvedTestimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className={cn(
            'bg-gray-50 rounded-lg p-4',
            direction === 'rtl' ? 'border-r-2' : 'border-l-2',
            THEME.accentBorder
          )}
        >
          <p className="text-sm text-gray-700 italic leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
            &quot;{testimonial.content}&quot;
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              — {testimonial.authorName}, {testimonial.relationship}
            </p>
            {testimonial.isPhoneVisibleToMatch && testimonial.authorPhone && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                <a href={`tel:${testimonial.authorPhone}`}>
                  <Phone className="w-3 h-3 me-1" />
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
        <p className="text-xs text-center text-gray-400 mt-2 px-4">
          {dict.content.friendTestimonials.callDisclaimer}
        </p>
      )}
    </div>
  );
};

export default FriendTestimonials;
