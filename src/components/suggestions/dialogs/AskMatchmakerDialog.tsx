// src/app/components/suggestions/dialogs/AskMatchmakerDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Send,
  AlertCircle,
  Heart,
  Users,
  BookOpen,
  Calendar,
  Lightbulb,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AskMatchmakerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => Promise<void>;
  matchmakerName?: string;
  suggestionId?: string;
}

interface QuestionTopic {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  questions: string[];
}

const questionTopics: QuestionTopic[] = [
  {
    id: 'values',
    label: 'ערכים ואמונות',
    icon: Heart,
    color: 'from-cyan-500 to-blue-500',
    description: 'שאלות על השקפת עולם ומערכת ערכים',
    questions: [
      'האם יש משהו שחשוב לדעת לגבי השקפת העולם שלו/ה?',
      'מה מידת החשיבות שהוא/היא מייחס/ת לנושאים דתיים?',
      'האם יש לו/ה קווים אדומים בנושאי השקפה?',
      'איך הוא/היא רואה את התפקיד של המסורת בחיי היומיום?',
    ],
  },
  {
    id: 'family',
    label: 'משפחה ורקע',
    icon: Users,
    color: 'from-emerald-500 to-green-500',
    description: 'שאלות על המשפחה והרקע האישי',
    questions: [
      'איך ניתן לתאר את המשפחה שלו/ה?',
      'האם יש דברים חשובים לדעת לגבי המשפחה?',
      'מה חשוב לו/ה בנושא בניית משפחה?',
      'איך הקשר שלו/ה עם המשפחה המורחבת?',
    ],
  },
  {
    id: 'career',
    label: 'תעסוקה ולימודים',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    description: 'שאלות על קריירה והשכלה',
    questions: [
      'מה התוכניות המקצועיות שלו/ה לטווח הארוך?',
      'האם הוא/היא מעוניין/ת בשינוי תעסוקתי?',
      'איך הוא/היא רואה את האיזון בין קריירה ומשפחה?',
      'מה התחומים שמעניינים אותו/ה ללימוד נוסף?',
    ],
  },
  {
    id: 'personality',
    label: 'אופי ומזג',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-500',
    description: 'שאלות על אישיות ותכונות אופי',
    questions: [
      'איך היית מתאר/ת את האופי שלו/ה?',
      'מה הן התכונות החזקות ביותר שלו/ה?',
      'האם יש משהו שכדאי לדעת לגבי המזג?',
      'איך הוא/היא מתמודל/ת עם לחץ ואתגרים?',
    ],
  },
  {
    id: 'future',
    label: 'תוכניות לעתיד',
    icon: Calendar,
    color: 'from-amber-500 to-orange-500',
    description: 'שאלות על חזון ותוכניות עתידיות',
    questions: [
      'מה החלומות שלו/ה לטווח הארוך?',
      'האם יש לו/ה תוכניות לשינוי מקום מגורים?',
      'מה החזון שלו/ה לחיי המשפחה?',
      'איך הוא/היא רואה את החיים שלו/ה בעוד 10 שנים?',
    ],
  },
  {
    id: 'other',
    label: 'שאלה אחרת',
    icon: Lightbulb,
    color: 'from-gray-500 to-slate-500',
    description: 'שאלה ספציפית או נושא אחר',
    questions: ['יש לי שאלה ספציפית...'],
  },
];

export const AskMatchmakerDialog: React.FC<AskMatchmakerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  matchmakerName,
}) => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit(question);
      setQuestion('');
      setSelectedTopic(null);
      onClose();
    } catch (error) {
      console.error('Error submitting question:', error);
      setError('אירעה שגיאה בשליחת השאלה. אנא נסה שוב מאוחר יותר.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'שד';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0);
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`;
  };

  const selectedTopicData = questionTopics.find((t) => t.id === selectedTopic);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-3xl bg-white overflow-hidden z-[9999]">
        {/* Header */}
        <DialogHeader className="px-8 py-6 bg-gradient-to-r from-cyan-50/80 via-white to-emerald-50/50 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white text-xl font-bold">
                {getInitials(matchmakerName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-800 mb-1">
                שאלה ל{matchmakerName ? ` ${matchmakerName}` : 'שדכן'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base">
                השדכן/ית זמין/ה לענות על כל שאלה שיש לך לגבי המועמד/ת
              </DialogDescription>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md px-3 py-1">
              <Clock className="w-3 h-3 ml-1" />
              זמין/ה עכשיו
            </Badge>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-red-800 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Topic Selection */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                איזה נושא מעניין אותך?
              </h3>
              <p className="text-sm text-gray-600">
                בחר קטגוריה כדי לקבל שאלות לדוגמה
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {questionTopics.map((topic) => (
                <Card
                  key={topic.id}
                  className={cn(
                    'cursor-pointer transition-all duration-300 border-2 hover:shadow-lg hover:-translate-y-1',
                    selectedTopic === topic.id
                      ? 'border-cyan-300 bg-cyan-50 shadow-md'
                      : 'border-gray-200 hover:border-cyan-200'
                  )}
                  onClick={() => setSelectedTopic(topic.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-r text-white shadow-md',
                        topic.color
                      )}
                    >
                      <topic.icon className="w-6 h-6" />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">
                      {topic.label}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {topic.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sample Questions */}
          {selectedTopicData && (
            <Card className="bg-gradient-to-r from-cyan-50/50 to-emerald-50/50 border-cyan-200/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <selectedTopicData.icon className="w-5 h-5 text-cyan-600" />
                  <h4 className="font-semibold text-cyan-800">
                    שאלות לדוגמה - {selectedTopicData.label}
                  </h4>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-elegant">
                  {selectedTopicData.questions.map((q, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-end text-right hover:bg-cyan-100 hover:text-cyan-800 transition-colors rounded-lg p-3 h-auto"
                      onClick={() => setQuestion(q)}
                    >
                      <span className="text-sm leading-relaxed">{q}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Input */}
          <div className="space-y-3">
            <Label
              htmlFor="question"
              className="text-base font-semibold text-gray-800"
            >
              שאלתך
            </Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="כתוב כאן את שאלתך... השדכן/ית ישמח/תשמח לעזור ולהשיב"
              className="min-h-[120px] text-right border-gray-200 focus:border-cyan-300 focus:ring-cyan-200 rounded-xl text-base leading-relaxed resize-none"
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{question.length}/500 תווים</span>
              <span>השאלה תישלח ישירות לשדכן/ית</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={!question.trim() || isSubmitting}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  שלח שאלה
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AskMatchmakerDialog;