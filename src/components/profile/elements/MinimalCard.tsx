// src/components/shared/profile/elements/MinimalCard.tsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Scroll, Heart } from "lucide-react";
import Image from "next/image";
import { calculateAge } from "../utils";
import type { UserProfile, UserImage } from "@/types/next-auth";

interface MinimalCardProps {
  profile: UserProfile;
  mainImage?: UserImage;
  onClick?: () => void;
  className?: string;
}

const MinimalCard: React.FC<MinimalCardProps> = ({
  profile,
  mainImage,
  onClick,
  className = "",
}) => {
  const age = calculateAge(new Date(profile.birthDate));

  // Handle cases where profile.user might be undefined
  const userName = profile.user
    ? `${profile.user.firstName} ${profile.user.lastName}`
    : "שם לא זמין"; // "Name not available" in Hebrew

  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex gap-4 p-4">
        {/* תמונת פרופיל */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt="תמונת פרופיל"
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* מידע בסיסי */}
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="text-lg font-medium">{userName}</h3>
            <p className="text-sm text-gray-500">{age} שנים</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.city && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.city}
              </Badge>
            )}
            {profile.religiousLevel && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Scroll className="w-3 h-3" />
                {profile.religiousLevel}
              </Badge>
            )}
          </div>

          {/* סטטוס זמינות */}
          <div className="flex items-center gap-2 text-sm">
            {profile.availabilityStatus === "AVAILABLE" ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                פנוי/ה להצעות
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                בתהליך הכרות
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MinimalCard;
