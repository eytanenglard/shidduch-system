// Full path: src/app/components/suggestions/dialogs/AskMatchmakerDialog.tsx

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AskMatchmakerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => Promise<void>;
  matchmakerName?: string;
  suggestionId?: string;
}

export const AskMatchmakerDialog: React.FC<AskMatchmakerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  matchmakerName,
  suggestionId,
}) => {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(question);
      setQuestion("");
      setSelectedTopic(null);
      onClose();
    } catch (error) {
      console.error("Error submitting question:", error);
      setError("אירעה שגיאה בשליחת השאלה. אנא נסה שוב מאוחר יותר.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const topics = [
    { id: "values", label: "ערכים ואמונות" },
    { id: "family", label: "משפחה ורקע" },
    { id: "career", label: "תעסוקה ולימודים" },
    { id: "personality", label: "אופי ומזג" },
    { id: "future", label: "תוכניות לעתיד" },
    { id: "other", label: "אחר" },
  ];

  const topicQuestions: Record<string, string[]> = {
    values: [
      "האם יש משהו שחשוב לדעת לגבי השקפת העולם שלו/ה?",
      "מה מידת החשיבות שהוא/היא מייחס/ת לנושאים דתיים?",
      "האם יש לו/ה קווים אדומים בנושאי השקפה?",
    ],
    family: [
      "איך ניתן לתאר את המשפחה שלו/ה?",
      "האם יש דברים חשובים לדעת לגבי המשפחה?",
      "מה חשוב לו/ה בנושא בניית משפחה?",
    ],
    career: [
      "מה התוכניות המקצועיות שלו/ה לטווח הארוך?",
      "האם הוא/היא מעוניין/ת בשינוי תעסוקתי?",
      "איך הוא/היא רואה את האיזון בין קריירה ומשפחה?",
    ],
    personality: [
      "איך היית מתאר/ת את האופי שלו/ה?",
      "מה הן התכונות החזקות ביותר שלו/ה?",
      "האם יש משהו שכדאי לדעת לגבי המזג?",
    ],
    future: [
      "מה החלומות שלו/ה לטווח הארוך?",
      "האם יש לו/ה תוכניות לשינוי מקום מגורים?",
      "מה החזון שלו/ה לחיי המשפחה?",
    ],
    other: ["יש לי שאלה ספציפית..."],
  };

  const getInitials = (name?: string) => {
    if (!name) return "שד";

    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0);
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            שאלה ל{matchmakerName ? `שדכן ${matchmakerName}` : "שדכן"}
          </DialogTitle>
          <DialogDescription>
            השדכן ישמח לענות על כל שאלה שיש לך לגבי המועמד/ת
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-2 mb-4">
            <Avatar className="w-10 h-10 bg-primary text-primary-foreground">
              <AvatarFallback>{getInitials(matchmakerName)}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{matchmakerName || "השדכן"}</p>
              <p className="text-gray-500">זמין/ה לענות על שאלותיך</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="block mb-2 text-right">בחר נושא לשאלה</Label>
            <div className="grid grid-cols-2 gap-2">
              {topics.map((topic) => (
                <Button
                  key={topic.id}
                  type="button"
                  variant={selectedTopic === topic.id ? "default" : "outline"}
                  className="justify-center"
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  {topic.label}
                </Button>
              ))}
            </div>
          </div>

          {selectedTopic && (
            <div className="space-y-2">
              <Label className="block mb-2 text-right">שאלות לדוגמה</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {topicQuestions[selectedTopic].map((q, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    className="w-full justify-end text-right hover:bg-gray-100"
                    onClick={() => setQuestion(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="question" className="block mb-2 text-right">
              שאלתך
            </Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="הזן את שאלתך כאן..."
              className="min-h-[120px] text-right"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!question.trim() || isSubmitting}
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "שולח..." : "שלח שאלה"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AskMatchmakerDialog;
