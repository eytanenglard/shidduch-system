// src/components/matchmaker/new/PotentialMatches/match-card/CardActions.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HeartHandshake,
  Bookmark,
  Eye,
  MoreHorizontal,
  ThumbsDown,
  MessageSquareX,
  Undo,
  ExternalLink,
} from 'lucide-react';

// =============================================================================
// DROPDOWN ACTIONS MENU (for expanded card header)
// =============================================================================

interface CardActionsMenuProps {
  matchId: string;
  isDismissed: boolean;
  isSent: boolean;
  onCreateSuggestion: (matchId: string) => void;
  onReview: (matchId: string) => void;
  onRestore: (matchId: string) => void;
  onQuickDismiss: (e: React.MouseEvent) => void;
  onDismissWithFeedback: () => void;
}

export const CardActionsMenu: React.FC<CardActionsMenuProps> = ({
  matchId,
  isDismissed,
  isSent,
  onCreateSuggestion,
  onReview,
  onRestore,
  onQuickDismiss,
  onDismissWithFeedback,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isSent && !isDismissed && (
          <>
            <DropdownMenuItem
              onClick={() => onCreateSuggestion(matchId)}
            >
              <HeartHandshake className="w-4 h-4 ml-2 text-green-600" />
              צור הצעה
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onReview(matchId)}>
              <Eye className="w-4 h-4 ml-2 text-blue-600" />
              סמן כנבדק
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onQuickDismiss}
              className="text-orange-600"
            >
              <ThumbsDown className="w-4 h-4 ml-2" />
              דחייה מהירה
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDismissWithFeedback}
              className="text-red-600"
            >
              <MessageSquareX className="w-4 h-4 ml-2" />
              דחייה עם פירוט
            </DropdownMenuItem>
          </>
        )}
        {isDismissed && (
          <DropdownMenuItem onClick={() => onRestore(matchId)}>
            <Undo className="w-4 h-4 ml-2 text-blue-600" />
            שחזר התאמה
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// =============================================================================
// MAIN ACTION BUTTONS (bottom of expanded card)
// =============================================================================

interface MainActionButtonsProps {
  matchId: string;
  matchStatus: string;
  onCreateSuggestion: (matchId: string) => void;
  onSave: (matchId: string) => void;
  onQuickDismiss: (e: React.MouseEvent) => void;
  onDismissWithFeedback: () => void;
}

export const MainActionButtons: React.FC<MainActionButtonsProps> = ({
  matchId,
  matchStatus,
  onCreateSuggestion,
  onSave,
  onQuickDismiss,
  onDismissWithFeedback,
}) => {
  return (
    <div className="mt-3 sm:mt-4 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5 sm:gap-2">
      <Button
        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm min-w-[100px] bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-sm"
        onClick={() => onCreateSuggestion(matchId)}
      >
        <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        צור הצעה
      </Button>
      {matchStatus !== 'SHORTLISTED' && (
        <Button
          variant="outline"
          className="h-8 sm:h-9 px-2 sm:px-3 text-purple-600 border-purple-200 hover:bg-purple-50"
          onClick={() => onSave(matchId)}
          title="שמור בצד"
        >
          <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      )}

      {/* Quick Reject Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="h-8 sm:h-9 w-8 sm:w-9 px-0 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              onClick={onQuickDismiss}
            >
              <ThumbsDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>דחייה מהירה (חוסר התאמה)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Detailed Reject Button */}
      <Button
        variant="outline"
        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm min-w-[100px]"
        onClick={onDismissWithFeedback}
      >
        <MessageSquareX className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        <span className="hidden sm:inline">דחה + פירוט</span>
        <span className="sm:hidden">דחה</span>
      </Button>
    </div>
  );
};

// =============================================================================
// COMPACT ACTION BUTTONS (compact card inline buttons)
// =============================================================================

interface CompactActionButtonsProps {
  matchId: string;
  isDismissed: boolean;
  isSent: boolean;
  onCreateSuggestion: (matchId: string) => void;
  onSave: (matchId: string) => void;
  onRestore: (matchId: string) => void;
  onQuickDismiss: (e: React.MouseEvent) => void;
}

export const CompactActionButtons: React.FC<CompactActionButtonsProps> = ({
  matchId,
  isDismissed,
  isSent,
  onCreateSuggestion,
  onSave,
  onRestore,
  onQuickDismiss,
}) => {
  if (isDismissed) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 text-blue-600 shrink-0"
        onClick={() => onRestore(matchId)}
        title="שחזר"
      >
        <Undo className="w-3.5 h-3.5" />
      </Button>
    );
  }

  if (isSent) return null;

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        size="icon"
        className="h-7 w-7 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
        onClick={() => onCreateSuggestion(matchId)}
        title="צור הצעה"
      >
        <HeartHandshake className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 text-purple-600 border-purple-200 hover:bg-purple-50"
        onClick={() => onSave(matchId)}
        title="שמור בצד"
      >
        <Bookmark className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7 text-red-500 border-red-200 hover:bg-red-50"
        onClick={onQuickDismiss}
        title="דחה"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

// =============================================================================
// SENT SUGGESTION LINK
// =============================================================================

interface SentSuggestionLinkProps {
  suggestionId: string;
}

export const SentSuggestionLink: React.FC<SentSuggestionLinkProps> = ({ suggestionId }) => {
  return (
    <div className="mt-4 p-2 rounded-lg bg-green-50 border border-green-200 text-center">
      <Button
        variant="link"
        size="sm"
        className="text-green-700 p-0 h-auto font-medium"
        onClick={() =>
          (window.location.href = `/matchmaker/suggestions?id=${suggestionId}`)
        }
      >
        עבור להצעה <ExternalLink className="w-3 h-3 mr-1" />
      </Button>
    </div>
  );
};

export default CardActionsMenu;
