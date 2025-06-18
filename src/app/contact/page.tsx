// src/app/contact/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowRight, Send, CheckCircle, AlertTriangle } from "lucide-react";
import { z } from "zod";

// Zod schema for client-side validation
const contactSchema = z.object({
  name: z.string().min(2, { message: "השם חייב להכיל לפחות 2 תווים" }),
  email: z.string().email({ message: "כתובת מייל לא תקינה" }),
  message: z.string().min(10, { message: "ההודעה חייבת להכיל לפחות 10 תווים" }),
});

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[] | undefined> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setValidationErrors(null);

    // Client-side validation using Zod
    const validationResult = contactSchema.safeParse({ name, email, message });
    if (!validationResult.success) {
      setValidationErrors(validationResult.error.flatten().fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Send the request to the dedicated contact API endpoint
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: validationResult.data.name,
          email: validationResult.data.email,
          message: validationResult.data.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "אירעה שגיאה בשליחת ההודעה");
      }

      setSuccess(true);
      // Clear the form fields on success
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "אירעה שגיאה לא צפויה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-pink-50 p-4 sm:p-8">
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 rtl:right-4 rtl:left-auto text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm z-20"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לדף הבית
      </button>

      <Card className="w-full max-w-lg shadow-xl border-t-4 border-t-cyan-500">
        <CardHeader className="text-center">
          <div className="inline-block mx-auto mb-4 p-3 bg-cyan-100 rounded-full">
            <Send className="w-8 h-8 text-cyan-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
            צור קשר
          </CardTitle>
          <CardDescription className="text-gray-600 pt-2">
            יש לך שאלה? הצעה? נשמח לשמוע ממך!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="font-semibold">ההודעה נשלחה בהצלחה!</AlertTitle>
              <AlertDescription>
                תודה על פנייתך. צוות Match Point ייצור איתך קשר בהקדם האפשרי.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="name"
                  type="text"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className={`transition-colors focus:border-cyan-500 ${validationErrors?.name ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {validationErrors?.name && <p className="text-xs text-red-600">{validationErrors.name[0]}</p>}
              </div>
              <div className="space-y-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="כתובת אימייל לחזרה"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={`transition-colors focus:border-cyan-500 ${validationErrors?.email ? "border-red-500 focus:border-red-500" : ""}`}
                />
                 {validationErrors?.email && <p className="text-xs text-red-600">{validationErrors.email[0]}</p>}
              </div>
              <div className="space-y-2">
                <Textarea
                  id="message"
                  placeholder="הודעה"
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                  className={`transition-colors focus:border-cyan-500 ${validationErrors?.message ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {validationErrors?.message && <p className="text-xs text-red-600">{validationErrors.message[0]}</p>}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>שגיאה</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="ml-2 h-4 w-4" />
                )}
                {isLoading ? "שולח..." : "שלח הודעה"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
        <div className="mt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Match Point. כל הזכויות שמורות.
        </div>
    </div>
  );
}