'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProfileCardHeader from '@/components/profile/ProfileCardHeader';
import { cn } from '@/lib/utils';

interface EditableCardProps {
  icon: React.ReactNode;
  title: string;
  gradientFrom?: string;
  iconGradient?: string;
  /** Extra content rendered in the header (badges, switches, etc.) */
  headerChildren?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

const EditableCard: React.FC<EditableCardProps> = ({
  icon,
  title,
  gradientFrom = 'from-gray-50/60 to-gray-100/60',
  iconGradient = 'from-gray-500/10 to-gray-600/10',
  headerChildren,
  children,
  className,
  contentClassName,
}) => (
  <Card
    className={cn(
      'bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50',
      className
    )}
  >
    <ProfileCardHeader
      icon={icon}
      title={title}
      gradientFrom={gradientFrom}
      iconGradient={iconGradient}
    >
      {headerChildren}
    </ProfileCardHeader>
    <CardContent className={cn('p-3 md:p-4 space-y-4', contentClassName)}>
      {children}
    </CardContent>
  </Card>
);

export default React.memo(EditableCard);
