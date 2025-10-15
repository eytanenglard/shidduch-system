// /components/matchmaker/CandidateCard/Actions.tsx

'use client';

import React, {useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Eye,
  Sparkles,
  Send,
  MessageCircle,
  Calendar,
  Star,
  Zap,
} from 'lucide-react';
import type { Candidate } from '../types/candidates';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface ActionsProps {
  candidate: Candidate;
  onInvite: (candidate: Candidate) => void;
  onSuggest: (candidate: Candidate) => void;
  onCheckAvailability: (candidate: Candidate) => void;
  onViewProfile: (candidate: Candidate) => void;
  className?: string;
  variant?: 'full' | 'compact' | 'minimal';
  showLabels?: boolean;
  dict: MatchmakerPageDictionary['candidatesManager']['list']['cardActions'];
}

const Actions: React.FC<ActionsProps> = ({
  candidate,
  onInvite,
  onSuggest,
  onCheckAvailability,
  onViewProfile,
  className,
  variant = 'full',
  showLabels = true,
  dict,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleActionClick = (action: string, callback: () => void) => {
    setActiveAction(action);
    callback();
    setTimeout(() => setActiveAction(null), 150);
  };

  const getPriorityBadge = () => {
    if (candidate.profile.availabilityStatus === 'AVAILABLE') {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg animate-pulse">
          <Sparkles className="w-3 h-3 mr-1" />
          {dict.availableNow}
        </Badge>
      );
    }
    return null;
  };

  const actionButtons = [
    {
      id: 'view',
      label: dict.viewProfile,
      icon: Eye,
      onClick: () => onViewProfile(candidate),
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'from-blue-600 to-cyan-600',
      description: dict.viewProfileTooltip,
      primary: true,
    },
    {
      id: 'suggest',
      label: dict.suggestMatch,
      icon: Heart,
      onClick: () => onSuggest(candidate),
      gradient: 'from-pink-500 to-rose-500',
      hoverGradient: 'from-pink-600 to-rose-600',
      description: dict.suggestMatchTooltip,
      primary: true,
    },
    {
      id: 'invite',
      label: dict.sendInvite,
      icon: Send,
      onClick: () => onInvite(candidate),
      gradient: 'from-purple-500 to-indigo-500',
      hoverGradient: 'from-purple-600 to-indigo-600',
      description: dict.sendInviteTooltip,
      primary: false,
    },
    {
      id: 'availability',
      label: dict.checkAvailability,
      icon: Calendar,
      onClick: () => onCheckAvailability(candidate),
      gradient: 'from-orange-500 to-amber-500',
      hoverGradient: 'from-orange-600 to-amber-600',
      description: dict.checkAvailabilityTooltip,
      primary: false,
    },
  ];

  if (variant === 'minimal') {
    return (
      <div
        className={cn('flex items-center gap-1', className)}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <TooltipProvider>
          {actionButtons.slice(0, 2).map((action) => {
            const IconComponent = action.icon;
            return (
              <Tooltip key={action.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 rounded-full transition-all duration-300 transform hover:scale-110',
                      `bg-gradient-to-r ${action.gradient} hover:${action.hoverGradient}`,
                      'text-white shadow-lg hover:shadow-xl',
                      activeAction === action.id && 'scale-95'
                    )}
                    onClick={() => handleActionClick(action.id, action.onClick)}
                  >
                    <IconComponent className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{action.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={cn('flex flex-wrap gap-2', className)}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {getPriorityBadge()}

        <div className="flex gap-2">
          {actionButtons.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className={cn(
                  'transition-all duration-300 transform hover:scale-105 border-0 shadow-lg hover:shadow-xl',
                  `bg-gradient-to-r ${action.gradient} hover:${action.hoverGradient}`,
                  'text-white font-medium',
                  activeAction === action.id && 'scale-95'
                )}
                onClick={() => handleActionClick(action.id, action.onClick)}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {showLabels && action.label}
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn('space-y-4', className)}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-center">{getPriorityBadge()}</div>

      <div className="grid grid-cols-2 gap-3">
        {actionButtons
          .filter((a) => a.primary)
          .map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                className={cn(
                  'h-12 transition-all duration-300 transform hover:scale-105 border-0 shadow-xl hover:shadow-2xl font-bold text-sm',
                  `bg-gradient-to-r ${action.gradient} hover:${action.hoverGradient}`,
                  'text-white relative overflow-hidden group',
                  activeAction === action.id && 'scale-95'
                )}
                onClick={() => handleActionClick(action.id, action.onClick)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <IconComponent className="w-5 h-5" />
                  {showLabels && (
                    <span className="hidden sm:inline">{action.label}</span>
                  )}
                </div>
              </Button>
            );
          })}
      </div>

      <div className="flex gap-2">
        {actionButtons
          .filter((a) => !a.primary)
          .map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className={cn(
                  'flex-1 transition-all duration-300 transform hover:scale-105 border-2 hover:border-transparent shadow-lg hover:shadow-xl font-medium',
                  `border-gray-200 hover:bg-gradient-to-r hover:${action.gradient}`,
                  'hover:text-white group relative overflow-hidden',
                  activeAction === action.id && 'scale-95'
                )}
                onClick={() => handleActionClick(action.id, action.onClick)}
              >
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-r transition-all duration-300 opacity-0 group-hover:opacity-100',
                    action.gradient
                  )}
                ></div>
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <IconComponent className="w-4 h-4" />
                  {showLabels && (
                    <span className="text-xs hidden sm:inline">
                      {action.label}
                    </span>
                  )}
                </div>
              </Button>
            );
          })}
      </div>

      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-110 group',
            'border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md rounded-full px-4'
          )}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-all duration-300',
              isHovered && 'fill-current animate-pulse'
            )}
          />
          <span className="mr-2 text-sm font-medium">{dict.addToFavorites}</span>
        </Button>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>{dict.rating}: 4.8</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-blue-500" />
            <span>{dict.matchScore}: 95%</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3 text-green-500" />
            <span>{dict.response}: {dict.quickResponse}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Actions;