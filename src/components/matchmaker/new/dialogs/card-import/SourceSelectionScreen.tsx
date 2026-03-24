'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2,
  Check,
  Users,
  CalendarHeart,
  MessageSquareText,
  Plus,
  ArrowRight,
  X,
} from 'lucide-react';
import { SourceOption } from './types';

export const BUILTIN_SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'shvivel',
    label: 'קבוצת שידוכים שוובל',
    icon: <Users className="w-6 h-6" />,
    description: 'מועמדים מקבוצת השידוכים',
    referredByValue: 'קבוצת שידוכים שוובל',
  },
  {
    id: 'event3',
    label: 'ערב שידוכים 3',
    icon: <CalendarHeart className="w-6 h-6" />,
    description: 'מועמדים מערב שידוכים 3',
    referredByValue: 'ערב שידוכים 3',
  },
];

interface SourceSelectionScreenProps {
  onSelectSource: (source: SourceOption, customValue?: string) => void;
}

export const SourceSelectionScreen: React.FC<SourceSelectionScreenProps> = ({
  onSelectSource,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customSource, setCustomSource] = useState('');
  const [savedSources, setSavedSources] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);

  // Fetch custom sources from DB on mount
  useEffect(() => {
    fetch('/api/matchmaker/sources')
      .then((res) => res.json())
      .then((data) => {
        if (data.sources) setSavedSources(data.sources);
      })
      .catch(() => {})
      .finally(() => setIsLoadingSources(false));
  }, []);

  // Build full options list: builtin + saved custom sources + "add new" option
  const allOptions: SourceOption[] = useMemo(() => {
    const customOptions: SourceOption[] = savedSources
      .filter((s) => !BUILTIN_SOURCE_OPTIONS.some((b) => b.referredByValue === s.name))
      .map((s) => ({
        id: `custom_${s.id}`,
        label: s.name,
        icon: <MessageSquareText className="w-6 h-6" />,
        description: 'מקור מותאם אישית',
        referredByValue: s.name,
      }));
    return [
      ...BUILTIN_SOURCE_OPTIONS,
      ...customOptions,
      {
        id: 'custom_new',
        label: 'מקור חדש',
        icon: <Plus className="w-6 h-6" />,
        description: 'הזן מקור מותאם אישית חדש',
        referredByValue: '',
      },
    ];
  }, [savedSources]);

  const handleDeleteSource = async (dbId: string, sourceName: string) => {
    try {
      const res = await fetch(`/api/matchmaker/sources/${dbId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setSavedSources((prev) => prev.filter((s) => s.id !== dbId));
      toast.success(`מקור "${sourceName}" נמחק`);
      if (selectedId === `custom_${dbId}`) setSelectedId(null);
    } catch {
      toast.error('שגיאה במחיקת המקור');
    }
  };

  const handleContinue = async () => {
    const source = allOptions.find((s) => s.id === selectedId);
    if (!source) return;

    if (source.id === 'custom_new') {
      const trimmed = customSource.trim();
      if (!trimmed) {
        toast.error('נא להזין שם מקור');
        return;
      }
      // Save new custom source to DB
      try {
        await fetch('/api/matchmaker/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
      } catch {
        // Non-critical — source still works even if DB save fails
      }
      onSelectSource(
        { ...source, referredByValue: trimmed, label: trimmed },
        trimmed
      );
    } else {
      onSelectSource(source);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[40vh] px-4 sm:px-8 py-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
          <Users className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          מאיפה הגיעו המועמדים?
        </h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          בחר את מקור ההפניה — הוא יוזן אוטומטית לכל המועמדים שתוסיף
        </p>
      </div>

      {isLoadingSources ? (
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg sm:max-w-2xl">
          {allOptions.map((source) => {
            const isSelected = selectedId === source.id;
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => setSelectedId(source.id)}
                className={`
                  relative flex flex-row sm:flex-col items-center gap-3 sm:gap-2 p-4 sm:p-5
                  rounded-xl border-2 transition-all duration-200 text-right sm:text-center
                  ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50 shadow-md shadow-teal-100'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                {source.id.startsWith('custom_') && source.id !== 'custom_new' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const dbId = source.id.replace('custom_', '');
                      handleDeleteSource(dbId, source.label);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-600 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    isSelected
                      ? 'bg-teal-100 text-teal-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {source.icon}
                </div>
                <div className="min-w-0">
                  <div
                    className={`font-semibold text-sm ${isSelected ? 'text-teal-700' : 'text-gray-700'}`}
                  >
                    {source.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {source.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Custom source input */}
      {selectedId === 'custom_new' && (
        <div className="mt-4 w-full max-w-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <Input
            value={customSource}
            onChange={(e) => setCustomSource(e.target.value)}
            placeholder="הזן שם מקור (למשל: פנייה ישירה, אתר, חבר...)"
            dir="rtl"
            className="h-11 text-sm"
            autoFocus
          />
        </div>
      )}

      <Button
        onClick={handleContinue}
        disabled={!selectedId}
        className="mt-8 h-12 px-8 text-base bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-200 disabled:opacity-40 disabled:shadow-none"
      >
        המשך לייבוא
        <ArrowRight className="w-5 h-5 mr-2 rtl:rotate-180" />
      </Button>
    </div>
  );
};
