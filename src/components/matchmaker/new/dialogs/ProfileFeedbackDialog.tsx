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
import { Loader2, Send, MailPlus, Eye, Edit } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  const isRtl = locale === 'he';
  const direction = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    const prepareEmail = async () => {
      if (isOpen && candidate) {
        setIsLoading(true);
        setHtmlContent('');
        setViewMode('preview'); // התחל במצב תצוגה מקדימה
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
          toast.error(dict.toasts.loadError);
          console.error(error);
          onClose();
        } finally {
          setIsLoading(false);
        }
      }
    };
    prepareEmail();
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

  // ReactQuill modules עם תמיכה ב-RTL
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'color', 'background',
    'list', 'bullet',
    'align',
    'link'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0"
        dir={direction}
      >
        <DialogHeader className="p-6 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <MailPlus className="w-5 h-5" />
              {dict.title.replace(
                '{{name}}',
                `${candidate?.firstName} ${candidate?.lastName}`
              )}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
                disabled={isLoading}
              >
                <Eye className="w-4 h-4 mr-1" />
                תצוגה מקדימה
              </Button>
              <Button
                variant={viewMode === 'edit' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('edit')}
                disabled={isLoading}
              >
                <Edit className="w-4 h-4 mr-1" />
                עריכה
              </Button>
            </div>
          </div>
          <DialogDescription>
            {viewMode === 'preview' ? 
              'תצוגה מקדימה של המייל כפי שיתקבל אצל המשתמש' : 
              dict.editPrompt
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto" dir={direction}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="ml-4">{dict.preparingEmail}</p>
            </div>
          ) : viewMode === 'preview' ? (
            // תצוגה מקדימה - HTML מלא עם כיוון נכון
            <div 
              className="p-4"
              dir={direction}
              style={{ 
                direction: direction,
                textAlign: isRtl ? 'right' : 'left'
              }}
            >
              <div 
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{
                  fontFamily: isRtl ? 'Arial, sans-serif' : 'inherit',
                  direction: direction,
                  textAlign: isRtl ? 'right' : 'left'
                }}
              />
            </div>
          ) : (
            // מצב עריכה
            <div className="p-1" dir={direction}>
              <style>
                {`
                  .ql-editor {
                    direction: ${direction} !important;
                    text-align: ${isRtl ? 'right' : 'left'} !important;
                    font-family: ${isRtl ? 'Arial, sans-serif' : 'inherit'} !important;
                  }
                  .ql-toolbar {
                    direction: ${direction} !important;
                  }
                  ${isRtl ? `
                    .ql-toolbar .ql-formats {
                      margin-left: 15px;
                      margin-right: 0;
                    }
                    .ql-toolbar .ql-formats:first-child {
                      margin-left: 0;
                    }
                  ` : ''}
                `}
              </style>
              <ReactQuill
                theme="snow"
                value={htmlContent}
                onChange={setHtmlContent}
                modules={quillModules}
                formats={quillFormats}
                style={{ 
                  height: 'calc(100vh - 200px)', 
                  direction: direction,
                }}
                placeholder={isRtl ? 'הקלד כאן את תוכן המייל...' : 'Type your email content here...'}
              />
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-gray-50" dir={direction}>
          <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};