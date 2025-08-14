// src/components/profile/ProfileCardHeader.tsx
import React from 'react';
import Image from 'next/image';
import { UserProfile, UserImage } from '@/types/next-auth';
import { Badge } from '@/components/ui/badge';
import { MapPin, Sparkles } from 'lucide-react';

const calculateAge = (birthDate: Date | string | null | undefined): number => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const getRelativeCloudinaryPath = (url: string) => {
  if (!url.includes('cloudinary.com')) return url;
  return url.split('cloudinary.com/')[1];
};

interface ProfileCardHeaderProps {
  profile: UserProfile;
  images: UserImage[] | null;
}

const ProfileCardHeader: React.FC<ProfileCardHeaderProps> = ({
  profile,
  images,
}) => {
  const age = calculateAge(profile.birthDate);
  const mainImage =
    images?.find((img) => img.isMain) ||
    (images && images.length > 0 ? images[0] : null);
  const characterTraits = profile.profileCharacterTraits || [];

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 border-b border-gray-200">
      <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
        <div className="relative flex-shrink-0">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-rose-300">
            {mainImage?.url ? (
              <Image
                src={getRelativeCloudinaryPath(mainImage.url)}
                alt={`תמונת פרופיל של ${profile.user?.firstName}`}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-5xl font-bold">
                {profile.user?.firstName?.charAt(0)}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-slate-800">
            {profile.user?.firstName} {profile.user?.lastName},{' '}
            <span className="font-bold text-slate-600">{age}</span>
          </h1>

          {profile.profileHeadline && (
            <p className="mt-2 text-lg text-slate-600 italic">
              "{profile.profileHeadline}"
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">
                {profile.city || 'לא צוינה עיר'}
              </span>
            </div>
            {characterTraits.length > 0 && (
              <div className="flex items-center gap-2">
                {characterTraits.map((trait) => (
                  <Badge
                    key={trait}
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 border-amber-200/50"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {trait}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCardHeader;
