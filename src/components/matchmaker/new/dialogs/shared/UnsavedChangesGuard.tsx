'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface UnsavedChangesGuardProps {
  isDirty: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export function UnsavedChangesGuard({
  isDirty,
  onClose,
  onConfirm,
  title = 'שינויים שלא נשמרו',
  message = 'יש שינויים שלא נשמרו. האם לסגור בכל זאת?',
}: UnsavedChangesGuardProps) {
  const [showAlert, setShowAlert] = React.useState(false);

  // Intercept close — if dirty, show confirmation; otherwise close directly
  const handleAttemptClose = React.useCallback(() => {
    if (isDirty) {
      setShowAlert(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleCancel = React.useCallback(() => {
    setShowAlert(false);
  }, []);

  const handleConfirmClose = React.useCallback(() => {
    setShowAlert(false);
    onConfirm();
  }, [onConfirm]);

  return (
    <>
      {/* Expose the intercept handler via a hidden trigger — consumers call handleAttemptClose */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel onClick={handleCancel}>
              המשך עריכה
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              סגור בלי לשמור
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Hook for convenient usage with DialogContainer
export function useUnsavedChangesGuard(isDirty: boolean, onClose: () => void) {
  const [showAlert, setShowAlert] = React.useState(false);

  const handleClose = React.useCallback(() => {
    if (isDirty) {
      setShowAlert(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const confirmClose = React.useCallback(() => {
    setShowAlert(false);
    onClose();
  }, [onClose]);

  const cancelClose = React.useCallback(() => {
    setShowAlert(false);
  }, []);

  return {
    showAlert,
    setShowAlert,
    handleClose,
    confirmClose,
    cancelClose,
  };
}
