// src/components/suggestions/inquiries/InquiryThreadView.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { format } from 'date-fns';
import { he, enUS } from 'date-fns/locale';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Send,
  MessageCircle,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import type { InquiryThreadDict } from '@/types/dictionary';

// --- Interfaces ---
interface Inquiry {
  id: string;
  suggestionId: string;
  fromUserId: string;
  toUserId: string;
  question: string;
  answer: string | null;
  status: 'PENDING' | 'ANSWERED' | 'CLOSED';
  createdAt: string | Date;
  answeredAt: string | Date | null;
  fromUser: { id: string; firstName: string; lastName: string };
  toUser: { id: string; firstName: string; lastName: string };
}

interface InquiryThreadViewProps {
  suggestionId: string;
  userId: string;
  showComposer?: boolean;
  className?: string;
  isDemo?: boolean;
  dict: InquiryThreadDict;
  locale: 'he' | 'en'; // <--- הוסף שורה זו
}

// --- Sub-components ---

const MatchmakerReplyForm: React.FC<{
  inquiryId: string;
  suggestionId: string;
  onAnswerSent: () => void;
  dict: InquiryThreadDict;
}> = ({ inquiryId, suggestionId, onAnswerSent, dict }) => {
  const [answer, setAnswer] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const handleSendAnswer = async () => {
    if (!answer.trim()) return;
    setIsReplying(true);
    try {
      const response = await fetch(
        `/api/suggestions/${suggestionId}/inquiries`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inquiryId, answer }),
        }
      );
      if (!response.ok) throw new Error('Failed to send answer');
      toast.success(dict.toasts.replySuccess);
      setAnswer('');
      onAnswerSent();
    } catch (error) {
      console.error('Error sending answer:', error);
      toast.error(dict.toasts.replyError);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    // Reply Form: Orange Tint
    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl space-y-3">
      <h4 className="font-semibold text-orange-800 text-sm flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> {dict.replyForm.title}
      </h4>
      <Textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={dict.replyForm.placeholder}
        className="bg-white rounded-lg focus:ring-orange-200 border-orange-200"
        disabled={isReplying}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSendAnswer}
          disabled={!answer.trim() || isReplying}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isReplying ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isReplying
            ? dict.replyForm.sendingButton
            : dict.replyForm.sendButton}
        </Button>
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{
  inquiry: Inquiry;
  userId: string;
  userRole: UserRole;
  isLatest: boolean;
  suggestionId: string;
  onAnswerSent: () => void;
  dict: InquiryThreadDict;
  locale: 'he' | 'en'; // <--- הוסף שורה זו
}> = ({
  inquiry,
  userId,
  userRole,
  isLatest,
  suggestionId,
  onAnswerSent,
  dict,
  locale, // <--- הוסף כאן
}) => {
  const isMyQuestion = inquiry.fromUserId === userId;

  const getStatusInfo = (status: Inquiry['status']) => {
    switch (status) {
      case 'PENDING':
        return {
          label: dict.status.pending,
          icon: Clock,
          // Pending: Amber
          className: 'bg-amber-100 text-amber-800 border-amber-200',
          pulse: true,
        };
      case 'ANSWERED':
        return {
          label: dict.status.answered,
          icon: CheckCircle,
          // Answered: Teal
          className: 'bg-teal-100 text-teal-800 border-teal-200',
          pulse: false,
        };
      case 'CLOSED':
        return {
          label: dict.status.closed,
          icon: MessageCircle,
          className: 'bg-gray-100 text-gray-700 border-gray-200',
          pulse: false,
        };
      default:
        return {
          label: String(status),
          icon: AlertTriangle,
          className: 'bg-gray-100 text-gray-700 border-gray-200',
          pulse: false,
        };
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    try {
      // --- התחלת השינוי ---
      const dateFnsLocale = locale === 'he' ? he : enUS;
      // בעברית: "16 ביוני 2024, 14:00" | באנגלית: "June 16, 2024, 14:00"
      const dateFormat =
        locale === 'he' ? 'dd בMMMM yyyy, HH:mm' : 'MMMM dd, yyyy, HH:mm';

      return format(new Date(date), dateFormat, { locale: dateFnsLocale });
      // --- סוף השינוי ---
    } catch (e) {
      console.error('Error formatting date:', date, e);
      return dict.invalidDate;
    }
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        isLatest && 'animate-fade-in-up'
      )}
    >
      {/* Question */}
      <div
        className={cn(
          'flex gap-4 mb-4',
          isMyQuestion ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <Avatar className="w-10 h-10 flex-shrink-0 shadow-md">
          <AvatarFallback
            className={cn(
              'font-bold text-sm',
              isMyQuestion
                ? // My Avatar: Teal Gradient
                  'bg-gradient-to-br from-teal-500 to-cyan-500 text-white'
                : // Other Avatar: Rose Gradient
                  'bg-gradient-to-br from-rose-400 to-pink-500 text-white'
            )}
          >
            {getInitials(
              `${inquiry.fromUser.firstName} ${inquiry.fromUser.lastName}`
            )}
          </AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'flex-1 max-w-[85%]',
            isMyQuestion ? 'ml-auto' : 'mr-auto'
          )}
        >
          <div
            className={cn(
              'flex items-center gap-2 mb-2',
              isMyQuestion
                ? 'flex-row-reverse justify-start'
                : 'flex-row justify-start'
            )}
          >
            <span className="font-semibold text-gray-800 text-sm">
              {inquiry.fromUser.firstName} {inquiry.fromUser.lastName}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(inquiry.createdAt)}
            </span>
          </div>
          <div
            className={cn(
              'p-4 rounded-2xl shadow-md relative',
              isMyQuestion
                ? // My Bubble: Teal Gradient
                  'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-md'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {inquiry.question}
            </p>
            <div
              className={cn(
                'absolute top-4 w-3 h-3 transform rotate-45',
                isMyQuestion
                  ? '-right-1.5 bg-teal-600'
                  : '-left-1.5 bg-white border-l border-b border-gray-200'
              )}
            />
          </div>
        </div>
      </div>

      {/* Answer */}
      {inquiry.answer && inquiry.answeredAt ? (
        <div className="flex gap-4 mt-6 mb-2">
          <Avatar className="w-10 h-10 flex-shrink-0 shadow-md">
            {/* Answer Avatar: Orange/Amber */}
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold text-sm">
              {getInitials(
                `${inquiry.toUser.firstName} ${inquiry.toUser.lastName}`
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 max-w-[85%]">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 text-sm">
                {inquiry.toUser.firstName} {inquiry.toUser.lastName}
              </span>
              <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 text-xs px-2 py-1 font-medium">
                <CheckCircle className="w-3 h-3 mr-1" /> {dict.answerBadge}
              </Badge>
              <span className="text-xs text-gray-400">
                {formatDate(inquiry.answeredAt)}
              </span>
            </div>
            {/* Answer Bubble: Light Orange */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl rounded-bl-md shadow-md relative">
              <p className="text-sm text-orange-900 leading-relaxed whitespace-pre-wrap break-words">
                {inquiry.answer}
              </p>
              <div className="absolute top-4 -left-1.5 w-3 h-3 bg-orange-50 border-l border-b border-orange-200 transform rotate-45" />
            </div>
          </div>
        </div>
      ) : (
        userRole !== 'CANDIDATE' &&
        inquiry.status === 'PENDING' &&
        !isMyQuestion && (
          <MatchmakerReplyForm
            inquiryId={inquiry.id}
            suggestionId={suggestionId}
            onAnswerSent={onAnswerSent}
            dict={dict}
          />
        )
      )}
      {!isLatest && (
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-6" />
      )}
    </div>
  );
};

// --- Main Component ---
const InquiryThreadView: React.FC<InquiryThreadViewProps> = ({
  suggestionId,
  userId,
  showComposer = true,
  className,
  isDemo = false,
  dict,
  locale, // <--- הוסף כאן
}) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole;
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchInquiries = useCallback(async () => {
    // Logic remains...
    // Mocking fetch for brevity in this response context, assuming logic exists in original file
    if (isDemo) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/suggestions/${suggestionId}/inquiries`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setInquiries(data);
    } catch (e) {
      setError('Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [suggestionId, isDemo]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
      }, 100);
    }
  }, [inquiries]);

  const handleSendQuestion = async () => {
    if (!newQuestion.trim()) return;
    setIsSending(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/suggestions/${suggestionId}/inquiries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: newQuestion }),
        }
      );
      if (!response.ok)
        throw new Error(`Failed to send inquiry (${response.status})`);
      await fetchInquiries();
      setNewQuestion('');
      toast.success(dict.toasts.sendSuccessTitle, {
        description: dict.toasts.sendSuccessDescription,
      });
    } catch (error) {
      setError(dict.loadingError);
      toast.error(dict.toasts.sendError);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card
      className={cn(
        'shadow-xl border-0 bg-white overflow-hidden flex flex-col max-h-[80vh] min-h-[500px]',
        className
      )}
    >
      {/* Header: Teal/White/Orange Gradient */}
      <CardHeader className="pb-4 bg-gradient-to-r from-teal-50/80 via-white to-orange-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-teal-500 to-orange-500 text-white shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">
              {dict.title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{dict.subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <div
        ref={scrollAreaRef}
        className="flex-1 p-6 space-y-6 scrollbar-elegant overflow-y-auto"
        aria-live="polite"
        aria-atomic="false"
      >
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            </div>
          ))
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
            <h3 className="font-semibold text-rose-800 mb-2">
              {dict.loadingError}
            </h3>
            <p className="text-rose-600 text-sm mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchInquiries}>
              {dict.retryButton}
            </Button>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-10 h-10 text-teal-500 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {dict.emptyState.title}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
              {dict.emptyState.description}
            </p>
          </div>
        ) : (
          inquiries.map((inquiry, index) => (
            <MessageBubble
              key={inquiry.id}
              inquiry={inquiry}
              userId={userId}
              userRole={userRole}
              isLatest={index === inquiries.length - 1}
              suggestionId={suggestionId}
              onAnswerSent={fetchInquiries}
              dict={dict}
              locale={locale} // <--- הוסף שורה זו (העברת ה-prop לילד)
            />
          ))
        )}
      </div>
      {showComposer && userRole === 'CANDIDATE' && (
        <CardFooter className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="w-full space-y-3">
            <Label
              htmlFor="new-question"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600"
            >
              <User className="w-4 h-4 text-teal-500" />
              {dict.composer.label}
            </Label>
            <Textarea
              id="new-question"
              placeholder={dict.composer.placeholder}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              disabled={isSending}
              // Focus ring: Teal
              className="text-right border-gray-200 focus:border-teal-300 focus:ring-teal-200 rounded-xl resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {dict.composer.charCount.replace(
                  '{{count}}',
                  newQuestion.length.toString()
                )}
              </span>
              <Button
                onClick={handleSendQuestion}
                disabled={!newQuestion.trim() || isSending}
                // Send Button: Teal -> Orange Gradient
                className="bg-gradient-to-r from-teal-500 to-orange-500 text-white shadow-lg rounded-xl"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    {dict.composer.sendingButton}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 ml-2" />
                    {dict.composer.sendButton}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default InquiryThreadView;
