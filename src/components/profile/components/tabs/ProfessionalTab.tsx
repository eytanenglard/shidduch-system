'use client';

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import {
  Heart,
  Users,
  Calendar,
  Clock,
  Lock,
  Phone,
} from 'lucide-react';
import SectionCard from '../shared/SectionCard';
import DetailItem from '../shared/DetailItem';
import { formatEnumValue } from '../../utils/formatters';
import { useProfileTab } from './ProfileTabContext';

const ProfessionalTab: React.FC = () => {
  const {
    profile,
    direction,
    locale,
    displayDict,
    contactPreferenceMap,
    renderMobileNav,
  } = useProfileTab();

  return (
    <TabsContent
      value="professional"
      className="mt-0 max-w-full min-w-0 animate-in fade-in-0 duration-200"
    >
      <div dir={direction}>
        <SectionCard
          title={displayDict.content.confidentialInfo}
          subtitle={displayDict.content.professionalDetails}
          icon={Lock}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {profile.contactPreference && (
                <DetailItem
                  icon={Phone}
                  label={displayDict.content.professionalInfo.contactPreference}
                  value={
                    formatEnumValue(
                      profile.contactPreference,
                      contactPreferenceMap,
                      ''
                    ).label
                  }
                />
              )}
              {profile.preferredMatchmakerGender && (
                <DetailItem
                  icon={Users}
                  label={displayDict.content.professionalInfo.matchmakerGenderPref}
                  value={
                    profile.preferredMatchmakerGender === 'MALE'
                      ? displayDict.content.professionalInfo.matchmakerMale
                      : displayDict.content.professionalInfo.matchmakerFemale
                  }
                />
              )}
            </div>
            {profile.hasMedicalInfo && (
              <DetailItem
                icon={Heart}
                label={displayDict.content.professionalInfo.medicalInfo}
                value={
                  profile.isMedicalInfoVisible
                    ? displayDict.content.professionalInfo.medicalInfoVisible
                    : displayDict.content.professionalInfo.medicalInfoDiscreet
                }
                tooltip={profile.medicalInfoDetails || undefined}
              />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {displayDict.content.professionalInfo.profileCreated}{' '}
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString(locale)
                    : displayDict.content.professionalInfo.unknown}
                </span>
              </div>
              {profile.lastActive && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>
                    {displayDict.content.professionalInfo.lastActive}{' '}
                    {new Date(profile.lastActive).toLocaleDateString(locale)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
        {renderMobileNav()}
      </div>
    </TabsContent>
  );
};

export default ProfessionalTab;
