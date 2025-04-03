import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MessageCircle, Send, AlertCircle } from "lucide-react";
import type { Suggestion } from "@/types/suggestions";

interface MessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  onSend: (data: {
    suggestionId: string;
    partyType: "first" | "second" | "both";
    messageType: "message" | "reminder" | "update";
    messageContent: string;
  }) => Promise<void>;
}

const MessageForm: React.FC<MessageFormProps> = ({
  isOpen,
  onClose,
  suggestion,
  onSend,
}) => {
  const [partyType, setPartyType] = useState<"first" | "second" | "both">(
    "both"
  );
  const [messageType, setMessageType] = useState<
    "message" | "reminder" | "update"
  >("message");
  const [messageContent, setMessageContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!suggestion || !messageContent.trim()) return;

    try {
      setIsSubmitting(true);

      // Call the API to send the message
      const response = await fetch(
        `/api/matchmaker/suggestions/${suggestion.id}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            partyType,
            messageType,
            content: messageContent,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      // Notify the parent component
      await onSend({
        suggestionId: suggestion.id,
        partyType,
        messageType,
        messageContent,
      });

      toast.success(
        `ההודעה נשלחה ${
          partyType === "first"
            ? `ל${suggestion.firstParty.firstName}`
            : partyType === "second"
            ? `ל${suggestion.secondParty.firstName}`
            : "לשני הצדדים"
        }`
      );
      onClose();
    } catch (error) {
      toast.error("שגיאה בשליחת ההודעה");
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMessagePlaceholder = () => {
    switch (messageType) {
      case "reminder":
        return "הודעת תזכורת למועמד/ת לגבי ההצעה...";
      case "update":
        return "עדכון לגבי סטטוס ההצעה או מידע חדש...";
      default:
        return "הודעה אישית למועמד/ת...";
    }
  };

  if (!suggestion) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>שליחת הודעה</DialogTitle>
          <DialogDescription>
            שליחת הודעה הקשורה להצעת השידוך בין{" "}
            {suggestion.firstParty.firstName} {suggestion.firstParty.lastName} ל
            {suggestion.secondParty.firstName} {suggestion.secondParty.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <Label>שלח אל</Label>
            <Select
              value={partyType}
              onValueChange={(value) =>
                setPartyType(value as "first" | "second" | "both")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר נמען" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first">
                  {suggestion.firstParty.firstName}{" "}
                  {suggestion.firstParty.lastName} (צד א׳)
                </SelectItem>
                <SelectItem value="second">
                  {suggestion.secondParty.firstName}{" "}
                  {suggestion.secondParty.lastName} (צד ב׳)
                </SelectItem>
                <SelectItem value="both">שני הצדדים</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Type */}
          <div className="space-y-2">
            <Label>סוג ההודעה</Label>
            <Select
              value={messageType}
              onValueChange={(value) =>
                setMessageType(value as "message" | "reminder" | "update")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סוג הודעה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="message">
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 ml-2" />
                    הודעה רגילה
                  </div>
                </SelectItem>
                <SelectItem value="reminder">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 ml-2" />
                    תזכורת
                  </div>
                </SelectItem>
                <SelectItem value="update">
                  <div className="flex items-center">
                    <Send className="w-4 h-4 ml-2" />
                    עדכון סטטוס
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label>תוכן ההודעה</Label>
            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={getMessagePlaceholder()}
              className="h-36"
            />
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !messageContent.trim()}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "שולח..." : "שלח הודעה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageForm;
