// src/components/matchmaker/notes/NotePanel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, StickyNote, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import NoteItem from './NoteItem';

interface NoteData {
  id: string;
  content: string;
  isPinned: boolean;
  suggestionId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotePanelProps {
  userId: string;
  suggestionId?: string;
  isHe: boolean;
}

export default function NotePanel({
  userId,
  suggestionId,
  isHe,
}: NotePanelProps) {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (suggestionId) {
        params.set('suggestionId', suggestionId);
      } else {
        params.set('userId', userId);
      }

      const res = await fetch(`/api/matchmaker/notes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {
      toast.error(isHe ? 'שגיאה בטעינת הערות' : 'Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }, [userId, suggestionId, isHe]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Create note
  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/matchmaker/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent.trim(),
          userId,
          suggestionId: suggestionId || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      const data = await res.json();
      setNotes((prev) => [data.note, ...prev]);
      setNewContent('');
      setIsAdding(false);
      toast.success(isHe ? 'הערה נוספה' : 'Note added');
    } catch {
      toast.error(isHe ? 'שגיאה ביצירת הערה' : 'Failed to create note');
    } finally {
      setIsSaving(false);
    }
  };

  // Update note
  const handleUpdate = async (
    id: string,
    data: { content?: string; isPinned?: boolean }
  ) => {
    try {
      const res = await fetch('/api/matchmaker/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const result = await res.json();

      setNotes((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, ...result.note } : n
        );
        // Re-sort: pinned first, then by createdAt desc
        return updated.sort((a, b) => {
          if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });

      toast.success(isHe ? 'הערה עודכנה' : 'Note updated');
    } catch {
      toast.error(isHe ? 'שגיאה בעדכון הערה' : 'Failed to update note');
    }
  };

  // Delete note
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/matchmaker/notes?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success(isHe ? 'הערה נמחקה' : 'Note deleted');
    } catch {
      toast.error(isHe ? 'שגיאה במחיקת הערה' : 'Failed to delete note');
    }
  };

  // Toggle pin
  const handleTogglePin = async (id: string, isPinned: boolean) => {
    await handleUpdate(id, { isPinned });
  };

  const pinnedCount = notes.filter((n) => n.isPinned).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            {isHe ? 'הערות פנימיות' : 'Internal Notes'}
          </h3>
          {notes.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {notes.length}
            </Badge>
          )}
          {pinnedCount > 0 && (
            <Badge
              variant="outline"
              className="h-5 border-amber-300 bg-amber-50 px-1.5 text-xs text-amber-700"
            >
              {pinnedCount} {isHe ? 'מוצמדות' : 'pinned'}
            </Badge>
          )}
        </div>
        {!isAdding && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className={cn('mr-1', !isHe && 'ml-1 mr-0')}>
              {isHe ? 'חדש' : 'New'}
            </span>
          </Button>
        )}
      </div>

      {/* Quick add form */}
      {isAdding && (
        <div className="border-b p-3 space-y-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder={isHe ? 'הקלד הערה...' : 'Type a note...'}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            rows={3}
            dir={isHe ? 'rtl' : 'ltr'}
            autoFocus
          />
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setIsAdding(false);
                setNewContent('');
              }}
            >
              {isHe ? 'ביטול' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleCreate}
              disabled={isSaving || !newContent.trim()}
            >
              {isSaving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {isHe ? 'שמור' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Notes list */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <StickyNote className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {isHe ? 'אין הערות עדיין' : 'No notes yet'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {isHe
                  ? 'לחצ/י על "חדש" כדי להוסיף הערה'
                  : 'Click "New" to add a note'}
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                isHe={isHe}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
