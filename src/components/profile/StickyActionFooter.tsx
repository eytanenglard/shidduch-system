'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Pencil, X } from 'lucide-react';

interface StickyActionFooterButtons {
  save?: string;
  saveChanges?: string;
  cancel?: string;
  edit?: string;
  unsavedChanges?: string;
  editHint?: string;
}

interface StickyActionFooterProps {
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  buttons: StickyActionFooterButtons;
  /** Gradient classes for the save button */
  saveClassName?: string;
  /** Border/text classes for the edit button */
  editClassName?: string;
}

const StickyActionFooter: React.FC<StickyActionFooterProps> = ({
  isEditing,
  onSave,
  onCancel,
  onEdit,
  buttons,
  saveClassName = 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white',
  editClassName = 'border-cyan-400 text-cyan-700 hover:bg-cyan-50',
}) => (
  <>
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-20 border-t border-gray-200/80 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.12)]">
      <div className="container mx-auto max-w-screen-xl px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          {isEditing ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-amber-600">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{buttons.unsavedChanges || 'יש שינויים שלא נשמרו'}</span>
              </div>
              <div className="sm:hidden flex-1" />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 border-gray-300 text-gray-700 hover:bg-gray-50 px-5 sm:px-6 py-2"
                >
                  <X className="w-4 h-4 ms-1.5" />
                  {buttons.cancel}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onSave}
                  className={`rounded-full shadow-sm hover:shadow-md transition-all duration-300 px-5 sm:px-6 py-2 ${saveClassName}`}
                >
                  <Save className="w-4 h-4 ms-1.5" />
                  {buttons.saveChanges || buttons.save}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
                <span>{buttons.editHint}</span>
              </div>
              <div className="sm:hidden flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className={`rounded-full shadow-sm hover:shadow-md transition-all duration-300 px-6 py-2 ${editClassName}`}
              >
                <Pencil className="w-4 h-4 ms-1.5" />
                {buttons.edit}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
    <div className="h-16 sm:h-20" />
  </>
);

export default React.memo(StickyActionFooter);
