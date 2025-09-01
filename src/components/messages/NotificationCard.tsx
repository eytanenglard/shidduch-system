// src/components/messages/NotificationCard.tsx

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { cn, getInitials, getRelativeCloudinaryPath } from '@/lib/utils';
import type { FeedItem } from '@/types/messages';
import {
  Heart,
  MessageCircle,
  ArrowLeft,
  Zap,
  CheckCircle,
  Info,
  ArrowRight,
} from 'lucide-react';
import type { MessagesPageDict } from '@/types/dictionary';
import type { Locale } from '../../../i18n-config';

interface NotificationCardProps {
  item: FeedItem;
  userId: string;
  // ✨ PROP UPDATE: קבלת חלק מהמילון ו-locale
  dict: MessagesPageDict['notificationCard'];
  locale: Locale;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  item,
  userId,
  dict,
  locale,
}) => {
  // ... (לוגיקת האייקונים נשארת זהה)
  const iconMap: Record<
    FeedItem['type'],
    { icon: React.ElementType; color: string; gradient: string }
  > = {
    NEW_SUGGESTION: {
      icon: Heart,
      color: 'text-pink-500',
      gradient: 'from-pink-400 to-rose-500',
    },
    ACTION_REQUIRED: {
      icon: Zap,
      color: 'text-orange-500',
      gradient: 'from-orange-400 to-amber-500',
    },
    STATUS_UPDATE: {
      icon: CheckCircle,
      color: 'text-green-500',
      gradient: 'from-emerald-400 to-green-500',
    },
    MATCHMAKER_MESSAGE: {
      icon: MessageCircle,
      color: 'text-blue-500',
      gradient: 'from-blue-400 to-cyan-500',
    },
    INQUIRY_RESPONSE: {
      icon: Info,
      color: 'text-cyan-500',
      gradient: 'from-cyan-400 to-teal-500',
    },
    AVAILABILITY_INQUIRY: {
      icon: MessageCircle,
      color: 'text-blue-500',
      gradient: 'from-blue-400 to-cyan-500',
    },
  };

  const { icon: Icon, gradient } = iconMap[item.type] || {
    icon: Info,
    gradient: 'from-gray-400 to-slate-500',
  };
  const suggestion = item.payload.suggestion;
  const matchmaker = suggestion?.matchmaker;

  const otherParty = suggestion
    ? suggestion.firstPartyId === userId
      ? suggestion.secondParty
      : suggestion.firstParty
    : null;
  const mainImage = otherParty?.images?.find((img) => img.isMain);

  return (
    <Card className="shadow-lg border-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br shadow-md',
              gradient
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          {matchmaker && (
            <Avatar
              className="w-10 h-10 border-2 border-white"
              title={`${dict.matchmakerPrefix} ${matchmaker.firstName}`}
            >
              <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-bold">
                {getInitials(`${matchmaker.firstName} ${matchmaker.lastName}`)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 text-lg leading-tight">
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0 pl-2">
              {/* ✨ LOCALE UPDATE: שימוש ב-locale עבור תאריך */}
              {formatDistanceToNow(new Date(item.timestamp), {
                addSuffix: true,
                locale: locale === 'he' ? he : enUS,
              })}
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            {otherParty && (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 border-2 border-white shadow">
                  {mainImage?.url ? (
                    <Image
                      src={getRelativeCloudinaryPath(mainImage.url)}
                      alt={otherParty.firstName}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <AvatarFallback className="bg-gray-300 text-gray-700 font-bold text-xs">
                      {getInitials(
                        `${otherParty.firstName} ${otherParty.lastName}`
                      )}
                    </AvatarFallback>
                  )}
                </Avatar>
                {/* ✨ TEXT UPDATE: שימוש במילון */}
                <span className="text-sm font-medium text-gray-700">
                  {dict.suggestionWith.replace(
                    '{{name}}',
                    otherParty.firstName
                  )}
                </span>
              </div>
            )}
            <Link href={item.link} passHref>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300">
                {dict.viewDetails}
                {/* ✨ LOCALE UPDATE: שינוי כיוון החץ */}
                {locale === 'he' ? (
                  <ArrowLeft className="mr-2 h-4 w-4" />
                ) : (
                  <ArrowRight className="ml-2 h-4 w-4" />
                )}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
