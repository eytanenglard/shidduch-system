// src/app/components/suggestions/inquiries/InquiryThreadView.tsx

import React, { useState, useEffect, useCallback } from 'react';
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
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
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
  ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  isDemo?: boolean; // Prop חדש למצב הדגמה
}

const getStatusInfo = (status: Inquiry['status']) => {
  switch (status) {
    case 'PENDING':
      return {
        label: 'ממתין לתשובה',
        className:
          'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-200',
        icon: <Clock className="w-3 h-3" />,
        pulse: true,
      };
    case 'ANSWERED':
      return {
        label: 'נענה',
        className:
          'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle className="w-3 h-3" />,
        pulse: false,
      };
    case 'CLOSED':
      return {
        label: 'סגור',
        className:
          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200',
        icon: <MessageCircle className="w-3 h-3" />,
        pulse: false,
      };
    default:
      return {
        label: String(status),
        className:
          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200',
        icon: <AlertTriangle className="w-3 h-3" />,
        pulse: false,
      };
  }
};

const MessageBubble: React.FC<{
  inquiry: Inquiry;
  userId: string;
  isLatest: boolean;
}> = ({ inquiry, userId, isLatest }) => {
  const isMyQuestion = inquiry.fromUserId === userId;
  const statusInfo = getStatusInfo(inquiry.status);

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'dd בMMMM yyyy, HH:mm', { locale: he });
    } catch (e) {
      console.error('Error formatting date:', date, e);
      return 'תאריך לא תקין';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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
                ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white'
                : 'bg-gradient-to-br from-emerald-500 to-green-500 text-white'
            )}
          >
            {getInitials(inquiry.fromUser.firstName, inquiry.fromUser.lastName)}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            'flex-1 max-w-[85%]',
            isMyQuestion ? 'ml-auto' : 'mr-auto'
          )}
        >
          {/* Header */}
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
            <Badge
              className={cn(
                'text-xs px-2 py-1 font-medium border shadow-sm',
                statusInfo.className,
                statusInfo.pulse && 'animate-pulse-subtle'
              )}
            >
              {statusInfo.icon}
              <span className="mr-1">{statusInfo.label}</span>
            </Badge>
            <span className="text-xs text-gray-400">
              {formatDate(inquiry.createdAt)}
            </span>
          </div>

          {/* Question Bubble */}
          <div
            className={cn(
              'p-4 rounded-2xl shadow-md relative max-w-full',
              isMyQuestion
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-br-md'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {inquiry.question}
            </p>

            {/* Triangle pointer */}
            <div
              className={cn(
                'absolute top-4 w-3 h-3 transform rotate-45',
                isMyQuestion
                  ? '-right-1.5 bg-cyan-600'
                  : '-left-1.5 bg-white border-l border-b border-gray-200'
              )}
            />
          </div>
        </div>
      </div>

      {/* Answer */}
      {inquiry.answer && inquiry.answeredAt && (
        <div className="flex gap-4 mt-6 mb-2">
          <Avatar className="w-10 h-10 flex-shrink-0 shadow-md">
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-bold text-sm">
              {getInitials(inquiry.toUser.firstName, inquiry.toUser.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 max-w-[85%]">
            {/* Answer Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-800 text-sm">
                {inquiry.toUser.firstName} {inquiry.toUser.lastName}
              </span>
              <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 text-xs px-2 py-1 font-medium">
                <CheckCircle className="w-3 h-3 mr-1" />
                תשובה
              </Badge>
              <span className="text-xs text-gray-400">
                {formatDate(inquiry.answeredAt)}
              </span>
            </div>

            {/* Answer Bubble */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl rounded-bl-md shadow-md relative">
              <p className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap break-words">
                {inquiry.answer}
              </p>

              {/* Triangle pointer */}
              <div className="absolute top-4 -left-1.5 w-3 h-3 bg-emerald-50 border-l border-b border-emerald-200 transform rotate-45" />
            </div>
          </div>
        </div>
      )}

      {/* Separator */}
      {!isLatest && (
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <ArrowDown className="w-4 h-4 text-gray-400 mx-3" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      )}
    </div>
  );
};

const InquiryThreadView: React.FC<InquiryThreadViewProps> = ({
  suggestionId,
  userId,
  showComposer = true,
  className,
  isDemo = false,
}) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = useCallback(async () => {
    if (isDemo) {
      setInquiries([]);
      setIsLoading(false);
      return;
    }

    if (!suggestionId) {
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
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch inquiries:', response.status, errorData);
        throw new Error(`Failed to fetch inquiries (${response.status})`);
      }

      const data = await response.json();
      setInquiries(Array.isArray(data.inquiries) ? data.inquiries : []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setError('אירעה שגיאה בטעינת השאלות');
    } finally {
      setIsLoading(false);
    }
  }, [suggestionId, isDemo]);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const handleSendQuestion = async () => {
    if (isDemo) {
      toast.info('זוהי הדגמה בלבד', {
        description: 'במערכת האמיתית, שאלתך הייתה נשלחת לשדכן/ית.',
        duration: 5000,
      });
      return;
    }

    if (!newQuestion.trim()) return;

    try {
      setIsSending(true);
      setError(null);

      const response = await fetch(
        `/api/suggestions/${suggestionId}/inquiries`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: newQuestion }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to send inquiry:', response.status, errorData);
        throw new Error(`Failed to send inquiry (${response.status})`);
      }

      await fetchInquiries();
      setNewQuestion('');
      toast.success('השאלה נשלחה בהצלחה', {
        description: 'השדכן יקבל הודעה ויחזור אליך בהקדם',
      });
    } catch (error) {
      console.error('Error sending inquiry:', error);
      setError('אירעה שגיאה בשליחת השאלה');
      toast.error('אירעה שגיאה בשליחת השאלה');
    } finally {
      setIsSending(false);
    }
  };

  const pendingCount = inquiries.filter((i) => i.status === 'PENDING').length;
  const answeredCount = inquiries.filter((i) => i.status === 'ANSWERED').length;

  const DemoState = () => (
    <>
      <CardContent className="flex-1 max-h-[500px] overflow-y-auto p-6 space-y-6 scrollbar-elegant">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-cyan-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            כך נראית שיחה עם השדכן
          </h3>
          <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
            בחשבון אמיתי, כאן תוכלו לשאול שאלות דיסקרטיות ולקבל תשובות מהשדכן/ית
            שיעזרו לכם להחליט.
          </p>
          <div className="mt-6">
            <Sparkles className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
            <p className="text-sm text-cyan-600 font-medium">
              הפיצ&apos;ר זמין עבור משתמשים רשומים.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white space-y-4">
        <div className="w-full space-y-3 opacity-50 cursor-not-allowed">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-cyan-500" />
            <span>שאלה חדשה לשדכן (הדגמה)</span>
          </div>
          <Textarea
            placeholder="כתוב כאן את שאלתך..."
            className="text-right border-gray-200 rounded-xl resize-none"
            rows={3}
            disabled={true}
          />
          <div className="flex justify-end">
            <Button
              disabled={true}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg rounded-xl"
            >
              <Send className="h-4 w-4 ml-2" />
              שלח שאלה
            </Button>
          </div>
        </div>
      </CardFooter>
    </>
  );

  return (
    <Card
      className={cn(
        'shadow-xl border-0 bg-white overflow-hidden flex flex-col',
        className
      )}
    >
      <CardHeader className="pb-4 bg-gradient-to-r from-cyan-50/80 via-white to-emerald-50/50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">
                שיחה עם השדכן
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                שאל שאלות וקבל תשובות מקצועיות
              </p>
            </div>
          </div>

          {!isDemo && inquiries.length > 0 && (
            <div className="flex items-center gap-2">
              {answeredCount > 0 && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 px-3 py-1 shadow-md">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  {answeredCount} נענו
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1 shadow-md animate-pulse-subtle">
                  <Clock className="w-3 h-3 ml-1" />
                  {pendingCount} ממתינות
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {isDemo ? (
        <DemoState />
      ) : (
        <>
          <CardContent className="flex-1 max-h-[500px] overflow-y-auto p-6 space-y-6 scrollbar-elegant">
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-semibold text-red-800 mb-2">
                  שגיאה בטעינה
                </h3>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchInquiries}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  נסה שוב
                </Button>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-100 to-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-10 h-10 text-cyan-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  התחל שיחה עם השדכן
                </h3>
                <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                  יש לך שאלות על המועמד/ת? השדכן כאן כדי לעזור ולספק מידע נוסף
                  שיעזור לך להחליט
                </p>
                {showComposer && (
                  <div className="mt-6">
                    <Sparkles className="w-6 h-6 text-cyan-500 mx-auto mb-2" />
                    <p className="text-sm text-cyan-600 font-medium">
                      התחל לכתוב שאלה למטה
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {inquiries.map((inquiry, index) => (
                  <MessageBubble
                    key={inquiry.id}
                    inquiry={inquiry}
                    userId={userId}
                    isLatest={index === inquiries.length - 1}
                  />
                ))}
              </div>
            )}
          </CardContent>

          {showComposer && (
            <CardFooter className="p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white space-y-4">
              <div className="w-full space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4 text-cyan-500" />
                  <span>שאלה חדשה לשדכן</span>
                </div>

                <Textarea
                  placeholder="כתוב כאן את שאלתך... השדכן ישמח לעזור ולהשיב"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="text-right border-gray-200 focus:border-cyan-300 focus:ring-cyan-200 rounded-xl resize-none"
                  rows={3}
                  disabled={isSending}
                />

                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {newQuestion.length}/500 תווים
                  </span>

                  <Button
                    onClick={handleSendQuestion}
                    disabled={!newQuestion.trim() || isSending || isLoading}
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 ml-2" />
                        שלח שאלה
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </>
      )}
    </Card>
  );
};

export default InquiryThreadView;
