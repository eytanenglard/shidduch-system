// src/components/matchmaker/new/CandidateCard/MinimalCard.tsx
// ============================================================================
// כרטיס מועמד — Orchestrator (decomposed from 1149-line monolith)
// ============================================================================

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { MinimalCandidateCardProps } from './MinimalCard.types';
import { useMinimalCard } from './MinimalCard.hooks';
import { highlightText } from './MinimalCard.utils';
import PhotoSection from './components/PhotoSection';
import PhotoBadges from './components/PhotoBadges';
import NameOverlay from './components/NameOverlay';
import InfoSection from './components/InfoSection';
import BottomStats from './components/BottomStats';
import FloatingActions from './components/FloatingActions';
import ComparisonCheckbox from './components/ComparisonCheckbox';
import AiReasoningDialog from './components/AiReasoningDialog';

const MinimalCandidateCard: React.FC<MinimalCandidateCardProps> = React.memo(
  (props) => {
    const {
      candidate,
      onClick,
      onEdit,
      onAnalyze,
      onSendProfileFeedback,
      isHighlighted = false,
      highlightTerm = '',
      className,
      isAiTarget = false,
      onSetAiTarget,
      isSelectableForComparison = false,
      isSelectedForComparison = false,
      onToggleComparison,
      existingSuggestion = null,
      aiTargetName,
      isCompact = true,
      dict,
    } = props;

    const state = useMinimalCard(props);
    const candidateName = `${candidate.firstName} ${candidate.lastName}`;

    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onMouseEnter={() => state.setIsHovered(true)}
        onMouseLeave={() => state.setIsHovered(false)}
      >
        <Card
          className={cn(
            'relative overflow-hidden cursor-pointer transition-all duration-200 group',
            'border-s-[3px]',
            state.priorityConfig.borderColor,
            isAiTarget
              ? 'ring-2 ring-emerald-400/60 shadow-emerald-100 shadow-xl'
              : state.isSuggestionBlocked
                ? 'ring-2 ring-red-400/60 shadow-red-100 shadow-xl'
                : isSelectedForComparison
                  ? 'ring-2 ring-blue-400/60 shadow-blue-100 shadow-xl'
                  : state.hasAiData
                    ? state.isVectorResult
                      ? 'ring-2 ring-blue-300/50 shadow-blue-50 shadow-lg'
                      : 'ring-2 ring-teal-300/50 shadow-teal-50 shadow-lg'
                    : isHighlighted
                      ? 'ring-2 ring-yellow-400/60 shadow-yellow-50 shadow-lg'
                      : 'shadow-sm hover:shadow-lg',
            'bg-white',
            className ?? ''
          )}
          onClick={() => onClick(candidate)}
        >
          {/* ── PHOTO ─────────────────────────────────────────────────────── */}
          <PhotoSection
            mainImage={state.mainImage}
            imageLoaded={state.imageLoaded}
            imageError={state.imageError}
            isHovered={state.isHovered}
            genderAccent={state.genderAccent}
            candidateName={candidateName}
            noImageLabel={dict.noImage}
            onLoad={() => state.setImageLoaded(true)}
            onError={() => state.setImageError(true)}
          >
            <PhotoBadges
              candidate={candidate}
              hasAiData={state.hasAiData}
              isVectorResult={state.isVectorResult}
              effectiveAiScore={state.effectiveAiScore}
              isManualEntry={state.isManualEntry}
              isAiTarget={isAiTarget}
              isSelectableForComparison={isSelectableForComparison}
              hasExistingSuggestion={state.hasExistingSuggestion}
              existingSuggestion={existingSuggestion}
              availabilityConfig={state.availabilityConfig}
              dict={dict}
            />
            <NameOverlay
              name={highlightText(candidateName, highlightTerm)}
              age={state.age}
              gender={candidate.profile.gender}
              isMale={state.isMale}
              genderAccent={state.genderAccent}
              dict={dict}
            />
          </PhotoSection>

          {/* ── INFO ──────────────────────────────────────────────────────── */}
          <div className="px-4 pt-3 pb-2 space-y-1 relative z-10">
            <InfoSection
              candidate={candidate}
              isManualEntry={state.isManualEntry}
              maritalLabel={state.maritalLabel}
              spokenLanguages={state.spokenLanguages}
              serviceTypeLabel={state.serviceTypeLabel}
              headCoveringLabel={state.headCoveringLabel}
              smokingLabel={state.smokingLabel}
              bodyTypeLabel={state.bodyTypeLabel}
              isCompact={isCompact}
              term={highlightTerm}
              dict={dict}
            />

            <BottomStats
              readinessConfig={state.readinessConfig}
              wantsToBeFirst={state.wantsToBeFirst}
              hasEngagementStats={state.hasEngagementStats}
              suggestionsReceived={state.suggestionsReceived}
              suggestionsAccepted={state.suggestionsAccepted}
              suggestionsDeclined={state.suggestionsDeclined}
              hasAiData={state.hasAiData}
              lastActive={candidate.profile.lastActive}
              dict={dict}
            />
          </div>

          {/* ── FLOATING ACTIONS ──────────────────────────────────────────── */}
          <FloatingActions
            candidate={candidate}
            hasAiData={state.hasAiData}
            isVectorResult={state.isVectorResult}
            isAiTarget={isAiTarget}
            onSetAiTarget={onSetAiTarget}
            onEdit={onEdit}
            onAnalyze={onAnalyze}
            onSendProfileFeedback={onSendProfileFeedback}
            onShowReasoning={() => state.setShowReasoning(true)}
            dict={dict}
          />

          {/* ── QUALITY SCORE (hover) ─────────────────────────────────────── */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none">
            {!state.hasAiData && (
              <div className="flex items-center gap-1 bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm text-xs font-bold whitespace-nowrap">
                <Eye className="w-3 h-3" />
                <span>{dict.qualityScore.replace('{{score}}', state.qualityScore.toString())}</span>
              </div>
            )}
          </div>

          {/* ── COMPARISON CHECKBOX ───────────────────────────────────────── */}
          <ComparisonCheckbox
            candidate={candidate}
            isSelectableForComparison={isSelectableForComparison}
            isSelectedForComparison={isSelectedForComparison}
            isSuggestionBlocked={state.isSuggestionBlocked}
            hasExistingSuggestion={state.hasExistingSuggestion}
            suggestionOverride={state.suggestionOverride}
            onToggleComparison={onToggleComparison}
            onOverride={() => state.setSuggestionOverride(true)}
            dict={dict}
          />

          {/* ── AI REASONING DIALOG ───────────────────────────────────────── */}
          <AiReasoningDialog
            open={state.showReasoning}
            onOpenChange={state.setShowReasoning}
            candidate={candidate}
            isVectorResult={state.isVectorResult}
            effectiveAiScore={state.effectiveAiScore}
            aiTargetName={aiTargetName}
            dict={dict}
          />
        </Card>
      </motion.div>
    );
  }
);

MinimalCandidateCard.displayName = 'MinimalCandidateCard';

export default MinimalCandidateCard;
