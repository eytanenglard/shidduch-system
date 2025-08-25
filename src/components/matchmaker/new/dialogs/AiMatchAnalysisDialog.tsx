// File: src/app/components/matchmaker/new/dialogs/AiMatchAnalysisDialog.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Info,
  XCircle,
  Star,
  Cake,
  MapPin,
  BookMarked,
  Users,
} from 'lucide-react';
import type { Candidate } from '../types/candidates';
import { cn, getRelativeCloudinaryPath } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

// --- Interfaces ---
interface AiAnalysis {
  overallScore: number;
  matchSummary: string;
  compatibilityPoints: {
    area: string;
    explanation: string;
    strength: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  potentialChallenges: {
    area: string;
    explanation: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
  }[];
  suggestedConversationStarters: string[];
}

interface AiMatchAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetCandidate: Candidate | null;
  comparisonCandidates: Candidate[];
  dict: MatchmakerPageDictionary['candidatesManager']['aiAnalysis'];
}

// --- Helper Functions ---
const getInitials = (firstName?: string, lastName?: string): string => {
  let initials = '';
  if (firstName && firstName.length > 0) initials += firstName[0];
  if (lastName && lastName.length > 0) initials += lastName[0];
  return initials.toUpperCase() || '?';
};

const calculateAge = (birthDate: Date | string): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
    age--;
  return age > 0 ? age : 0;
};

// --- Sub-components ---
const MiniProfileHeader: React.FC<{
  candidate: Candidate;
  score?: number;
  isTarget?: boolean;
  dict: MatchmakerPageDictionary['candidatesManager']['aiAnalysis']['miniProfile'];
}> = ({ candidate, score, isTarget = false, dict }) => {
  const mainImage = candidate.images?.find((img) => img.isMain);
  const age = calculateAge(candidate.profile.birthDate);
  const initials = getInitials(candidate.firstName, candidate.lastName);

  return (
    <div className="p-4 rounded-t-lg bg-gradient-to-b from-slate-50 to-slate-100 border-b border-slate-200 text-center relative">
      <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-offset-2 ring-cyan-400">
        {mainImage?.url ? (
          <Image
            src={getRelativeCloudinaryPath(mainImage.url)}
            alt={`Profile picture of ${candidate.firstName}`}
            layout="fill"
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <span className="text-4xl font-medium text-slate-500">
              {initials}
            </span>
          </div>
        )}
      </div>
      {!isTarget && typeof score === 'number' && (
        <Badge className="absolute top-4 left-4 bg-gradient-to-r from-teal-400 to-cyan-500 text-white border-0 shadow-lg px-3 py-1.5 text-sm font-bold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" />
          {dict.matchBadge.replace('{{score}}', String(score))}
        </Badge>
      )}
      {isTarget && (
        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg px-3 py-1.5 text-sm font-bold flex items-center gap-1.5">
          <Star className="w-4 h-4" />
          {dict.targetBadge}
        </Badge>
      )}
      <h3 className="mt-3 text-lg font-bold text-slate-800">
        {candidate.firstName} {candidate.lastName}
      </h3>
      <div className="mt-2 flex justify-center items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <Cake className="w-3.5 h-3.5 text-slate-400" /> {age} {dict.years}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />{' '}
          {candidate.profile.city || dict.notSpecified}
        </div>
        <div className="flex items-center gap-1">
          <BookMarked className="w-3.5 h-3.5 text-slate-400" />{' '}
          {candidate.profile.religiousLevel || dict.notSpecified}
        </div>
      </div>
    </div>
  );
};

const AnalysisItem: React.FC<{
  icon: React.ElementType;
  iconColor: string;
  area: string;
  explanation: string;
}> = ({ icon: Icon, iconColor, area, explanation }) => (
  <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50/70 transition-colors">
    <div
      className={cn(
        'mt-1 flex-shrink-0 rounded-full p-2 bg-opacity-10',
        iconColor.replace('text-', 'bg-')
      )}
    >
      <Icon className={cn('h-5 w-5', iconColor)} />
    </div>
    <div>
      <h4 className="font-semibold text-gray-800">{area}</h4>
      <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
    </div>
  </div>
);

const ComparisonTable: React.FC<{
  target: Candidate;
  comparison: Candidate;
  dict: MatchmakerPageDictionary['candidatesManager']['aiAnalysis']['comparisonTable'];
}> = ({ target, comparison, dict }) => {
  const fieldsToCompare = [
    {
      key: 'age',
      label: dict.fields.age,
      formatter: (c: Candidate) =>
        `${calculateAge(c.profile.birthDate)}${c.profile.birthDateIsApproximate ? ` ${dict.fields.ageApprox}` : ''}`,
    },
    {
      key: 'city',
      label: dict.fields.city,
      formatter: (c: Candidate) => c.profile.city || 'לא צוין',
    },
    {
      key: 'maritalStatus',
      label: dict.fields.maritalStatus,
      formatter: (c: Candidate) => c.profile.maritalStatus || 'לא צוין',
    },
    {
      key: 'religiousLevel',
      label: dict.fields.religiousLevel,
      formatter: (c: Candidate) => c.profile.religiousLevel || 'לא צוין',
    },
    {
      key: 'occupation',
      label: dict.fields.occupation,
      formatter: (c: Candidate) => c.profile.occupation || 'לא צוין',
    },
    {
      key: 'education',
      label: dict.fields.education,
      formatter: (c: Candidate) => c.profile.education || 'לא צוין',
    },
  ];
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm text-right border-collapse">
        <thead>
          <tr className="bg-slate-50">
            <th className="p-3 font-semibold text-slate-600 border-b border-slate-200">
              {dict.criterion}
            </th>
            <th className="p-3 font-semibold text-slate-600 border-b border-slate-200 text-center">
              {target.firstName}
            </th>
            <th className="p-3 font-semibold text-slate-600 border-b border-slate-200 text-center">
              {comparison.firstName}
            </th>
          </tr>
        </thead>
        <tbody>
          {fieldsToCompare.map((field, index) => (
            <tr
              key={field.key}
              className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
            >
              <td className="p-3 font-medium text-slate-500 border-b border-slate-200">
                {field.label}
              </td>
              <td className="p-3 text-slate-700 border-b border-slate-200 text-center">
                {field.formatter(target)}
              </td>
              <td className="p-3 text-slate-700 border-b border-slate-200 text-center">
                {field.formatter(comparison)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AnalysisSkeleton: React.FC = () => (
  <div className="space-y-6 p-4 animate-pulse">
    <div className="p-4 bg-gray-100 rounded-lg">
      <div className="h-20 bg-gray-200 rounded-md"></div>
    </div>
    <div className="space-y-4">
      <div className="h-5 bg-gray-200 rounded-md w-1/3"></div>
      <div className="flex gap-4">
        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  </div>
);

const DialogBody: React.FC<AiMatchAnalysisDialogProps> = ({
  isOpen,
  onClose,
  targetCandidate,
  comparisonCandidates,
  dict,
}) => {
  const [activeComparisonId, setActiveComparisonId] = useState<string | null>(
    null
  );
  const [analyses, setAnalyses] = useState<
    Record<string, AiAnalysis | 'error' | 'loading'>
  >({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const activeComparisonCandidate = useMemo(
    () => comparisonCandidates.find((c) => c.id === activeComparisonId),
    [activeComparisonId, comparisonCandidates]
  );
  const activeAnalysis = useMemo(
    () => (activeComparisonId ? analyses[activeComparisonId] || null : null),
    [activeComparisonId, analyses]
  );

  useEffect(() => {
    if (
      isOpen &&
      comparisonCandidates.length > 0 &&
      !comparisonCandidates.some((c) => c.id === activeComparisonId)
    ) {
      setActiveComparisonId(comparisonCandidates[0].id);
    }
  }, [isOpen, comparisonCandidates, activeComparisonId]);

  useEffect(() => {
    if (
      isOpen &&
      targetCandidate &&
      activeComparisonId &&
      analyses[activeComparisonId] === undefined
    ) {
      const fetchAnalysis = async () => {
        setAnalyses((prev) => ({ ...prev, [activeComparisonId]: 'loading' }));
        try {
          const response = await fetch('/api/ai/generate-rationale', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId1: targetCandidate.id,
              userId2: activeComparisonId,
              language: 'he', // Language is now hardcoded
            }),
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setAnalyses((prev) => ({
              ...prev,
              [activeComparisonId]: data.analysis,
            }));
          } else {
            throw new Error(data.error || 'Failed to fetch analysis');
          }
        } catch (e) {
          console.error(`Failed to get analysis for ${activeComparisonId}:`, e);
          setAnalyses((prev) => ({ ...prev, [activeComparisonId]: 'error' }));
        }
      };
      fetchAnalysis();
    }
  }, [isOpen, targetCandidate, activeComparisonId, analyses]);

  if (!targetCandidate) return null;

  return (
    <>
      {/* --- MODIFIED PART: Added floating close button --- */}
      <DialogClose asChild className="absolute top-3 left-3 z-50">
        <Button variant="ghost" size="icon" className="rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </DialogClose>

      {/* --- MODIFIED PART: The DialogHeader was removed from here --- */}

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {isMobile ? (
          <div className="p-4 border-b md:hidden">
            <Select
              value={activeComparisonId || ''}
              onValueChange={setActiveComparisonId}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={dict.header.languageSelectPlaceholder}
                />
              </SelectTrigger>
              <SelectContent>
                {comparisonCandidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <aside className="w-1/4 border-l bg-slate-50/50 flex flex-col flex-shrink-0">
            {/* --- MODIFICATION: Added pt-4 to give space for the floating X button --- */}
            <h3 className="p-3 pt-4 text-sm font-semibold text-slate-600 border-b">
              {dict.sidebar.title.replace(
                '{{count}}',
                String(comparisonCandidates.length)
              )}
            </h3>
            <ScrollArea className="flex-1">
              {comparisonCandidates.map((candidate) => {
                const mainImageUrl = candidate.images?.find(
                  (img) => img.isMain
                )?.url;
                return (
                  <button
                    key={candidate.id}
                    onClick={() => setActiveComparisonId(candidate.id)}
                    className={cn(
                      'w-full text-right p-3 flex items-center gap-3 border-b border-slate-200/60 hover:bg-slate-100 transition-colors',
                      activeComparisonId === candidate.id &&
                        'bg-cyan-50 border-r-4 border-cyan-500 font-semibold'
                    )}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                      {mainImageUrl ? (
                        <Image
                          src={getRelativeCloudinaryPath(mainImageUrl)}
                          alt={candidate.firstName}
                          layout="fill"
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-500">
                            {getInitials(
                              candidate.firstName,
                              candidate.lastName
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm text-slate-800">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {calculateAge(candidate.profile.birthDate)} |{' '}
                        {candidate.profile.city}
                      </p>
                    </div>
                    {analyses[candidate.id] &&
                      analyses[candidate.id] !== 'error' &&
                      analyses[candidate.id] !== 'loading' && (
                        <Badge
                          variant="secondary"
                          className="bg-teal-100 text-teal-800"
                        >
                          {(analyses[candidate.id] as AiAnalysis).overallScore}%
                        </Badge>
                      )}
                  </button>
                );
              })}
            </ScrollArea>
          </aside>
        )}
        <main className="flex-1 flex flex-col min-h-0 bg-white">
          {!activeComparisonCandidate ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold">
                {dict.main.selectCandidate.title}
              </h3>
              <p className="max-w-xs">
                {dict.main.selectCandidate.description}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 flex-shrink-0">
                <MiniProfileHeader
                  candidate={targetCandidate}
                  isTarget
                  dict={dict.miniProfile}
                />
                <MiniProfileHeader
                  candidate={activeComparisonCandidate}
                  score={(activeAnalysis as AiAnalysis)?.overallScore}
                  dict={dict.miniProfile}
                />
              </div>
              <Tabs
                defaultValue="summary"
                className="flex-1 flex flex-col min-h-0"
              >
                <TabsList className="mx-4 mt-4 bg-slate-100 p-1 rounded-lg">
                  <TabsTrigger value="summary">{dict.tabs.summary}</TabsTrigger>
                  <TabsTrigger value="challenges">
                    {dict.tabs.challenges}
                  </TabsTrigger>
                  <TabsTrigger value="comparison">
                    {dict.tabs.comparison}
                  </TabsTrigger>
                  <TabsTrigger value="conversation">
                    {dict.tabs.conversation}
                  </TabsTrigger>
                </TabsList>
                <ScrollArea className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeComparisonId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 md:p-6"
                    >
                      {activeAnalysis === 'loading' && <AnalysisSkeleton />}
                      {activeAnalysis === 'error' && (
                        <div className="text-center py-10">
                          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                          <h3 className="font-semibold text-xl text-red-600">
                            {dict.main.error.title}
                          </h3>
                          <p className="text-gray-500 mt-2">
                            {dict.main.error.description}
                          </p>
                        </div>
                      )}
                      {activeAnalysis &&
                        activeAnalysis !== 'error' &&
                        activeAnalysis !== 'loading' && (
                          <>
                            <TabsContent
                              value="summary"
                              className="space-y-6 mt-0"
                            >
                              <div className="p-4 bg-slate-50/70 rounded-lg border border-slate-200">
                                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                  <Info className="w-5 h-5 text-blue-500" />
                                  {dict.analysis.summaryTitle}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                  {(activeAnalysis as AiAnalysis).matchSummary}
                                </p>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  {dict.analysis.strengthsTitle}
                                </h3>
                                <div className="space-y-4">
                                  {(
                                    activeAnalysis as AiAnalysis
                                  ).compatibilityPoints.map((point) => (
                                    <AnalysisItem
                                      key={point.area}
                                      icon={CheckCircle}
                                      iconColor="text-green-500"
                                      {...point}
                                    />
                                  ))}
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent
                              value="challenges"
                              className="space-y-6 mt-0"
                            >
                              <div>
                                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                                  {dict.analysis.challengesTitle}
                                </h3>
                                <div className="space-y-4">
                                  {(
                                    activeAnalysis as AiAnalysis
                                  ).potentialChallenges.map((challenge) => (
                                    <AnalysisItem
                                      key={challenge.area}
                                      icon={AlertTriangle}
                                      iconColor="text-amber-500"
                                      {...challenge}
                                    />
                                  ))}
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent value="comparison" className="mt-0">
                              <ComparisonTable
                                target={targetCandidate}
                                comparison={activeComparisonCandidate}
                                dict={dict.comparisonTable}
                              />
                            </TabsContent>
                            <TabsContent
                              value="conversation"
                              className="space-y-4 mt-0"
                            >
                              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-indigo-500" />
                                {dict.analysis.conversationStartersTitle}
                              </h3>
                              <ul className="space-y-3 list-inside">
                                {(
                                  activeAnalysis as AiAnalysis
                                ).suggestedConversationStarters.map(
                                  (starter, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 p-2 rounded-md hover:bg-indigo-50/50"
                                    >
                                      <MessageSquare className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">
                                        {starter}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </TabsContent>
                          </>
                        )}
                    </motion.div>
                  </AnimatePresence>
                </ScrollArea>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export const AiMatchAnalysisDialog = (props: AiMatchAnalysisDialogProps) => {
  const { isOpen, onClose } = props;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl w-full h-[95vh] flex flex-col p-0 overflow-hidden relative"
        dir="rtl"
      >
        {isOpen && <DialogBody {...props} />}
      </DialogContent>
    </Dialog>
  );
};
