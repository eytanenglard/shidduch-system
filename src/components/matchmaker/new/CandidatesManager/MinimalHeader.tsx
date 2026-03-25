'use client';

import React from 'react';
import {
  UserPlus,
  RotateCw,
  Bot,
  Loader2,
  Users,
  TrendingUp,
  TrendingDown,
  Upload,
  ChevronDown,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface MinimalHeaderProps {
  stats: {
    total: number;
    male: number;
    female: number;
    verified: number;
    activeToday: number;
    profilesComplete: number;
  };
  onAddCandidate: () => void;
  onBulkImport: () => void;
  onCardImport: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onBulkUpdate?: () => void;
  isBulkUpdating?: boolean;
  isAdmin?: boolean;
  isCompact: boolean;
  onToggleCompact: () => void;
  dict: MatchmakerPageDictionary['candidatesManager']['header'];
}

const MinimalHeader = React.memo<MinimalHeaderProps>(
  ({
    stats,
    onAddCandidate,
    onBulkImport,
    onCardImport,
    onRefresh,
    isRefreshing,
    onBulkUpdate,
    isBulkUpdating,
    isAdmin,
    isCompact,
    onToggleCompact,
    dict,
  }) => {
    return (
      <header
        className={cn(
          'sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm transition-all duration-300',
          isCompact ? 'h-16' : 'h-32'
        )}
      >
        <div className="container mx-auto px-6 h-full">
          {isCompact ? (
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    <Users className="w-4 h-4" />
                  </div>
                  <h1 className="text-lg font-bold text-gray-800">
                    {dict.title}
                  </h1>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {stats.total} {dict.totalLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    {stats.verified} {dict.verifiedLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                  >
                    {stats.profilesComplete}
                    {dict.profilesCompleteLabel}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
                    >
                      <UserPlus className="w-4 h-4 ml-1" />
                      הוסף
                      <ChevronDown className="w-3 h-3 mr-1 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuItem
                      onClick={onAddCandidate}
                      className="cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 ml-2 text-indigo-500" />
                      הוסף מועמד בודד
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onBulkImport}
                      className="cursor-pointer"
                    >
                      <Upload className="w-4 h-4 ml-2 text-purple-500" />
                      ייבוא מקבוצת וואטסאפ
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onCardImport}
                      className="cursor-pointer"
                    >
                      <Grid3X3 className="w-4 h-4 ml-2 text-indigo-500" />
                      ייבוא בכרטיסים (תמונה + טקסט)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={onRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <RotateCw
                    className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
                  />
                </Button>
                {isAdmin && onBulkUpdate && (
                  <Button
                    onClick={onBulkUpdate}
                    variant="secondary"
                    size="sm"
                    disabled={isBulkUpdating}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {isBulkUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  onClick={onToggleCompact}
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  title={dict.expandTooltip}
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-center h-full py-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {dict.advancedTitle}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {dict.advancedSubtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                      >
                        <UserPlus className="w-4 h-4 ml-2" />
                        הוסף מועמדים
                        <ChevronDown className="w-3 h-3 mr-1 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      <DropdownMenuItem
                        onClick={onAddCandidate}
                        className="cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 ml-2 text-indigo-500" />
                        הוסף מועמד בודד
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={onBulkImport}
                        className="cursor-pointer"
                      >
                        <Upload className="w-4 h-4 ml-2 text-purple-500" />
                        ייבוא מקבוצת וואטסאפ
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={onCardImport}
                        className="cursor-pointer"
                      >
                        <Grid3X3 className="w-4 h-4 ml-2 text-indigo-500" />
                        ייבוא בכרטיסים (תמונה + טקסט)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    onClick={onRefresh}
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                    className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                  >
                    <RotateCw
                      className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
                    />
                  </Button>
                  {isAdmin && onBulkUpdate && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isBulkUpdating}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          {isBulkUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {dict.bulkUpdateDialog.title}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {dict.bulkUpdateDialog.description}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {dict.bulkUpdateDialog.cancel}
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={onBulkUpdate}>
                            {dict.bulkUpdateDialog.confirm}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  <Button
                    onClick={onToggleCompact}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                    title={dict.collapseTooltip}
                  >
                    <TrendingDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-3">
                <div className="text-center bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-2 shadow-sm border border-blue-100">
                  <div className="text-lg font-bold text-blue-700">
                    {stats.total}
                  </div>
                  <div className="text-xs text-blue-600">
                    {dict.stats.total}
                  </div>
                </div>
                <div className="text-center bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-2 shadow-sm border border-indigo-100">
                  <div className="text-lg font-bold text-indigo-700">
                    {stats.male}
                  </div>
                  <div className="text-xs text-indigo-600">
                    {dict.stats.male}
                  </div>
                </div>
                <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 shadow-sm border border-purple-100">
                  <div className="text-lg font-bold text-purple-700">
                    {stats.female}
                  </div>
                  <div className="text-xs text-purple-600">
                    {dict.stats.female}
                  </div>
                </div>
                <div className="text-center bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-2 shadow-sm border border-emerald-100">
                  <div className="text-lg font-bold text-emerald-700">
                    {stats.verified}
                  </div>
                  <div className="text-xs text-emerald-600">
                    {dict.stats.verified}
                  </div>
                </div>
                <div className="text-center bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-2 shadow-sm border border-orange-100">
                  <div className="text-lg font-bold text-orange-700">
                    {stats.activeToday}
                  </div>
                  <div className="text-xs text-orange-600">
                    {dict.stats.active}
                  </div>
                </div>
                <div className="text-center bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-2 shadow-sm border border-teal-100">
                  <div className="text-lg font-bold text-teal-700">
                    {stats.profilesComplete}%
                  </div>
                  <div className="text-xs text-teal-600">
                    {dict.stats.complete}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }
);
MinimalHeader.displayName = 'MinimalHeader';

export default MinimalHeader;
