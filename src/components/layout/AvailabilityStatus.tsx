// src/components/layout/AvailabilityStatus.tsx

'use client';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { AvailabilityStatus as AvailabilityStatusEnum } from '@prisma/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  Loader2,
  Heart,
  UserMinus,
  XCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Session } from 'next-auth';
import type { AvailabilityStatusDict } from '@/types/dictionary';

// --- עדכון פונקציית הסגנונות לפלטה החדשה (Teal/Rose/Orange) ---
const getStatusStyles = (status: AvailabilityStatusEnum) => {
  switch (status) {
    case AvailabilityStatusEnum.AVAILABLE:
      return {
        // שינוי: Cyan -> Teal
        dotClasses: 'bg-teal-500',
        pulse: true,
        icon: <CheckCircle2 />,
        iconColorClass: 'text-teal-600',
        // גרדיאנט תואם ל-Hero (Knowledge/Growth)
        dialogButtonClasses:
          'bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-600 hover:via-teal-700 hover:to-emerald-700 text-white',
      };
    case AvailabilityStatusEnum.UNAVAILABLE:
      return {
        dotClasses: 'bg-slate-400', // שינוי ל-Slate למראה נקי יותר
        pulse: false,
        icon: <XCircle />,
        iconColorClass: 'text-slate-500',
        dialogButtonClasses:
          'bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white',
      };
    case AvailabilityStatusEnum.DATING:
      return {
        // שינוי: Pink -> Rose (תואם ל-Hero Personal/Emotion)
        dotClasses: 'bg-rose-500',
        pulse: false,
        icon: <Heart />,
        iconColorClass: 'text-rose-600',
        dialogButtonClasses:
          'bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 hover:from-rose-600 hover:via-pink-600 hover:to-red-600 text-white',
      };
    case AvailabilityStatusEnum.PAUSED:
      return {
        // שינוי: Orange -> Orange/Amber (תואם ל-Hero Privacy/Human)
        dotClasses: 'bg-orange-500',
        pulse: false,
        icon: <PauseCircle />,
        iconColorClass: 'text-orange-600',
        dialogButtonClasses:
          'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white',
      };
    case AvailabilityStatusEnum.ENGAGED:
      return {
        // שינוי: תואם ל-Dating עם Pulse
        dotClasses: 'bg-rose-500',
        pulse: true,
        icon: <Heart fill="currentColor" />,
        iconColorClass: 'text-rose-600',
        dialogButtonClasses:
          'bg-gradient-to-r from-rose-500 via-pink-500 to-red-500 hover:from-rose-600 hover:via-pink-600 hover:to-red-600 text-white',
      };
    case AvailabilityStatusEnum.MARRIED:
      return {
        dotClasses: 'bg-slate-400',
        pulse: false,
        icon: <UserMinus />,
        iconColorClass: 'text-slate-500',
        dialogButtonClasses:
          'bg-gradient-to-r from-slate-500 to-gray-600 hover:from-slate-600 hover:to-gray-700 text-white',
      };
    default:
      return {
        dotClasses: 'bg-gray-400',
        pulse: false,
        icon: <AlertCircle />,
        iconColorClass: 'text-gray-500',
        dialogButtonClasses:
          'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white',
      };
  }
};

interface AvailabilityStatusProps {
  dict: AvailabilityStatusDict;
}

export default function AvailabilityStatus({ dict }: AvailabilityStatusProps) {
  const { update: updateSession } = useSession();
  const { data: session } = useSession() as { data: Session | null };

  const [showDialog, setShowDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const initialStatus =
    session?.user?.profile?.availabilityStatus ||
    AvailabilityStatusEnum.AVAILABLE;
  const initialNote = session?.user?.profile?.availabilityNote || '';

  const [status, setStatus] = useState<AvailabilityStatusEnum>(initialStatus);
  const [note, setNote] = useState(initialNote);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session?.user?.profile) {
      setStatus(
        session.user.profile.availabilityStatus ||
          AvailabilityStatusEnum.AVAILABLE
      );
      setNote(session.user.profile.availabilityNote || '');
    }
  }, [session]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setError('');

    try {
      const response = await fetch('/api/profile/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availabilityStatus: status,
          availabilityNote: note || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update status');
      }

      await updateSession();
      setShowDialog(false);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Error in update:', err);
      setError(err instanceof Error ? err.message : dict.updateError);
    } finally {
      setIsUpdating(false);
    }
  };

  const displayStatus =
    session?.user?.profile?.availabilityStatus ||
    AvailabilityStatusEnum.AVAILABLE;
  const currentStatusStyles = getStatusStyles(displayStatus);
  const editingStatusStyles = getStatusStyles(status);

  if (!session?.user) return null;

  return (
    <>
      <Button
        id="onboarding-target-availability-status"
        variant="ghost"
        onClick={() => {
          setStatus(
            session?.user?.profile?.availabilityStatus ||
              AvailabilityStatusEnum.AVAILABLE
          );
          setNote(session?.user?.profile?.availabilityNote || '');
          setError('');
          setShowDialog(true);
        }}
        // שינוי: ריווח פנימי ואפקט hover עדין יותר
        className="flex items-center gap-x-2 px-3 h-10 rounded-full font-medium text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200"
      >
        <span className="relative flex h-2.5 w-2.5">
          {currentStatusStyles.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStatusStyles.dotClasses}`}
            ></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${currentStatusStyles.dotClasses}`}
          ></span>
        </span>
        <span className="text-sm">{dict.status[displayStatus]}</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md p-6 bg-white rounded-xl shadow-2xl border-gray-100">
          <DialogHeader className="mb-4 text-right">
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {dict.dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {dict.dialogDescription}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <label
                htmlFor="status-select"
                className="text-sm font-medium text-gray-700"
              >
                {dict.statusLabel}
              </label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setStatus(value as AvailabilityStatusEnum)
                }
                disabled={isUpdating}
              >
                {/* שינוי: Focus Ring ל-Teal */}
                <SelectTrigger
                  id="status-select"
                  className="w-full rounded-lg h-12 text-base bg-gray-50 border-gray-200 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                >
                  <SelectValue placeholder={dict.selectPlaceholder} />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {Object.values(AvailabilityStatusEnum).map((enumKey) => {
                    const itemStyle = getStatusStyles(enumKey);
                    return (
                      <SelectItem
                        key={enumKey}
                        value={enumKey}
                        className="cursor-pointer text-base py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          {React.cloneElement(itemStyle.icon, {
                            className: `w-4 h-4 ${itemStyle.iconColorClass}`,
                          })}
                          <span>{dict.status[enumKey]}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="status-note"
                className="text-sm font-medium text-gray-700"
              >
                {dict.noteLabel}
              </label>
              <Textarea
                id="status-note"
                placeholder={dict.notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isUpdating}
                // שינוי: Focus Ring ל-Teal
                className="rounded-lg min-h-[100px] text-base bg-gray-50 border-gray-200 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 placeholder:text-gray-400 transition-all"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-6 sm:justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              disabled={isUpdating}
              className="rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {dict.cancelButton}
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`rounded-lg px-6 h-11 text-base font-medium transition-all shadow-md hover:shadow-lg ${editingStatusStyles.dialogButtonClasses}`}
            >
              {isUpdating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                dict.updateButton
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="sm:max-w-md p-6 bg-white rounded-xl shadow-2xl">
          <AlertDialogHeader className="text-center">
            {/* שינוי: רקע האייקון ל-Teal */}
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-teal-100 mb-4">
              <CheckCircle2 className="h-8 w-8 text-teal-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-gray-800">
              {dict.successDialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-2">
              {dict.successDialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => setShowSuccessDialog(false)}
            // שינוי: כפתור אישור ב-Teal Gradient
            className="w-full mt-4 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-base h-11 shadow-md hover:shadow-lg transition-all border-none"
          >
            {dict.successDialogAction}
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}