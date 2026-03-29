// src/components/suggestions/interested/InterestedQueue.tsx
// V4: Enhanced design with gradient header, glow effects, and polished interactions

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Bookmark,
  Heart,
  Trash2,
  GripVertical,
  User,
  ArrowUpCircle,
  Eye,
  Info,
  Crown,
  Scale,
} from 'lucide-react';
import CompareDialog from './CompareDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// =============================================================================
// TEXTS
// =============================================================================
const TEXTS = {
  he: {
    title: 'רשימת ההמתנה שלי',
    subtitle: 'גרור/י לשינוי סדר עדיפויות',
    empty: 'אין הצעות בהמתנה. סמן/י הצעות כ"שומר/ת לגיבוי" והן יופיעו כאן.',
    nextInLine: 'הבאה בתור',
    rank: 'מקום',
    activateNow: 'אשר/י עכשיו',
    remove: 'הסר/י מהרשימה',
    removeConfirm: 'ההצעה הוסרה מרשימת ההמתנה',
    viewProfile: 'צפה בפרופיל',
    rankUpdated: 'סדר העדיפויות עודכן',
    rankError: 'שגיאה בעדכון הסדר',
    activateSuccess: 'ההצעה אושרה! תועבר לטיפול השדכן.',
    activeProcessInfo: 'יש לך הצעה פעילה. כשתסתיים, תוכל/י לאשר מהרשימה.',
    dragToReorder: 'גרור/י כדי לשנות סדר',
    compare: 'השוואה',
  },
  en: {
    title: 'My Waitlist',
    subtitle: 'Drag to reorder priorities',
    empty:
      'No suggestions on waitlist. Mark suggestions as "Save for later" and they\'ll appear here.',
    nextInLine: 'Next in line',
    rank: 'Rank',
    activateNow: 'Approve now',
    remove: 'Remove from list',
    removeConfirm: 'Suggestion removed from waitlist',
    viewProfile: 'View profile',
    rankUpdated: 'Priority order updated',
    rankError: 'Error updating order',
    activateSuccess:
      'Suggestion approved! Will be forwarded to the matchmaker.',
    activeProcessInfo:
      'You have an active suggestion. Once it ends, you can approve from the waitlist.',
    dragToReorder: 'Drag to reorder',
    compare: 'Compare',
  },
};

// =============================================================================
// HELPER: Calculate Age
// =============================================================================
const calculateAge = (birthDate?: Date | string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
};

// =============================================================================
// SORTABLE ITEM COMPONENT
// =============================================================================
interface SortableItemProps {
  suggestion: ExtendedMatchSuggestion;
  index: number;
  userId: string;
  locale: 'he' | 'en';
  isUserInActiveProcess: boolean;
  onActivate: (suggestion: ExtendedMatchSuggestion) => void;
  onRemove: (suggestion: ExtendedMatchSuggestion) => void;
  onViewDetails: (suggestion: ExtendedMatchSuggestion) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  suggestion,
  index,
  userId,
  locale,
  isUserInActiveProcess,
  onActivate: _onActivate,
  onRemove,
  onViewDetails,
}) => {
  const texts = TEXTS[locale];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: suggestion.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const targetParty =
    suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty;

  const mainImage = targetParty?.images?.find((img) => img.isMain);
  const age = calculateAge(targetParty?.profile?.birthDate);
  const isFirst = index === 0;

  if (!targetParty || !targetParty.profile) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex items-center gap-2.5 px-3 py-3 rounded-xl transition-all duration-200',
        isFirst
          ? 'bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60 shadow-md shadow-amber-200/30'
          : 'bg-white border border-gray-100 hover:bg-amber-50/20 hover:border-amber-200/30 hover:shadow-sm',
        isDragging &&
          'bg-amber-100 shadow-lg ring-2 ring-amber-400/50 scale-[1.02]',
      )}
    >
      {/* Drag Handle */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-amber-100/80 transition-colors touch-none flex-shrink-0"
              {...attributes}
              {...listeners}
            >
              <GripVertical
                className={cn(
                  'w-3.5 h-3.5 transition-colors',
                  isDragging
                    ? 'text-amber-600'
                    : 'text-gray-300 group-hover:text-amber-400'
                )}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{texts.dragToReorder}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Rank Badge */}
      {isFirst ? (
        <div className="relative w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md shadow-amber-400/30 flex-shrink-0">
          <Crown className="w-3.5 h-3.5 text-white" />
          {/* Pulse glow on crown */}
          <span className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200/50">
          <span className="text-gray-600 text-[10px] font-bold">{index + 1}</span>
        </div>
      )}

      {/* Avatar */}
      <button
        onClick={() => onViewDetails(suggestion)}
        className="flex-shrink-0"
      >
        <div className={cn(
          'w-11 h-11 rounded-full overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105',
          isFirst ? 'ring-2 ring-amber-300/50' : 'ring-2 ring-white',
        )}>
          {mainImage ? (
            <Image
              src={getRelativeCloudinaryPath(mainImage.url)}
              alt={targetParty.firstName}
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
          )}
        </div>
      </button>

      {/* Info Section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => onViewDetails(suggestion)}
            className="font-semibold text-gray-900 text-sm hover:text-amber-700 transition-colors leading-tight truncate"
          >
            {targetParty.firstName} {targetParty.lastName?.charAt(0)}.
          </button>
          {age && (
            <span className="text-xs text-gray-500 flex-shrink-0">({age})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 min-w-0">
          {targetParty.profile.city && (
            <span className="truncate max-w-[80px]">{targetParty.profile.city}</span>
          )}
          {targetParty.profile.city && targetParty.profile.occupation && (
            <span className="flex-shrink-0">•</span>
          )}
          {targetParty.profile.occupation && (
            <span className="truncate">{targetParty.profile.occupation}</span>
          )}
        </div>
        {isFirst && !isUserInActiveProcess && (
          <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-[9px] px-1.5 py-0 mt-0.5 inline-flex shadow-sm">
            <ArrowUpCircle className="w-2.5 h-2.5 mr-0.5" />
            {texts.nextInLine}
          </Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-amber-100 text-gray-400 hover:text-amber-700 transition-all"
                onClick={() => onViewDetails(suggestion)}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{texts.viewProfile}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-all"
                onClick={() => {
                  onRemove(suggestion);
                  toast.success(texts.removeConfirm);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{texts.remove}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT: InterestedQueue
// =============================================================================
interface InterestedQueueProps {
  suggestions: ExtendedMatchSuggestion[];
  userId: string;
  locale: 'he' | 'en';
  isUserInActiveProcess: boolean;
  onActivate: (suggestion: ExtendedMatchSuggestion) => void;
  onRemove: (suggestion: ExtendedMatchSuggestion) => void;
  onViewDetails: (suggestion: ExtendedMatchSuggestion) => void;
  onRankUpdate: (rankedIds: string[]) => Promise<void>;
  className?: string;
}

const InterestedQueue: React.FC<InterestedQueueProps> = ({
  suggestions,
  userId,
  locale,
  isUserInActiveProcess,
  onActivate,
  onRemove,
  onViewDetails,
  onRankUpdate,
  className,
}) => {
  const texts = TEXTS[locale];
  const [items, setItems] = useState<ExtendedMatchSuggestion[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  // Sort by rank and sync with prop changes
  useEffect(() => {
    const sorted = [...suggestions].sort(
      (a, b) => (a.firstPartyRank ?? 999) - (b.firstPartyRank ?? 999)
    );
    setItems(sorted);
  }, [suggestions]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || isReordering) return;

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems); // Optimistic update

      setIsReordering(true);
      try {
        await onRankUpdate(newItems.map((s) => s.id));
        toast.success(texts.rankUpdated);
      } catch {
        setItems(items); // Revert on error
        toast.error(texts.rankError);
      } finally {
        setIsReordering(false);
      }
    },
    [items, isReordering, onRankUpdate, texts]
  );

  if (suggestions.length === 0) return null;

  const firstSuggestion = items[0];
  const firstPartyName =
    firstSuggestion?.firstPartyId === userId
      ? firstSuggestion?.secondParty?.firstName
      : firstSuggestion?.firstParty?.firstName;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-0 shadow-sm bg-white rounded-2xl',
          className
        )}
      >
        {/* Header with gradient */}
        <CardHeader className="relative pb-3 overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50/50 to-white" />
          <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full bg-amber-200/20 blur-2xl pointer-events-none" />
          {/* Gradient bottom border */}
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />

          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md shadow-amber-400/25">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-amber-800">
                {texts.title}
              </CardTitle>
              <p className="text-sm text-amber-600/70">{texts.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {suggestions.length >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 rounded-xl transition-all hover:scale-[1.03] active:scale-[0.97]"
                  onClick={() => setShowCompare(true)}
                >
                  <Scale className={cn('w-3 h-3', locale === 'he' ? 'ml-1' : 'mr-1')} />
                  {texts.compare}
                </Button>
              )}
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 font-bold shadow-sm px-2.5">
                {suggestions.length}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-2">
          {/* Draggable List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {items.map((suggestion, index) => (
                  <SortableItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                    userId={userId}
                    locale={locale}
                    isUserInActiveProcess={isUserInActiveProcess}
                    onActivate={onActivate}
                    onRemove={onRemove}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Compare CTA banner — shown when 2+ suggestions */}
          {items.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowCompare(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/50 rounded-xl text-sm font-medium text-violet-700 hover:from-violet-100 hover:to-indigo-100 hover:border-violet-300/60 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group"
            >
              <Scale className="w-3.5 h-3.5 text-violet-500 group-hover:scale-110 transition-transform" />
              {locale === 'he'
                ? `השווה בין ${items.length} ההצעות שלך — מי מתאים/ה יותר?`
                : `Compare your ${items.length} suggestions — who's a better fit?`}
            </button>
          )}

          {/* CTA: Activate next suggestion */}
          {!isUserInActiveProcess && items.length > 0 && (
            <div className="relative mt-3 p-3.5 rounded-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-emerald-50/50" />
              <div className="absolute inset-0 border border-teal-200/40 rounded-xl" />
              <div className="relative flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm shadow-teal-400/20">
                  <ArrowUpCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-teal-800 font-medium flex-1">
                  {locale === 'he'
                    ? `מוכן/ה לאשר את ${firstPartyName}?`
                    : `Ready to approve ${firstPartyName}?`}
                </span>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl text-xs px-4 h-9 shadow-md shadow-teal-500/25 hover:shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                  onClick={() => {
                    onActivate(firstSuggestion);
                    toast.success(texts.activateSuccess);
                  }}
                >
                  <Heart
                    className={cn(
                      'w-3.5 h-3.5',
                      locale === 'he' ? 'ml-1.5' : 'mr-1.5'
                    )}
                  />
                  {texts.activateNow}
                </Button>
              </div>
            </div>
          )}

          {/* Info: Active process blocking */}
          {isUserInActiveProcess && items.length > 0 && (
            <div className="flex items-center gap-2.5 p-3 bg-gray-50/80 border border-gray-100 rounded-xl">
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                {texts.activeProcessInfo}
              </p>
            </div>
          )}
        </CardContent>

        {/* Compare Dialog */}
        <CompareDialog
          open={showCompare}
          onOpenChange={setShowCompare}
          suggestions={items}
          userId={userId}
          locale={locale}
          onActivate={(suggestion) => {
            setShowCompare(false);
            onActivate(suggestion);
          }}
        />
      </Card>
    </motion.div>
  );
};

export default InterestedQueue;
