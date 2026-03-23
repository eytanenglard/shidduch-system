// src/components/matchmaker/inbox/QuickReplyPicker.tsx
//
// Popover with searchable list of quick reply templates.
// Click a template to insert its content into the chat input.

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Search, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string | null;
  matchmakerId: string | null;
}

interface QuickReplyPickerProps {
  onSelect: (content: string) => void;
  onManageClick?: () => void;
  isHe: boolean;
}

const CATEGORY_LABELS: Record<string, { he: string; en: string }> = {
  greeting: { he: 'פתיחה', en: 'Greeting' },
  followup: { he: 'מעקב', en: 'Follow-up' },
  scheduling: { he: 'תיאום', en: 'Scheduling' },
  feedback: { he: 'משוב', en: 'Feedback' },
  general: { he: 'כללי', en: 'General' },
};

export default function QuickReplyPicker({
  onSelect,
  onManageClick,
  isHe,
}: QuickReplyPickerProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Template[]>>({});
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/matchmaker/templates');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
        setGrouped(data.grouped || {});
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadTemplates();
  }, [open, loadTemplates]);

  const filteredGrouped = React.useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const result: Record<string, Template[]> = {};
    for (const [cat, items] of Object.entries(grouped)) {
      const filtered = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q)
      );
      if (filtered.length > 0) result[cat] = filtered;
    }
    return result;
  }, [grouped, search]);

  const handleSelect = (content: string) => {
    onSelect(content);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-xl hover:bg-amber-50 text-amber-600 hover:text-amber-700"
          title={isHe ? 'תגובות מהירות' : 'Quick Replies'}
        >
          <Zap className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={isHe ? 'end' : 'start'}
        className="w-80 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-3 pt-3 pb-2 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800">
              {isHe ? 'תגובות מהירות' : 'Quick Replies'}
            </h4>
            {onManageClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setOpen(false); onManageClick(); }}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <Settings className="w-3 h-3 mr-1" />
                {isHe ? 'נהל' : 'Manage'}
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className={cn(
              'absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400',
              isHe ? 'right-2.5' : 'left-2.5'
            )} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isHe ? 'חיפוש...' : 'Search...'}
              className={cn(
                'w-full py-1.5 rounded-md border border-gray-200 text-xs',
                'focus:outline-none focus:ring-1 focus:ring-teal-300',
                isHe ? 'pr-8 pl-2' : 'pl-8 pr-2'
              )}
              dir={isHe ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        {/* Template list */}
        <ScrollArea className="max-h-64">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : Object.keys(filteredGrouped).length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-gray-500">
                {templates.length === 0
                  ? isHe ? 'אין תבניות עדיין' : 'No templates yet'
                  : isHe ? 'לא נמצאו תוצאות' : 'No results found'}
              </p>
              {templates.length === 0 && onManageClick && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setOpen(false); onManageClick(); }}
                  className="mt-2 text-xs h-7"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {isHe ? 'צור תבנית' : 'Create Template'}
                </Button>
              )}
            </div>
          ) : (
            <div className="py-1">
              {Object.entries(filteredGrouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-3 py-1.5 bg-gray-50">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {CATEGORY_LABELS[category]
                        ? isHe ? CATEGORY_LABELS[category].he : CATEGORY_LABELS[category].en
                        : category}
                    </span>
                  </div>
                  {items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelect(t.content)}
                      className="w-full text-right px-3 py-2 hover:bg-teal-50 transition-colors border-b border-gray-50 last:border-0"
                    >
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {t.title}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {t.content}
                      </p>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
