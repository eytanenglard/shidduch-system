// Full path: src/app/components/suggestions/inquiries/InquiryThreadView.tsx

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Inquiry {
  id: string;
  suggestionId: string;
  fromUserId: string;
  toUserId: string;
  question: string;
  answer: string | null;
  status: "PENDING" | "ANSWERED" | "CLOSED";
  createdAt: string | Date;
  answeredAt: string | Date | null;
  fromUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  toUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface InquiryThreadViewProps {
  suggestionId: string;
  userId: string;
  showComposer?: boolean;
  className?: string;
}

const InquiryThreadView: React.FC<InquiryThreadViewProps> = ({
  suggestionId,
  userId,
  showComposer = true,
  className,
}) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/suggestions/${suggestionId}/inquiries`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch inquiries");
      }

      const data = await response.json();
      setInquiries(data.inquiries || []);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      setError("אירעה שגיאה בטעינת השאלות");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (suggestionId) {
      fetchInquiries();
    }
  }, [suggestionId]);

  const handleSendQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      setIsSending(true);
      setError(null);

      const response = await fetch(
        `/api/suggestions/${suggestionId}/inquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: newQuestion }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send inquiry");
      }

      // Refresh the inquiries list
      await fetchInquiries();
      setNewQuestion("");
      toast.success("השאלה נשלחה בהצלחה");
    } catch (error) {
      console.error("Error sending inquiry:", error);
      setError("אירעה שגיאה בשליחת השאלה");
      toast.error("אירעה שגיאה בשליחת השאלה");
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0);
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
  };

  const formatDate = (date: string | Date) => {
    return format(new Date(date), "dd בMMMM yyyy, HH:mm", { locale: he });
  };

  const getStatusLabel = (status: Inquiry["status"]) => {
    switch (status) {
      case "PENDING":
        return {
          label: "ממתין לתשובה",
          className: "bg-yellow-100 text-yellow-800",
        };
      case "ANSWERED":
        return { label: "נענה", className: "bg-green-100 text-green-800" };
      case "CLOSED":
        return { label: "סגור", className: "bg-gray-100 text-gray-800" };
      default:
        return { label: status, className: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <Card className={cn("bg-white shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          שאלות לשדכן
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-0">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : inquiries.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p>אין שאלות בשרשור זה</p>
            {showComposer && (
              <p className="text-sm mt-2">
                התחל את השיחה על ידי שליחת שאלה לשדכן
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-h-[400px] overflow-y-auto">
            {inquiries.map((inquiry) => {
              const isFromCurrentUser = inquiry.fromUserId === userId;
              const statusInfo = getStatusLabel(inquiry.status);

              return (
                <div
                  key={inquiry.id}
                  className={cn(
                    "flex gap-3",
                    isFromCurrentUser ? "flex-row" : "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-10 w-10 mt-1 flex-shrink-0">
                    <AvatarFallback>
                      {isFromCurrentUser
                        ? getInitials(
                            `${inquiry.fromUser.firstName} ${inquiry.fromUser.lastName}`
                          )
                        : getInitials(
                            `${inquiry.toUser.firstName} ${inquiry.toUser.lastName}`
                          )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      "flex-1 space-y-1",
                      isFromCurrentUser ? "text-right" : "text-left"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          isFromCurrentUser ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <span className="font-medium text-sm">
                          {isFromCurrentUser
                            ? `${inquiry.fromUser.firstName} ${inquiry.fromUser.lastName}`
                            : `${inquiry.toUser.firstName} ${inquiry.toUser.lastName}`}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusInfo.className)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>

                    <div
                      className={cn(
                        "p-3 rounded-lg",
                        isFromCurrentUser
                          ? "bg-blue-50 ml-auto"
                          : "bg-gray-50 mr-auto"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{inquiry.question}</p>
                    </div>

                    {inquiry.answer && inquiry.status === "ANSWERED" && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mt-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatDate(inquiry.answeredAt!)}
                            </span>
                          </div>
                          <span className="font-medium text-sm">
                            תשובת השדכן
                          </span>
                        </div>
                        <div
                          className={cn(
                            "p-3 rounded-lg bg-green-50",
                            isFromCurrentUser ? "mr-auto" : "ml-auto"
                          )}
                        >
                          <p className="whitespace-pre-wrap">
                            {inquiry.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {showComposer && (
        <CardFooter className="flex-col space-y-2 pt-4 pb-4">
          <Textarea
            placeholder="כתוב את שאלתך לשדכן..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="text-right"
            rows={3}
          />
          <div className="flex justify-end w-full">
            <Button
              onClick={handleSendQuestion}
              disabled={!newQuestion.trim() || isSending}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  שלח שאלה
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default InquiryThreadView;
