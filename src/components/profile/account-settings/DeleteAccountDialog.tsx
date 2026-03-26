// src/components/profile/account-settings/DeleteAccountDialog.tsx

'use client';

import React, { useState } from 'react';
import {
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import type { AccountSettingsBaseProps } from './types';

const DeleteAccountDialog: React.FC<AccountSettingsBaseProps> = ({
  dict,
  locale,
}) => {
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== dict.deleteDialog.confirmationPhrase) {
      toast.error(dict.toasts.invalidDeleteConfirmation, {
        description: dict.toasts.invalidDeleteConfirmationDesc.replace(
          '{{phrase}}',
          dict.deleteDialog.confirmationPhrase
        ),
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/delete`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }
      toast.success(dict.toasts.deleteSuccess, {
        description: dict.toasts.deleteSuccessDesc,
      });
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : dict.toasts.deleteError,
        { description: dict.toasts.deleteErrorDesc }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {dict.sections.delete.description}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeletingAccount(true)}
          disabled={isLoading}
          className="ms-4 text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950"
        >
          <Trash2 className="w-3.5 h-3.5 me-1.5" />
          {dict.sections.delete.deleteButton}
        </Button>
      </div>

      {/* Delete Account Dialog */}
      <Dialog
        open={isDeletingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeletingAccount(false);
            setDeleteConfirmText('');
          } else {
            setIsDeletingAccount(true);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          dir={locale === 'he' ? 'rtl' : 'ltr'}
        >
          <DialogHeader className="text-start">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 mb-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-lg">
              {dict.deleteDialog.title}
            </DialogTitle>
            <DialogDescription>
              {dict.deleteDialog.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-start">
            <Label htmlFor="deleteConfirm" className="text-sm">
              {dict.deleteDialog.confirmationLabel}{' '}
              <code className="px-1.5 py-0.5 rounded bg-muted text-destructive font-mono text-xs">
                {dict.deleteDialog.confirmationPhrase}
              </code>
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={dict.deleteDialog.confirmationPhrase}
              className="font-mono"
            />
            {deleteConfirmText &&
              deleteConfirmText !== dict.deleteDialog.confirmationPhrase && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {dict.deleteDialog.mismatchWarning}
                </p>
              )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeletingAccount(false);
                setDeleteConfirmText('');
              }}
              className="text-sm"
            >
              {dict.deleteDialog.cancelButton}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                isLoading ||
                deleteConfirmText !== dict.deleteDialog.confirmationPhrase
              }
              className="text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {dict.deleteDialog.deletingButton}
                </>
              ) : (
                dict.deleteDialog.deleteButton
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeleteAccountDialog;
