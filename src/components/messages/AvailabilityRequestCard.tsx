// src/components/messages/AvailabilityRequestCard.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ExtendedAvailabilityInquiry } from '@/types/messages';
import type { AvailabilityRequestCardDict } from '@/types/dictionary';
import { cn } from '@/lib/utils';
import type { Locale } from '../../../i18n-config';

interface AvailabilityRequestCardProps {
  inquiry: ExtendedAvailabilityInquiry;
  currentUserId: string;
  onRespond: (inquiryId: string, isAvailable: boolean) => Promise<void>;
  dict: AvailabilityRequestCardDict;
  locale: Locale;
}

export default function AvailabilityRequestCard({
  inquiry,
  currentUserId,
  onRespond,
  dict,
  locale,
}: AvailabilityRequestCardProps) {
  const isFirstParty = inquiry.firstPartyId === currentUserId;
  const isSecondParty = inquiry.secondPartyId === currentUserId;
  const totalResponses = [
    inquiry.firstPartyResponse,
    inquiry.secondPartyResponse,
  ].filter((r) => r !== null).length;
  const progress = (totalResponses / 2) * 100;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium">{dict.title}</h3>
            <p className="text-sm text-gray-600">
              {dict.fromMatchmaker.replace(
                '{{name}}',
                `${inquiry.matchmaker.firstName} ${inquiry.matchmaker.lastName}`
              )}
            </p>
          </div>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">
                {dict.firstPartyLabel}
              </div>
              <div className="flex items-center mt-1">
                {inquiry.firstPartyResponse === null ? (
                  <Clock
                    className={cn(
                      'w-4 h-4 text-yellow-500',
                      locale === 'he' ? 'ml-1' : 'mr-1'
                    )}
                  />
                ) : inquiry.firstPartyResponse ? (
                  <CheckCircle
                    className={cn(
                      'w-4 h-4 text-green-500',
                      locale === 'he' ? 'ml-1' : 'mr-1'
                    )}
                  />
                ) : (
                  <XCircle
                    className={cn(
                      'w-4 h-4 text-red-500',
                      locale === 'he' ? 'ml-1' : 'mr-1'
                    )}
                  />
                )}
                <span>
                  {inquiry.firstParty.firstName} {inquiry.firstParty.lastName}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">
                {dict.secondPartyLabel}
              </div>
              <div className="flex items-center mt-1">
                {inquiry.secondPartyResponse === null ? (
                  <Clock
                    className={cn(
                      'w-4 h-4 text-yellow-500',
                      locale === 'he' ? 'ml-1' : 'mr-1'
                    )}
                  />
                ) : inquiry.secondPartyResponse ? (
                  <CheckCircle
                    className={cn(
                      'w-4 h-4 text-green-500',
                      locale === 'he' ? 'ml-1' : 'mr-1'
                    )}
                  />
                ) : (
                  <XCircle
                    className={cn(
                      'w-4 h-4 text-red-500',
                      locale === 'he' ? 'ml-1' : 'mr-1'
                    )}
                  />
                )}
                <span>
                  {inquiry.secondParty.firstName} {inquiry.secondParty.lastName}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>{dict.progressLabel}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {inquiry.note && (
            <div className="text-sm text-gray-600">
              <strong>{dict.noteLabel}</strong> {inquiry.note}
            </div>
          )}

          {((isFirstParty && inquiry.firstPartyResponse === null) ||
            (isSecondParty && inquiry.secondPartyResponse === null)) && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => onRespond(inquiry.id, true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle
                  className={cn('h-4 w-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                />{' '}
                {dict.buttons.available}
              </Button>
              <Button
                onClick={() => onRespond(inquiry.id, false)}
                variant="outline"
                className="flex-1"
              >
                <XCircle
                  className={cn('h-4 w-4', locale === 'he' ? 'ml-2' : 'mr-2')}
                />{' '}
                {dict.buttons.unavailable}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
