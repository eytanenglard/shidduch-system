// src/components/suggestions/cards/CardActions.tsx

import React, { useState } from 'react';
import {
  XCircle,
  Heart,
  MessageCircle,
  Eye,
  Bookmark,
  Info,
  Trash2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { ExtendedMatchSuggestion } from '../../../types/suggestions';
import type { SuggestionsCardDict } from '@/types/dictionary';

interface CardActionsProps {
  suggestion: ExtendedMatchSuggestion;
  isFirstParty: boolean;
  isUserInActiveProcess: boolean;
  onApprove?: (suggestion: ExtendedMatchSuggestion) => void;
  onInterested?: (suggestion: ExtendedMatchSuggestion) => void;
  onInquiry?: (suggestion: ExtendedMatchSuggestion) => void;
  onDecline?: (suggestion: ExtendedMatchSuggestion) => void;
  onClick: (suggestion: ExtendedMatchSuggestion) => void;
  dict: SuggestionsCardDict;
  locale: 'he' | 'en';
}

const CardActions: React.FC<CardActionsProps> = ({
  suggestion,
  isFirstParty,
  isUserInActiveProcess,
  onApprove,
  onInterested,
  onInquiry,
  onDecline,
  onClick,
  dict,
  locale,
}) => {
  const isRtl = locale === 'he';
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  const handleDeclineClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeclineConfirm(true);
  };

  const confirmDecline = () => {
    onDecline?.(suggestion);
    setShowDeclineConfirm(false);
  };

  const declineDialog = (
    <AlertDialog open={showDeclineConfirm} onOpenChange={setShowDeclineConfirm}>
      <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRtl ? 'דחיית הצעה' : 'Decline Suggestion'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRtl
              ? 'האם את/ה בטוח/ה שברצונך לדחות את ההצעה? לא ניתן לבטל פעולה זו.'
              : 'Are you sure you want to decline this suggestion? This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{isRtl ? 'ביטול' : 'Cancel'}</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDecline}
            className="bg-rose-500 hover:bg-rose-600 text-white"
          >
            {isRtl ? 'דחה/י' : 'Decline'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // CASE: First party PENDING
  if (suggestion.status === 'PENDING_FIRST_PARTY' && isFirstParty) {
    if (isUserInActiveProcess) {
      return (
        <>
          <div className="w-full space-y-2">
            <Button
              size="sm"
              variant="default"
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-medium h-10"
              onClick={(e) => {
                e.stopPropagation();
                onInterested?.(suggestion);
              }}
            >
              <Bookmark
                className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
              />
              {dict.buttons.interested ||
                (locale === 'he' ? 'שומר/ת לגיבוי' : 'Save for later')}
            </Button>

            <div className="flex items-start gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                {dict.activeProcessExplanation ||
                  (locale === 'he'
                    ? 'יש לך כבר הצעה בתהליך פעיל. ההצעה הזו תישמר ברשימת ההמתנה שלך ותוכל/י לאשר אותה כשהתהליך הנוכחי יסתיים.'
                    : 'You already have an active suggestion. This one will be saved to your waitlist and you can approve it when the current process ends.')}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200 rounded-xl font-medium transition-all duration-300 h-9"
              onClick={handleDeclineClick}
            >
              <XCircle
                className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
              />
              {dict.buttons.decline}
            </Button>
          </div>
          {declineDialog}
        </>
      );
    }

    return (
      <>
        <div className="w-full space-y-2">
          <Button
            size="sm"
            variant="default"
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-medium h-10"
            onClick={(e) => {
              e.stopPropagation();
              onApprove?.(suggestion);
            }}
          >
            <Heart
              className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
            />
            {dict.buttons.approve}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-teal-700 hover:text-teal-800 hover:bg-teal-50 border-teal-200 hover:border-teal-300 rounded-xl font-medium transition-all duration-300 text-xs h-9"
              onClick={(e) => {
                e.stopPropagation();
                onInterested?.(suggestion);
              }}
            >
              <Bookmark
                className={cn(
                  'w-3.5 h-3.5',
                  locale === 'he' ? 'ml-1.5' : 'mr-1.5'
                )}
              />
              {dict.buttons.interested ||
                (locale === 'he' ? 'שומר/ת לגיבוי' : 'Save for later')}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200 rounded-xl font-medium transition-all duration-300 text-xs h-9"
              onClick={handleDeclineClick}
            >
              <XCircle
                className={cn(
                  'w-3.5 h-3.5',
                  locale === 'he' ? 'ml-1.5' : 'mr-1.5'
                )}
              />
              {dict.buttons.decline}
            </Button>
          </div>
        </div>
        {declineDialog}
      </>
    );
  }

  // CASE: Second party PENDING
  if (suggestion.status === 'PENDING_SECOND_PARTY' && !isFirstParty) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 w-full">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200 rounded-xl font-medium transition-all duration-300"
            onClick={handleDeclineClick}
          >
            <XCircle
              className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
            />
            {dict.buttons.decline}
          </Button>

          <Button
            size="sm"
            variant="default"
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onApprove?.(suggestion);
            }}
          >
            <Heart
              className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
            />
            {dict.buttons.approve}
          </Button>
        </div>
        {declineDialog}
      </>
    );
  }

  // CASE: INTERESTED
  if (suggestion.status === 'FIRST_PARTY_INTERESTED' && isFirstParty) {
    return (
      <>
        <div className="w-full space-y-2">
          {!isUserInActiveProcess && (
            <Button
              size="sm"
              variant="default"
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-medium h-10"
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.(suggestion);
              }}
            >
              <Heart
                className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
              />
              {dict.buttons.activateNow ||
                (locale === 'he' ? 'אשר/י עכשיו' : 'Approve now')}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200 rounded-xl font-medium transition-all duration-300 h-9"
            onClick={handleDeclineClick}
          >
            <Trash2
              className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
            />
            {dict.buttons.removeFromList ||
              (locale === 'he' ? 'הסר מהרשימה' : 'Remove')}
          </Button>

          {isUserInActiveProcess && (
            <div className="flex items-start gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                {locale === 'he'
                  ? 'יש לך הצעה פעילה. כשתסתיים, תוכל/י לאשר מהרשימה.'
                  : 'You have an active suggestion. Once it ends, you can approve from the waitlist.'}
              </p>
            </div>
          )}
        </div>
        {declineDialog}
      </>
    );
  }

  // CASE: Second party not available - first party view
  if (suggestion.status === 'SECOND_PARTY_NOT_AVAILABLE' && isFirstParty) {
    return (
      <div className="w-full">
        <div className="flex items-start gap-2 px-3 py-3 bg-amber-50 rounded-xl border border-amber-200">
          <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {(dict.status as any)?.secondPartyNotAvailable?.title ||
                (locale === 'he' ? 'ההצעה בהמתנה' : 'Suggestion on hold')}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {(dict.status as any)?.secondPartyNotAvailable?.description ||
                (locale === 'he'
                  ? 'הצד השני לא זמין כרגע. ההצעה תחזור כשיהיה זמין. בינתיים, תוכל/י לאשר הצעות אחרות.'
                  : 'The other side is not available right now. The suggestion will resume when they are. In the meantime, you can approve other suggestions.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CASE: Second party not available - second party view
  if (suggestion.status === 'SECOND_PARTY_NOT_AVAILABLE' && !isFirstParty) {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            {locale === 'he'
              ? 'סימנת שאת/ה לא זמין/ה כרגע. כשתהיה מוכן/ה, לחצ/י כאן.'
              : "You marked yourself as not available. When you're ready, click below."}
          </p>
        </div>
        <Button
          size="sm"
          variant="default"
          className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md rounded-xl font-medium h-10"
          onClick={(e) => {
            e.stopPropagation();
            onApprove?.(suggestion);
          }}
        >
          {locale === 'he' ? 'חזרתי להיות זמין/ה' : "I'm available now"}
        </Button>
      </div>
    );
  }

  // CASE: Re-offered to first party
  if (suggestion.status === 'RE_OFFERED_TO_FIRST_PARTY' && isFirstParty) {
    return (
      <>
        <div className="w-full space-y-2">
          <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              {locale === 'he'
                ? 'הצד השני חזר להיות זמין ואישר! האם ההצעה עדיין רלוונטית עבורך?'
                : 'The other side is now available and approved! Is this still relevant for you?'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-gray-200 rounded-xl font-medium"
              onClick={handleDeclineClick}
            >
              <XCircle
                className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
              />
              {dict.buttons.decline}
            </Button>
            <Button
              size="sm"
              variant="default"
              className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md rounded-xl font-medium"
              onClick={(e) => {
                e.stopPropagation();
                onApprove?.(suggestion);
              }}
            >
              <Heart
                className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
              />
              {dict.buttons.approve}
            </Button>
          </div>
        </div>
        {declineDialog}
      </>
    );
  }

  // CASE: Other statuses (in progress, etc.)
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <Button
        size="sm"
        variant="outline"
        className="w-full border-gray-200 hover:bg-teal-50 hover:border-teal-200 text-gray-700 hover:text-teal-700 rounded-xl font-medium transition-all duration-300"
        onClick={(e) => {
          e.stopPropagation();
          onInquiry?.(suggestion);
        }}
      >
        <MessageCircle
          className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
        />
        {dict.buttons.askMatchmaker}
      </Button>

      <Button
        size="sm"
        variant="default"
        className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-xl font-medium"
        onClick={() => onClick(suggestion)}
      >
        <Eye
          className={cn('w-4 h-4', locale === 'he' ? 'ml-2' : 'mr-2')}
        />
        {dict.buttons.viewDetails}
      </Button>
    </div>
  );
};

export default CardActions;
