import React, { useState, useEffect, useCallback } from "react"; // Import useCallback
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Send, MessageCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Interface Inquiry remains the same...
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

  // Wrap fetchInquiries in useCallback
  // It depends on suggestionId, so list suggestionId as its dependency.
  const fetchInquiries = useCallback(async () => {
    // Check suggestionId inside useCallback or rely on useEffect condition
    if (!suggestionId) {
      // Optionally clear inquiries or handle appropriately if suggestionId becomes null/undefined
      setInquiries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/suggestions/${suggestionId}/inquiries`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        console.error("Failed to fetch inquiries:", response.status, errorData);
        throw new Error(`Failed to fetch inquiries (${response.status})`);
      }

      const data = await response.json();
      // Ensure data.inquiries is always an array
      setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      setError("אירעה שגיאה בטעינת השאלות");
      // Optionally show a toast notification for fetch errors too
      // toast.error("אירעה שגיאה בטעינת השאלות");
    } finally {
      setIsLoading(false);
    }
    // Add suggestionId as a dependency for useCallback
  }, [suggestionId]);

  useEffect(() => {
    // Now the effect depends on the memoized fetchInquiries function.
    // It will run initially and whenever fetchInquiries changes (i.e., when suggestionId changes).
    fetchInquiries();
    // Add the memoized fetchInquiries to the dependency array.
  }, [fetchInquiries]);

  const handleSendQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      setIsSending(true);
      setError(null); // Clear previous errors

      const response = await fetch(
        `/api/suggestions/${suggestionId}/inquiries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: newQuestion }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error details
        console.error("Failed to send inquiry:", response.status, errorData);
        throw new Error(`Failed to send inquiry (${response.status})`);
      }

      // Refresh the inquiries list by calling the memoized fetch function
      await fetchInquiries();
      setNewQuestion(""); // Clear input only on success
      toast.success("השאלה נשלחה בהצלחה");
    } catch (error) {
      console.error("Error sending inquiry:", error);
      setError("אירעה שגיאה בשליחת השאלה"); // Set error state for potential display
      toast.error("אירעה שגיאה בשליחת השאלה");
    } finally {
      setIsSending(false);
    }
  };

  // getInitials, formatDate, getStatusLabel remain the same...
  const getInitials = (name: string) => {
    const parts = name?.split(" ") || ["?"]; // Handle potential null/undefined name
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(
      0
    )}`.toUpperCase();
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return ""; // Handle null date
    try {
      return format(new Date(date), "dd בMMMM yyyy, HH:mm", { locale: he });
    } catch (e) {
      console.error("Error formatting date:", date, e);
      return "תאריך לא תקין"; // Fallback for invalid date
    }
  };

  const getStatusLabel = (status: Inquiry["status"]) => {
    switch (status) {
      case "PENDING":
        return {
          label: "ממתין לתשובה",
          className: "border-yellow-300 bg-yellow-50 text-yellow-700", // Adjusted colors for better contrast/style
        };
      case "ANSWERED":
        return {
          label: "נענה",
          className: "border-green-300 bg-green-50 text-green-700",
        };
      case "CLOSED":
        return {
          label: "סגור",
          className: "border-gray-300 bg-gray-50 text-gray-600",
        };
      default:
        // Handle potential unknown status gracefully
        const statusStr = String(status);
        return {
          label: statusStr,
          className: "border-gray-300 bg-gray-50 text-gray-600",
        };
    }
  };

  // JSX structure remains largely the same
  return (
    <Card className={cn("bg-white shadow-sm flex flex-col", className)}>
      <CardHeader className="pb-3 border-b">
        {" "}
        {/* Added border */}
        <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
          {" "}
          {/* Adjusted text color */}
          <MessageCircle className="w-5 h-5 text-primary" />{" "}
          {/* Use primary color */}
          שאלות לשדכן
        </CardTitle>
      </CardHeader>

      {/* Make content area scrollable, not the whole card */}
      <CardContent className="flex-1 py-4 px-4 space-y-6 overflow-y-auto max-h-[400px]">
        {" "}
        {/* Adjusted padding and added scroll */}
        {isLoading ? (
          <div className="space-y-4 p-4">
            {" "}
            {/* Added padding for skeleton */}
            {Array.from({ length: 2 }).map(
              (
                _,
                i // Reduced skeleton count slightly
              ) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" /> {/* Adjusted height */}
                  </div>
                </div>
              )
            )}
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-4 px-4 flex flex-col items-center">
            {" "}
            {/* Adjusted text color */}
            <MessageCircle className="mx-auto h-10 w-10 mb-2 opacity-50 text-red-500" />
            <p className="font-medium">שגיאה</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInquiries}
              className="mt-4"
            >
              נסה שוב
            </Button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center text-gray-500 py-8 flex flex-col items-center">
            <MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p className="font-medium">אין עדיין שאלות</p>
            {showComposer && (
              <p className="text-sm mt-1 text-gray-400">
                תוכל לשאול את השדכן שאלה כאן למטה.
              </p>
            )}
          </div>
        ) : (
          // Removed max-h and overflow from here, moved to CardContent
          <div className="space-y-6">
            {inquiries.map((inquiry) => {
              const isMyQuestion = inquiry.fromUserId === userId; // User asking the question
              // Determine alignment based on who *asked* the original question
              const alignRight = isMyQuestion; // Align right if the current user asked the question

              const asker = inquiry.fromUser;
              const responder = inquiry.toUser; // Usually the matchmaker
              const statusInfo = getStatusLabel(inquiry.status);

              return (
                <div
                  key={inquiry.id}
                  className={cn(
                    "flex gap-3",
                    alignRight ? "flex-row-reverse" : "flex-row" // Align based on asker
                  )}
                >
                  {/* Avatar of the person who asked the question */}
                  <Avatar className="h-9 w-9 mt-1 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(`${asker.firstName} ${asker.lastName}`)}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn("flex-1 space-y-1")}>
                    {/* Question Section */}
                    <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1">
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          alignRight ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <span className="font-medium text-sm text-gray-800">
                          {`${asker.firstName} ${asker.lastName}`}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-1.5 py-0.5 font-normal",
                            statusInfo.className
                          )}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "p-3 rounded-lg max-w-[85%]", // Limit width
                        alignRight
                          ? "bg-blue-50 text-blue-900 ml-auto text-right" // Asker's question style
                          : "bg-gray-100 text-gray-800 mr-auto text-left" // Other person's question style
                      )}
                      dir="auto" // Auto direction based on text content
                    >
                      <p className="whitespace-pre-wrap text-sm">
                        {inquiry.question}
                      </p>
                    </div>

                    {/* Answer Section (if exists) */}
                    {inquiry.answer && inquiry.answeredAt && (
                      <div className="mt-2 flex gap-3">
                        {/* Answer Avatar (Matchmaker/Responder) - Aligned opposite to question */}
                        {!alignRight && (
                          <div className="w-9 flex-shrink-0"></div>
                        )}{" "}
                        {/* Spacer */}
                        <Avatar className="h-9 w-9 mt-1 flex-shrink-0">
                          <AvatarFallback className="text-xs bg-green-100 text-green-700">
                            {getInitials(
                              `${responder.firstName} ${responder.lastName}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {alignRight && (
                          <div className="w-9 flex-shrink-0"></div>
                        )}{" "}
                        {/* Spacer */}
                        {/* Answer Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-1">
                            {/* Answer Meta - aligned opposite */}
                            <div
                              className={cn(
                                "flex items-center gap-2",
                                !alignRight ? "flex-row-reverse" : "flex-row"
                              )}
                            >
                              <span className="font-medium text-sm text-gray-800">
                                {`${responder.firstName} ${responder.lastName}`}{" "}
                                (תשובה)
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {formatDate(inquiry.answeredAt)}
                            </span>
                          </div>
                          <div
                            className={cn(
                              "p-3 rounded-lg bg-green-50 text-green-900 max-w-[85%]", // Limit width
                              !alignRight
                                ? "ml-auto text-right"
                                : "mr-auto text-left" // Align answer opposite to question
                            )}
                            dir="auto" // Auto direction
                          >
                            <p className="whitespace-pre-wrap text-sm">
                              {inquiry.answer}
                            </p>
                          </div>
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
        <CardFooter className="flex-col space-y-2 pt-4 pb-4 border-t bg-gray-50">
          {" "}
          {/* Added border and subtle bg */}
          <Textarea
            placeholder="כתוב כאן את שאלתך לשדכן..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            className="bg-white text-right" // Ensure white background for textarea
            rows={3}
            disabled={isSending} // Disable textarea while sending
          />
          <div className="flex justify-end w-full">
            <Button
              onClick={handleSendQuestion}
              disabled={!newQuestion.trim() || isSending || isLoading} // Also disable if loading inquiries
              className="gap-2"
              size="sm" // Slightly smaller button
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
