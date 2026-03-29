// KeyboardShortcutsDialog.tsx — Shows available keyboard shortcuts
'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['←', '→'], description: 'ניווט בין מועמדים' },
  { keys: ['↑', '↓'], description: 'ניווט בין שורות' },
  { keys: ['Enter'], description: 'פתיחת פרופיל מועמד' },
  { keys: ['S'], description: 'יצירת הצעת שידוך' },
  { keys: ['E'], description: 'עריכת פרופיל' },
  { keys: ['Home'], description: 'מעבר למועמד ראשון' },
  { keys: ['End'], description: 'מעבר למועמד אחרון' },
  { keys: ['Esc'], description: 'ביטול בחירה / סגירת חלון' },
  { keys: ['?'], description: 'הצגת קיצורי מקלדת' },
];

interface KeyboardShortcutsDialogProps {
  enabled?: boolean;
}

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ enabled = true }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Keyboard className="w-5 h-5 text-indigo-500" />
            קיצורי מקלדת
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 mt-2">
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="min-w-[28px] h-7 flex items-center justify-center text-xs font-mono font-semibold bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-600 px-1.5"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-3">
          לחצו <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-[10px]">?</kbd> בכל עת לפתיחת חלון זה
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
