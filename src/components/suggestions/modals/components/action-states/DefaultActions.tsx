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
    className="w-full border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 rounded-xl h-12 font-bold text-base shadow-sm"
  >
    <MessageCircle className={cn('w-5 h-5', isHe ? 'ml-3' : 'mr-3')} />
    {label}
  </Button>
);

export default DefaultActions;
