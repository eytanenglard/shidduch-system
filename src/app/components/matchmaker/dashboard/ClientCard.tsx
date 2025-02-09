"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  Check,
  X,
  Clock,
  User,
  Mail,
  MessageCircle,
  MapPin,
  Briefcase,
  GraduationCap,
} from "lucide-react";
import { AvailabilityStatus } from "@prisma/client";
import type { Client, ExtendedClient } from "@/app/types/matchmaker";
import { InvitationStatus } from "@prisma/client";

interface ClientCardProps {
  client: ExtendedClient;
  onSuggest: (client: ExtendedClient) => void;
  onSendInvite: () => void;
  onCheckAvailability?: (client: ExtendedClient) => Promise<void>;
}

export default function ClientCard({
  client,
  onSuggest,
  onSendInvite,
  onCheckAvailability,
}: ClientCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  console.log("Availability Status:", client.profile?.availabilityStatus);
  console.log("Latest Inquiry:", JSON.stringify(client.latestInquiry, null, 2));
  console.log("Full Client Object:", JSON.stringify(client, null, 2));

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getGeneralAvailabilityDisplay = (
    status?: AvailabilityStatus | null
  ) => {
    if (!status) return null;

    const statusConfig = {
      AVAILABLE: { color: "text-green-600 bg-green-50", text: "פנוי/ה" },
      UNAVAILABLE: { color: "text-red-600 bg-red-50", text: "לא פנוי/ה" },
      DATING: { color: "text-purple-600 bg-purple-50", text: "בתהליך היכרות" },
      ENGAGED: { color: "text-blue-600 bg-blue-50", text: "מאורס/ת" },
      MARRIED: { color: "text-gray-600 bg-gray-50", text: "נשוי/ה" },
    };

    const config = statusConfig[status];
    return (
      <div className={`px-2 py-1 rounded-full text-sm ${config.color}`}>
        {config.text}
        {client.profile?.availabilityUpdatedAt && (
          <span className="text-xs block">
            עודכן:{" "}
            {new Date(
              client.profile.availabilityUpdatedAt
            ).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  };

  const getImmediateAvailabilityDisplay = (latestInquiry?: {
    firstPartyResponse?: boolean | null;
    updatedAt?: string;
  }) => {
    if (!latestInquiry) return null;

    const status = latestInquiry.firstPartyResponse;
    return (
      <div
        className={`px-2 py-1 rounded-full text-sm ${
          status === null
            ? "bg-yellow-50 text-yellow-600"
            : status
            ? "bg-green-50 text-green-600"
            : "bg-red-50 text-red-600"
        }`}
      >
        {status === null
          ? "ממתין לתגובה"
          : status
          ? "זמין/ה מיידית"
          : "לא זמין/ה מיידית"}
        {latestInquiry.updatedAt && (
          <span className="text-xs block">
            עודכן: {new Date(latestInquiry.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  };

  const handleCheckAvailability = async () => {
    if (!onCheckAvailability) return;

    try {
      setIsSending(true);
      setError("");
      await onCheckAvailability(client);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check availability"
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {client.firstName} {client.lastName}
              </h3>
              <p className="text-sm text-gray-500">
                {calculateAge(client.birthDate)} •{" "}
                {client.personalInfo?.religiousLevel}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Info Section */}
        <div className="grid grid-cols-2 gap-4 text-sm mt-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{client.personalInfo?.city || "לא צוין"}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Briefcase className="h-4 w-4 text-gray-400" />
            <span>{client.personalInfo?.occupation || "לא צוין"}</span>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            <span>{client.personalInfo?.education || "לא צוין"}</span>
          </div>
        </div>

        {/* Availability Status Section */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">זמינות כללית:</span>
            {getGeneralAvailabilityDisplay(client.profile?.availabilityStatus)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">זמינות מיידית:</span>
            {getImmediateAvailabilityDisplay(client.latestInquiry)}
          </div>
        </div>

        {/* Invitation Status */}
        {client.invitation && (
          <div className="flex items-center space-x-2 space-x-reverse mt-4 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              הזמנה נשלחה ל-{client.invitation.email} •{" "}
              {client.invitation.status}
            </span>
          </div>
        )}


        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleCheckAvailability}
            className="flex-1"
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertCircle className="ml-2 h-4 w-4" />
            )}
            בדוק זמינות
          </Button>

          {!client.invitation && (
            <Button variant="outline" onClick={onSendInvite} className="flex-1">
              <Mail className="ml-2 h-4 w-4" />
              שליחת הזמנה
            </Button>
          )}

          <Button onClick={() => onSuggest(client)} className="flex-1">
            <User className="ml-2 h-4 w-4" />
            הצעת שידוך
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
