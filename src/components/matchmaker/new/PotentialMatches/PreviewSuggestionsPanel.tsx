// =============================================================================
// 📁 src/components/matchmaker/new/PotentialMatches/PreviewSuggestionsPanel.tsx
// תצוגה מקדימה של הצעות יומיות — השדכן רואה, מחליף, מוחק, ושולח
// =============================================================================

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Play,
  Send,
  Trash2,
  RefreshCw,
  Loader2,
  Users,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Search as SearchIcon,
  Zap,
  Pencil,
  ArrowLeft,
  X,
  ChevronRight,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import RejectionFeedbackModal, { useRejectionFeedback } from './RejectionFeedbackModal';

// =============================================================================
// TYPES
// =============================================================================

interface PreviewOtherParty {
  id: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  city: string | null;
  birthDate: string | null;
  religiousLevel: string | null;
  mainImage: string | null;
}

interface PreviewMatch {
  matchId: string;
  aiScore: number;
  shortReasoning: string | null;
  partyDirection?: {
    firstPartyGender: 'MALE' | 'FEMALE';
    firstPartyName: string;
    secondPartyName: string;
  };
  previousSuggestion?: {
    status: string;
    createdAt: string;
  } | null;
  otherParty: PreviewOtherParty;
}

interface PreviewItem {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: string | null;
    lastSuggestionDate: string | null;
    daysSinceLastSuggestion: number | null;
    mainImage: string | null;
  };
  selectedMatchId: string | null;
  customMatchingReason: string | null;
  matches: PreviewMatch[];
  status: 'ready' | 'no_matches';
}

interface PreviewFilters {
  gender: string;
  searchName: string;
  noSuggestionDays: string;
  limit: string;
  sortBy: string;
  scanMethod: string;
  scanAfter: string;
}

interface PreviewSuggestionsPanelProps {
  onViewProfile: (userId: string) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? age : null;
};

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
  if (score >= 75) return 'text-blue-700 bg-blue-100 border-blue-200';
  return 'text-amber-700 bg-amber-100 border-amber-200';
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const MiniAvatar: React.FC<{ src: string | null; gender: string | null; size?: number }> = ({
  src, gender, size = 10,
}) => (
  <div className={`w-${size} h-${size} rounded-full bg-gray-200 overflow-hidden flex-shrink-0`}>
    {src ? (
      <img src={src} alt="" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <Users size={size * 1.6} />
      </div>
    )}
  </div>
);

// --- Preview Card for a single user ---
const PreviewCard: React.FC<{
  item: PreviewItem;
  onRemove: (userId: string) => void;
  onChangeMatch: (userId: string, matchId: string) => void;
  onViewProfile: (userId: string) => void;
  onScanUser: (userId: string) => void;
  isScanningUser: boolean;
  onEditReason: (userId: string, reason: string) => void;
  onExpandMatches: (userId: string) => void;
}> = ({ item, onRemove, onChangeMatch, onViewProfile, onScanUser, isScanningUser, onEditReason, onExpandMatches }) => {
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [editedReason, setEditedReason] = useState('');

  const selectedMatch = item.matches.find((m) => m.matchId === item.selectedMatchId);
  const otherParty = selectedMatch?.otherParty;
  const age = otherParty ? calculateAge(otherParty.birthDate) : null;
  const genderIcon = item.user.gender === 'MALE' ? '♂' : '♀';
  const genderColor = item.user.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500';
  const displayReason = item.customMatchingReason || selectedMatch?.shortReasoning;

  const handleStartEdit = () => {
    setEditedReason(displayReason || '');
    setIsEditingReason(true);
  };
  const handleSaveReason = () => {
    onEditReason(item.user.id, editedReason);
    setIsEditingReason(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
      className={cn(
        'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden',
        item.status === 'no_matches' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
      )}
    >
      {/* User Row */}
      <div className="p-3 flex items-center gap-2 border-b border-gray-50">
        <button
          onClick={() => onViewProfile(item.user.id)}
          className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 hover:ring-2 ring-violet-300 transition-all"
          title="לחץ לצפייה בפרופיל"
        >
          {item.user.mainImage ? (
            <img src={item.user.mainImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Users size={14} />
            </div>
          )}
        </button>
        <button
          onClick={() => onViewProfile(item.user.id)}
          className="flex items-center gap-1 min-w-0 flex-1 hover:opacity-80 transition-opacity"
          title="לחץ לצפייה בפרופיל"
        >
          <span className={cn('text-sm font-bold', genderColor)}>{genderIcon}</span>
          <span className="text-sm font-semibold text-gray-800 truncate">
            {item.user.firstName} {item.user.lastName}
          </span>
        </button>

        {/* Days indicator */}
        {item.user.daysSinceLastSuggestion !== null ? (
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] h-5 flex-shrink-0',
              item.user.daysSinceLastSuggestion >= 7
                ? 'border-red-300 text-red-600 bg-red-50'
                : item.user.daysSinceLastSuggestion >= 3
                  ? 'border-amber-300 text-amber-600 bg-amber-50'
                  : 'border-gray-200 text-gray-500'
            )}
            title={`הצעה אחרונה לפני ${item.user.daysSinceLastSuggestion} ימים`}
          >
            {item.user.daysSinceLastSuggestion}d
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0 border-purple-300 text-purple-600 bg-purple-50" title="לא קיבל הצעה מעולם">
            חדש
          </Badge>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
          onClick={() => onRemove(item.user.id)}
          title="הסר מהרשימה"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Match Content */}
      {item.status === 'no_matches' ? (
        <div className="p-4 text-center space-y-2">
          <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-xs text-amber-700 font-medium">אין התאמות זמינות</p>
          <p className="text-[10px] text-amber-500">לא נמצאו PotentialMatches עם ציון ≥ 70</p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => onScanUser(item.user.id)}
            disabled={isScanningUser}
          >
            {isScanningUser ? (
              <Loader2 className="w-3 h-3 ml-1 animate-spin" />
            ) : (
              <Zap className="w-3 h-3 ml-1" />
            )}
            {isScanningUser ? 'סורק...' : 'סרוק עכשיו'}
          </Button>
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {/* Selected match display */}
          {otherParty && selectedMatch && (
            <button
              onClick={() => onViewProfile(otherParty.id)}
              className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1.5 -m-1.5 transition-colors"
              title="לחץ לצפייה בפרופיל"
            >
              <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                {otherParty.mainImage ? (
                  <img src={otherParty.mainImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Users size={16} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {otherParty.firstName} {otherParty.lastName}
                  <span className={cn('mr-1 text-xs', otherParty.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500')}>
                    {otherParty.gender === 'MALE' ? '♂' : '♀'}
                  </span>
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  {age && <span>{age}</span>}
                  {otherParty.city && <><span>•</span><span className="truncate">{otherParty.city}</span></>}
                </div>
              </div>
              <Badge className={cn('text-xs font-bold border flex-shrink-0', getScoreColor(selectedMatch.aiScore))}>
                {Math.round(selectedMatch.aiScore)}
              </Badge>
            </button>
          )}

          {/* Editable Reasoning */}
          {selectedMatch && (
            <div className="px-1">
              {isEditingReason ? (
                <div className="space-y-1.5">
                  <Textarea
                    value={editedReason}
                    onChange={(e) => setEditedReason(e.target.value)}
                    className="text-xs min-h-[60px] resize-none"
                    placeholder="סיבת ההתאמה..."
                    dir="rtl"
                  />
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setIsEditingReason(false)}>
                      ביטול
                    </Button>
                    <Button size="sm" className="h-6 text-[10px] px-2 bg-violet-600 text-white" onClick={handleSaveReason}>
                      שמור
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-1 group">
                  <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 flex-1">
                    {displayReason || <span className="italic text-gray-300">ללא סיבה</span>}
                  </p>
                  <button
                    onClick={handleStartEdit}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-violet-500 flex-shrink-0 mt-0.5"
                    title="ערוך סיבת התאמה"
                  >
                    <Pencil size={11} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* V4.0: Direction indicator */}
          {selectedMatch && (
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 px-1">
              <span className={cn('font-semibold', item.user.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500')}>
                {item.user.gender === 'MALE' ? '♂' : '♀'} {item.user.firstName}
              </span>
              <ArrowLeft size={10} className="text-gray-300" />
              <span className={cn('font-semibold', otherParty?.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500')}>
                {otherParty?.gender === 'MALE' ? '♂' : '♀'} {otherParty?.firstName}
              </span>
              <Badge variant="outline" className="text-[8px] h-4 border-gray-200 text-gray-400 mr-auto">
                צד 1 → צד 2
              </Badge>
            </div>
          )}

          {/* V4.0: "Show all matches" button (replaces dropdown) */}
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-xs border-dashed border-violet-300 text-violet-600 hover:bg-violet-50"
            onClick={() => onExpandMatches(item.user.id)}
          >
            <Eye size={12} className="ml-1" />
            הצג כל ההתאמות ({item.matches.length}+)
            <ChevronRight size={12} className="mr-auto" />
          </Button>

          {/* V4.0: Previous suggestion badge on selected match */}
          {selectedMatch?.previousSuggestion && (
            <Badge variant="outline" className="text-[9px] h-5 border-amber-300 text-amber-600 bg-amber-50 w-fit">
              <History size={10} className="ml-1" />
              נשלח בעבר — {selectedMatch.previousSuggestion.status === 'EXPIRED' ? 'פג תוקף' :
                selectedMatch.previousSuggestion.status === 'FIRST_PARTY_DECLINED' ? 'צד ראשון דחה' :
                selectedMatch.previousSuggestion.status === 'SECOND_PARTY_DECLINED' ? 'צד שני דחה' :
                selectedMatch.previousSuggestion.status === 'CLOSED' ? 'נסגר' : selectedMatch.previousSuggestion.status}
            </Badge>
          )}
        </div>
      )}
    </motion.div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function PreviewSuggestionsPanel({ onViewProfile }: PreviewSuggestionsPanelProps) {
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [stats, setStats] = useState<{
    eligibleCount: number;
    filteredCount: number;
    withMatches: number;
    withoutMatches: number;
    hasBlockingSuggestion: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [scanningUserIds, setScanningUserIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // V4.0: Expanded match panel state
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [allMatches, setAllMatches] = useState<PreviewMatch[]>([]);
  const [allMatchesTotal, setAllMatchesTotal] = useState(0);
  const [allMatchesHasMore, setAllMatchesHasMore] = useState(false);
  const [allMatchesPage, setAllMatchesPage] = useState(1);
  const [isLoadingAllMatches, setIsLoadingAllMatches] = useState(false);
  const rejectionFeedback = useRejectionFeedback();

  // ===== Filter State =====
  const [filters, setFilters] = useState<PreviewFilters>({
    gender: '',
    searchName: '',
    noSuggestionDays: '',
    limit: '',
    sortBy: 'waiting_time',
    scanMethod: '',
    scanAfter: '',
  });

  const updateFilter = (key: keyof PreviewFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // ===== Generate Preview =====
  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true);
      toast.loading('מכין תצוגה מקדימה...', { id: 'preview-gen' });

      const params = new URLSearchParams();
      if (filters.gender) params.set('gender', filters.gender);
      if (filters.searchName) params.set('searchName', filters.searchName);
      if (filters.noSuggestionDays) params.set('noSuggestionDays', filters.noSuggestionDays);
      if (filters.limit) params.set('limit', filters.limit);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.scanMethod) params.set('scanMethod', filters.scanMethod);
      if (filters.scanAfter) params.set('scanAfter', filters.scanAfter);

      const qs = params.toString();
      const response = await fetch(`/api/matchmaker/daily-suggestions/preview${qs ? `?${qs}` : ''}`);
      if (!response.ok) throw new Error('Failed to generate preview');

      const data = await response.json();
      setPreviews(data.previews || []);
      setStats({
        eligibleCount: data.eligibleCount,
        filteredCount: data.filteredCount,
        withMatches: data.withMatches,
        withoutMatches: data.withoutMatches,
        hasBlockingSuggestion: data.hasBlockingSuggestion,
      });
      setHasGenerated(true);

      toast.success(`${data.withMatches} הצעות מוכנות`, {
        id: 'preview-gen',
        description: `${data.withoutMatches} ללא התאמה, ${data.hasBlockingSuggestion} עם הצעה פעילה`,
      });
    } catch (err) {
      toast.error('שגיאה', { id: 'preview-gen', description: err instanceof Error ? err.message : '' });
    } finally {
      setIsGenerating(false);
    }
  }, [filters]);

  // ===== Remove from preview =====
  const handleRemove = useCallback((userId: string) => {
    setPreviews((prev) => prev.filter((p) => p.user.id !== userId));
  }, []);

  // ===== Change selected match =====
  const handleChangeMatch = useCallback((userId: string, matchId: string) => {
    setPreviews((prev) =>
      prev.map((p) =>
        p.user.id === userId ? { ...p, selectedMatchId: matchId, customMatchingReason: null } : p
      )
    );
  }, []);

  // ===== Edit matching reason =====
  const handleEditReason = useCallback((userId: string, reason: string) => {
    setPreviews((prev) =>
      prev.map((p) =>
        p.user.id === userId ? { ...p, customMatchingReason: reason || null } : p
      )
    );
  }, []);

  // ===== Scan single user (when no matches found) =====
  const handleScanUser = useCallback(async (userId: string) => {
    try {
      setScanningUserIds((prev) => new Set(prev).add(userId));
      toast.loading('סורק התאמות...', { id: `scan-${userId}` });

      // Trigger scan
      const scanResponse = await fetch('/api/ai/batch-scan-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'scan_single',
          userId,
          method: 'hybrid',
          skipPreparation: true,
        }),
      });

      const scanData = await scanResponse.json();
      if (!scanData.success && scanData.status !== 'already_running') {
        throw new Error(scanData.error || 'Scan failed');
      }

      // Wait for scan to complete (poll briefly)
      const scanId = scanData.scanId;
      if (scanId) {
        let attempts = 0;
        while (attempts < 60) { // max 2 minutes
          await new Promise((r) => setTimeout(r, 2000));
          attempts++;

          const statusRes = await fetch(`/api/ai/batch-scan-all?checkActive=true`);
          const statusData = await statusRes.json();

          if (!statusData.hasActiveScan || statusData.scan?.id !== scanId) {
            break; // scan finished
          }
        }
      }

      // Now re-fetch preview for this specific user by regenerating full preview
      // (simpler than building a single-user preview endpoint)
      const previewResponse = await fetch('/api/matchmaker/daily-suggestions/preview');
      if (previewResponse.ok) {
        const previewData = await previewResponse.json();
        const updatedUser = (previewData.previews || []).find(
          (p: PreviewItem) => p.user.id === userId
        );

        if (updatedUser && updatedUser.matches.length > 0) {
          setPreviews((prev) =>
            prev.map((p) => (p.user.id === userId ? updatedUser : p))
          );
          toast.success('נמצאו התאמות!', {
            id: `scan-${userId}`,
            description: `${updatedUser.matches.length} התאמות חדשות`,
          });
        } else {
          toast.warning('לא נמצאו התאמות חדשות', { id: `scan-${userId}` });
        }
      }
    } catch (err) {
      toast.error('שגיאה בסריקה', {
        id: `scan-${userId}`,
        description: err instanceof Error ? err.message : '',
      });
    } finally {
      setScanningUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }, []);

  // ===== V4.0: Expand all matches for a user =====
  const handleExpandMatches = useCallback(async (userId: string) => {
    try {
      setExpandedUserId(userId);
      setIsLoadingAllMatches(true);
      setAllMatches([]);
      setAllMatchesPage(1);

      const res = await fetch(`/api/matchmaker/daily-suggestions/preview?allMatches=true&userId=${userId}&page=1&limit=20`);
      if (!res.ok) throw new Error('Failed to load matches');

      const data = await res.json();
      setAllMatches(data.matches || []);
      setAllMatchesTotal(data.total || 0);
      setAllMatchesHasMore(data.hasMore || false);
    } catch (err) {
      toast.error('שגיאה בטעינת התאמות');
      setExpandedUserId(null);
    } finally {
      setIsLoadingAllMatches(false);
    }
  }, []);

  // ===== V4.0: Load more matches =====
  const handleLoadMoreMatches = useCallback(async () => {
    if (!expandedUserId || isLoadingAllMatches) return;
    try {
      setIsLoadingAllMatches(true);
      const nextPage = allMatchesPage + 1;
      const res = await fetch(`/api/matchmaker/daily-suggestions/preview?allMatches=true&userId=${expandedUserId}&page=${nextPage}&limit=20`);
      if (!res.ok) throw new Error('Failed to load more');

      const data = await res.json();
      setAllMatches(prev => [...prev, ...(data.matches || [])]);
      setAllMatchesHasMore(data.hasMore || false);
      setAllMatchesPage(nextPage);
    } catch {
      toast.error('שגיאה בטעינת התאמות נוספות');
    } finally {
      setIsLoadingAllMatches(false);
    }
  }, [expandedUserId, allMatchesPage, isLoadingAllMatches]);

  // ===== V4.0: Select match from expanded panel =====
  const handleSelectFromExpanded = useCallback((matchId: string) => {
    if (!expandedUserId) return;
    setPreviews(prev =>
      prev.map(p =>
        p.user.id === expandedUserId ? { ...p, selectedMatchId: matchId, customMatchingReason: null } : p
      )
    );
    setExpandedUserId(null);
    toast.success('ההתאמה הוחלפה');
  }, [expandedUserId]);

  // ===== V4.0: Dismiss match from expanded panel =====
  const handleDismissFromExpanded = useCallback(async (matchId: string, otherParty: PreviewOtherParty) => {
    if (!expandedUserId) return;

    const expandedUser = previews.find(p => p.user.id === expandedUserId)?.user;
    if (!expandedUser) return;

    rejectionFeedback.open({
      partyA: {
        id: expandedUser.id,
        profileId: expandedUser.id, // will be resolved by API
        firstName: expandedUser.firstName,
        lastName: expandedUser.lastName,
        gender: (expandedUser.gender as 'MALE' | 'FEMALE') || undefined,
      },
      partyB: {
        id: otherParty.id,
        profileId: otherParty.id,
        firstName: otherParty.firstName,
        lastName: otherParty.lastName,
        gender: (otherParty.gender as 'MALE' | 'FEMALE') || undefined,
      },
      potentialMatchId: matchId,
    });
  }, [expandedUserId, previews, rejectionFeedback]);

  // ===== V4.0: After rejection submitted =====
  const handleRejectionSubmit = useCallback(async (data: any) => {
    try {
      await rejectionFeedback.submit(data);
      // Remove the dismissed match from allMatches
      setAllMatches(prev => prev.filter(m => m.matchId !== data.potentialMatchId));
      setAllMatchesTotal(prev => prev - 1);
      toast.success('ההתאמה נדחתה');
    } catch {
      toast.error('שגיאה בדחייה');
    }
  }, [rejectionFeedback]);

  // ===== Send all approved =====
  const handleSendAll = useCallback(async () => {
    setShowConfirmSend(false);

    const readyItems = previews.filter((p) => p.status === 'ready' && p.selectedMatchId);
    if (readyItems.length === 0) {
      toast.error('אין הצעות לשליחה');
      return;
    }

    const assignments = readyItems.map((p) => ({
      userId: p.user.id,
      matchId: p.selectedMatchId!,
      ...(p.customMatchingReason ? { customMatchingReason: p.customMatchingReason } : {}),
    }));

    try {
      setIsSending(true);
      toast.loading(`שולח ${assignments.length} הצעות...`, { id: 'send-all' });

      const response = await fetch('/api/matchmaker/daily-suggestions/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });

      if (!response.ok) throw new Error('Failed to send suggestions');

      const data = await response.json();

      toast.success(`${data.sent} הצעות נשלחו!`, {
        id: 'send-all',
        description: data.errors?.length > 0 ? `${data.errors.length} שגיאות` : undefined,
        duration: 8000,
      });

      // Clear sent items from preview
      const sentUserIds = new Set(assignments.map((a) => a.userId));
      const errorUserIds = new Set((data.errors || []).map((e: any) => e.userId));
      setPreviews((prev) =>
        prev.filter((p) => !sentUserIds.has(p.user.id) || errorUserIds.has(p.user.id))
      );
    } catch (err) {
      toast.error('שגיאה בשליחה', { id: 'send-all' });
    } finally {
      setIsSending(false);
    }
  }, [previews]);

  const readyCount = previews.filter((p) => p.status === 'ready' && p.selectedMatchId).length;
  const noMatchCount = previews.filter((p) => p.status === 'no_matches').length;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50/50 to-purple-50/30">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-violet-900">הכנת הצעות יומיות</h3>
              <p className="text-xs text-violet-500">תצוגה מקדימה → סקירה → שליחה</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasGenerated && readyCount > 0 && (
              <Button
                size="sm"
                onClick={() => setShowConfirmSend(true)}
                disabled={isSending}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-xl shadow-lg"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-1" />
                )}
                שלח {readyCount} הצעות
              </Button>
            )}

            <div className="flex items-center gap-1.5 bg-white/80 border border-violet-200 rounded-xl px-2 py-1">
              <label className="text-[10px] text-violet-500 whitespace-nowrap">כמות:</label>
              <Input
                type="number"
                min={1}
                max={100}
                value={filters.limit}
                onChange={(e) => updateFilter('limit', e.target.value)}
                placeholder="הכל"
                className="h-7 w-16 text-xs text-center border-0 bg-transparent p-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                dir="ltr"
              />
            </div>

            <Button
              size="sm"
              variant={hasGenerated ? 'outline' : 'default'}
              onClick={handleGenerate}
              disabled={isGenerating}
              className={cn(
                'rounded-xl',
                !hasGenerated && 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 ml-1 animate-spin" />
              ) : hasGenerated ? (
                <RefreshCw className="w-4 h-4 ml-1" />
              ) : (
                <Zap className="w-4 h-4 ml-1" />
              )}
              {isGenerating ? 'מכין...' : hasGenerated ? `הכן הצעות${filters.limit ? ` (${filters.limit})` : ''}` : `הכן הצעות${filters.limit ? ` (${filters.limit})` : ''}`}
            </Button>
          </div>
        </div>

        {/* ===== Filter Bar ===== */}
        <div className="space-y-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-800 transition-colors"
          >
            <SearchIcon size={12} />
            <span>{showFilters ? 'הסתר סינונים' : 'סינון ומיון'}</span>
            <ChevronDown size={12} className={cn('transition-transform', showFilters && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/70 rounded-xl border border-violet-100 p-3 space-y-3">
                  {/* Row 1: Search + Gender + Limit */}
                  <div className="flex flex-wrap gap-2 items-end">
                    {/* Search by name */}
                    <div className="flex-1 min-w-[180px]">
                      <label className="text-[10px] text-gray-500 mb-0.5 block">חיפוש לפי שם</label>
                      <Input
                        value={filters.searchName}
                        onChange={(e) => updateFilter('searchName', e.target.value)}
                        placeholder="שם פרטי, משפחה או מייל..."
                        className="h-8 text-xs"
                        dir="rtl"
                      />
                    </div>

                    {/* Gender */}
                    <div className="min-w-[100px]">
                      <label className="text-[10px] text-gray-500 mb-0.5 block">מגדר</label>
                      <Select
                        value={filters.gender || 'all'}
                        onValueChange={(v) => updateFilter('gender', v === 'all' ? '' : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">הכל</SelectItem>
                          <SelectItem value="MALE">♂ גברים</SelectItem>
                          <SelectItem value="FEMALE">♀ נשים</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Limit */}
                    <div className="min-w-[100px]">
                      <label className="text-[10px] text-gray-500 mb-0.5 block">הגבלת כמות</label>
                      <Select
                        value={filters.limit || 'all'}
                        onValueChange={(v) => updateFilter('limit', v === 'all' ? '' : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">הכל</SelectItem>
                          <SelectItem value="5">5 ראשונים</SelectItem>
                          <SelectItem value="10">10 ראשונים</SelectItem>
                          <SelectItem value="20">20 ראשונים</SelectItem>
                          <SelectItem value="50">50 ראשונים</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 2: No suggestion days + Sort */}
                  <div className="flex flex-wrap gap-2 items-end">
                    {/* No suggestion in X days */}
                    <div className="min-w-[160px]">
                      <label className="text-[10px] text-gray-500 mb-0.5 block">לא קיבל הצעה ב-</label>
                      <Select
                        value={filters.noSuggestionDays || 'any'}
                        onValueChange={(v) => updateFilter('noSuggestionDays', v === 'any' ? '' : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">ללא הגבלה</SelectItem>
                          <SelectItem value="3">3 ימים+</SelectItem>
                          <SelectItem value="7">שבוע+</SelectItem>
                          <SelectItem value="14">שבועיים+</SelectItem>
                          <SelectItem value="30">חודש+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sort */}
                    <div className="min-w-[160px]">
                      <label className="text-[10px] text-gray-500 mb-0.5 block">מיון לפי</label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(v) => updateFilter('sortBy', v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waiting_time">⏰ זמן המתנה (הכי ארוך קודם)</SelectItem>
                          <SelectItem value="best_match">🏆 ציון התאמה (הכי גבוה קודם)</SelectItem>
                          <SelectItem value="registration_date">📅 תאריך הרשמה (חדשים קודם)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 3: Scan method + Scan date + Apply */}
                  <div className="flex flex-wrap gap-2 items-end">
                    {/* Scan method */}
                    <div className="min-w-[140px]">
                      <label className="text-[10px] text-gray-500 mb-0.5 block">שיטת סריקה</label>
                      <Select
                        value={filters.scanMethod || 'any'}
                        onValueChange={(v) => updateFilter('scanMethod', v === 'any' ? '' : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">כל השיטות</SelectItem>
                          <SelectItem value="hybrid">🔀 Hybrid</SelectItem>
                          <SelectItem value="algorithmic">🤖 Algorithmic</SelectItem>
                          <SelectItem value="vector">📐 Vector</SelectItem>
                          <SelectItem value="metrics_v2">📊 Metrics V2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Scan date */}
                    <div className="min-w-[140px]">
                      <label className="text-[10px] text-gray-500 mb-0.5 block">סריקה מתאריך</label>
                      <Select
                        value={filters.scanAfter || 'any'}
                        onValueChange={(v) => updateFilter('scanAfter', v === 'any' ? '' : v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">הכל</SelectItem>
                          <SelectItem value={new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()}>אתמול+</SelectItem>
                          <SelectItem value={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()}>3 ימים אחרונים</SelectItem>
                          <SelectItem value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}>שבוע אחרון</SelectItem>
                          <SelectItem value={new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()}>שבועיים אחרונים</SelectItem>
                          <SelectItem value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}>חודש אחרון</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Apply button */}
                    <Button
                      size="sm"
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="h-8 text-xs bg-violet-600 text-white hover:bg-violet-700 rounded-lg"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <SearchIcon size={12} className="ml-1" />}
                      הכן עם סינון
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-violet-200">
              <Users size={12} className="ml-1" />
              {stats.eligibleCount} זכאים
            </Badge>
            {stats.filteredCount !== stats.eligibleCount && (
              <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                <SearchIcon size={12} className="ml-1" />
                {stats.filteredCount} אחרי סינון
              </Badge>
            )}
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              <CheckCircle size={12} className="ml-1" />
              {stats.withMatches} עם התאמה
            </Badge>
            {stats.withoutMatches > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                <AlertTriangle size={12} className="ml-1" />
                {stats.withoutMatches} ללא התאמה
              </Badge>
            )}
            <Badge className="bg-gray-100 text-gray-600 border-gray-200">
              {stats.hasBlockingSuggestion} עם הצעה פעילה (דולגו)
            </Badge>
            {readyCount < (stats.withMatches || 0) && (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                <Trash2 size={12} className="ml-1" />
                {(stats.withMatches || 0) - readyCount} הוסרו
              </Badge>
            )}
          </div>
        )}

        {/* Preview cards */}
        {!hasGenerated ? (
          <div className="text-center py-10 text-violet-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">לחץ על &quot;הכן הצעות&quot; כדי לייצר תצוגה מקדימה</p>
            <p className="text-xs mt-1 opacity-60">המערכת תמצא את ההתאמה הטובה ביותר לכל יוזר זכאי</p>
          </div>
        ) : previews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {stats && stats.hasBlockingSuggestion > 0 && stats.withMatches === 0 ? (
              <>
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <p className="text-sm font-medium text-gray-600">אין הצעות זמינות כרגע</p>
                <p className="text-xs mt-1 text-gray-400">
                  {stats.hasBlockingSuggestion} משתמשים עם הצעה פעילה, {stats.withoutMatches} ללא התאמה מתאימה
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">לא נמצאו התאמות זמינות</p>
                <p className="text-xs mt-1 text-gray-400">
                  {stats?.eligibleCount === 0
                    ? 'אין משתמשים זכאים במערכת'
                    : stats?.withoutMatches
                      ? `${stats.withoutMatches} משתמשים ללא התאמה (ציון מינימלי 70)`
                      : 'נסה לשנות את הסינון או להפעיל סריקה חדשה'}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {previews.map((item) => (
                <PreviewCard
                  key={item.user.id}
                  item={item}
                  onRemove={handleRemove}
                  onChangeMatch={handleChangeMatch}
                  onViewProfile={onViewProfile}
                  onScanUser={handleScanUser}
                  isScanningUser={scanningUserIds.has(item.user.id)}
                  onEditReason={handleEditReason}
                  onExpandMatches={handleExpandMatches}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* V4.0: Expanded Matches Dialog */}
        <Dialog open={!!expandedUserId} onOpenChange={(open) => !open && setExpandedUserId(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Users size={18} className="text-violet-600" />
                כל ההתאמות
                {expandedUserId && (() => {
                  const expandedUser = previews.find(p => p.user.id === expandedUserId)?.user;
                  return expandedUser ? (
                    <span className="text-gray-500 font-normal text-sm">
                      עבור {expandedUser.firstName} {expandedUser.lastName}
                    </span>
                  ) : null;
                })()}
                <Badge variant="outline" className="text-xs mr-auto">{allMatchesTotal} סה&quot;כ</Badge>
              </DialogTitle>
            </DialogHeader>

            {isLoadingAllMatches && allMatches.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              </div>
            ) : allMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <XCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">אין התאמות זמינות</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allMatches.map((match) => {
                    const matchAge = calculateAge(match.otherParty.birthDate);
                    const isSelected = previews.find(p => p.user.id === expandedUserId)?.selectedMatchId === match.matchId;

                    return (
                      <div
                        key={match.matchId}
                        className={cn(
                          'border rounded-xl p-3 space-y-2 transition-all',
                          isSelected ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200' : 'border-gray-200 hover:border-gray-300 bg-white'
                        )}
                      >
                        {/* Match header: avatar + info + score */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onViewProfile(match.otherParty.id)}
                            className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 hover:ring-2 ring-violet-300"
                          >
                            {match.otherParty.mainImage ? (
                              <img src={match.otherParty.mainImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Users size={16} />
                              </div>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              <span className={cn('ml-1', match.otherParty.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500')}>
                                {match.otherParty.gender === 'MALE' ? '♂' : '♀'}
                              </span>
                              {match.otherParty.firstName} {match.otherParty.lastName}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              {matchAge && <span>{matchAge}</span>}
                              {match.otherParty.city && <><span>•</span><span className="truncate">{match.otherParty.city}</span></>}
                              {match.otherParty.religiousLevel && <><span>•</span><span className="truncate">{match.otherParty.religiousLevel}</span></>}
                            </div>
                          </div>
                          <Badge className={cn('text-sm font-bold border flex-shrink-0', getScoreColor(match.aiScore))}>
                            {Math.round(match.aiScore)}
                          </Badge>
                        </div>

                        {/* Reasoning */}
                        {match.shortReasoning && (
                          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 px-1">
                            {match.shortReasoning}
                          </p>
                        )}

                        {/* Direction indicator */}
                        {match.partyDirection && (
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-1">
                            <span className={cn('font-semibold', match.partyDirection.firstPartyGender === 'MALE' ? 'text-blue-500' : 'text-pink-500')}>
                              {match.partyDirection.firstPartyGender === 'MALE' ? '♂' : '♀'} {match.partyDirection.firstPartyName.split(' ')[0]}
                            </span>
                            <ArrowLeft size={10} className="text-gray-300" />
                            <span className={cn('font-semibold', match.partyDirection.firstPartyGender === 'MALE' ? 'text-pink-500' : 'text-blue-500')}>
                              {match.partyDirection.firstPartyGender === 'MALE' ? '♀' : '♂'} {match.partyDirection.secondPartyName.split(' ')[0]}
                            </span>
                          </div>
                        )}

                        {/* Badges: selected + previously sent */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isSelected && (
                            <Badge className="text-[9px] h-5 bg-violet-100 text-violet-700 border-violet-200">
                              <CheckCircle size={10} className="ml-1" />
                              נבחר כרגע
                            </Badge>
                          )}
                          {match.previousSuggestion && (
                            <Badge variant="outline" className="text-[9px] h-5 border-amber-300 text-amber-600 bg-amber-50">
                              <History size={10} className="ml-1" />
                              נשלח בעבר — {match.previousSuggestion.status === 'EXPIRED' ? 'פג תוקף' :
                                match.previousSuggestion.status === 'FIRST_PARTY_DECLINED' ? 'צד 1 דחה' :
                                match.previousSuggestion.status === 'SECOND_PARTY_DECLINED' ? 'צד 2 דחה' :
                                match.previousSuggestion.status === 'CLOSED' ? 'נסגר' : match.previousSuggestion.status}
                            </Badge>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            className={cn(
                              'flex-1 h-8 text-xs rounded-lg',
                              isSelected
                                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 border border-violet-200'
                                : 'bg-violet-600 text-white hover:bg-violet-700'
                            )}
                            onClick={() => handleSelectFromExpanded(match.matchId)}
                            disabled={isSelected}
                          >
                            {isSelected ? 'נבחר' : 'בחר התאמה'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 border-red-200"
                            onClick={() => handleDismissFromExpanded(match.matchId, match.otherParty)}
                            title="דחה התאמה"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load more */}
                {allMatchesHasMore && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLoadMoreMatches}
                      disabled={isLoadingAllMatches}
                      className="text-xs"
                    >
                      {isLoadingAllMatches ? (
                        <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                      ) : null}
                      טען עוד ({allMatchesTotal - allMatches.length} נותרו)
                    </Button>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* V4.0: Rejection Feedback Modal */}
        <RejectionFeedbackModal
          isOpen={rejectionFeedback.isOpen}
          onClose={rejectionFeedback.close}
          onSubmit={handleRejectionSubmit}
          partyA={rejectionFeedback.context?.partyA || { id: '', profileId: '', firstName: '', lastName: '' }}
          partyB={rejectionFeedback.context?.partyB || { id: '', profileId: '', firstName: '', lastName: '' }}
          defaultRejectingParty={rejectionFeedback.context?.defaultRejectingParty}
          potentialMatchId={rejectionFeedback.context?.potentialMatchId}
        />

        {/* Confirm Send Dialog */}
        <AlertDialog open={showConfirmSend} onOpenChange={setShowConfirmSend}>
          <AlertDialogContent className="border-0 shadow-2xl rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                שליחת {readyCount} הצעות
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-gray-600 leading-relaxed">
                <p>כל ההצעות ברשימה יישלחו ליוזרים הזכאים.</p>
                <p className="text-sm text-gray-500 mt-1">
                  כל יוזר יקבל מייל + הודעת וואטסאפ עם קישור להצעה.
                </p>
                {noMatchCount > 0 && (
                  <p className="text-sm text-amber-600 font-medium mt-2">
                    ⚠️ {noMatchCount} יוזרים ללא התאמה לא ייכללו בשליחה.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel className="rounded-xl">ביטול</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSendAll}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg"
              >
                <Send className="w-4 h-4 ml-2" />
                שלח {readyCount} הצעות
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}