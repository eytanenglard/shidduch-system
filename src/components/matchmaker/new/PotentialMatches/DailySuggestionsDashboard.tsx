// =============================================================================
// 📁 src/components/matchmaker/new/PotentialMatches/DailySuggestionsDashboard.tsx
// דשבורד הצעות יומיות - מאפשר לשדכן להריץ הצעות ידנית ולצפות בתוצאות
// =============================================================================

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Sparkles,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Send,
  Bell,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  Heart,
  Zap,
  BarChart3,
  Search,
  UserPlus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

interface SuggestionParty {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  city: string | null;
  religiousLevel: string | null;
  mainImage: string | null;
  birthDate: string | null;
}

interface DailySuggestionItem {
  id: string;
  status: string;
  createdAt: string;
  decisionDeadline: string | null;
  matchingReason: string | null;
  internalNotes: string | null;
  lastActivity: string | null;
  firstParty: SuggestionParty;
  secondParty: SuggestionParty;
  statusHistory: {
    id: string;
    status: string;
    notes: string | null;
    createdAt: string;
  }[];
}

interface DailySuggestionsStats {
  totalToday: number;
  pending: number;
  approved: number;
  declined: number;
  allTimeTotal: number;
  allTimeApproved: number;
  acceptanceRate: number;
}

interface RunResult {
  success: boolean;
  durationFormatted: string;
  summary: {
    processed: number;
    newSuggestionsSent: number;
    remindersSent: number;
    skipped: number;
    errors: number;
  };
  details?: {
    userId: string;
    action: string;
    reason?: string;
    matchId?: string;
    suggestionId?: string;
  }[];
}

interface PersonalRunResult {
  success: boolean;
  userId: string;
  userName: string;
  requested: number;
  sent: number;
  suggestions: {
    suggestionId: string;
    matchId: string;
    aiScore: number;
    otherPartyName: string;
  }[];
  skipped: string[];
  errors: string[];
}

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string | null;
  city: string | null;
  mainImage: string | null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const calculateAge = (birthDate: string | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : null;
};

const getStatusDisplay = (
  status: string
): {
  label: string;
  color: string;
  icon: React.ReactNode;
} => {
  const statusMap: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
  > = {
    PENDING_FIRST_PARTY: {
      label: 'ממתין לצד ראשון',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: <Clock size={12} />,
    },
    PENDING_SECOND_PARTY: {
      label: 'ממתין לצד שני',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Clock size={12} />,
    },
    FIRST_PARTY_APPROVED: {
      label: 'צד ראשון אישר',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <CheckCircle size={12} />,
    },
    SECOND_PARTY_APPROVED: {
      label: 'צד שני אישר',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: <CheckCircle size={12} />,
    },
    FIRST_PARTY_DECLINED: {
      label: 'צד ראשון דחה',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle size={12} />,
    },
    SECOND_PARTY_DECLINED: {
      label: 'צד שני דחה',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle size={12} />,
    },
    CONTACT_DETAILS_SHARED: {
      label: 'פרטים שותפו',
      color: 'bg-violet-100 text-violet-800 border-violet-200',
      icon: <Heart size={12} />,
    },
    DATING: {
      label: 'בקשר',
      color: 'bg-pink-100 text-pink-800 border-pink-200',
      icon: <Heart size={12} />,
    },
  };

  return (
    statusMap[status] || {
      label: status.replace(/_/g, ' '),
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: <Clock size={12} />,
    }
  );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// --- Stat Card ---
const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, subtitle, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    </div>
  </motion.div>
);

// --- Party Mini Card ---
const PartyMiniCard: React.FC<{
  party: SuggestionParty;
  label: string;
}> = ({ party, label }) => {
  const age = calculateAge(party.birthDate);
  const genderIcon = party.gender === 'MALE' ? '♂' : '♀';
  const genderColor =
    party.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500';

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
          {party.mainImage ? (
            <img
              src={party.mainImage}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Users size={18} />
            </div>
          )}
        </div>
        <span
          className={`absolute -bottom-0.5 -left-0.5 text-xs font-bold ${genderColor}`}
        >
          {genderIcon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">
          {party.name}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {age && <span>{age}</span>}
          {party.city && (
            <>
              <span>•</span>
              <span className="truncate">{party.city}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Suggestion Row ---
const SuggestionRow: React.FC<{
  suggestion: DailySuggestionItem;
  onViewUser: (userId: string) => void;
}> = ({ suggestion, onViewUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusDisplay = getStatusDisplay(suggestion.status);
  const createdAt = new Date(suggestion.createdAt);

  // Extract PotentialMatch score from internalNotes
  const scoreMatch = suggestion.internalNotes?.match(
    /Score:\s*(\d+(?:\.\d+)?)/
  );
  const aiScore = scoreMatch ? parseFloat(scoreMatch[1]) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Main Row */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Score badge */}
          {aiScore && (
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex flex-col items-center justify-center text-white shadow-sm">
              <span className="text-xs font-medium opacity-80">AI</span>
              <span className="text-sm font-bold leading-none">
                {Math.round(aiScore)}
              </span>
            </div>
          )}

          {/* Parties */}
          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PartyMiniCard party={suggestion.firstParty} label="צד ראשון" />
            <PartyMiniCard party={suggestion.secondParty} label="צד שני" />
          </div>

          {/* Status + Time */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge
              className={cn(
                'flex items-center gap-1 text-xs font-semibold border',
                statusDisplay.color
              )}
            >
              {statusDisplay.icon}
              {statusDisplay.label}
            </Badge>
            <span className="text-xs text-gray-400">
              {format(createdAt, 'HH:mm', { locale: he })}
            </span>
          </div>

          {/* Expand */}
          <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
              {/* Matching Reason */}
              {suggestion.matchingReason && (
                <div className="bg-violet-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-violet-700 mb-1">
                    סיבת ההתאמה:
                  </p>
                  <p className="text-sm text-violet-900/80 leading-relaxed">
                    {suggestion.matchingReason}
                  </p>
                </div>
              )}

              {/* Internal Notes */}
              {suggestion.internalNotes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1">
                    הערות פנימיות:
                  </p>
                  <p className="text-xs text-gray-600 font-mono">
                    {suggestion.internalNotes}
                  </p>
                </div>
              )}

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-3">
                {[suggestion.firstParty, suggestion.secondParty].map(
                  (party, idx) => (
                    <div key={party.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        {idx === 0 ? 'צד ראשון' : 'צד שני'} - {party.name}
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail size={11} />
                          <span className="truncate">{party.email}</span>
                        </div>
                        {party.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Phone size={11} />
                            <span>{party.phone}</span>
                          </div>
                        )}
                        {party.city && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <MapPin size={11} />
                            <span>{party.city}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewUser(party.id);
                        }}
                      >
                        <Eye size={12} className="ml-1" />
                        צפה בפרופיל
                      </Button>
                    </div>
                  )
                )}
              </div>

              {/* Status History */}
              {suggestion.statusHistory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    היסטוריית סטטוס:
                  </p>
                  <div className="space-y-1">
                    {suggestion.statusHistory.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center gap-2 text-xs text-gray-500"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <span className="font-medium">
                          {getStatusDisplay(h.status).label}
                        </span>
                        {h.notes && (
                          <span className="text-gray-400 truncate">
                            - {h.notes}
                          </span>
                        )}
                        <span className="text-gray-300 mr-auto">
                          {format(new Date(h.createdAt), 'dd/MM HH:mm')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DailySuggestionsDashboard() {
  const [suggestions, setSuggestions] = useState<DailySuggestionItem[]>([]);
  const [stats, setStats] = useState<DailySuggestionsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunResult, setLastRunResult] = useState<RunResult | null>(null);
  const [showConfirmRun, setShowConfirmRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // ===== Personal Mode State =====
  const [personalSearchQuery, setPersonalSearchQuery] = useState('');
  const [personalSearchResults, setPersonalSearchResults] = useState<
    UserSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const [personalCount, setPersonalCount] = useState(1);
  const [isRunningPersonal, setIsRunningPersonal] = useState(false);
  const [personalResult, setPersonalResult] =
    useState<PersonalRunResult | null>(null);

  // ===== Fetch today's suggestions =====
  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        '/api/matchmaker/daily-suggestions?date=today'
      );
      if (!response.ok) throw new Error('Failed to fetch daily suggestions');

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  // ===== Run daily suggestions =====
  const handleRunSuggestions = useCallback(async () => {
    setShowConfirmRun(false);

    try {
      setIsRunning(true);
      setError(null);

      toast.loading('מריץ הצעות יומיות...', { id: 'daily-run' });

      const response = await fetch('/api/matchmaker/daily-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to run daily suggestions');
      }

      const result: RunResult = await response.json();
      setLastRunResult(result);

      toast.success('ההרצה הושלמה!', {
        id: 'daily-run',
        description: `${result.summary.newSuggestionsSent} הצעות חדשות, ${result.summary.remindersSent} תזכורות, ${result.summary.skipped} דולגו`,
        duration: 8000,
      });

      // Refresh the list
      await fetchSuggestions();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      toast.error('שגיאה בהרצה', {
        id: 'daily-run',
        description: errorMsg,
      });
    } finally {
      setIsRunning(false);
    }
  }, [fetchSuggestions]);

  // Navigate to user profile
  const handleViewUser = useCallback((userId: string) => {
    window.open(`/matchmaker/candidates/${userId}`, '_blank');
  }, []);

  // ===== Personal Mode: Search users =====
  const handlePersonalSearch = useCallback(async (query: string) => {
    setPersonalSearchQuery(query);
    if (query.length < 2) {
      setPersonalSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/matchmaker/users/search?q=${encodeURIComponent(query)}&limit=8`
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setPersonalSearchResults(data.users || []);
    } catch (err) {
      console.error('Search error:', err);
      setPersonalSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ===== Personal Mode: Run for specific user =====
  const handleRunPersonal = useCallback(async () => {
    if (!selectedUser) return;

    try {
      setIsRunningPersonal(true);
      setPersonalResult(null);

      toast.loading(
        `שולח ${personalCount} הצעות ל${selectedUser.firstName}...`,
        { id: 'personal-run' }
      );

      const response = await fetch('/api/matchmaker/daily-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          count: personalCount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed');
      }

      const data = await response.json();
      const result: PersonalRunResult = data.result;
      setPersonalResult(result);

      if (result.success) {
        toast.success(`נשלחו ${result.sent} הצעות!`, {
          id: 'personal-run',
          description: result.suggestions
            .map((s) => `${s.otherPartyName} (${Math.round(s.aiScore)})`)
            .join(', '),
          duration: 10000,
        });
      } else {
        toast.error('לא נשלחו הצעות', {
          id: 'personal-run',
          description: result.errors.join(', ') || result.skipped.join(', '),
        });
      }

      // Refresh main list
      await fetchSuggestions();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      toast.error('שגיאה', { id: 'personal-run', description: errorMsg });
    } finally {
      setIsRunningPersonal(false);
    }
  }, [selectedUser, personalCount, fetchSuggestions]);

  // Load on mount
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6" dir="rtl">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              הצעות יומיות אוטומטיות
            </h2>
            <p className="text-sm text-gray-500">
              הרצה ידנית ומעקב אחרי הצעות שנשלחו היום
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSuggestions}
            disabled={isLoading}
            className="rounded-xl"
          >
            <RefreshCw
              className={cn('w-4 h-4 ml-1', isLoading && 'animate-spin')}
            />
            רענן
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => setShowConfirmRun(true)}
                  disabled={isRunning}
                  className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 ml-1" />
                  )}
                  {isRunning ? 'מריץ...' : 'הרץ הצעות יומיות'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>שולח הצעת שידוך יומית אחת לכל יוזר זכאי</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* ===== Stats Cards ===== */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            title="נשלחו היום"
            value={stats.totalToday}
            icon={<Send size={18} className="text-violet-600" />}
            color="bg-violet-50"
          />
          <StatCard
            title="ממתינים"
            value={stats.pending}
            icon={<Clock size={18} className="text-amber-600" />}
            color="bg-amber-50"
          />
          <StatCard
            title="אושרו"
            value={stats.approved}
            icon={<CheckCircle size={18} className="text-emerald-600" />}
            color="bg-emerald-50"
          />
          <StatCard
            title="נדחו"
            value={stats.declined}
            icon={<XCircle size={18} className="text-red-600" />}
            color="bg-red-50"
          />
          <StatCard
            title="סה״כ שנשלחו"
            value={stats.allTimeTotal}
            subtitle="מאז ההתחלה"
            icon={<BarChart3 size={18} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="אושרו סה״כ"
            value={stats.allTimeApproved}
            icon={<Heart size={18} className="text-pink-600" />}
            color="bg-pink-50"
          />
          <StatCard
            title="אחוז אישור"
            value={`${stats.acceptanceRate}%`}
            icon={<TrendingUp size={18} className="text-indigo-600" />}
            color="bg-indigo-50"
          />
        </div>
      )}

      {/* ===== Last Run Result ===== */}
      {lastRunResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-violet-50 via-purple-50/50 to-indigo-50 border border-violet-200/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-bold text-violet-800">
              תוצאות ההרצה האחרונה
            </h3>
            <span className="text-xs text-violet-500">
              ({lastRunResult.durationFormatted})
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="border-gray-300">
              <Users size={12} className="ml-1" />
              {lastRunResult.summary.processed} עובדו
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              <Send size={12} className="ml-1" />
              {lastRunResult.summary.newSuggestionsSent} הצעות חדשות
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              <Bell size={12} className="ml-1" />
              {lastRunResult.summary.remindersSent} תזכורות
            </Badge>
            <Badge className="bg-gray-100 text-gray-600 border-gray-200">
              {lastRunResult.summary.skipped} דולגו
            </Badge>
            {lastRunResult.summary.errors > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <AlertTriangle size={12} className="ml-1" />
                {lastRunResult.summary.errors} שגיאות
              </Badge>
            )}
          </div>

          {/* Show details if available */}
          {lastRunResult.details && lastRunResult.details.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs text-violet-600 cursor-pointer hover:text-violet-700 font-medium">
                פרטי הרצה ({lastRunResult.details.length} יוזרים)
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                {lastRunResult.details.map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs py-1 border-b border-violet-100/50 last:border-0"
                  >
                    <span className="font-mono text-gray-400 w-24 truncate">
                      {d.userId.slice(0, 12)}...
                    </span>
                    <Badge
                      className={cn(
                        'text-[10px] h-5',
                        d.action === 'new_suggestion' &&
                          'bg-emerald-100 text-emerald-700',
                        d.action === 'reminder' &&
                          'bg-amber-100 text-amber-700',
                        d.action === 'skipped' && 'bg-gray-100 text-gray-600',
                        d.action === 'error' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {d.action === 'new_suggestion'
                        ? '✅ הצעה'
                        : d.action === 'reminder'
                          ? '🔔 תזכורת'
                          : d.action === 'skipped'
                            ? '⏭️ דולג'
                            : '❌ שגיאה'}
                    </Badge>
                    {d.reason && (
                      <span className="text-gray-400 truncate flex-1">
                        {d.reason}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </motion.div>
      )}

      {/* ===== Error ===== */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">שגיאה</p>
            <p className="text-xs text-red-600">{error}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mr-auto text-red-600 hover:text-red-700"
            onClick={() => setError(null)}
          >
            <XCircle size={14} />
          </Button>
        </div>
      )}

      {/* ===== Personal Mode Section ===== */}
      <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-indigo-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            מצב אישי — שלח הצעות ליוזר ספציפי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="חפש לפי שם, מייל או טלפון..."
              value={personalSearchQuery}
              onChange={(e) => handlePersonalSearch(e.target.value)}
              className="pr-10 rounded-xl border-indigo-200 focus:border-indigo-400"
            />
            {isSearching && (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 animate-spin" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {personalSearchResults.length > 0 && !selectedUser && (
            <div className="bg-white border border-indigo-100 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
              {personalSearchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSelectedUser(u);
                    setPersonalSearchQuery('');
                    setPersonalSearchResults([]);
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 transition-colors text-right"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {u.mainImage ? (
                      <img
                        src={u.mainImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {u.firstName} {u.lastName}
                      <span
                        className={cn(
                          'mr-1 text-xs',
                          u.gender === 'MALE'
                            ? 'text-blue-500'
                            : 'text-pink-500'
                        )}
                      >
                        {u.gender === 'MALE' ? '♂' : '♀'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>
                  {u.city && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {u.city}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="bg-white border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {selectedUser.mainImage ? (
                      <img
                        src={selectedUser.mainImage}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Users size={20} />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {selectedUser.firstName} {selectedUser.lastName}
                      <span
                        className={cn(
                          'mr-1',
                          selectedUser.gender === 'MALE'
                            ? 'text-blue-500'
                            : 'text-pink-500'
                        )}
                      >
                        {selectedUser.gender === 'MALE' ? '♂' : '♀'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-red-500"
                  onClick={() => {
                    setSelectedUser(null);
                    setPersonalResult(null);
                  }}
                >
                  <XCircle size={16} />
                </Button>
              </div>

              {/* Count + Run */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">כמות הצעות:</span>
                  <div className="flex items-center bg-gray-100 rounded-lg">
                    {[1, 2, 3, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setPersonalCount(n)}
                        className={cn(
                          'px-3 py-1.5 text-sm font-semibold rounded-lg transition-all',
                          personalCount === n
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleRunPersonal}
                  disabled={isRunningPersonal}
                  className="mr-auto bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl shadow-lg"
                >
                  {isRunningPersonal ? (
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 ml-1" />
                  )}
                  {isRunningPersonal ? 'שולח...' : `שלח ${personalCount} הצעות`}
                </Button>
              </div>
            </div>
          )}

          {/* Personal Run Result */}
          {personalResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'rounded-xl p-4 border',
                personalResult.success
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {personalResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-bold text-gray-800">
                  {personalResult.success
                    ? `נשלחו ${personalResult.sent} מתוך ${personalResult.requested} הצעות ל${personalResult.userName}`
                    : `לא הצלחנו לשלוח הצעות ל${personalResult.userName}`}
                </span>
              </div>

              {/* Sent suggestions */}
              {personalResult.suggestions.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {personalResult.suggestions.map((s, i) => (
                    <div
                      key={s.suggestionId}
                      className="flex items-center gap-2 text-sm bg-white/60 rounded-lg px-3 py-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {Math.round(s.aiScore)}
                      </div>
                      <span className="font-medium text-gray-800">
                        {s.otherPartyName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 border-emerald-300 text-emerald-700 mr-auto"
                      >
                        נשלח ✓
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Skipped / Errors */}
              {personalResult.skipped.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="font-medium">דולגו: </span>
                  {personalResult.skipped.join(', ')}
                </div>
              )}
              {personalResult.errors.length > 0 && (
                <div className="mt-1 text-xs text-red-600">
                  <span className="font-medium">שגיאות: </span>
                  {personalResult.errors.join(', ')}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* ===== Suggestions List ===== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-700">
            הצעות שנשלחו היום
            {suggestions.length > 0 && (
              <span className="text-sm font-normal text-gray-400 mr-2">
                ({suggestions.length})
              </span>
            )}
          </h3>
        </div>

        {isInitialLoad ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500">טוען הצעות...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-100">
            <div className="p-4 bg-violet-50 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              אין הצעות היום
            </h3>
            <p className="text-sm text-gray-500 max-w-md mb-4">
              לא נשלחו עדיין הצעות יומיות היום. לחץ על &quot;הרץ הצעות
              יומיות&quot; כדי לשלוח הצעות לכל היוזרים הזכאים.
            </p>
            <Button
              onClick={() => setShowConfirmRun(true)}
              disabled={isRunning}
              className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl"
            >
              <Play className="w-4 h-4 ml-1" />
              הרץ הצעות יומיות
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <SuggestionRow
                key={s.id}
                suggestion={s}
                onViewUser={handleViewUser}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== Confirm Run Dialog ===== */}
      <AlertDialog open={showConfirmRun} onOpenChange={setShowConfirmRun}>
        <AlertDialogContent className="border-0 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              הרצת הצעות יומיות
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600 leading-relaxed space-y-2">
              <p>
                פעולה זו תשלח הצעת שידוך יומית אחת לכל יוזר זכאי שעדיין לא קיבל
                הצעה היום.
              </p>
              <p className="text-sm text-amber-600 font-medium">
                ⚠️ יוזרים שכבר קיבלו הצעה שממתינה לתגובתם יקבלו תזכורת במקום
                הצעה חדשה.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="rounded-xl">ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRunSuggestions}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg"
            >
              <Play className="w-4 h-4 ml-2" />
              הרץ עכשיו
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
