// src/components/matchmaker/InquiriesDashboard.tsx

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { useInterval } from "@/hooks/useInterval";

interface ExtendedInquiry {
  id: string;
  matchmakerId: string;
  firstPartyId: string;
  secondPartyId: string;
  firstPartyResponse: boolean | null;
  secondPartyResponse: boolean | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;

  firstParty: {
    firstName: string;
    lastName: string;
    email: string;
    profile: {
      availabilityStatus: string;
      availabilityNote?: string;
      availabilityUpdatedAt?: Date;
    } | null;
  };
  secondParty: {
    firstName: string;
    lastName: string;
    email: string;
    profile: {
      availabilityStatus: string;
      availabilityNote?: string;
      availabilityUpdatedAt?: Date;
    } | null;
  };
  matchmaker: {
    firstName: string;
    lastName: string;
  };
}

export default function InquiriesDashboard() {
  const { data: session } = useSession();
  const [inquiries, setInquiries] = useState<ExtendedInquiry[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState("");

  useInterval(() => {
    if (session?.user?.id) {
      loadInquiries();
    }
  }, 30000);

  useEffect(() => {
    if (session?.user?.id) {
      loadInquiries();
    }
  }, [session]);

  const loadInquiries = async () => {
    try {
      setError("");
      const response = await fetch("/api/matchmaker/inquiries");
      if (!response.ok) throw new Error("Failed to load inquiries");
      const data = await response.json();
      setInquiries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (inquiry: ExtendedInquiry) => {
    const totalResponses = [
      inquiry.firstPartyResponse,
      inquiry.secondPartyResponse,
    ].filter((r) => r !== null).length;
    const progress = (totalResponses / 2) * 100;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>התקדמות</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="w-full" />

        {(inquiry.firstParty.profile?.availabilityUpdatedAt ||
          inquiry.secondParty.profile?.availabilityUpdatedAt) && (
          <div className="text-sm text-gray-500 mt-2">
            עודכן לאחרונה:{" "}
            {new Date(
              Math.max(
                inquiry.firstParty.profile?.availabilityUpdatedAt?.getTime() ||
                  0,
                inquiry.secondParty.profile?.availabilityUpdatedAt?.getTime() ||
                  0
              )
            ).toLocaleString()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inquiries.map((inquiry) => (
          <Card key={inquiry.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">בקשת בדיקת זמינות</h3>
                  <p className="text-sm text-gray-500">
                    מאת {inquiry.matchmaker.firstName}{" "}
                    {inquiry.matchmaker.lastName}
                  </p>
                </div>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">צד ראשון:</div>
                    <div className="flex items-center mt-1">
                      {inquiry.firstPartyResponse === null ? (
                        <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                      ) : inquiry.firstPartyResponse ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mr-1" />
                      )}
                      <span>
                        {inquiry.firstParty.firstName}{" "}
                        {inquiry.firstParty.lastName}
                      </span>
                    </div>
                    {/* Availability note section */}
                    {inquiry.firstParty.profile?.availabilityNote && (
                      <p className="text-sm text-gray-600 mt-1">
                       {inquiry.firstParty.profile.availabilityNote}
                
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">סטטוס זמינות:</div>
                    <div className="flex items-center mt-1">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          inquiry.firstParty.profile?.availabilityStatus ===
                          "AVAILABLE"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {inquiry.firstParty.profile?.availabilityStatus ===
                        "AVAILABLE"
                          ? "זמין/ה"
                          : "לא זמין/ה"}
                      </span>
                    </div>
                  </div>
                </div>

                {getStatusDisplay(inquiry)}

                {inquiry.note && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>הערה:</strong> {inquiry.note}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
