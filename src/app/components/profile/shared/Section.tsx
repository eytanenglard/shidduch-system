// src/components/profile/shared/Section.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  action?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  contentClassName,
  action,
}) => {
  return (
    <Card
      className={cn(
        'w-full bg-white/60 backdrop-blur-sm border-gray-200/70 shadow-sm',
        className
      )}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex-shrink-0 bg-rose-100 text-rose-600 p-2 rounded-lg">
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-slate-800">
                {title}
              </CardTitle>
              {subtitle && (
                <CardDescription className="text-sm text-slate-500 mt-1">
                  {subtitle}
                </CardDescription>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn('pt-0', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
};

export default Section;
