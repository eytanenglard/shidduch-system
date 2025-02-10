// src/app/(authenticated)/availability-response/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AvailabilityResponsePage() {
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get("id");

  const [inquiry, setInquiry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    console.log("Component mounted, inquiryId:", inquiryId);
    if (!inquiryId) {
      setError("מזהה בקשה חסר");
      setIsLoading(false);
      return;
    }

    loadInquiry();
  }, [inquiryId]);

  const loadInquiry = async () => {
    try {
      console.log("Loading inquiry data...");
      const response = await fetch(`/api/matchmaker/inquiries/${inquiryId}`);

      if (!response.ok) {
        throw new Error("Failed to load inquiry");
      }

      const data = await response.json();
      console.log("Loaded inquiry:", data);
      setInquiry(data);
    } catch (err) {
      console.error("Error loading inquiry:", err);
      setError(err instanceof Error ? err.message : "Failed to load inquiry");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = async (isAvailable: boolean) => {
    try {
      console.log("Submitting response:", { isAvailable, note });
      setIsSubmitting(true);

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

      console.log("Response submitted successfully");
      window.location.href = "/matches";
    } catch (err) {
      console.error("Error submitting response:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit response"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>בדיקת זמינות לשידוך</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            השדכן/ית {inquiry?.matchmaker.firstName}{" "}
            {inquiry?.matchmaker.lastName}
            מעוניין/ת לבדוק את זמינותך להצעת שידוך
          </p>

          <div className="space-y-4">
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

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => handleResponse(false)}
              disabled={isSubmitting}
              className="bg-red-50 hover:bg-red-100 text-red-600"
            >
              <XCircle className="ml-2 h-4 w-4" />
              לא פנוי/ה כרגע
            </Button>
            <Button
              onClick={() => handleResponse(true)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="ml-2 h-4 w-4" />
              פנוי/ה להצעות
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
