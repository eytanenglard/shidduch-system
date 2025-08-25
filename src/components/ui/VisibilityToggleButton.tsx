// src/components/ui/VisibilityToggleButton.tsx (ייתכן שהנתיב מעט שונה אצלך)

'use client';

import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisibilityToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  disabled?: boolean;
  // --- START: הוספת props חדשים ---
  visibleText: string;
  hiddenText: string;
  // --- END: הוספת props חדשים ---
}

export const VisibilityToggleButton: React.FC<VisibilityToggleButtonProps> = ({
  isVisible,
  onToggle,
  disabled,
  // --- START: קבלת ה-props החדשים ---
  visibleText,
  hiddenText,
  // --- END: קבלת ה-props החדשים ---
}) => {
  const text = isVisible ? visibleText : hiddenText;
  const Icon = isVisible ? Eye : EyeOff;

  return (
    <Button
      type="button"
      role="switch"
      aria-checked={isVisible}
      variant="outline"
      size="sm"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 rounded-full transition-all duration-200 text-xs',
        isVisible
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="font-medium">{text}</span>
    </Button>
  );
};
