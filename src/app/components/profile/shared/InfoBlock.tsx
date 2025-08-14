// src/components/profile/shared/InfoBlock.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface InfoBlockProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}

const InfoBlock: React.FC<InfoBlockProps> = ({
  icon: Icon,
  label,
  value,
  className,
}) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-3 rounded-lg bg-slate-50/70 border border-slate-200/80',
        className
      )}
    >
      <div className="flex-shrink-0 text-slate-500 mt-1">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <div className="text-base font-medium text-slate-800 mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
};

export default InfoBlock;
