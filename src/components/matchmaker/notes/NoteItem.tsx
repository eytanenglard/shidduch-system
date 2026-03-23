// src/components/matchmaker/notes/NoteItem.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Pin, Pencil, Trash2, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

interface NoteData {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NoteItemProps {
  note: NoteData;
  onUpdate: (id: string, data: { content?: string; isPinned?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePin: (id: string, isPinned: boolean) => Promise<void>;
  isHe: boolean;
}

export default function NoteItem({
  note,
  onUpdate,
  onDelete,
  onTogglePin,
  isHe,
}: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const locale = isHe ? he : enUS;
  const createdDate = new Date(note.createdAt);
  const updatedDate = new Date(note.updatedAt);
  const wasEdited = updatedDate.getTime() - createdDate.getTime() > 1000;

  const handleSave = async () => {
    if (!editContent.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(note.id, { content: editContent.trim() });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(note.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-3 transition-colors',
        note.isPinned
          ? 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
          : 'border-border bg-card hover:bg-muted/30'
      )}
    >
      {/* Header: timestamp + actions */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {note.isPinned && (
            <Pin className="h-3 w-3 fill-amber-500 text-amber-500" />
          )}
          <span>{format(createdDate, 'dd/MM/yy HH:mm', { locale })}</span>
          {wasEdited && (
            <span className="text-muted-foreground/60">
              ({isHe ? 'נערך' : 'edited'})
            </span>
          )}
        </div>

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-6 w-6',
              note.isPinned && 'text-amber-500 opacity-100'
            )}
            onClick={() => onTogglePin(note.id, !note.isPinned)}
            title={isHe ? (note.isPinned ? 'בטל הצמדה' : 'הצמד') : (note.isPinned ? 'Unpin' : 'Pin')}
          >
            <Pin className={cn('h-3.5 w-3.5', note.isPinned && 'fill-current')} />
          </Button>
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsEditing(true)}
              title={isHe ? 'ערוך' : 'Edit'}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            title={isHe ? 'מחק' : 'Delete'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
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
              onClick={handleCancel}
            >
              <X className="mr-1 h-3 w-3" />
              {isHe ? 'ביטול' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleSave}
              disabled={isSaving || !editContent.trim()}
            >
              <Save className="mr-1 h-3 w-3" />
              {isHe ? 'שמור' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <p
          className="whitespace-pre-wrap text-sm leading-relaxed"
          dir={isHe ? 'rtl' : 'ltr'}
        >
          {note.content}
        </p>
      )}
    </div>
  );
}
