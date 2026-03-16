// src/components/matchmaker/CandidateHub/index.tsx
// תיק מועמד — מרכז מידע אחוד לשדכן: פרופיל, הצעות, התאמות, הודעות, עריכה ומיילים

'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Heart,
  Target,
  MessageCircle,
  Edit,
  Mail,
  Search,
  X,
  MapPin,
  Calendar,
  Phone,
  Loader2,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { useCandidates } from '@/components/matchmaker/new/hooks/useCandidates';
import type { Candidate } from '@/components/matchmaker/new/types/candidates';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';
import type { Locale } from '../../../../i18n-config';
import { cn, getInitials } from '@/lib/utils';

// =============================================================================
// DYNAMIC IMPORTS — טעינה עצלה של קומפוננטות כבדות
// =============================================================================

const DynamicProfileCard = dynamic(
  () => import('@/components/profile/ProfileCard'),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false,
  }
);

const DynamicMatchmakerChatPanel = dynamic(
  () => import('@/components/messages/MatchmakerChatPanel'),
  {
    loading: () => <TabLoadingSkeleton />,
    ssr: false,
  }
);

const DynamicMatchmakerEditProfile = dynamic(
  () => import('@/components/matchmaker/new/MatchmakerEditProfile'),
  { ssr: false }
);

// =============================================================================
// TYPES
// =============================================================================

interface CandidateHubProps {
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
  locale: Locale;
}

interface SuggestionListItem {
  id: string;
  status: string;
  createdAt: string;
  category: string;
  unreadChatCount: number;
  firstParty: {
    id: string;
    firstName: string;
    lastName: string;
    profile?: { city?: string; birthDate?: string };
    images?: { url: string }[];
  };
  secondParty: {
    id: string;
    firstName: string;
    lastName: string;
    profile?: { city?: string; birthDate?: string };
    images?: { url: string }[];
  };
}

interface PotentialMatchListItem {
  id: string;
  aiScore: number;
  status: string;
  male: { id: string; firstName: string; lastName: string; profile?: { city?: string; religiousLevel?: string } };
  female: { id: string; firstName: string; lastName: string; profile?: { city?: string; religiousLevel?: string } };
}

// =============================================================================
// HELPERS
// =============================================================================

const statusColors: Record<string, string> = {
  PENDING_FIRST_PARTY: 'bg-amber-100 text-amber-700',
  PENDING_SECOND_PARTY: 'bg-blue-100 text-blue-700',
  FIRST_PARTY_APPROVED: 'bg-teal-100 text-teal-700',
  FIRST_PARTY_DECLINED: 'bg-red-100 text-red-700',
  SECOND_PARTY_APPROVED: 'bg-teal-100 text-teal-700',
  SECOND_PARTY_DECLINED: 'bg-red-100 text-red-700',
  CONTACT_DETAILS_SHARED: 'bg-purple-100 text-purple-700',
  DATING: 'bg-rose-100 text-rose-700',
  ENGAGED: 'bg-pink-100 text-pink-700',
  MARRIED: 'bg-emerald-100 text-emerald-700',
  DRAFT: 'bg-gray-100 text-gray-600',
};

function getAge(birthDate: string | Date): number {
  return Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000)
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

const TabLoadingSkeleton = () => (
  <div className="p-6 space-y-4">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-20 w-full rounded-xl" />
    ))}
  </div>
);

// =============================================================================
// SUGGESTIONS TAB
// =============================================================================

const SuggestionsTab = ({
  candidateId,
  isRtl,
}: {
  candidateId: string;
  isRtl: boolean;
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch('/api/matchmaker/suggestions/list')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: SuggestionListItem[]) => {
        const filtered = Array.isArray(data)
          ? data.filter(
              (s) =>
                s.firstParty?.id === candidateId ||
                s.secondParty?.id === candidateId
            )
          : [];
        setSuggestions(filtered);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading) return <TabLoadingSkeleton />;

  if (error)
    return (
      <div className="text-center py-16 text-red-500">
        {isRtl ? 'שגיאה בטעינת ההצעות' : 'Error loading suggestions'}
      </div>
    );

  if (!suggestions.length)
    return (
      <div className="text-center py-16 text-gray-400">
        <Heart className="h-12 w-12 mx-auto mb-3 text-gray-200" />
        <p className="font-medium">
          {isRtl ? 'אין הצעות שידוך' : 'No suggestions yet'}
        </p>
      </div>
    );

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-gray-500 px-1">
        {isRtl ? `${suggestions.length} הצעות` : `${suggestions.length} suggestions`}
      </p>
      {suggestions.map((s) => (
        <Card key={s.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="text-center min-w-[80px]">
                <p className="font-semibold text-sm truncate">
                  {s.firstParty?.firstName} {s.firstParty?.lastName}
                </p>
                {s.firstParty?.profile?.city && (
                  <p className="text-xs text-gray-400 truncate">{s.firstParty.profile.city}</p>
                )}
              </div>
              <Heart className="h-4 w-4 text-rose-400 shrink-0" />
              <div className="text-center min-w-[80px]">
                <p className="font-semibold text-sm truncate">
                  {s.secondParty?.firstName} {s.secondParty?.lastName}
                </p>
                {s.secondParty?.profile?.city && (
                  <p className="text-xs text-gray-400 truncate">{s.secondParty.profile.city}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge
                className={cn(
                  'text-xs font-medium',
                  statusColors[s.status] ?? 'bg-gray-100 text-gray-600'
                )}
              >
                {s.status.replace(/_/g, ' ')}
              </Badge>
              <p className="text-xs text-gray-400">
                {new Date(s.createdAt).toLocaleDateString('he-IL')}
              </p>
              {s.unreadChatCount > 0 && (
                <Badge className="bg-teal-500 text-white text-xs">
                  {s.unreadChatCount}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// =============================================================================
// POTENTIAL MATCHES TAB
// =============================================================================

const PotentialMatchesTab = ({
  candidate,
  isRtl,
}: {
  candidate: Candidate;
  isRtl: boolean;
}) => {
  const [matches, setMatches] = useState<PotentialMatchListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const name = `${candidate.firstName} ${candidate.lastName}`;
    setLoading(true);
    setError(false);
    fetch(
      `/api/matchmaker/potential-matches?searchTerm=${encodeURIComponent(name)}&pageSize=20`
    )
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setMatches(data.matches ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [candidate.id, candidate.firstName, candidate.lastName]);

  if (loading) return <TabLoadingSkeleton />;

  if (error)
    return (
      <div className="text-center py-16 text-red-500">
        {isRtl ? 'שגיאה בטעינת ההתאמות' : 'Error loading matches'}
      </div>
    );

  if (!matches.length)
    return (
      <div className="text-center py-16 text-gray-400">
        <Target className="h-12 w-12 mx-auto mb-3 text-gray-200" />
        <p className="font-medium">
          {isRtl ? 'אין התאמות פוטנציאליות' : 'No potential matches'}
        </p>
      </div>
    );

  return (
    <div className="p-4 space-y-3">
      <p className="text-sm text-gray-500 px-1">
        {isRtl ? `${matches.length} התאמות` : `${matches.length} matches`}
      </p>
      {matches.map((m) => (
        <Card key={m.id} className="hover:shadow-sm transition-shadow">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="text-center min-w-[80px]">
                <p className="font-semibold text-sm truncate">
                  {m.male?.firstName} {m.male?.lastName}
                </p>
                {m.male?.profile?.city && (
                  <p className="text-xs text-gray-400 truncate">{m.male.profile.city}</p>
                )}
              </div>
              <Target className="h-4 w-4 text-teal-400 shrink-0" />
              <div className="text-center min-w-[80px]">
                <p className="font-semibold text-sm truncate">
                  {m.female?.firstName} {m.female?.lastName}
                </p>
                {m.female?.profile?.city && (
                  <p className="text-xs text-gray-400 truncate">{m.female.profile.city}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-teal-600">
                  {m.aiScore ? `${Math.round(m.aiScore)}%` : '—'}
                </span>
                <span className="text-xs text-gray-400">
                  {isRtl ? 'התאמה' : 'match'}
                </span>
              </div>
              {m.status && (
                <Badge variant="outline" className="text-xs">
                  {m.status}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// =============================================================================
// EMAIL HISTORY TAB
// =============================================================================

const EmailHistoryTab = ({ isRtl }: { isRtl: boolean }) => (
  <div className="text-center py-16 text-gray-400 space-y-3">
    <Mail className="h-12 w-12 mx-auto text-gray-200" />
    <p className="font-medium text-gray-500">
      {isRtl ? 'היסטוריית מיילים' : 'Email History'}
    </p>
    <p className="text-sm max-w-xs mx-auto">
      {isRtl
        ? 'רישום המיילים שנשלחו למועמד יהיה זמין בגרסה הבאה.'
        : 'Email history sent to this candidate will be available in the next version.'}
    </p>
  </div>
);

// =============================================================================
// EDIT TAB
// =============================================================================

const EditTab = ({
  candidate,
  matchmakerDict,
  profileDict,
  locale,
  isRtl,
}: {
  candidate: Candidate;
  matchmakerDict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
  locale: Locale;
  isRtl: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8 flex flex-col items-center justify-center gap-5 min-h-[300px]">
      <div className="text-center space-y-2">
        <div className="h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
          <Edit className="h-8 w-8 text-teal-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          {isRtl ? 'עריכת פרופיל' : 'Edit Profile'}
        </h3>
        <p className="text-gray-400 text-sm">
          {isRtl
            ? `ערוך את הפרטים של ${candidate.firstName} ${candidate.lastName}`
            : `Edit ${candidate.firstName} ${candidate.lastName}'s details`}
        </p>
      </div>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
      >
        <Edit className="h-4 w-4" />
        {isRtl ? 'פתח עורך פרופיל' : 'Open Profile Editor'}
      </Button>
      <DynamicMatchmakerEditProfile
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        candidate={candidate}
        dict={matchmakerDict.candidatesManager.editProfile}
        profileDict={profileDict}
        locale={locale}
      />
    </div>
  );
};

// =============================================================================
// CANDIDATE INFO HEADER
// =============================================================================

const CandidateInfoHeader = ({
  candidate,
  isRtl,
}: {
  candidate: Candidate;
  isRtl: boolean;
}) => {
  const mainImage = candidate.images?.find((img) => img.isMain) ?? candidate.images?.[0];
  const age = candidate.profile?.birthDate ? getAge(candidate.profile.birthDate) : null;

  return (
    <Card className="border-teal-100 bg-gradient-to-r from-teal-50/50 to-white">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-teal-200 shrink-0">
            {mainImage?.url && (
              <AvatarImage src={mainImage.url} alt={candidate.firstName} />
            )}
            <AvatarFallback className="bg-teal-100 text-teal-700 text-lg font-bold">
              {getInitials(`${candidate.firstName} ${candidate.lastName}`)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {candidate.firstName} {candidate.lastName}
            </h2>
            <div className="flex flex-wrap gap-3 mt-1.5 text-sm text-gray-500">
              {candidate.profile?.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {candidate.profile.city}
                </span>
              )}
              {age !== null && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {age} {isRtl ? 'שנים' : 'years'}
                </span>
              )}
              {candidate.phone && (
                <span className="flex items-center gap-1" dir="ltr">
                  <Phone className="h-3.5 w-3.5" />
                  {candidate.phone}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              className={cn(
                'text-xs font-medium',
                candidate.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {candidate.status}
            </Badge>
            {candidate.profile?.gender && (
              <Badge variant="outline" className="text-xs">
                {candidate.profile.gender === 'MALE'
                  ? isRtl ? 'גבר' : 'Male'
                  : isRtl ? 'אישה' : 'Female'}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CandidateHub({
  matchmakerDict,
  profileDict,
  locale,
}: CandidateHubProps) {
  const isRtl = locale === 'he';
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  // Tracks which tabs have been mounted at least once (for lazy rendering)
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLDivElement>(null);

  const { candidates, loading: candidatesLoading } = useCandidates();

  // --- Search filter ---
  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return candidates.slice(0, 8);
    return candidates
      .filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [candidates, searchQuery]);

  // --- Click outside to close dropdown ---
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectCandidate = useCallback((candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setSearchQuery(`${candidate.firstName} ${candidate.lastName}`);
    setDropdownOpen(false);
    setActiveTab('profile');
    setMountedTabs(new Set(['profile']));
  }, []);

  const handleClearCandidate = useCallback(() => {
    setSelectedCandidate(null);
    setSearchQuery('');
    setMountedTabs(new Set());
    setActiveTab('profile');
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setMountedTabs((prev) => new Set([...prev, tab]));
  }, []);

  // --- Tab config ---
  const tabs = [
    { id: 'profile', label: isRtl ? 'פרופיל' : 'Profile', icon: User },
    { id: 'suggestions', label: isRtl ? 'הצעות' : 'Suggestions', icon: Heart },
    { id: 'potential', label: isRtl ? 'התאמות' : 'Matches', icon: Target },
    { id: 'messages', label: isRtl ? 'הודעות' : 'Messages', icon: MessageCircle },
    { id: 'edit', label: isRtl ? 'עריכה' : 'Edit', icon: Edit },
    { id: 'emails', label: isRtl ? 'מיילים' : 'Emails', icon: Mail },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-orange-50/10"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* ================================================================= */}
        {/* PAGE HEADER                                                        */}
        {/* ================================================================= */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-600" />
            {isRtl ? 'תיק מועמד' : 'Candidate File'}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {isRtl
              ? 'חפש/י מועמד/ת וצפה/י בכל המידע שלו/ה במקום אחד'
              : 'Search for a candidate and view all their information in one place'}
          </p>
        </div>

        {/* ================================================================= */}
        {/* SEARCH                                                             */}
        {/* ================================================================= */}
        <div ref={searchRef} className="relative">
          <div className="relative">
            <Search
              className={cn(
                'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none',
                isRtl ? 'right-3' : 'left-3'
              )}
            />
            <Input
              className={cn(
                'h-12 text-base bg-white shadow-sm border-gray-200',
                isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'
              )}
              placeholder={
                isRtl
                  ? 'חיפוש לפי שם או אימייל...'
                  : 'Search by name or email...'
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
            />
            {selectedCandidate && (
              <button
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600',
                  isRtl ? 'left-3' : 'right-3'
                )}
                onClick={handleClearCandidate}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <Card className="absolute top-full mt-1 w-full z-50 shadow-xl border-gray-200">
              <ScrollArea className="max-h-72">
                {candidatesLoading ? (
                  <div className="p-4 text-center text-gray-400">
                    <Loader2 className="animate-spin h-5 w-5 mx-auto" />
                  </div>
                ) : filteredCandidates.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    {isRtl ? 'לא נמצאו תוצאות' : 'No results found'}
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredCandidates.map((c) => {
                      const mainImg =
                        c.images?.find((img) => img.isMain) ?? c.images?.[0];
                      return (
                        <button
                          key={c.id}
                          className="w-full text-start p-3 hover:bg-teal-50 rounded-lg flex items-center gap-3 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectCandidate(c);
                          }}
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            {mainImg?.url && (
                              <AvatarImage src={mainImg.url} alt={c.firstName} />
                            )}
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-medium">
                              {getInitials(`${c.firstName} ${c.lastName}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {c.firstName} {c.lastName}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{c.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {c.profile?.gender && (
                              <Badge variant="outline" className="text-xs">
                                {c.profile.gender === 'MALE'
                                  ? isRtl ? 'גבר' : 'M'
                                  : isRtl ? 'אישה' : 'F'}
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </Card>
          )}
        </div>

        {/* ================================================================= */}
        {/* EMPTY STATE                                                        */}
        {/* ================================================================= */}
        {!selectedCandidate && (
          <Card className="border-dashed border-2 border-gray-200 bg-white/60">
            <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="h-20 w-20 rounded-full bg-teal-50 flex items-center justify-center">
                <User className="h-10 w-10 text-teal-300" />
              </div>
              <h3 className="text-base font-medium text-gray-500">
                {isRtl ? 'חפש/י מועמד/ת להתחיל' : 'Search for a candidate to begin'}
              </h3>
              <p className="text-sm text-gray-400 max-w-sm">
                {isRtl
                  ? 'הקלד/י שם או אימייל בשורת החיפוש כדי לבחור מועמד/ת ולצפות בכל המידע שלו/ה'
                  : 'Type a name or email in the search bar above to select a candidate and view all their information'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ================================================================= */}
        {/* CANDIDATE HEADER + TABS                                           */}
        {/* ================================================================= */}
        {selectedCandidate && (
          <>
            <CandidateInfoHeader candidate={selectedCandidate} isRtl={isRtl} />

            <Tabs value={activeTab} onValueChange={handleTabChange}>
              {/* Tab triggers */}
              <TabsList className="w-full grid grid-cols-6 h-11 bg-gray-100/80 rounded-xl p-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="rounded-lg gap-1.5 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-teal-700"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab contents — each only mounts on first visit */}
              <div className="mt-3 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[420px] overflow-hidden">

                {/* ---- PROFILE ---- */}
                <TabsContent value="profile" className="m-0 focus-visible:ring-0">
                  {mountedTabs.has('profile') && (
                    <DynamicProfileCard
                      profile={selectedCandidate.profile as any}
                      isProfileComplete={selectedCandidate.isProfileComplete}
                      images={selectedCandidate.images}
                      viewMode="matchmaker"
                      candidate={selectedCandidate}
                      allCandidates={candidates}
                      dict={profileDict.profileCard}
                      locale={locale}
                    />
                  )}
                </TabsContent>

                {/* ---- SUGGESTIONS ---- */}
                <TabsContent value="suggestions" className="m-0 focus-visible:ring-0">
                  {mountedTabs.has('suggestions') && (
                    <SuggestionsTab
                      candidateId={selectedCandidate.id}
                      isRtl={isRtl}
                    />
                  )}
                </TabsContent>

                {/* ---- POTENTIAL MATCHES ---- */}
                <TabsContent value="potential" className="m-0 focus-visible:ring-0">
                  {mountedTabs.has('potential') && (
                    <PotentialMatchesTab
                      candidate={selectedCandidate}
                      isRtl={isRtl}
                    />
                  )}
                </TabsContent>

                {/* ---- MESSAGES ---- */}
                <TabsContent value="messages" className="m-0 focus-visible:ring-0">
                  {mountedTabs.has('messages') && (
                    <DynamicMatchmakerChatPanel locale={locale} />
                  )}
                </TabsContent>

                {/* ---- EDIT PROFILE ---- */}
                <TabsContent value="edit" className="m-0 focus-visible:ring-0">
                  {mountedTabs.has('edit') && (
                    <EditTab
                      candidate={selectedCandidate}
                      matchmakerDict={matchmakerDict}
                      profileDict={profileDict}
                      locale={locale}
                      isRtl={isRtl}
                    />
                  )}
                </TabsContent>

                {/* ---- EMAIL HISTORY ---- */}
                <TabsContent value="emails" className="m-0 focus-visible:ring-0">
                  {mountedTabs.has('emails') && (
                    <EmailHistoryTab isRtl={isRtl} />
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
