// File: src/app/components/matchmaker/new/CandidateCard/QuickView.tsx

'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Mail,
  Clock,
  Eye,
  Scroll,
  GraduationCap,
  Briefcase,
  MapPin,
  User,
  FileText,
  CalendarClock,
  Edit,
  Info,
  Star,
  Sparkles,
  Send,
  Calendar,
  Shield,
  Crown,
  Zap,
  Award,
  Activity,
  MessageCircle,
  Phone,
  X,
} from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import type { Candidate } from '../types/candidates';
import { UserSource } from '@prisma/client';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { getRelativeCloudinaryPath } from '@/lib/utils';

// פונקציה לחישוב גיל
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

interface QuickViewProps {
  candidate: Candidate;
  onAction: (
    action: 'view' | 'invite' | 'suggest' | 'contact' | 'favorite' | 'edit'
  ) => void;
  onSetAiTarget?: (candidate: Candidate, e: React.MouseEvent) => void;
  isAiTarget?: boolean;
}

const QuickView: React.FC<QuickViewProps> = ({
  candidate,
  onAction,
  onSetAiTarget,
  isAiTarget = false,
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      // הקומפוננט יסגר על ידי ההורה
    }, 150);
  };

  const profile = candidate.profile;
  const isManualEntry = candidate.source === UserSource.MANUAL_ENTRY;
  const mainImage = candidate.images?.find((img) => img.isMain);

  const getAvailabilityInfo = () => {
    switch (profile.availabilityStatus) {
      case 'AVAILABLE':
        return {
          label: 'פנוי/ה',
          gradient: 'from-emerald-500 to-green-500',
          icon: <Sparkles className="w-4 h-4" />,
          description: 'זמין/ה למפגשים חדשים',
        };
      case 'DATING':
        return {
          label: 'בתהליך היכרות',
          gradient: 'from-amber-500 to-orange-500',
          icon: <Heart className="w-4 h-4" />,
          description: 'כרגע בתהליך היכרות',
        };
      case 'UNAVAILABLE':
        return {
          label: 'לא פנוי/ה',
          gradient: 'from-red-500 to-pink-500',
          icon: <Clock className="w-4 h-4" />,
          description: 'לא זמין/ה כרגע',
        };
      default:
        return {
          label: 'לא ידוע',
          gradient: 'from-gray-500 to-slate-500',
          icon: <User className="w-4 h-4" />,
          description: 'סטטוס לא ידוע',
        };
    }
  };

  const getQualityScore = () => {
    let score = 0;
    if (candidate.images.length > 0) score += 25;
    if (profile.about) score += 25;
    if (profile.education) score += 25;
    if (profile.occupation) score += 25;
    return score;
  };

  const availabilityInfo = getAvailabilityInfo();
  const qualityScore = getQualityScore();

  const actionButtons = [
    {
      id: 'view',
      label: 'צפייה מלאה',
      icon: Eye,
      gradient: 'from-blue-500 to-cyan-500',
      description: 'פתח פרופיל מלא',
      primary: true,
    },
    {
      id: 'suggest',
      label: 'הצעת שידוך',
      icon: Heart,
      gradient: 'from-pink-500 to-rose-500',
      description: 'צור הצעה חדשה',
      primary: true,
    },
    {
      id: 'invite',
      label: 'שלח הזמנה',
      icon: Send,
      gradient: 'from-purple-500 to-indigo-500',
      description: 'הזמן למערכת',
      primary: false,
    },
    {
      id: 'contact',
      label: 'בדוק זמינות',
      icon: Calendar,
      gradient: 'from-orange-500 to-amber-500',
      description: 'תיאום פגישה',
      primary: false,
    },
    {
      id: 'edit',
      label: 'עריכה',
      icon: Edit,
      gradient: 'from-gray-500 to-slate-500',
      description: 'ערוך פרופיל',
      primary: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{
        opacity: isClosing ? 0 : 1,
        scale: isClosing ? 0.9 : 1,
        y: isClosing ? 20 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-white shadow-2xl flex flex-col border-0 overflow-hidden max-w-md sm:max-w-lg w-full rounded-3xl"
      onClick={handleClick}
    >
      {/* Enhanced Header */}
      <div
        className={cn(
          'relative px-6 py-6 text-white overflow-hidden',
          `bg-gradient-to-br ${availabilityInfo.gradient}`
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Profile Image */}
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-3 border-white/30 shadow-xl">
                {mainImage ? (
                  <Image
                    src={getRelativeCloudinaryPath(mainImage.url)}
                    alt={`${candidate.firstName} ${candidate.lastName}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-white/80" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold mb-1">
                  {candidate.firstName} {candidate.lastName}
                </h3>
                <div className="flex items-center gap-2">
                  {availabilityInfo.icon}
                  <span className="text-white/90 font-medium">
                    {availabilityInfo.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onSetAiTarget && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                  onClick={(e) => onSetAiTarget(candidate, e)}
                  title={isAiTarget ? 'בטל בחירת מטרה' : 'בחר כמטרה לחיפוש AI'}
                >
                  <Star
                    className={cn(
                      'h-5 w-5',
                      isAiTarget
                        ? 'fill-current text-yellow-300'
                        : 'text-white/80'
                    )}
                  />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
                onClick={handleClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              {availabilityInfo.description}
            </Badge>

            {isManualEntry && (
              <Badge className="bg-purple-500/30 text-white border-purple-300/50 backdrop-blur-sm">
                <Edit className="w-3 h-3 mr-1" />
                מועמד ידני
              </Badge>
            )}

           
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 text-right overflow-y-auto max-h-[calc(80vh-200px)] sm:max-h-96 bg-gradient-to-br from-white to-gray-50/30">
        {/* Key Information Grid */}
        <div className="grid grid-cols-2 gap-4">
          {profile.birthDate && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-end gap-2 text-blue-700">
                <span className="font-bold text-lg">
                  {calculateAge(new Date(profile.birthDate))}
                </span>
                <CalendarClock className="w-5 h-5" />
              </div>
              <p className="text-xs text-blue-600 mt-1">שנים</p>
            </div>
          )}

          {profile.height && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-end gap-2 text-purple-700">
                <span className="font-bold text-lg">{profile.height}</span>
                <User className="w-5 h-5" />
              </div>
              <p className="text-xs text-purple-600 mt-1">ס״ם</p>
            </div>
          )}

          {profile.maritalStatus && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-end gap-2 text-green-700">
                <span className="font-medium text-sm">
                  {profile.maritalStatus}
                </span>
                <Heart className="w-5 h-5" />
              </div>
              <p className="text-xs text-green-600 mt-1">מצב משפחתי</p>
            </div>
          )}

          {profile.religiousLevel && (
            <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-end gap-2 text-orange-700">
                <span className="font-medium text-sm">
                  {profile.religiousLevel}
                </span>
                <Scroll className="w-5 h-5" />
              </div>
              <p className="text-xs text-orange-600 mt-1">רמת דתיות</p>
            </div>
          )}
        </div>

        <Separator className="my-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Manual Entry Text or Profile Details */}
        {isManualEntry && profile.manualEntryText ? (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <h4 className="text-lg font-bold text-purple-800">
                תיאור ידני מהשדכן
              </h4>
              <Info className="w-6 h-6 text-purple-500" />
            </div>
            <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 shadow-sm">
              <p className="text-purple-900 leading-relaxed whitespace-pre-wrap font-medium">
                {profile.manualEntryText}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-700 mb-4 flex items-center justify-end gap-2">
              <span>מידע נוסף</span>
              <Sparkles className="w-5 h-5 text-blue-500" />
            </h4>

            {profile.education && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-end gap-3">
                  <span className="font-medium text-blue-800 group-hover:text-blue-900 transition-colors">
                    {profile.education}
                  </span>
                  <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-1 text-right">השכלה</p>
              </div>
            )}

            {profile.occupation && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-end gap-3">
                  <span className="font-medium text-green-800 group-hover:text-green-900 transition-colors">
                    {profile.occupation}
                  </span>
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-1 text-right">עיסוק</p>
              </div>
            )}

            {profile.city && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-300 group">
                <div className="flex items-center justify-end gap-3">
                  <span className="font-medium text-purple-800 group-hover:text-purple-900 transition-colors">
                    {profile.city}
                  </span>
                  <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-purple-600 mt-1 text-right">מיקום</p>
              </div>
            )}
          </div>
        )}

        {/* About Section */}
        {(!isManualEntry || !profile.manualEntryText) && profile.about && (
          <>
            <Separator className="my-6 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-gray-700 flex items-center justify-end gap-2">
                <span>אודות</span>
                <FileText className="w-5 h-5 text-gray-500" />
              </h4>
              <div className="p-5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200 shadow-sm">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {profile.about}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Action Buttons */}
      <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
        {/* Quality Score */}
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-2 rounded-full border border-blue-100">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-800">
              איכות פרופיל: {qualityScore}%
            </span>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3 h-3',
                    i < Math.floor(qualityScore / 20)
                      ? 'text-yellow-500 fill-current'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {actionButtons
            .filter((a) => a.primary)
            .map((action) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.id}
                  className={cn(
                    'h-12 font-bold text-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group rounded-2xl',
                    `bg-gradient-to-r ${action.gradient} hover:${action.gradient.replace('500', '600')}`,
                    'text-white',
                    hoveredAction === action.id && 'scale-105'
                  )}
                  onClick={() => onAction(action.id as any)}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <IconComponent className="w-5 h-5" />
                    <span>{action.label}</span>
                  </div>
                </Button>
              );
            })}
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-2">
          {actionButtons
            .filter((a) => !a.primary)
            .map((action) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'border-2 border-gray-200 hover:border-transparent shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group relative overflow-hidden rounded-xl',
                    `hover:bg-gradient-to-r hover:${action.gradient}`,
                    'hover:text-white font-medium',
                    hoveredAction === action.id && 'scale-105'
                  )}
                  onClick={() => onAction(action.id as any)}
                  onMouseEnter={() => setHoveredAction(action.id)}
                  onMouseLeave={() => setHoveredAction(null)}
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-r transition-all duration-300 opacity-0 group-hover:opacity-100',
                      action.gradient
                    )}
                  ></div>
                  <div className="relative z-10 flex items-center justify-center gap-1">
                    <IconComponent className="w-3 h-3" />
                    <span className="text-xs">{action.label}</span>
                  </div>
                </Button>
              );
            })}
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-medium">דירוג: 4.8</span>
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <Zap className="w-3 h-3" />
              <span className="font-medium">התאמה: 95%</span>
            </div>
            <div className="flex items-center gap-1 text-green-600">
              <MessageCircle className="w-3 h-3" />
              <span className="font-medium">תגובה: מהירה</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickView;
