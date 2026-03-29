'use client';

import React from 'react';
import { Loader2, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileCard } from '@/components/profile';
import AiInsightBar from './AiInsightBar';
import type { ProfileTabProps } from '../types/modal.types';

const ProfileTab: React.FC<ProfileTabProps> = ({
  profileWithUser,
  isQuestionnaireLoading,
  targetParty,
  questionnaire,
  sfAnswers,
  sfUpdatedAt,
  locale,
  onNavigateToDetails,
  onRequestAiSummary,
  onNavigateToCompatibility,
  dict,
  aiInsightBarDict,
}) => {
  if (isQuestionnaireLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700">
            {dict.modal.profile.loading}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {dict.modal.profile.loadingDescription}
          </p>
        </div>
      </div>
    );
  }

  if (!profileWithUser || !targetParty) {
    return (
      <div className="text-center p-12">
        <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          {dict.modal.profile.errorTitle}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
          {dict.modal.profile.errorDescription}
        </p>
        <Button
          onClick={onNavigateToDetails}
          className="mt-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
        >
          <MessageCircle className="w-4 h-4 ml-2" />
          {dict.modal.profile.contactMatchmaker}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AiInsightBar
        targetName={targetParty.firstName}
        onRequestAiSummary={onRequestAiSummary}
        onNavigateToCompatibility={onNavigateToCompatibility}
        locale={locale}
        dict={aiInsightBarDict}
      />
      <ProfileCard
        profile={profileWithUser}
        isProfileComplete={targetParty.isProfileComplete}
        images={targetParty.images}
        questionnaire={questionnaire}
        sfAnswers={sfAnswers}
        sfUpdatedAt={sfUpdatedAt}
        viewMode="candidate"
        dict={dict.profileCard}
        locale={locale}
      />
    </div>
  );
};

export default ProfileTab;
