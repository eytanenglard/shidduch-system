// src/components/matchmaker/new/dialogs/ProfileFeedbackDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Send, MailPlus } from 'lucide-react';
import ReactQuill from 'react-quill'; // עורך טקסט עשיר
import 'react-quill/dist/quill.snow.css'; // עיצובים עבור העורך
import type { Candidate } from '../types/candidates';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface ProfileFeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  locale: string;
  dict: MatchmakerPageDictionary['candidatesManager']['profileFeedbackDialog'];
}

export const ProfileFeedbackDialog: React.FC<ProfileFeedbackDialogProps> = ({
  isOpen,
  onClose,
  candidate,
  locale,
  dict,
}) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // src/components/matchmaker/new/dialogs/ProfileFeedbackDialog.tsx

  useEffect(() => {
    const prepareEmail = async () => {
      if (isOpen && candidate) {
        setIsLoading(true);
        setHtmlContent('');
        try {
          const response = await fetch(
            '/api/ai/matchmaker/prepare-feedback-email',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: candidate.id,
                locale,
                isAutomated: false,
              }),
            }
          );
          const data = await response.json();
          if (data.success) {
            setHtmlContent(data.htmlContent);
          } else {
            throw new Error(data.error || 'Failed to prepare email content');
          }
        } catch (error) {
          // עכשיו הקריאה הזו תעבוד כי הוספנו את התרגום
          toast.error(dict.toasts.loadError);
          console.error(error);
          onClose();
        } finally {
          setIsLoading(false);
        }
      }
    };
    prepareEmail();
    // התיקון כאן: השתמש ב-dict כולו במקום במפתח ספציפי
  }, [isOpen, candidate, locale, dict, onClose]);
  const handleSendEmail = async () => {
    if (!candidate) return;
    setIsSending(true);
    try {
      const response = await fetch('/api/ai/matchmaker/send-feedback-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: candidate.email,
          subject: dict.emailSubject.replace('{{name}}', candidate.firstName),
          htmlContent: htmlContent,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to send email');
      }
      toast.success(dict.toasts.sendSuccess);
      onClose();
    } catch (error) {
      toast.error(dict.toasts.sendError);
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MailPlus />
            {dict.title.replace(
              '{{name}}',
              `${candidate?.firstName} ${candidate?.lastName}`
            )}
          </DialogTitle>
          <DialogDescription>{dict.editPrompt}</DialogDescription>
        </DialogHeader>
        <div className="flex-grow p-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="ml-4">{dict.preparingEmail}</p>
            </div>
          ) : (
            <ReactQuill
              theme="snow"
              value={htmlContent}
              onChange={setHtmlContent}
              style={{ height: 'calc(100% - 2px)', border: 'none' }}
            />
          )}
        </div>
        <DialogFooter className="p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            {dict.buttons.cancel}
          </Button>
          <Button onClick={handleSendEmail} disabled={isLoading || isSending}>
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSending ? dict.buttons.sending : dict.buttons.send}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
