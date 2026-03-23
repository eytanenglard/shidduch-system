'use client';

import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProfileCardHeaderProps {
  icon: React.ReactNode;
  title: string;
  /** Gradient classes for the header background (e.g., "from-cyan-50/60 to-pink-50/60") */
  gradientFrom: string;
  /** Gradient classes for the icon background (e.g., "from-cyan-500/10 to-cyan-600/10") */
  iconGradient: string;
  /** Extra content on the right side of the header (badges, switches, etc.) */
  children?: React.ReactNode;
}

const ProfileCardHeader: React.FC<ProfileCardHeaderProps> = ({
  icon,
  title,
  gradientFrom,
  iconGradient,
  children,
}) => (
  <CardHeader
    className={cn(
      'border-b border-gray-200/50 px-4 py-2.5 flex items-center',
      children ? 'justify-between' : 'space-x-2 rtl:space-x-reverse',
      `bg-gradient-to-r ${gradientFrom}`
    )}
  >
    <div className={cn('flex items-center', children ? 'gap-2' : 'space-x-2 rtl:space-x-reverse')}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', `bg-gradient-to-br ${iconGradient}`)}>
        {icon}
      </div>
      <CardTitle className="text-base font-semibold text-gray-700">
        {title}
      </CardTitle>
    </div>
    {children}
  </CardHeader>
);

export default React.memo(ProfileCardHeader);
