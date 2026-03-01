// src/components/suggestions/interested/InterestedQueue.tsx
// V3: Merged version with drag-and-drop, improved UX, and mobile-aligned flow

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';
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
  onActivate,
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
        'group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
        isFirst
          ? 'bg-gradient-to-r from-amber-50 via-white to-orange-50 border border-amber-200/50 shadow-sm'
          : 'bg-white border border-gray-100',
        isDragging &&
          'bg-amber-100 shadow-xl ring-2 ring-amber-400/50 scale-[1.02]',
        !isDragging &&
          'hover:bg-amber-50/30 hover:border-amber-200/50 hover:shadow-sm'
      )}
    >
      {/* Drag Handle */}
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-amber-100 transition-colors touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical
                className={cn(
                  'w-4 h-4 transition-colors',
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
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Crown className="w-4 h-4 text-white" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-gray-600 text-xs font-bold">{index + 1}</span>
        </div>
      )}

      {/* Avatar */}
      <button
        onClick={() => onViewDetails(suggestion)}
        className="flex-shrink-0"
      >
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm hover:shadow-md transition-shadow">
          {mainImage ? (
            <Image
              src={getRelativeCloudinaryPath(mainImage.url)}
              alt={targetParty.firstName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>
      </button>

      {/* Info Section */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(suggestion)}
            className="font-semibold text-gray-900 text-sm hover:text-amber-700 transition-colors truncate"
          >
            {targetParty.firstName}
          </button>
          {age && (
            <span className="text-xs text-gray-500 flex-shrink-0">({age})</span>
          )}
          {isFirst && !isUserInActiveProcess && (
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white border-0 text-[10px] px-1.5 py-0 flex-shrink-0">
              <ArrowUpCircle className="w-3 h-3 mr-0.5" />
              {texts.nextInLine}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          {targetParty.profile.city && (
            <span className="truncate">{targetParty.profile.city}</span>
          )}
          {targetParty.profile.city && targetParty.profile.occupation && (
            <span>•</span>
          )}
          {targetParty.profile.occupation && (
            <span className="truncate">{targetParty.profile.occupation}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* View Profile */}
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-amber-100 text-gray-400 hover:text-gray-600"
                onClick={() => onViewDetails(suggestion)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{texts.viewProfile}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Remove */}
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-rose-100 text-gray-400 hover:text-rose-500"
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
      } catch (error) {
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
      ? firstSuggestion.secondParty?.firstName
      : firstSuggestion.firstParty?.firstName;

  return (
    <Card
      className={cn(
        'border-0 shadow-lg bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <CardHeader className="pb-3 border-b border-amber-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 flex items-center justify-center shadow-md">
            <Bookmark className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
              {texts.title}
            </CardTitle>
            <p className="text-sm text-amber-600/80">{texts.subtitle}</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold">
            {suggestions.length}
          </Badge>
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

        {/* CTA: Activate next suggestion */}
        {!isUserInActiveProcess && items.length > 0 && (
          <div className="mt-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/50 rounded-xl">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="text-sm text-teal-800 font-medium flex-1">
                {locale === 'he'
                  ? `מוכן/ה לאשר את ${firstPartyName}?`
                  : `Ready to approve ${firstPartyName}?`}
              </span>
              <Button
                size="sm"
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-lg text-xs px-3 h-8 shadow-md hover:shadow-lg transition-all"
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
          <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200/50 rounded-xl">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-600 leading-relaxed">
              {texts.activeProcessInfo}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InterestedQueue;
