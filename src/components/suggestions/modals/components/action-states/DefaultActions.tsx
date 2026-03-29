'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DefaultActionsProps {
  isSubmitting: boolean;
  isHe: boolean;
  onAskQuestion: () => void;
  label: string;
}

const DefaultActions: React.FC<DefaultActionsProps> = ({
  isSubmitting,
  isHe,
  onAskQuestion,
  label,
}) => (
  <Button
    variant="outline"
    onClick={onAskQuestion}
    disabled={isSubmitting}
    className="w-full border border-violet-200 text-violet-700 bg-white hover:bg-violet-50 hover:border-violet-300 hover:shadow-md hover:shadow-violet-100/50 rounded-xl h-12 font-bold text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
  >
    <MessageCircle className={cn('w-5 h-5', isHe ? 'ml-3' : 'mr-3')} />
    {label}
  </Button>
);

export default DefaultActions;
