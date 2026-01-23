// src/components/matchmaker/new/PotentialMatches/HideCandidateDialog.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { EyeOff, Loader2 } from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface CandidateToHide {
  id: string;
  firstName: string;
  lastName: string;
  mainImage?: string | null;
  gender?: 'MALE' | 'FEMALE' | null;
}

interface HideCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateToHide | null;
  onConfirm: (candidateId: string, reason?: string) => Promise<boolean>;
}

// =============================================================================
// PRESET REASONS
// =============================================================================

const PRESET_REASONS = [
  { value: 'dating', label: '💑 בדייטים כרגע' },
  { value: 'waiting', label: '⏳ ממתין לתשובה' },
  { value: 'break', label: '☕ בהפסקה מחיפושים' },
  { value: 'not_ready', label: '🚫 לא מוכן להצעות' },
  { value: 'custom', label: '✏️ סיבה אחרת...' },
  { value: 'none', label: '➖ ללא סיבה' },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const HideCandidateDialog: React.FC<HideCandidateDialogProps> = ({
  open,
  onOpenChange,
  candidate,
  onConfirm,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('none');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!candidate) return;

    setIsSubmitting(true);

    // קביעת הסיבה הסופית
    let finalReason: string | undefined;
    if (selectedReason === 'custom' && customReason.trim()) {
      finalReason = customReason.trim();
    } else if (selectedReason !== 'none' && selectedReason !== 'custom') {
      finalReason = PRESET_REASONS.find(r => r.value === selectedReason)?.label.replace(/^[^\s]+ /, '');
    }

    const success = await onConfirm(candidate.id, finalReason);
    
    setIsSubmitting(false);

    if (success) {
      // Reset state
      setSelectedReason('none');
      setCustomReason('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('none');
      setCustomReason('');
      onOpenChange(false);
    }
  };

  if (!candidate) return null;

  const genderIcon = candidate.gender === 'MALE' ? '👨' : '👩';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-amber-600" />
            הסתרת מועמד/ת
          </DialogTitle>
          <DialogDescription>
            כל ההצעות הפוטנציאליות עם מועמד/ת זה/זו לא יופיעו ברשימה
          </DialogDescription>
        </DialogHeader>

        {/* פרטי המועמד */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
            {candidate.mainImage ? (
              <Image
                src={getRelativeCloudinaryPath(candidate.mainImage)}
                alt={`${candidate.firstName} ${candidate.lastName}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-lg">
                {genderIcon}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-800">
              {candidate.firstName} {candidate.lastName}
            </p>
            <p className="text-xs text-gray-500">
              יוסתר/תוסתר מכל ההצעות הפוטנציאליות
            </p>
          </div>
        </div>

        {/* בחירת סיבה */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">סיבה להסתרה (אופציונלי)</Label>
          
          <RadioGroup
            value={selectedReason}
            onValueChange={setSelectedReason}
            className="grid grid-cols-2 gap-2"
          >
            {PRESET_REASONS.map((reason) => (
              <div key={reason.value}>
                <RadioGroupItem
                  value={reason.value}
                  id={reason.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={reason.value}
                  className={cn(
                    'flex items-center justify-center rounded-lg border-2 p-2.5 text-xs cursor-pointer transition-all',
                    'hover:bg-amber-50 hover:border-amber-200',
                    'peer-data-[state=checked]:bg-amber-100 peer-data-[state=checked]:border-amber-400 peer-data-[state=checked]:text-amber-800'
                  )}
                >
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* שדה סיבה מותאמת אישית */}
          {selectedReason === 'custom' && (
            <Input
              placeholder="הקלד סיבה..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="mt-2"
              autoFocus
            />
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            ביטול
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מסתיר...
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                הסתר
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HideCandidateDialog;