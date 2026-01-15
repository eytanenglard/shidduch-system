// ===========================================
// קובץ חדש: src/components/matchmaker/new/VirtualSearch/SavedVirtualProfiles.tsx
// ===========================================

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Star,
  StarOff,
  Target,
  MoreVertical,
  Trash2,
  Edit3,
  Loader2,
  UserCircle,
  Clock,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

// ============================================================================
// TYPES
// ============================================================================

interface GeneratedVirtualProfile {
  inferredAge: number;
  inferredCity: string | null;
  inferredOccupation: string | null;
  personalitySummary: string;
  lookingForSummary: string;
  keyTraits: string[];
  displaySummary: string;
}

interface SavedProfile {
  id: string;
  name: string | null;
  gender: 'MALE' | 'FEMALE';
  religiousLevel: string;
  generatedProfile: GeneratedVirtualProfile;
  editedSummary: string | null;
  wasEdited: boolean;
  isStarred: boolean;
  lastUsedAt: string | null;
  usageCount: number;
  createdAt: string;
}

interface SavedVirtualProfilesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProfile: (profile: SavedProfile) => void;
  onCreateNew: () => void;
  locale: string;
}

// מיפוי רמות דתיות לתצוגה
const RELIGIOUS_LEVEL_LABELS: Record<string, string> = {
  charedi_modern: 'חרדי מודרני',
  dati_leumi_torani: 'דתי לאומי תורני',
  dati_leumi_standard: 'דתי לאומי',
  dati_leumi_liberal: 'דתי לאומי ליברלי',
  masorti_strong: 'מסורתי חזק',
  masorti_light: 'מסורתי לייט',
  secular_traditional_connection: 'חילוני מסורתי',
  secular: 'חילוני',
};

// ============================================================================
// COMPONENT
// ============================================================================

const SavedVirtualProfiles: React.FC<SavedVirtualProfilesProps> = ({
  isOpen,
  onClose,
  onSelectProfile,
  onCreateNew,
  locale,
}) => {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isRtl = locale === 'he';

  // טעינת פרופילים
  const loadProfiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/virtual-profile');
      const data = await response.json();

      if (data.success) {
        setProfiles(data.profiles || []);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error loading virtual profiles:', error);
      toast.error('שגיאה בטעינת הפרופילים');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadProfiles();
    }
  }, [isOpen]);

  // סימון/ביטול כוכב
  const handleToggleStar = async (profileId: string, currentStarred: boolean) => {
    try {
      const response = await fetch('/api/ai/virtual-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profileId,
          isStarred: !currentStarred,
        }),
      });

      if (response.ok) {
        setProfiles(prev =>
          prev.map(p =>
            p.id === profileId ? { ...p, isStarred: !currentStarred } : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  // מחיקת פרופיל
  const handleDelete = async (profileId: string) => {
    setDeletingId(profileId);
    try {
      const response = await fetch(`/api/ai/virtual-profile?id=${profileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProfiles(prev => prev.filter(p => p.id !== profileId));
        toast.success('הפרופיל נמחק');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('שגיאה במחיקת הפרופיל');
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  // בחירת פרופיל לחיפוש
  const handleSelectProfile = (profile: SavedProfile) => {
    onSelectProfile(profile);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="max-w-2xl max-h-[80vh]"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-purple-500" />
                פרופילים וירטואליים שמורים
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadProfiles}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onCreateNew();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 ml-1" />
                  חדש
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[60vh] mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <UserCircle className="w-12 h-12 mb-2 opacity-50" />
                <p>אין פרופילים שמורים</p>
                <Button
                  variant="link"
                  onClick={() => {
                    onClose();
                    onCreateNew();
                  }}
                  className="text-purple-600"
                >
                  צור פרופיל חדש
                </Button>
              </div>
            ) : (
              <div className="space-y-3 pr-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={cn(
                      'group relative p-4 rounded-xl border transition-all cursor-pointer',
                      'hover:border-purple-300 hover:shadow-md',
                      profile.isStarred ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200' : 'bg-white border-gray-200'
                    )}
                    onClick={() => handleSelectProfile(profile)}
                  >
                    {/* Star Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(profile.id, profile.isStarred);
                      }}
                      className="absolute top-3 left-3 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      {profile.isStarred ? (
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      ) : (
                        <StarOff className="w-5 h-5 text-gray-400 hover:text-amber-500" />
                      )}
                    </button>

                    {/* Main Content */}
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold',
                        profile.gender === 'MALE' 
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                          : 'bg-gradient-to-br from-pink-500 to-rose-600'
                      )}>
                        {profile.gender === 'MALE' ? '👨' : '👩'}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800 truncate">
                            {profile.name || 'פרופיל ללא שם'}
                          </h3>
                          {profile.wasEdited && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                              נערך
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs',
                            profile.gender === 'MALE' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-pink-100 text-pink-700'
                          )}>
                            {profile.gender === 'MALE' ? 'גבר' : 'אישה'}, {profile.generatedProfile?.inferredAge || '?'}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {RELIGIOUS_LEVEL_LABELS[profile.religiousLevel] || profile.religiousLevel}
                          </span>
                        </div>

                        {/* Summary Preview */}
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {profile.editedSummary || profile.generatedProfile?.displaySummary || 'אין תיאור'}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {profile.lastUsedAt 
                              ? `שימוש אחרון: ${formatDistanceToNow(new Date(profile.lastUsedAt), { addSuffix: true, locale: he })}`
                              : `נוצר ${formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true, locale: he })}`
                            }
                          </span>
                          {profile.usageCount > 0 && (
                            <span>{profile.usageCount} חיפושים</span>
                          )}
                        </div>
                      </div>

                      {/* Actions Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProfile(profile);
                            }}
                          >
                            <Target className="w-4 h-4 ml-2" />
                            הפעל חיפוש
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(profile.id);
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחק
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Hover Action */}
                    <div className="absolute inset-0 flex items-center justify-center bg-purple-600/0 group-hover:bg-purple-600/5 rounded-xl transition-colors pointer-events-none">
                      <span className="opacity-0 group-hover:opacity-100 text-purple-600 font-medium flex items-center gap-1 transition-opacity">
                        <Target className="w-4 h-4" />
                        לחץ להפעלת חיפוש
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פרופיל וירטואלי</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הפרופיל? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={!!deletingId}
            >
              {deletingId ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'מחק'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SavedVirtualProfiles;