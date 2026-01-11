// File: src/components/matchmaker/new/CandidatesManager/CandidatesList.tsx

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { UserX, Edit, X } from 'lucide-react';
import MinimalCard from '../CandidateCard/MinimalCard';
import QuickView from '../CandidateCard/QuickView';
import { ProfileCard } from '@/components/profile';
import type {
  Candidate,
  CandidateAction,
  MobileView,
} from '../types/candidates';
import type { QuestionnaireResponse } from '@/types/next-auth';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { toast } from 'sonner';
import { ActionDialogs } from '../dialogs/ActionDialogs';
import NewSuggestionForm from '../../suggestions/NewSuggestionForm';
import MatchmakerEditProfile from '../MatchmakerEditProfile';
import { cn } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';
import type { ProfilePageDictionary } from '@/types/dictionary';

// ============================================================================
// TYPES
// ============================================================================

interface CreateSuggestionData {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  firstPartyId: string;
  secondPartyId: string;
  status:
    | 'DRAFT'
    | 'PENDING_FIRST_PARTY'
    | 'FIRST_PARTY_APPROVED'
    | 'FIRST_PARTY_DECLINED'
    | string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
}

// 🆕 טיפוס לפירוט ציון
interface ScoreBreakdown {
  religious: number;
  careerFamily: number;
  lifestyle: number;
  ambition: number;
  communication: number;
  values: number;
}

// 🆕 טיפוס מורחב למועמד עם נתוני AI
type CandidateWithAiData = Candidate & {
  aiScore?: number;
  aiReasoning?: string;
  aiRank?: number;
  aiFirstPassScore?: number;
  aiScoreBreakdown?: ScoreBreakdown;
  aiBackgroundMultiplier?: number;
  aiBackgroundCompatibility?:
    | 'excellent'
    | 'good'
    | 'possible'
    | 'problematic'
    | 'not_recommended';
  aiSimilarity?: number; // 🆕 עבור Vector Search
};

interface CandidatesListProps {
  candidates: CandidateWithAiData[];
  allCandidates: Candidate[];
  onOpenAiAnalysis: (candidate: Candidate) => void;
  onSendProfileFeedback: (candidate: Candidate, e?: React.MouseEvent) => void;
  onCandidateClick?: (candidate: Candidate) => void;
  onCandidateAction?: (type: CandidateAction, candidate: Candidate) => void;
  viewMode: 'grid' | 'list';
  mobileView: MobileView;
  isLoading?: boolean;
  className?: string;
  highlightTerm?: string;
  aiTargetCandidate: Candidate | null;
  onSetAiTarget: (candidate: Candidate, e: React.MouseEvent) => void;
  comparisonSelection: Record<string, Candidate>;
  onToggleComparison: (candidate: Candidate, e: React.MouseEvent) => void;
  quickViewSide?: 'left' | 'right' | 'center';
  isQuickViewEnabled: boolean;
  locale: string;
  dict: MatchmakerPageDictionary;
  profileDict: ProfilePageDictionary;
}

// ============================================================================
// COMPONENT
// ============================================================================

const CandidatesList: React.FC<CandidatesListProps> = ({
  candidates,
  allCandidates,
  locale,
  onCandidateClick,
  onCandidateAction,
  isQuickViewEnabled,
  onOpenAiAnalysis,
  onSendProfileFeedback,
  viewMode,
  mobileView,
  isLoading = false,
  className,
  highlightTerm,
  aiTargetCandidate,
  onSetAiTarget,
  comparisonSelection,
  onToggleComparison,
  quickViewSide = 'center',
  dict,
  profileDict,
}) => {
  // Base states
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [questionnaireResponse, setQuestionnaireResponse] =
    useState<QuestionnaireResponse | null>(null);
  const [isMatchmaker, setIsMatchmaker] = useState(true);
  const [hoveredCandidate, setHoveredCandidate] =
    useState<CandidateWithAiData | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const quickViewRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [showSuggestDialog, setShowSuggestDialog] = useState(false);
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false);
  const [dialogCandidate, setDialogCandidate] = useState<Candidate | null>(
    null
  );

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        hoveredCandidate &&
        quickViewRef.current &&
        !quickViewRef.current.contains(event.target as Node)
      ) {
        setHoveredCandidate(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hoveredCandidate]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const loadQuestionnaire = async () => {
      if (!selectedCandidate) {
        setQuestionnaireResponse(null);
        return;
      }
      try {
        const params = new URLSearchParams();
        params.append('userId', selectedCandidate.id);
        params.append('locale', locale);

        const response = await fetch(
          `/api/profile/questionnaire?${params.toString()}`
        );

        const data = await response.json();
        if (data.success && data.questionnaireResponse) {
          setQuestionnaireResponse(data.questionnaireResponse);
        } else {
          console.warn('Could not load questionnaire:', data.message);
          setQuestionnaireResponse(null);
        }
      } catch (error) {
        console.error('Failed to load questionnaire:', error);
        toast.error('שגיאה בטעינת השאלון');
      }
    };
    loadQuestionnaire();
  }, [selectedCandidate, locale]);

  // Action handlers
  const handleInvite = async (candidate: Candidate, email: string) => {
    try {
      const response = await fetch(
        `/api/matchmaker/candidates/${candidate.id}/invite-setup`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId: candidate.id, email }),
        }
      );
      if (!response.ok) throw new Error('Failed to send invitation');
      toast.success('ההזמנה נשלחה בהצלחה');
      onCandidateAction?.('invite', candidate);
    } catch (error) {
      console.error('Error sending invite:', error);
      throw error;
    }
  };

  const handleAvailabilityCheck = async (candidate: Candidate) => {
    try {
      const response = await fetch('/api/availability/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: candidate.id }),
      });
      if (!response.ok) throw new Error('Failed to check availability');
      toast.success('בדיקת הזמינות נשלחה');
      onCandidateAction?.('contact', candidate);
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  };

  const handleCreateSuggestion = async (data: CreateSuggestionData) => {
    try {
      const response = await fetch(
        `/api/matchmaker/suggestions?locale=${locale}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error('Failed to create suggestion');
      toast.success('ההצעה נוצרה בהצלחה');
      onCandidateAction?.('suggest', dialogCandidate!);
    } catch (error) {
      console.error('Error creating suggestion:', error);
      throw error;
    }
  };

  const handleEditProfile = (candidate: Candidate) => {
    setDialogCandidate(candidate);
    setShowEditProfileDialog(true);
  };

  const handleMouseEnter = (
    candidate: CandidateWithAiData,
    e?: React.MouseEvent
  ) => {
    if (isMobile || !e || !isQuickViewEnabled) return;

    if (isMobile || !e) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const cardElement = e.currentTarget as HTMLElement;
    const cardRect = cardElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const padding = 20;
    const quickViewApproxHeight = Math.min(650, viewportHeight * 0.85);
    let top;
    if (cardRect.top + quickViewApproxHeight > viewportHeight - padding) {
      top = cardElement.offsetTop + cardRect.height - quickViewApproxHeight;
    } else {
      top = cardElement.offsetTop;
    }
    const scrollContainer = cardElement.closest('.overflow-y-auto');
    if (scrollContainer) {
      top = Math.max(top, scrollContainer.scrollTop);
    }
    let left;
    const quickViewWidth = 420;
    switch (quickViewSide) {
      case 'left':
        left = window.innerWidth / 4 - quickViewWidth / 2;
        break;
      case 'right':
        left = (window.innerWidth * 3) / 4 - quickViewWidth / 2 - 470;
        break;
      case 'center':
      default:
        left = window.innerWidth / 2 - quickViewWidth / 2;
        break;
    }
    left = Math.max(
      padding,
      Math.min(left, window.innerWidth - quickViewWidth - padding)
    );
    hoverTimeoutRef.current = setTimeout(() => {
      setHoverPosition({ top, left });
      setHoveredCandidate(candidate);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setTimeout(() => {
      if (!quickViewRef.current?.matches(':hover')) {
        setHoveredCandidate(null);
      }
    }, 100);
  };

  const handleAction = useCallback(
    (
      action: CandidateAction | 'analyze' | 'sendFeedback',
      candidate: Candidate
    ) => {
      setDialogCandidate(candidate);
      setHoveredCandidate(null);
      switch (action) {
        case 'invite':
          setShowInviteDialog(true);
          break;
        case 'contact':
          setShowAvailabilityDialog(true);
          break;
        case 'suggest':
          setShowSuggestDialog(true);
          break;
        case 'view':
          setSelectedCandidate(candidate);
          onCandidateClick?.(candidate);
          break;
        case 'edit':
          handleEditProfile(candidate);
          break;
        case 'analyze':
          onOpenAiAnalysis(candidate);
          break;
        case 'sendFeedback':
          if (onSendProfileFeedback) {
            onSendProfileFeedback(candidate);
          }
          break;

        default:
          onCandidateAction?.(action as CandidateAction, candidate);
      }
    },
    [
      onCandidateAction,
      onCandidateClick,
      onOpenAiAnalysis,
      onSendProfileFeedback,
    ]
  );

  const gridLayoutClass = useMemo(() => {
    if (isMobile) {
      return mobileView === 'double'
        ? 'grid grid-cols-2 gap-2'
        : 'grid grid-cols-1 gap-3';
    }
    return viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-4'
      : 'space-y-4';
  }, [isMobile, mobileView, viewMode]);

  if (isLoading) {
    return (
      <div
        className={`${
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        } ${className || ''}`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative">
            <Skeleton
              className={
                viewMode === 'list' ? 'h-32 w-full' : 'h-[350px] w-full'
              }
            />
            <div className="absolute top-3 right-3">
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center">
        <UserX className="w-8 h-8 mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-500 mb-1">
          {dict.candidatesManager.list.emptyState.title}
        </p>
        <p className="text-xs text-gray-400">
          {dict.candidatesManager.list.emptyState.description}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={cn(gridLayoutClass, className || '')}>
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="group relative"
            onMouseEnter={(e) => handleMouseEnter(candidate, e)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleAction('view', candidate)}
          >
            <MinimalCard
              candidate={candidate}
              onClick={() => handleAction('view', candidate)}
              onAnalyze={(c, e) => {
                e.stopPropagation();
                handleAction('analyze', c);
              }}
              onSendProfileFeedback={(c, e) => {
                e.stopPropagation();
                handleAction('sendFeedback', c);
              }}
              onEdit={(c, e) => {
                e.stopPropagation();
                handleAction('edit', c);
              }}
              className={cn(
                viewMode === 'list' && !isMobile
                  ? 'flex flex-row-reverse gap-4 h-32'
                  : '',
                isMobile && mobileView === 'double' ? 'transform scale-90' : '',
                isMobile && mobileView === 'single' ? 'transform scale-95' : ''
              )}
              highlightTerm={highlightTerm}
              aiScore={candidate.aiScore}
              onSetAiTarget={onSetAiTarget}
              isAiTarget={aiTargetCandidate?.id === candidate.id}
              isSelectableForComparison={
                !!aiTargetCandidate &&
                aiTargetCandidate.profile.gender !== candidate.profile.gender &&
                aiTargetCandidate.id !== candidate.id
              }
              isSelectedForComparison={!!comparisonSelection[candidate.id]}
              onToggleComparison={onToggleComparison}
              dict={dict.candidatesManager.list.minimalCard}
            />
            <button
              className="absolute top-2 left-2 bg-primary text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('edit', candidate);
              }}
              aria-label={dict.candidatesManager.list.editProfileTooltip}
              title={dict.candidatesManager.list.editProfileTooltip}
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {isQuickViewEnabled && hoveredCandidate && !isMobile && (
        <div
          ref={quickViewRef}
          className="absolute z-[70]"
          style={{
            top: `${hoverPosition.top}px`,
            left: `${hoverPosition.left}px`,
            width: '420px',
          }}
        >
          <div className="drop-shadow-2xl">
            <QuickView
              candidate={hoveredCandidate}
              onAction={(action) => handleAction(action, hoveredCandidate)}
              onSetAiTarget={(c, e) => onSetAiTarget(c, e)}
              isAiTarget={aiTargetCandidate?.id === hoveredCandidate.id}
              dict={dict.candidatesManager.list.quickView}
              // 🆕 העברת נתוני AI ל-QuickView
              aiScore={hoveredCandidate.aiScore}
              aiReasoning={hoveredCandidate.aiReasoning}
              aiRank={hoveredCandidate.aiRank}
              aiSimilarity={hoveredCandidate.aiSimilarity}
            />
          </div>
        </div>
      )}

      {/* --- Main Profile Dialog --- */}
      <Dialog
        open={!!selectedCandidate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCandidate(null);
            setQuestionnaireResponse(null);
          }
        }}
      >
        <DialogContent
          className="max-w-6xl max-h-[90vh] overflow-y-auto p-0"
          dir={locale === 'he' ? 'rtl' : 'ltr'}
        >
          {/* Custom Sticky Header */}
          <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-100">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-bold text-gray-800">
                {selectedCandidate
                  ? `${selectedCandidate.firstName} ${selectedCandidate.lastName}`
                  : ''}
              </DialogTitle>
              {selectedCandidate?.isVerified && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700"
                >
                  מאומת
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={isMatchmaker ? 'matchmaker' : 'candidate'}
                onValueChange={(value) =>
                  setIsMatchmaker(value === 'matchmaker')
                }
              >
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue
                    placeholder={
                      dict.candidatesManager.list.profileDialog.viewAsLabel
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candidate">
                    {dict.candidatesManager.list.profileDialog.candidateView}
                  </SelectItem>
                  <SelectItem value="matchmaker">
                    {dict.candidatesManager.list.profileDialog.matchmakerView}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAction('edit', selectedCandidate!)}
                className="h-9 w-9 p-0 rounded-full hover:bg-gray-100"
                title={dict.candidatesManager.list.profileDialog.editButton}
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCandidate(null)}
                className="h-9 w-9 p-0 rounded-full hover:bg-red-50 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {selectedCandidate && (
            <div className="p-0">
              <ProfileCard
                profile={selectedCandidate.profile}
                images={selectedCandidate.images}
                questionnaire={questionnaireResponse}
                viewMode={isMatchmaker ? 'matchmaker' : 'candidate'}
                isProfileComplete={selectedCandidate.isProfileComplete}
                dict={profileDict.profileCard}
                locale={locale}
                onClose={() => setSelectedCandidate(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ActionDialogs
        suggestDialog={{
          isOpen: showSuggestDialog,
          onClose: () => setShowSuggestDialog(false),
          onSubmit: handleCreateSuggestion,
          selectedCandidate: dialogCandidate,
        }}
        availabilityDialog={{
          isOpen: showAvailabilityDialog,
          onClose: () => setShowAvailabilityDialog(false),
          onCheck: handleAvailabilityCheck,
          selectedCandidate: dialogCandidate,
        }}
        inviteDialog={{
          isOpen: showInviteDialog,
          onClose: () => setShowInviteDialog(false),
          onInvite: handleInvite,
          selectedCandidate: dialogCandidate,
        }}
        dict={dict.candidatesManager.actionDialogs}
      />

      <NewSuggestionForm
        isOpen={showSuggestDialog}
        onClose={() => setShowSuggestDialog(false)}
        candidates={allCandidates}
        selectedCandidate={dialogCandidate}
        onSubmit={handleCreateSuggestion}
        dict={dict}
        locale={locale}
      />

      <MatchmakerEditProfile
        isOpen={showEditProfileDialog}
        onClose={() => setShowEditProfileDialog(false)}
        candidate={dialogCandidate}
        dict={dict.candidatesManager.editProfile}
        profileDict={profileDict}
        locale={locale}
      />
    </>
  );
};

export default CandidatesList;
