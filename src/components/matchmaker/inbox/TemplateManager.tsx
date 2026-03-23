// src/components/matchmaker/inbox/TemplateManager.tsx
//
// Dialog for managing quick reply templates (CRUD).

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Save, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string | null;
  sortOrder: number;
  isActive: boolean;
  matchmakerId: string | null;
}

interface TemplateManagerProps {
  open: boolean;
  onClose: () => void;
  isHe: boolean;
}

const CATEGORIES = [
  { value: 'greeting', labelHe: 'פתיחה', labelEn: 'Greeting' },
  { value: 'followup', labelHe: 'מעקב', labelEn: 'Follow-up' },
  { value: 'scheduling', labelHe: 'תיאום', labelEn: 'Scheduling' },
  { value: 'feedback', labelHe: 'משוב', labelEn: 'Feedback' },
  { value: 'general', labelHe: 'כללי', labelEn: 'General' },
];

export default function TemplateManager({
  open,
  onClose,
  isHe,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState('general');

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/matchmaker/templates');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadTemplates();
  }, [open, loadTemplates]);

  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('general');
    setEditingId(null);
    setIsCreating(false);
  };

  const startEdit = (t: Template) => {
    setFormTitle(t.title);
    setFormContent(t.content);
    setFormCategory(t.category || 'general');
    setEditingId(t.id);
    setIsCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      toast.error(isHe ? 'נא למלא כותרת ותוכן' : 'Title and content required');
      return;
    }

    try {
      if (editingId) {
        // Update
        const res = await fetch('/api/matchmaker/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success(isHe ? 'התבנית עודכנה' : 'Template updated');
      } else {
        // Create
        const res = await fetch('/api/matchmaker/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            content: formContent.trim(),
            category: formCategory,
          }),
        });
        if (!res.ok) throw new Error();
        toast.success(isHe ? 'התבנית נוצרה' : 'Template created');
      }
      resetForm();
      loadTemplates();
    } catch {
      toast.error(isHe ? 'שגיאה בשמירה' : 'Save error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/matchmaker/templates?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success(isHe ? 'התבנית נמחקה' : 'Template deleted');
      if (editingId === id) resetForm();
      loadTemplates();
    } catch {
      toast.error(isHe ? 'שגיאה במחיקה' : 'Delete error');
    }
  };

  const isEditing = editingId !== null || isCreating;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col" dir={isHe ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            {isHe ? 'ניהול תגובות מהירות' : 'Manage Quick Replies'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Form (create/edit) */}
          {isEditing && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {editingId
                    ? isHe ? 'עריכת תבנית' : 'Edit Template'
                    : isHe ? 'תבנית חדשה' : 'New Template'}
                </span>
                <button onClick={resetForm} className="p-1 hover:bg-gray-200 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={isHe ? 'שם התבנית...' : 'Template name...'}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                dir={isHe ? 'rtl' : 'ltr'}
              />

              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={isHe ? 'תוכן ההודעה...' : 'Message content...'}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                dir={isHe ? 'rtl' : 'ltr'}
              />

              <div className="flex items-center gap-2">
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-300"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {isHe ? c.labelHe : c.labelEn}
                    </option>
                  ))}
                </select>

                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!formTitle.trim() || !formContent.trim()}
                  className="bg-teal-600 hover:bg-teal-700 text-white gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isHe ? 'שמור' : 'Save'}
                </Button>
              </div>
            </div>
          )}

          {/* Template list */}
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={startCreate}
              className="w-full gap-1 border-dashed"
            >
              <Plus className="w-4 h-4" />
              {isHe ? 'תבנית חדשה' : 'New Template'}
            </Button>
          )}

          <ScrollArea className="flex-1 -mx-1 px-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {isHe ? 'אין תבניות עדיין' : 'No templates yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                      editingId === t.id
                        ? 'border-teal-300 bg-teal-50/50'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {t.title}
                        </span>
                        {t.category && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {isHe
                              ? CATEGORIES.find((c) => c.value === t.category)?.labelHe || t.category
                              : CATEGORIES.find((c) => c.value === t.category)?.labelEn || t.category}
                          </Badge>
                        )}
                        {!t.matchmakerId && (
                          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border-0">
                            {isHe ? 'מערכת' : 'System'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {t.content}
                      </p>
                    </div>

                    {t.matchmakerId && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEdit(t)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
