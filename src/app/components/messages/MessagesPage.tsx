"use client";
import { useNotifications } from "@/app/contexts/NotificationContext";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, XCircle, Loader2, Users } from "lucide-react";
import type { ExtendedInquiry } from "@/types/messages";
import type { Session } from "@/types/next-auth";

export default function MessagesPage() {
  const { data: session } = useSession() as { data: Session | null };
  const { refreshNotifications } = useNotifications();
  const [inquiries, setInquiries] = useState<ExtendedInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "pending",
    timeframe: "all",
  });
  const [note, setNote] = useState("");

  useEffect(() => {
    if (session?.user) {
      loadInquiries();
    }
  }, [session, filters]);

  const loadInquiries = async () => {
    try {
      const queryParams = new URLSearchParams({
        status: filters.status,
        timeframe: filters.timeframe,
      });

      const response = await fetch(`/api/matchmaker/inquiries?${queryParams}`);
      if (!response.ok) throw new Error("Failed to load inquiries");
      const data = await response.json();
      setInquiries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (inquiryId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(
        `/api/matchmaker/inquiries/${inquiryId}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAvailable, note }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit response");
      }

      await loadInquiries();
      await refreshNotifications();
      setNote("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit response"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">אין הודעות</h3>
          <p className="text-gray-500">אין הודעות או התראות חדשות</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>הודעות והתראות</CardTitle>
          <div className="flex gap-4">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="סינון לפי סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="pending">ממתין לתגובה</SelectItem>
                <SelectItem value="completed">טופל</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.timeframe}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, timeframe: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="סינון לפי זמן" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="today">היום</SelectItem>
                <SelectItem value="week">שבוע אחרון</SelectItem>
                <SelectItem value="month">חודש אחרון</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        {inquiries.map((inquiry) => (
          <Card key={inquiry.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">בקשת בדיקת זמינות</h3>
                  <p className="text-sm text-gray-600">
                    מאת {inquiry.matchmaker.firstName}{" "}
                    {inquiry.matchmaker.lastName}
                  </p>
                </div>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {inquiry.note && (
                  <div className="text-sm text-gray-600 mt-2">
                    <strong>הערה:</strong> {inquiry.note}
                  </div>
                )}

                {!inquiry.firstPartyResponse && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        הערות (אופציונלי):
                      </label>
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="הוסף/י הערות..."
                        className="w-full"
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleResponse(inquiry.id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        אני זמין/ה
                      </Button>
                      <Button
                        onClick={() => handleResponse(inquiry.id, false)}
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        לא זמין/ה כרגע
                      </Button>
                    </div>
                  </>
                )}

{inquiry.firstPartyResponse !== null && (
  <div className="space-y-4">
    <div className={`flex items-center gap-2 p-2 rounded-md ${
      inquiry.firstPartyResponse
        ? "bg-green-50 text-green-700"
        : "bg-red-50 text-red-700"
    }`}>
      {inquiry.firstPartyResponse ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <XCircle className="h-5 w-5" />
      )}
      <span>
        {inquiry.firstPartyResponse
          ? "אישרת זמינות"
          : "ציינת שאינך זמין/ה"}
      </span>
    </div>

    <div>
      <Button
        onClick={() => handleResponse(inquiry.id, !inquiry.firstPartyResponse)}
        className={`w-full ${
          inquiry.firstPartyResponse 
            ? "bg-red-600 hover:bg-red-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {inquiry.firstPartyResponse ? (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            שינוי תשובה - אינני זמין/ה
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            שינוי תשובה - אני זמין/ה
          </>
        )}
      </Button>
    </div>
  </div>
)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
