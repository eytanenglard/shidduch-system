// src/components/profile/elements/VisibilityControl.tsx
import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { VisibilityControlDict } from '@/types/dictionary';

interface VisibilityControlProps {
  isVisible: boolean;
  onChange: (isVisible: boolean) => void;
  dict: VisibilityControlDict;
  className?: string;
  disabled?: boolean;
}

const VisibilityControl: React.FC<VisibilityControlProps> = ({
  isVisible,
  onChange,
  dict,
  className,
  disabled = false,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-secondary/20 p-2 rounded-md',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isVisible ? (
        <Eye className="h-4 w-4 text-primary" aria-hidden="true" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      )}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Switch
                checked={isVisible}
                onCheckedChange={onChange}
                disabled={disabled}
                className={cn(
                  'data-[state=checked]:bg-primary',
                  disabled && 'cursor-not-allowed'
                )}
                aria-label={dict.ariaLabel.replace(
                  '{{status}}',
                  isVisible ? 'visible' : 'hidden'
                )}
              />
              <span className="sr-only">
                {isVisible ? dict.srAction.hide : dict.srAction.show}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[200px]" dir="rtl">
            <p>{isVisible ? dict.tooltip.visible : dict.tooltip.hidden}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {`${dict.tooltip.actionPrefix} ${isVisible ? dict.tooltip.actionHide : dict.tooltip.actionShow}`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default VisibilityControl;
export type { VisibilityControlProps };
