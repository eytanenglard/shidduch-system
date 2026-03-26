// src/components/messages/MessagesPage.tsx
//
// Matchmaker's view of availability inquiries.
// Shows pending/completed availability requests with response controls.

'use client';

import { useNotifications } from '@/app/[locale]/contexts/NotificationContext';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, CheckCircle, XCircle, Loader2, Users } from 'lucide-react';
import type { ExtendedAvailabilityInquiry } from '@/types/messages';
import { Session } from 'next-auth';
import type { Locale } from '../../../i18n-config';

// ==========================================
// i18n strings
// ==========================================

const strings = {
  he: {
    noRequests: 'אין בקשות זמינות',
    noRequestsDescription: 'כרגע אין בקשות לבדיקת זמינות הממתינות לך.',
    pageTitle: 'בקשות לבדיקת זמינות',
    filterByStatus: 'סינון לפי סטטוס',
    filterByTime: 'סינון לפי זמן',
    all: 'הכל',
    pending: 'ממתין לתגובה',
    completed: 'טופל',
    today: 'היום',
    lastWeek: 'שבוע אחרון',
    lastMonth: 'חודש אחרון',
    requestTitle: 'בקשת בדיקת זמינות',
    fromMatchmaker: 'מאת',
    note: 'הערה:',
    notesLabel: 'הערות (אופציונלי):',
    notesPlaceholder: 'הוסף/י הערות...',
    available: 'אני זמין/ה',
    unavailable: 'לא זמין/ה כרגע',
    confirmedAvailable: 'אישרת זמינות',
    confirmedUnavailable: 'ציינת שאינך זמין/ה',
    changeToUnavailable: 'שינוי תשובה - אינני זמין/ה',
    changeToAvailable: 'שינוי תשובה - אני זמין/ה',
    responseSaved: 'תגובתך נשמרה בהצלחה!',
    errorSubmit: 'שגיאה בשליחת התגובה',
  },
  en: {
    noRequests: 'No availability requests',
    noRequestsDescription: 'There are no availability requests waiting for you.',
    pageTitle: 'Availability Check Requests',
    filterByStatus: 'Filter by status',
    filterByTime: 'Filter by time',
    all: 'All',
    pending: 'Pending response',
    completed: 'Handled',
    today: 'Today',
    lastWeek: 'Last week',
    lastMonth: 'Last month',
    requestTitle: 'Availability check request',
    fromMatchmaker: 'From',
    note: 'Note:',
    notesLabel: 'Notes (optional):',
    notesPlaceholder: 'Add notes...',
    available: "I'm available",
    unavailable: 'Not available right now',
    confirmedAvailable: 'You confirmed availability',
    confirmedUnavailable: "You indicated you're not available",
    changeToUnavailable: 'Change answer - Not available',
    changeToAvailable: 'Change answer - Available',
    responseSaved: 'Your response was saved successfully!',
    errorSubmit: 'Error submitting response',
  },
};

// ==========================================
// Component
// ==========================================

interface MessagesPageProps {
  locale?: Locale;
}

export default function MessagesPage({ locale = 'he' }: MessagesPageProps) {
  const t = strings[locale] || strings.he;
  const { data: session } = useSession() as { data: Session | null };
  const { refreshNotifications } = useNotifications();
  const [inquiries, setInquiries] = useState<ExtendedAvailabilityInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'pending',
    timeframe: 'all',
  });
  const [note, setNote] = useState('');

  const loadInquiries = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        status: filters.status,
        timeframe: filters.timeframe,
      });

      const response = await fetch(`/api/matchmaker/inquiries?${queryParams}`);
      if (!response.ok)
        throw new Error('Failed to load availability inquiries');
      const data = await response.json();
      setInquiries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorSubmit);
    } finally {
      setLoading(false);
    }
  }, [filters, t.errorSubmit]);

  useEffect(() => {
    if (session?.user) {
      loadInquiries();
    }
  }, [session, loadInquiries]);

  const handleResponse = async (inquiryId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(
        `/api/matchmaker/inquiries/${inquiryId}/respond`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAvailable, note }),
        }
      );

      if (!response.ok) {
        throw new Error(t.errorSubmit);
      }

      await loadInquiries();
      await refreshNotifications();
      setNote('');
      toast.success(t.responseSaved);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t.errorSubmit;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (inquiries.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto mt-8">
        <CardContent className="p-6 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">{t.noRequests}</h3>
          <p className="text-gray-500">{t.noRequestsDescription}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.pageTitle}</CardTitle>
          <div className="flex gap-4">
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="pending">{t.pending}</SelectItem>
                <SelectItem value="completed">{t.completed}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.timeframe}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, timeframe: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.filterByTime} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.all}</SelectItem>
                <SelectItem value="today">{t.today}</SelectItem>
                <SelectItem value="week">{t.lastWeek}</SelectItem>
                <SelectItem value="month">{t.lastMonth}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-6">
        {inquiries.map((inquiry) => (
          <Card key={inquiry.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">{t.requestTitle}</h3>
                  <p className="text-sm text-gray-600">
                    {t.fromMatchmaker} {inquiry.matchmaker.firstName}{' '}
                    {inquiry.matchmaker.lastName}
                  </p>
                </div>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {inquiry.note && (
                  <div className="text-sm text-gray-600 mt-2">
                    <strong>{t.note}</strong> {inquiry.note}
                  </div>
                )}
                {!inquiry.firstPartyResponse && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        {t.notesLabel}
                      </label>
                      <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t.notesPlaceholder}
                        className="w-full"
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleResponse(inquiry.id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="me-2 h-4 w-4" /> {t.available}
                      </Button>
                      <Button
                        onClick={() => handleResponse(inquiry.id, false)}
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="me-2 h-4 w-4" /> {t.unavailable}
                      </Button>
                    </div>
                  </>
                )}
                {inquiry.firstPartyResponse !== null && (
                  <div className="space-y-4">
                    <div
                      className={`flex items-center gap-2 p-2 rounded-md ${inquiry.firstPartyResponse ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                    >
                      {inquiry.firstPartyResponse ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      <span>
                        {inquiry.firstPartyResponse
                          ? t.confirmedAvailable
                          : t.confirmedUnavailable}
                      </span>
                    </div>
                    <div>
                      <Button
                        onClick={() =>
                          handleResponse(
                            inquiry.id,
                            !inquiry.firstPartyResponse
                          )
                        }
                        className={`w-full ${inquiry.firstPartyResponse ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                      >
                        {inquiry.firstPartyResponse ? (
                          <>
                            <XCircle className="me-2 h-4 w-4" />{' '}
                            {t.changeToUnavailable}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="me-2 h-4 w-4" />{' '}
                            {t.changeToAvailable}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
