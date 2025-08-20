// src/app/components/suggestions/dialogs/AskMatchmakerDialog.tsx

import React, { useState, useMemo } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { AskMatchmakerDict } from '@/types/dictionary';

interface AskMatchmakerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => Promise<void>;
  matchmakerName?: string;
  dict: AskMatchmakerDict;
}

const iconMap: { [key: string]: React.ElementType } = {
  values: Heart,
  family: Users,
  career: BookOpen,
  personality: Sparkles,
  future: Calendar,
  other: Lightbulb,
};

const colorMap: { [key: string]: string } = {
  values: 'from-cyan-500 to-blue-500',
  family: 'from-emerald-500 to-green-500',
  career: 'from-blue-500 to-cyan-500',
  personality: 'from-pink-500 to-rose-500',
  future: 'from-amber-500 to-orange-500',
  other: 'from-gray-500 to-slate-500',
};

export const AskMatchmakerDialog: React.FC<AskMatchmakerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  matchmakerName,
  dict,
}) => {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const questionTopics = useMemo(() => {
    return Object.keys(dict.topics).map((key) => ({
      id: key,
      label: dict.topics[key as keyof typeof dict.topics].label,
      description: dict.topics[key as keyof typeof dict.topics].description,
      questions: dict.topics[key as keyof typeof dict.topics].questions,
      icon: iconMap[key],
      color: colorMap[key],
    }));
  }, [dict.topics]);

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
      setError(dict.errorSubmitting);
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
  const dialogTitle = matchmakerName
    ? dict.title.replace('{{name}}', matchmakerName)
    : dict.titleDefault;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 border-0 shadow-2xl rounded-3xl bg-white overflow-hidden z-[9999]">
        <DialogHeader className="px-8 py-6 bg-gradient-to-r from-cyan-50/80 via-white to-emerald-50/50 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-emerald-500 text-white text-xl font-bold">
                {getInitials(matchmakerName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-gray-800 mb-1">
                {dialogTitle}
              </DialogTitle>
              <DialogDescription className="text-gray-600 text-base">
                {dict.description}
              </DialogDescription>
            </div>
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md px-3 py-1">
              <Clock className="w-3 h-3 ml-1" />
              {dict.statusBadge}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-red-800 font-medium">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {dict.topicSelect.title}
              </h3>
              <p className="text-sm text-gray-600">
                {dict.topicSelect.subtitle}
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

          {selectedTopicData && (
            <Card className="bg-gradient-to-r from-cyan-50/50 to-emerald-50/50 border-cyan-200/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <selectedTopicData.icon className="w-5 h-5 text-cyan-600" />
                  <h4 className="font-semibold text-cyan-800">
                    {dict.sampleQuestions.title.replace(
                      '{{topic}}',
                      selectedTopicData.label
                    )}
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

          <div className="space-y-3">
            <Label
              htmlFor="question"
              className="text-base font-semibold text-gray-800"
            >
              {dict.input.label}
            </Label>
            <Textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={dict.input.placeholder}
              className="min-h-[120px] text-right border-gray-200 focus:border-cyan-300 focus:ring-cyan-200 rounded-xl text-base leading-relaxed resize-none"
            />
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>
                {dict.input.charCount.replace(
                  '{{count}}',
                  question.length.toString()
                )}
              </span>
              <span>{dict.input.info}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
            >
              {dict.buttons.cancel}
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
                  {dict.buttons.submitting}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  {dict.buttons.submit}
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
