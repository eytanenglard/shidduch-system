// FILENAME: src/app/components/messages/AvailabilityRequestCard.tsx

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
// --- START OF FIX ---
// Changed 'ExtendedInquiry' to 'ExtendedAvailabilityInquiry'
import type { ExtendedAvailabilityInquiry } from '@/types/messages';
// --- END OF FIX ---

interface AvailabilityRequestCardProps {
  // --- START OF FIX ---
  // Updated the prop type to use the new name
  inquiry: ExtendedAvailabilityInquiry;
  // --- END OF FIX ---
  currentUserId: string;
  onRespond: (inquiryId: string, isAvailable: boolean) => Promise<void>;
}

export default function AvailabilityRequestCard({
  inquiry,
  currentUserId,
  onRespond,
}: AvailabilityRequestCardProps) {
  const isFirstParty = inquiry.firstPartyId === currentUserId;
  const isSecondParty = inquiry.secondPartyId === currentUserId;
  const totalResponses = [
    inquiry.firstPartyResponse,
    inquiry.secondPartyResponse,
  ].filter((r) => r !== null).length;
  const progress = (totalResponses / 2) * 100;

  // Since this component is specifically for AvailabilityInquiry, its internal logic
  // for displaying responses and actions remains correct. The only change needed was the type import.
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium">בקשת בדיקת זמינות</h3>
            <p className="text-sm text-gray-600">
              מאת {inquiry.matchmaker.firstName} {inquiry.matchmaker.lastName}
            </p>
          </div>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">צד ראשון</div>
              <div className="flex items-center mt-1">
                {inquiry.firstPartyResponse === null ? (
                  <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                ) : inquiry.firstPartyResponse ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span>
                  {inquiry.firstParty.firstName} {inquiry.firstParty.lastName}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">צד שני</div>
              <div className="flex items-center mt-1">
                {inquiry.secondPartyResponse === null ? (
                  <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                ) : inquiry.secondPartyResponse ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span>
                  {inquiry.secondParty.firstName} {inquiry.secondParty.lastName}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>התקדמות</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {inquiry.note && (
            <div className="text-sm text-gray-600">
              <strong>הערה:</strong> {inquiry.note}
            </div>
          )}

          {isFirstParty && inquiry.firstPartyResponse === null && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => onRespond(inquiry.id, true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> אני זמין/ה
              </Button>
              <Button
                onClick={() => onRespond(inquiry.id, false)}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" /> לא זמין/ה כרגע
              </Button>
            </div>
          )}

          {isSecondParty && inquiry.secondPartyResponse === null && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => onRespond(inquiry.id, true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" /> אני זמין/ה
              </Button>
              <Button
                onClick={() => onRespond(inquiry.id, false)}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" /> לא זמין/ה כרגע
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
