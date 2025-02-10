//C:\Users\eytan\Desktop\שידוכים\shidduch-system\src\app\components\matchmaker\suggestions\SuggestionCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Send,
  Clock,
  Check,
  X,
  AlertCircle,
  Heart,
  User,
  ThumbsUp,
  ThumbsDown,
  Users,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import type { Suggestion } from "@/app/types/suggestions";
import { MatchSuggestionStatus } from "@prisma/client";
import { Trash2 } from "lucide-react";
interface SuggestionCardProps {
  suggestion: Suggestion;
  onSend: (
    suggestion: Suggestion,
    partyType: "first" | "second"
  ) => Promise<void>;
  onShareContacts?: (suggestion: Suggestion) => Promise<void>;
  onDelete?: (suggestionId: string) => Promise<void>;
  isMatchmaker?: boolean;
  onClick?: () => void;
}

export function SuggestionCard({
  suggestion,
  onSend,
  onDelete,
  isMatchmaker = false,
  onShareContacts,
  onClick: onCardClick,
}: SuggestionCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendToParty, setSendToParty] = useState<"first" | "second" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusDisplay = () => {
    const statusConfig = {
      DRAFT: {
        text: "טיוטה",
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
      },
      PENDING_FIRST_PARTY: {
        text: "ממתין לצד ראשון",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      FIRST_PARTY_APPROVED: {
        text: "אושר על ידי צד ראשון",
        color: "bg-blue-100 text-blue-800",
        icon: ThumbsUp,
      },
      PENDING_SECOND_PARTY: {
        text: "ממתין לצד שני",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      SECOND_PARTY_APPROVED: {
        text: "אושר על ידי שני הצדדים",
        color: "bg-green-100 text-green-800",
        icon: ThumbsUp,
      },
      AWAITING_MATCHMAKER_APPROVAL: {
        text: "ממתין לאישור שדכן",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
      },
      CONTACT_DETAILS_SHARED: {
        text: "פרטי קשר נשלחו",
        color: "bg-blue-100 text-blue-800",
        icon: Phone,
      },
      DATING: {
        text: "בתהליך היכרות",
        color: "bg-purple-100 text-purple-800",
        icon: Heart,
      },
      MATCH_APPROVED: {
        text: "השידוך אושר",
        color: "bg-green-100 text-green-800",
        icon: Heart,
      },
    };

    const config = statusConfig[
      suggestion.status as keyof typeof statusConfig
    ] || {
      text: suggestion.status,
      color: "bg-gray-100 text-gray-800",
      icon: AlertCircle,
    };

    const Icon = config.icon;

    return (
      <div
        className={`px-3 py-1 rounded-full text-sm inline-flex items-center ${config.color}`}
      >
        <Icon className="h-4 w-4 ml-2" />
        <span>{config.text}</span>
      </div>
    );
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    if (onCardClick) {
      onCardClick();
    }
  };

  const handleSendClick = async (
    e: React.MouseEvent,
    partyType: "first" | "second"
  ) => {
    e.stopPropagation();
    setSendToParty(partyType);
    setShowSendDialog(true);
  };
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete?.(suggestion.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting suggestion:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSend = async () => {
    if (!sendToParty) return;

    try {
      setIsSending(true);
      setError(null);
      await onSend(suggestion, sendToParty);
      setShowSendDialog(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send suggestion"
      );
    } finally {
      setIsSending(false);
      setSendToParty(null);
    }
  };

  const handleShareContactsClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmShare = async () => {
    if (!onShareContacts) return;

    try {
      setIsSharing(true);
      setError(null);
      await onShareContacts(suggestion);
      setShowConfirmDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share contacts");
    } finally {
      setIsSharing(false);
    }
  };

  const renderActionButtons = () => {
    switch (suggestion.status as MatchSuggestionStatus) {
      case "DRAFT":
        return (
          <Button
            className="flex-1"
            onClick={(e) => handleSendClick(e, "first")}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="ml-2 h-4 w-4" />
            )}
            {isSending ? "שולח..." : "שליחה לצד ראשון"}
          </Button>
        );

      case "FIRST_PARTY_APPROVED":
        return (
          <Button
            className="flex-1"
            onClick={(e) => handleSendClick(e, "second")}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="ml-2 h-4 w-4" />
            )}
            {isSending ? "שולח..." : "שליחה לצד שני"}
          </Button>
        );

      case "SECOND_PARTY_APPROVED":
        return (
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleShareContactsClick}
            disabled={isSharing}
          >
            {isSharing ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Users className="ml-2 h-4 w-4" />
            )}
            {isSharing ? "שולח..." : "שליחת פרטי קשר"}
          </Button>
        );

      default:
        return null;
    }
  };
  return (
    <>
      <Card
        className="hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={handleClick}
      >
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              {getStatusDisplay()}
              <p className="text-sm text-gray-500 mt-2">
                נוצר ב-
                {new Date(suggestion.createdAt).toLocaleDateString("he-IL")}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">צד ראשון</h4>
                <p className="text-sm">
                  {suggestion.firstParty.firstName}{" "}
                  {suggestion.firstParty.lastName}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">צד שני</h4>
                <p className="text-sm">
                  {suggestion.secondParty.firstName}{" "}
                  {suggestion.secondParty.lastName}
                </p>
              </div>
            </div>

            {suggestion.notes &&
              (suggestion.notes.forFirstParty ||
                suggestion.notes.forSecondParty) && (
                <div>
                  <h4 className="text-sm font-medium mb-1">הערות</h4>
                  <p className="text-sm text-gray-600">
                    {suggestion.notes.forFirstParty ||
                      suggestion.notes.forSecondParty}
                  </p>
                </div>
              )}

            <div className="flex flex-col gap-2">
              {renderActionButtons()}
              {isMatchmaker && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="hover:bg-red-600 mt-2"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  מחיקת הצעה
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת הצעת שידוך</AlertDialogTitle>
            <AlertDialogDescription>
              האם את/ה בטוח/ה שברצונך למחוק את ההצעה? פעולה זו תמחק את ההצעה גם
              עבור שני הצדדים ולא ניתן יהיה לשחזר אותה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "מוחק..." : "מחק הצעה"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {sendToParty === "first"
                ? "שליחת הצעה לצד ראשון"
                : "שליחת הצעה לצד שני"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לשלוח את ההצעה? הודעת אימייל תישלח למועמד/ת.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md">{error}</div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSendDialog(false)}>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSend}
              disabled={isSending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="ml-2 h-4 w-4" />
              )}
              {isSending ? "שולח..." : "שליחת הצעה"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Contacts Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור שליחת פרטי קשר</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך לשלוח את פרטי הקשר לשני הצדדים? פעולה זו אינה
              הפיכה.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md">{error}</div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmShare}
              disabled={isSharing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSharing ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Phone className="ml-2 h-4 w-4" />
              )}
              {isSharing ? "שולח..." : "שליחת פרטי קשר"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
