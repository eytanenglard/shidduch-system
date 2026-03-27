// QuickTagPopover.tsx — Popover for managing custom tags on a candidate card

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Plus, Check, X, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TagData {
  id: string;
  name: string;
  color: string;
  candidateCount: number;
}

interface QuickTagPopoverProps {
  userId: string;
  assignedTagIds: string[];
  onTagsChanged: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TAG_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#6b7280', // gray
];

const QuickTagPopover: React.FC<QuickTagPopoverProps> = ({
  userId,
  assignedTagIds,
  onTagsChanged,
  open,
  onOpenChange,
}) => {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [showNewTag, setShowNewTag] = useState(false);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/matchmaker/tags');
      const data = await res.json();
      if (data.success) setTags(data.tags);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchTags();
  }, [open, fetchTags]);

  useEffect(() => {
    if (showNewTag) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showNewTag]);

  const handleCreateTag = async () => {
    if (!newTagName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/matchmaker/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim(), color: selectedColor }),
      });
      const data = await res.json();
      if (data.success) {
        setTags((prev) => [...prev, data.tag]);
        setNewTagName('');
        setShowNewTag(false);
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  const handleToggleTag = async (tagId: string) => {
    if (toggling) return;
    setToggling(tagId);
    try {
      await fetch('/api/matchmaker/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', tagId, userId }),
      });
      onTagsChanged();
    } catch {
      // silent
    } finally {
      setToggling(null);
    }
  };

  const tagCount = assignedTagIds.length;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 min-h-[44px] min-w-[44px] lg:min-h-[32px] lg:min-w-[32px] bg-white/95 shadow-xl border-0 hover:bg-white hover:scale-105 transition-all duration-200 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <Tag className="h-3 w-3 text-gray-600" />
                {tagCount > 0 && (
                  <span className="absolute -top-1 -end-1 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {tagCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>תגיות</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        className="w-[260px] p-0"
        align="start"
        side="top"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b">
          <p className="text-sm font-semibold text-gray-700">תגיות</p>
        </div>

        <div className="max-h-[250px] overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : tags.length === 0 && !showNewTag ? (
            <p className="text-xs text-gray-400 text-center py-3">
              אין תגיות עדיין
            </p>
          ) : (
            tags.map((tag) => {
              const isAssigned = assignedTagIds.includes(tag.id);
              const isLoading = toggling === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  disabled={isLoading}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                    isAssigned
                      ? 'bg-gray-100 hover:bg-gray-200'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1 text-start truncate text-gray-700">
                    {tag.name}
                  </span>
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                  ) : isAssigned ? (
                    <Check className="h-3.5 w-3.5 text-indigo-500" />
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        {/* Create new tag */}
        <div className="border-t p-2">
          {showNewTag ? (
            <div className="space-y-2">
              <div className="flex gap-1.5">
                <Input
                  ref={inputRef}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="שם התגית..."
                  className="h-7 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTag();
                    if (e.key === 'Escape') setShowNewTag(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => setShowNewTag(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      'w-5 h-5 rounded-full transition-all',
                      selectedColor === c
                        ? 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                        : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || creating}
              >
                {creating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'צור תגית'
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-gray-500"
              onClick={() => setShowNewTag(true)}
            >
              <Plus className="h-3 w-3 me-1" />
              תגית חדשה
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(QuickTagPopover);
