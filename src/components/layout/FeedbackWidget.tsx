// src/components/FeedbackWidget/FeedbackWidget.tsx

'use client';

import React, { useState, useRef, useEffect, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  ThumbsUp,
  Bug,
  Lightbulb,
  Loader2,
  Paperclip,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import type { FeedbackWidgetDict } from '@/types/dictionary'; // ייבוא טיפוס המילון המלא
// מומלץ ליצור קובץ types ייעודי או להוסיף לקובץ קיים

interface FeedbackWidgetProps {
  dict: FeedbackWidgetDict;
}

type FeedbackType = 'SUGGESTION' | 'BUG' | 'POSITIVE';

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ dict }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'form'>('type');
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [content, setContent] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const feedbackOptions = [
    {
      type: 'SUGGESTION' as FeedbackType,
      icon: Lightbulb,
      label: dict.types.suggestion,
    },
    { type: 'BUG' as FeedbackType, icon: Bug, label: dict.types.bug },
    {
      type: 'POSITIVE' as FeedbackType,
      icon: ThumbsUp,
      label: dict.types.positive,
    },
  ];

  useEffect(() => {
    if (screenshot) {
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(screenshot);
    } else {
      setScreenshotPreview(null);
    }
  }, [screenshot]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        toast.error(dict.toasts.imageTooLarge);
        return;
      }
      setScreenshot(file);
    }
    if (event.target) event.target.value = '';
  };

  const resetState = (closeWidget: boolean = true) => {
    if (closeWidget) {
      setIsOpen(false);
      setTimeout(() => {
        setStep('type');
        setFeedbackType(null);
        setContent('');
        setScreenshot(null);
        setScreenshotPreview(null);
      }, 300);
    } else {
      setStep('type');
      setFeedbackType(null);
      setContent('');
      setScreenshot(null);
      setScreenshotPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !feedbackType) {
      toast.error(dict.toasts.contentRequired);
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('content', content);
    formData.append('feedbackType', feedbackType);
    formData.append('pageUrl', window.location.href);
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      toast.success(dict.toasts.submitSuccess);
      resetState();
    } catch (error) {
      console.error(error);
      toast.error(dict.toasts.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Fragment>
      {/* --- שינוי מיקום ועיצוב הכפתור --- */}
      <div className="fixed top-1/2 -translate-y-1/2 right-0 z-50">
        <Button
          variant="default"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-r-none rounded-l-lg h-auto py-3 px-2 bg-gray-800 text-white hover:bg-gray-700 shadow-lg flex flex-col items-center gap-2"
          aria-label={dict.openAriaLabel}
        >
          <MessageSquare className="w-5 h-5" />
          <span
            style={{ writingMode: 'vertical-rl' }}
            className="text-sm font-semibold tracking-wider"
          >
            {dict.tabLabel}
          </span>
        </Button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[59]"
          onClick={() => resetState()}
        />
      )}

      <div
        className={cn(
          'fixed top-1/2 -translate-y-1/2 right-14 z-[60] w-[340px] bg-white rounded-2xl shadow-2xl transition-all duration-300 ease-in-out',
          isOpen
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-4 pointer-events-none'
        )}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-center">{dict.title}</h3>
            <p className="text-xs text-gray-500 text-center">{dict.subtitle}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full"
            onClick={() => resetState()}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {step === 'type' && (
          <div className="p-4 space-y-2">
            {feedbackOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => {
                  setFeedbackType(option.type);
                  setStep('form');
                }}
                className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors text-right"
              >
                <option.icon className="w-5 h-5 ml-3 text-gray-600" />
                <span className="font-medium text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <button
              type="button"
              onClick={() => setStep('type')}
              className="text-xs text-gray-500 hover:text-gray-800 mb-2"
            >
              ← {dict.cancelButton}
            </button>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={dict.placeholder}
              className="min-h-[120px]"
              required
            />

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 ml-2" />
                {dict.attachScreenshot}
              </Button>

              {screenshotPreview && (
                <div className="flex items-center gap-2">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-10 h-10 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => setScreenshot(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => resetState()}
              >
                {dict.cancelButton}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  dict.submitButton
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Fragment>
  );
};

export default FeedbackWidget;
