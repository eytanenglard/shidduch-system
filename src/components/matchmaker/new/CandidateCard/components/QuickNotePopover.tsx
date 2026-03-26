// QuickNotePopover.tsx — Popover wrapper for NotePanel on MinimalCard

import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { StickyNote } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import NotePanel from '@/components/matchmaker/notes/NotePanel';

interface QuickNotePopoverProps {
  userId: string;
  isHe: boolean;
  notesCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickNotePopover: React.FC<QuickNotePopoverProps> = ({
  userId,
  isHe,
  notesCount,
  open,
  onOpenChange,
}) => (
  <Popover open={open} onOpenChange={onOpenChange}>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 min-h-[44px] min-w-[44px] bg-white/95 shadow-xl border-0 hover:bg-white hover:scale-105 transition-all duration-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <StickyNote className="h-3 w-3 text-gray-600" />
              {notesCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notesCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isHe ? 'הערות פנימיות' : 'Internal notes'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

    <PopoverContent
      className="w-[340px] p-0 max-h-[420px] overflow-hidden"
      align="start"
      side="top"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-[400px]">
        <NotePanel userId={userId} isHe={isHe} />
      </div>
    </PopoverContent>
  </Popover>
);

export default React.memo(QuickNotePopover);
