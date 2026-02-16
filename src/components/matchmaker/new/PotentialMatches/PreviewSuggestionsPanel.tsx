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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  otherParty: PreviewOtherParty;
}

interface PreviewItem {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: string | null;
  };
  selectedMatchId: string | null;
  matches: PreviewMatch[];
  status: 'ready' | 'no_matches';
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
}> = ({ item, onRemove, onChangeMatch, onViewProfile, onScanUser, isScanningUser }) => {
  const selectedMatch = item.matches.find((m) => m.matchId === item.selectedMatchId);
  const otherParty = selectedMatch?.otherParty;
  const age = otherParty ? calculateAge(otherParty.birthDate) : null;
  const genderIcon = item.user.gender === 'MALE' ? '♂' : '♀';
  const genderColor = item.user.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500';

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
      <div className="p-3 flex items-center gap-3 border-b border-gray-50">
        <button
          onClick={() => onViewProfile(item.user.id)}
          className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity"
          title="לחץ לצפייה בפרופיל"
        >
          <span className={cn('text-sm font-bold', genderColor)}>{genderIcon}</span>
          <span className="text-sm font-semibold text-gray-800 truncate">
            {item.user.firstName} {item.user.lastName}
          </span>
          <Eye size={12} className="text-gray-300 flex-shrink-0" />
        </button>

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

          {/* Reasoning */}
          {selectedMatch?.shortReasoning && (
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 px-1">
              {selectedMatch.shortReasoning}
            </p>
          )}

          {/* Match selector dropdown */}
          {item.matches.length > 1 && (
            <Select
              value={item.selectedMatchId || ''}
              onValueChange={(matchId) => onChangeMatch(item.user.id, matchId)}
            >
              <SelectTrigger className="h-8 text-xs border-dashed">
                <SelectValue placeholder="החלף התאמה" />
              </SelectTrigger>
              <SelectContent>
                {item.matches.map((m, idx) => (
                  <SelectItem key={m.matchId} value={m.matchId}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{Math.round(m.aiScore)}</span>
                      <span className="truncate">
                        {m.otherParty.firstName} {m.otherParty.lastName}
                      </span>
                      {m.otherParty.city && (
                        <span className="text-gray-400 text-[10px]">({m.otherParty.city})</span>
                      )}
                      {idx === 0 && (
                        <Badge className="text-[9px] h-4 bg-emerald-100 text-emerald-700 border-0">
                          מומלץ
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
    withMatches: number;
    withoutMatches: number;
    hasBlockingSuggestion: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [scanningUserIds, setScanningUserIds] = useState<Set<string>>(new Set());

  // ===== Generate Preview =====
  const handleGenerate = useCallback(async () => {
    try {
      setIsGenerating(true);
      toast.loading('מכין תצוגה מקדימה...', { id: 'preview-gen' });

      const response = await fetch('/api/matchmaker/daily-suggestions/preview');
      if (!response.ok) throw new Error('Failed to generate preview');

      const data = await response.json();
      setPreviews(data.previews || []);
      setStats({
        eligibleCount: data.eligibleCount,
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
  }, []);

  // ===== Remove from preview =====
  const handleRemove = useCallback((userId: string) => {
    setPreviews((prev) => prev.filter((p) => p.user.id !== userId));
  }, []);

  // ===== Change selected match =====
  const handleChangeMatch = useCallback((userId: string, matchId: string) => {
    setPreviews((prev) =>
      prev.map((p) =>
        p.user.id === userId ? { ...p, selectedMatchId: matchId } : p
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
              {isGenerating ? 'מכין...' : hasGenerated ? 'הכן מחדש' : 'הכן הצעות'}
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-violet-200">
              <Users size={12} className="ml-1" />
              {stats.eligibleCount} זכאים
            </Badge>
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
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm font-medium text-gray-600">כל ההצעות נשלחו!</p>
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
                />
              ))}
            </AnimatePresence>
          </div>
        )}

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