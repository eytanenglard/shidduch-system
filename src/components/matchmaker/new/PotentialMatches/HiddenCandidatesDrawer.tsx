// src/components/matchmaker/new/PotentialMatches/HiddenCandidatesDrawer.tsx

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  EyeOff,
  Undo2,
  Calendar,
  MapPin,
  User,
  Edit2,
  Check,
  X,
  Loader2,
  Users,
} from 'lucide-react';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import type { HiddenCandidateInfo } from './hooks/useHiddenCandidates';

// =============================================================================
// TYPES
// =============================================================================

interface HiddenCandidatesDrawerProps {
  hiddenCandidates: HiddenCandidateInfo[];
  onUnhide: (hiddenRecordId: string) => Promise<boolean>;
  onBatchUnhide?: (hiddenRecordIds: string[]) => Promise<boolean>;
  onUpdateReason: (hiddenRecordId: string, reason: string) => Promise<boolean>;
  isLoading?: boolean;
  className?: string;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// כרטיס מועמד מוסתר בודד
const HiddenCandidateCard: React.FC<{
  candidate: HiddenCandidateInfo;
  onUnhide: () => void;
  onUpdateReason: (reason: string) => void;
  isUnhiding: boolean;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}> = ({
  candidate,
  onUnhide,
  onUpdateReason,
  isUnhiding,
  isSelectMode,
  isSelected,
  onToggleSelect,
}) => {
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [editedReason, setEditedReason] = useState(candidate.reason || '');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSaveReason = () => {
    onUpdateReason(editedReason);
    setIsEditingReason(false);
  };

  const genderIcon = candidate.candidate.gender === 'MALE' ? '👨' : '👩';
  const borderColor =
    candidate.candidate.gender === 'MALE'
      ? 'border-blue-200 hover:border-blue-300'
      : 'border-pink-200 hover:border-pink-300';

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          'relative p-3 rounded-xl border-2 bg-white/80 backdrop-blur-sm transition-all duration-200',
          borderColor,
          isSelectMode && 'cursor-pointer',
          isSelected && 'border-green-400 bg-green-50/80 ring-2 ring-green-200'
        )}
        onClick={isSelectMode ? onToggleSelect : undefined}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox במצב בחירה */}
          {isSelectMode && (
            <div className="flex items-center justify-center flex-shrink-0 pt-1">
              <div
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                  isSelected
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 bg-white'
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          )}

          {/* תמונה */}
          <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
            {candidate.candidate.mainImage ? (
              <Image
                src={getRelativeCloudinaryPath(candidate.candidate.mainImage)}
                alt={`${candidate.candidate.firstName} ${candidate.candidate.lastName}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-lg">
                {genderIcon}
              </div>
            )}
          </div>

          {/* פרטים */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-800 truncate">
              {candidate.candidate.firstName} {candidate.candidate.lastName}
            </h4>

            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              {candidate.candidate.city && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {candidate.candidate.city}
                </span>
              )}
            </div>

            {/* סיבת הסתרה */}
            <div className="mt-2">
              {isEditingReason ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editedReason}
                    onChange={(e) => setEditedReason(e.target.value)}
                    placeholder="סיבה להסתרה..."
                    className="h-7 text-xs flex-1"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-600 hover:bg-green-50"
                    onClick={handleSaveReason}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-400 hover:bg-gray-100"
                    onClick={() => {
                      setIsEditingReason(false);
                      setEditedReason(candidate.reason || '');
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {candidate.reason ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      {candidate.reason}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">
                      ללא סיבה
                    </span>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-gray-400 hover:text-gray-600"
                          onClick={() => setIsEditingReason(true)}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>ערוך סיבה</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            {/* תאריך הסתרה */}
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
              <Calendar className="w-3 h-3" />
              הוסתר{' '}
              {formatDistanceToNow(new Date(candidate.hiddenAt), {
                addSuffix: true,
                locale: he,
              })}
            </div>
          </div>

          {/* כפתור החזרה - מוסתר במצב בחירה */}
          {!isSelectMode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full border-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all flex-shrink-0"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isUnhiding}
                  >
                    {isUnhiding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Undo2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>החזר לרשימת ההצעות</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </motion.div>

      {/* דיאלוג אישור */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              להחזיר את {candidate.candidate.firstName} לרשימה?
            </AlertDialogTitle>
            <AlertDialogDescription>
              ההצעות הפוטנציאליות עם {candidate.candidate.firstName}{' '}
              {candidate.candidate.lastName} יחזרו להופיע ברשימה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={onUnhide}
              className="bg-green-600 hover:bg-green-700"
            >
              החזר לרשימה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const HiddenCandidatesDrawer: React.FC<HiddenCandidatesDrawerProps> = ({
  hiddenCandidates,
  onUnhide,
  onBatchUnhide,
  onUpdateReason,
  isLoading = false,
  className,
}) => {
  const [unhidingId, setUnhidingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchUnhiding, setIsBatchUnhiding] = useState(false);
  const [showBatchConfirmDialog, setShowBatchConfirmDialog] = useState(false);

  const handleUnhide = async (hiddenRecordId: string) => {
    setUnhidingId(hiddenRecordId);
    const success = await onUnhide(hiddenRecordId);
    setUnhidingId(null);

    // אם זה היה האחרון, סגור את ה-drawer
    if (success && hiddenCandidates.length === 1) {
      setIsOpen(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === hiddenCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(hiddenCandidates.map((c) => c.id)));
    }
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBatchUnhide = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchUnhiding(true);

    const idsArray = Array.from(selectedIds);
    let success = false;

    if (onBatchUnhide) {
      success = await onBatchUnhide(idsArray);
    } else {
      // Fallback: unhide one by one
      const results = await Promise.all(idsArray.map((id) => onUnhide(id)));
      success = results.every(Boolean);
    }

    setIsBatchUnhiding(false);
    setShowBatchConfirmDialog(false);

    if (success) {
      exitSelectMode();
      // אם כולם הוחזרו, סגור drawer
      if (idsArray.length === hiddenCandidates.length) {
        setIsOpen(false);
      }
    }
  };

  const count = hiddenCandidates.length;
  const selectedCount = selectedIds.size;
  const allSelected = count > 0 && selectedCount === count;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'gap-2 border-2 transition-all',
            count > 0
              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300'
              : 'border-gray-200 text-gray-500',
            className
          )}
        >
          <EyeOff className="w-4 h-4" />
          <span className="hidden sm:inline">מוסתרים</span>
          {count > 0 && (
            <Badge
              variant="secondary"
              className="bg-amber-200 text-amber-800 h-5 min-w-5 text-xs"
            >
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="p-4 pb-2 border-b bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-amber-800">
              <EyeOff className="w-5 h-5" />
              מועמדים מוסתרים
              {count > 0 && (
                <Badge className="bg-amber-600 text-white">{count}</Badge>
              )}
            </SheetTitle>

            {/* כפתור סגירה ידני - X */}
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 text-amber-800 hover:bg-amber-100 rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <SheetDescription className="text-amber-700/70 text-sm">
            מועמדים שהסתרת לא יופיעו בהצעות הפוטנציאליות
          </SheetDescription>

          {/* כפתורי מצב בחירה */}
          {count > 1 && (
            <div className="flex items-center gap-2 pt-1">
              {isSelectMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-amber-700 hover:bg-amber-100"
                    onClick={toggleSelectAll}
                  >
                    {allSelected ? 'בטל הכל' : 'בחר הכל'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-gray-500 hover:bg-gray-100"
                    onClick={exitSelectMode}
                  >
                    ביטול
                  </Button>
                  {selectedCount > 0 && (
                    <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px]">
                      {selectedCount} נבחרו
                    </Badge>
                  )}
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 text-amber-700 hover:bg-amber-100 gap-1"
                  onClick={() => setIsSelectMode(true)}
                >
                  <Check className="w-3.5 h-3.5" />
                  בחירה מרובה
                </Button>
              )}
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">טוען...</p>
            </div>
          ) : count === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Users className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm font-medium">אין מועמדים מוסתרים</p>
              <p className="text-xs mt-1 text-center px-4">
                לחץ על כפתור ההסתרה ליד שם המועמד בכרטיס ההצעה כדי להסתיר אותו
                זמנית
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {hiddenCandidates.map((candidate) => (
                  <HiddenCandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onUnhide={() => handleUnhide(candidate.id)}
                    onUpdateReason={(reason) =>
                      onUpdateReason(candidate.id, reason)
                    }
                    isUnhiding={unhidingId === candidate.id}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.has(candidate.id)}
                    onToggleSelect={() => toggleSelect(candidate.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 flex flex-col gap-3">
          {isSelectMode && selectedCount > 0 ? (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              onClick={() => setShowBatchConfirmDialog(true)}
              disabled={isBatchUnhiding}
            >
              {isBatchUnhiding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  מחזיר...
                </>
              ) : (
                <>
                  <Undo2 className="w-4 h-4" />
                  החזר {selectedCount} מועמדים לרשימה
                </>
              )}
            </Button>
          ) : (
            <>
              {count > 0 && !isSelectMode && (
                <p className="text-[10px] text-gray-500 text-center">
                  💡 לחץ על כפתור ההחזרה כדי להציג שוב את ההצעות עם המועמד
                </p>
              )}
              <Button
                variant="outline"
                className="w-full border-gray-300"
                onClick={() => setIsOpen(false)}
              >
                סגור
              </Button>
            </>
          )}
        </div>

        {/* דיאלוג אישור החזרה קבוצתית */}
        <AlertDialog
          open={showBatchConfirmDialog}
          onOpenChange={setShowBatchConfirmDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                להחזיר {selectedCount} מועמדים לרשימה?
              </AlertDialogTitle>
              <AlertDialogDescription>
                ההצעות הפוטנציאליות עם {selectedCount} המועמדים שנבחרו יחזרו
                להופיע ברשימה.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBatchUnhiding}>
                ביטול
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchUnhide}
                className="bg-green-600 hover:bg-green-700"
                disabled={isBatchUnhiding}
              >
                {isBatchUnhiding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    מחזיר...
                  </>
                ) : (
                  'החזר לרשימה'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};

export default HiddenCandidatesDrawer;
